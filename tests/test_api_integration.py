#!/usr/bin/env python3
"""
API Integration Tests: Test the complete workflows REST API
"""

import pytest
import json
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from pathlib import Path
import sys
import tempfile
import os

# Add source path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from gragraf.server import app
from gragraf.infrastructure.database import DatabaseConfig, DatabaseManager, initialize_database
from gragraf.infrastructure.repositories import RepositoryFactory


@pytest.fixture
def test_db():
    """Create a temporary test database"""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    
    # Create test database config
    test_db_url = f"sqlite+aiosqlite:///{db_path}"
    config = DatabaseConfig(database_url=test_db_url, echo=False)
    
    # Initialize database
    db_manager = initialize_database(config)
    asyncio.run(db_manager.create_tables())
    
    yield db_path
    
    # Cleanup
    if os.path.exists(db_path):
        os.unlink(db_path)


@pytest.fixture
def client(test_db):
    """Create test client with test database"""
    from gragraf.api.workflows import get_workflow_service
    from gragraf.infrastructure.database import DatabaseConfig, initialize_database
    from gragraf.application.services import WorkflowApplicationService
    from gragraf.infrastructure.repositories import RepositoryFactory
    
    # Create test database config and manager
    test_db_url = f"sqlite+aiosqlite:///{test_db}"
    config = DatabaseConfig(database_url=test_db_url, echo=False)
    db_manager = initialize_database(config)
    
    # Override the dependency to use test database
    def get_test_workflow_service() -> WorkflowApplicationService:
        factory = RepositoryFactory(db_manager)
        return WorkflowApplicationService(factory)
    
    app.dependency_overrides[get_workflow_service] = get_test_workflow_service
    
    client = TestClient(app)
    yield client
    
    # Cleanup override
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(test_db):
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def sample_workflow_dsl():
    """Sample workflow DSL for testing"""
    return {
        "nodes": [
            {
                "id": "start_1",
                "type": "start",
                "config": {
                    "inputs": [{"name": "user", "type": "string"}]
                }
            },
            {
                "id": "agent_1",
                "type": "agent",
                "config": {
                    "modelConfig": {
                        "model": "gpt-3.5-turbo",
                        "maxTokens": 100
                    },
                    "systemPrompt": "You are a helpful assistant",
                    "inputs": [{"name": "user_input", "value": "${start_1.user}"}]
                }
            },
            {
                "id": "end_1",
                "type": "end",
                "config": {
                    "outputs": [{"name": "result", "value": "${agent_1.output}"}]
                }
            }
        ],
        "edges": [
            {"source": "start_1", "target": "agent_1"},
            {"source": "agent_1", "target": "end_1"}
        ]
    }


class TestWorkflowsCRUD:
    """Test CRUD operations for workflows"""

    def test_create_workflow(self, client, sample_workflow_dsl):
        """Test creating a new workflow"""
        workflow_data = {
            "name": "Test Workflow",
            "dsl": sample_workflow_dsl,
            "description": "A test workflow",
            "tags": ["test", "demo"],
            "created_by": "test_user"
        }
        
        response = client.post("/workflows/", json=workflow_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["name"] == "Test Workflow"
        assert data["description"] == "A test workflow"
        assert data["tags"] == ["test", "demo"]
        assert data["created_by"] == "test_user"
        assert data["status"] == "draft"
        assert data["version"] == 1
        assert "id" in data
        assert "created_at" in data

    def test_create_duplicate_workflow(self, client, sample_workflow_dsl):
        """Test creating workflow with duplicate name fails"""
        workflow_data = {
            "name": "Duplicate Test",
            "dsl": sample_workflow_dsl
        }
        
        # First creation should succeed
        response1 = client.post("/workflows/", json=workflow_data)
        assert response1.status_code == 201
        
        # Second creation should fail
        response2 = client.post("/workflows/", json=workflow_data)
        assert response2.status_code == 409

    def test_get_workflow_by_id(self, client, sample_workflow_dsl):
        """Test retrieving workflow by ID"""
        # Create workflow first
        workflow_data = {
            "name": "Get Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Get workflow
        response = client.get(f"/workflows/{workflow_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == workflow_id
        assert data["name"] == "Get Test Workflow"

    def test_get_workflow_by_name(self, client, sample_workflow_dsl):
        """Test retrieving workflow by name"""
        # Create workflow first
        workflow_data = {
            "name": "Name Test Workflow",
            "dsl": sample_workflow_dsl
        }
        client.post("/workflows/", json=workflow_data)
        
        # Get workflow by name
        response = client.get("/workflows/name/Name Test Workflow")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Name Test Workflow"

    def test_get_nonexistent_workflow(self, client):
        """Test getting non-existent workflow returns 404"""
        response = client.get("/workflows/nonexistent-id")
        assert response.status_code == 400  # Invalid UUID format
        
        response = client.get("/workflows/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

    def test_list_workflows(self, client, sample_workflow_dsl):
        """Test listing workflows"""
        # Create multiple workflows
        for i in range(3):
            workflow_data = {
                "name": f"List Test Workflow {i}",
                "dsl": sample_workflow_dsl,
                "tags": ["test"] if i % 2 == 0 else ["demo"]
            }
            client.post("/workflows/", json=workflow_data)
        
        # List all workflows
        response = client.get("/workflows/")
        assert response.status_code == 200
        
        data = response.json()
        assert "workflows" in data
        assert "total" in data
        assert data["total"] >= 3

    def test_list_workflows_with_filters(self, client, sample_workflow_dsl):
        """Test listing workflows with filters"""
        # Create workflows with different tags
        client.post("/workflows/", json={
            "name": "Filter Test 1",
            "dsl": sample_workflow_dsl,
            "tags": ["production"]
        })
        client.post("/workflows/", json={
            "name": "Filter Test 2", 
            "dsl": sample_workflow_dsl,
            "tags": ["development"]
        })
        
        # Filter by tags
        response = client.get("/workflows/?tags=production")
        assert response.status_code == 200
        
        data = response.json()
        assert all("production" in wf["tags"] for wf in data["workflows"])

    def test_update_workflow_definition(self, client, sample_workflow_dsl):
        """Test updating workflow definition"""
        # Create workflow
        workflow_data = {
            "name": "Update Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Update definition
        updated_dsl = {**sample_workflow_dsl}
        updated_dsl["nodes"][1]["config"]["systemPrompt"] = "Updated prompt"
        
        response = client.put(f"/workflows/{workflow_id}/definition", 
                            json={"dsl": updated_dsl})
        assert response.status_code == 200
        
        data = response.json()
        assert data["version"] == 2
        assert data["definition"]["nodes"][1]["config"]["systemPrompt"] == "Updated prompt"

    def test_update_workflow_metadata(self, client, sample_workflow_dsl):
        """Test updating workflow metadata"""
        # Create workflow
        workflow_data = {
            "name": "Metadata Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Update metadata
        response = client.put(f"/workflows/{workflow_id}/metadata", json={
            "name": "Updated Metadata Test",
            "description": "Updated description",
            "tags": ["updated", "metadata"]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Metadata Test"
        assert data["description"] == "Updated description"
        assert data["tags"] == ["updated", "metadata"]


class TestWorkflowStatusManagement:
    """Test workflow status management"""

    def test_activate_workflow(self, client, sample_workflow_dsl):
        """Test activating a workflow"""
        # Create workflow
        workflow_data = {
            "name": "Activate Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Activate workflow
        response = client.post(f"/workflows/{workflow_id}/activate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "active"

    def test_deactivate_workflow(self, client, sample_workflow_dsl):
        """Test deactivating a workflow"""
        # Create and activate workflow
        workflow_data = {
            "name": "Deactivate Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        client.post(f"/workflows/{workflow_id}/activate")
        
        # Deactivate workflow
        response = client.post(f"/workflows/{workflow_id}/deactivate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "inactive"

    def test_archive_workflow(self, client, sample_workflow_dsl):
        """Test archiving a workflow"""
        # Create workflow
        workflow_data = {
            "name": "Archive Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Archive workflow
        response = client.post(f"/workflows/{workflow_id}/archive")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "archived"

    def test_get_active_workflows(self, client, sample_workflow_dsl):
        """Test getting only active workflows"""
        # Create and activate multiple workflows
        active_workflows = []
        for i in range(2):
            workflow_data = {
                "name": f"Active Workflow {i}",
                "dsl": sample_workflow_dsl
            }
            create_response = client.post("/workflows/", json=workflow_data)
            workflow_id = create_response.json()["id"]
            client.post(f"/workflows/{workflow_id}/activate")
            active_workflows.append(workflow_id)
        
        # Create inactive workflow
        inactive_data = {
            "name": "Inactive Workflow",
            "dsl": sample_workflow_dsl
        }
        client.post("/workflows/", json=inactive_data)
        
        # Get active workflows
        response = client.get("/workflows/active/list")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        assert all(wf["status"] == "active" for wf in data)


class TestWorkflowExecution:
    """Test workflow execution tracking"""

    def test_record_execution(self, client, sample_workflow_dsl):
        """Test recording workflow execution"""
        # Create workflow
        workflow_data = {
            "name": "Execution Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Record execution
        execution_data = {
            "success": True,
            "execution_time_ms": 1500.0
        }
        response = client.post(f"/workflows/{workflow_id}/executions", 
                             json=execution_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["statistics"]["total_executions"] == 1
        assert data["statistics"]["successful_executions"] == 1

    def test_get_workflow_health(self, client, sample_workflow_dsl):
        """Test getting workflow health metrics"""
        # Create workflow
        workflow_data = {
            "name": "Health Test Workflow",
            "dsl": sample_workflow_dsl
        }
        create_response = client.post("/workflows/", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Record some executions
        for success in [True, True, False]:
            execution_data = {
                "success": success,
                "execution_time_ms": 1000.0
            }
            client.post(f"/workflows/{workflow_id}/executions", 
                       json=execution_data)
        
        # Get health
        response = client.get(f"/workflows/{workflow_id}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_executions"] == 3
        assert abs(data["success_rate"] - 66.67) < 0.01  # ~66.67% (2 successes out of 3)
        assert "health_score" in data


class TestWorkflowSimilarity:
    """Test workflow similarity features"""

    def test_find_similar_workflows(self, client, sample_workflow_dsl):
        """Test finding similar workflows"""
        # Create base workflow
        workflow_data = {
            "name": "Base Workflow",
            "dsl": sample_workflow_dsl,
            "tags": ["ai", "agent"]
        }
        create_response = client.post("/workflows/", json=workflow_data)
        base_id = create_response.json()["id"]
        
        # Create similar workflow
        similar_data = {
            "name": "Similar Workflow",
            "dsl": sample_workflow_dsl,
            "tags": ["ai", "chatbot"]
        }
        client.post("/workflows/", json=similar_data)
        
        # Find similar workflows
        response = client.get(f"/workflows/{base_id}/similar?threshold=0.5")
        assert response.status_code == 200
        
        # Should return some results (exact similarity algorithm depends on implementation)
        data = response.json()
        assert isinstance(data, list)


class TestErrorHandling:
    """Test API error handling"""

    def test_invalid_workflow_data(self, client):
        """Test creating workflow with invalid data"""
        invalid_data = {
            "name": "",  # Empty name
            "dsl": {}    # Empty DSL
        }
        response = client.post("/workflows/", json=invalid_data)
        assert response.status_code == 400

    def test_invalid_workflow_id_format(self, client):
        """Test operations with invalid workflow ID format"""
        response = client.get("/workflows/invalid-id")
        assert response.status_code == 400

    def test_workflow_not_found_operations(self, client):
        """Test operations on non-existent workflows"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        # Various operations should return 404
        response = client.get(f"/workflows/{fake_id}")
        assert response.status_code == 404
        
        response = client.put(f"/workflows/{fake_id}/definition", 
                            json={"dsl": {}})
        assert response.status_code == 400  # Will fail validation first
        
        response = client.post(f"/workflows/{fake_id}/activate")
        assert response.status_code == 400  # Will fail validation first


if __name__ == "__main__":
    pytest.main([__file__]) 