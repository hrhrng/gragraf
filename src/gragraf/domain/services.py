"""
Domain Services for the Workflow domain.
Contains business logic that doesn't naturally fit within entities.
"""

from typing import List, Optional
from datetime import datetime, timezone

from .entities import Workflow
from .value_objects import WorkflowId, WorkflowStatus
from .repositories import WorkflowRepository, DuplicateWorkflowError


class WorkflowDomainService:
    """Domain service for workflow-specific business logic."""
    
    def __init__(self, workflow_repository: WorkflowRepository):
        self._workflow_repository = workflow_repository
    
    async def create_workflow(
        self,
        name: str,
        dsl: dict,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        created_by: Optional[str] = None
    ) -> Workflow:
        """
        Create a new workflow with validation.
        
        Args:
            name: Workflow name (must be unique)
            dsl: Workflow definition
            description: Optional description
            tags: Optional tags
            created_by: Optional creator identifier
            
        Returns:
            New workflow instance
            
        Raises:
            DuplicateWorkflowError: If a workflow with the same name exists
        """
        # Check for duplicate names
        existing_workflow = await self._workflow_repository.find_by_name(name)
        if existing_workflow is not None:
            raise DuplicateWorkflowError(name)
        
        # Create the new workflow
        workflow = Workflow.create_new(
            name=name,
            dsl=dsl,
            description=description,
            tags=tags or [],
            created_by=created_by
        )
        
        await self._workflow_repository.save(workflow)
        return workflow
    
    async def can_delete_workflow(self, workflow_id: WorkflowId) -> bool:
        """
        Check if a workflow can be safely deleted.
        
        Args:
            workflow_id: The workflow ID to check
            
        Returns:
            True if the workflow can be deleted
        """
        workflow = await self._workflow_repository.find_by_id(workflow_id)
        if workflow is None:
            return False
        
        # Allow deletion of any workflow status
        return True
    
    async def get_workflow_health(self, workflow_id: WorkflowId) -> dict:
        """
        Get health metrics for a workflow.
        
        Args:
            workflow_id: The workflow ID
            
        Returns:
            Dictionary containing health metrics
        """
        workflow = await self._workflow_repository.find_by_id(workflow_id)
        if workflow is None:
            return {"status": "not_found"}
        
        stats = workflow.statistics
        
        # Calculate health score based on success rate and activity
        health_score = 0
        if stats.total_executions > 0:
            # Success rate contributes 70% to health score
            health_score += (stats.success_rate / 100) * 0.7
            
            # Recent activity contributes 30%
            if stats.last_executed_at:
                # Ensure both datetimes are timezone-aware for comparison
                now_utc = datetime.now(timezone.utc)
                last_executed = stats.last_executed_at
                if last_executed.tzinfo is None:
                    last_executed = last_executed.replace(tzinfo=timezone.utc)
                
                days_since_last_execution = (now_utc - last_executed).days
                # Penalize for inactivity (max 30 days)
                activity_score = max(0, (30 - days_since_last_execution) / 30)
                health_score += activity_score * 0.3
        
        health_status = "excellent" if health_score >= 0.8 else \
                       "good" if health_score >= 0.6 else \
                       "fair" if health_score >= 0.4 else \
                       "poor"
        
        return {
            "status": health_status,
            "health_score": round(health_score, 2),
            "success_rate": stats.success_rate,
            "total_executions": stats.total_executions,
            "last_executed_at": stats.last_executed_at,
            "average_execution_time_ms": stats.average_execution_time_ms
        }
    
    async def find_similar_workflows(
        self, 
        workflow: Workflow, 
        similarity_threshold: float = 0.7
    ) -> List[Workflow]:
        """
        Find workflows similar to the given one.
        
        Args:
            workflow: The reference workflow
            similarity_threshold: Minimum similarity score (0.0 to 1.0)
            
        Returns:
            List of similar workflows
        """
        all_workflows = await self._workflow_repository.find_all()
        similar_workflows = []
        
        for other_workflow in all_workflows:
            if other_workflow.id == workflow.id:
                continue
            
            # Simple similarity calculation based on tags and name
            similarity_score = self._calculate_similarity(workflow, other_workflow)
            
            if similarity_score >= similarity_threshold:
                similar_workflows.append(other_workflow)
        
        return similar_workflows
    
    def _calculate_similarity(self, workflow1: Workflow, workflow2: Workflow) -> float:
        """
        Calculate similarity score between two workflows.
        
        Args:
            workflow1: First workflow
            workflow2: Second workflow
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        score = 0.0
        
        # Name similarity (30% weight)
        name1_words = set(workflow1.name.lower().split())
        name2_words = set(workflow2.name.lower().split())
        if name1_words and name2_words:
            name_similarity = len(name1_words & name2_words) / len(name1_words | name2_words)
            score += name_similarity * 0.3
        
        # Tags similarity (40% weight)
        tags1 = set(workflow1.metadata.tags)
        tags2 = set(workflow2.metadata.tags)
        if tags1 or tags2:
            if not tags1 and not tags2:
                tags_similarity = 1.0
            elif not tags1 or not tags2:
                tags_similarity = 0.0
            else:
                tags_similarity = len(tags1 & tags2) / len(tags1 | tags2)
            score += tags_similarity * 0.4
        
        # Node types similarity (30% weight)
        nodes1 = workflow1.definition.dsl.get('nodes', [])
        nodes2 = workflow2.definition.dsl.get('nodes', [])
        
        types1 = set(node.get('type', '') for node in nodes1)
        types2 = set(node.get('type', '') for node in nodes2)
        
        if types1 or types2:
            if not types1 and not types2:
                types_similarity = 1.0
            elif not types1 or not types2:
                types_similarity = 0.0
            else:
                types_similarity = len(types1 & types2) / len(types1 | types2)
            score += types_similarity * 0.3
        
        return min(score, 1.0)  # Cap at 1.0


class WorkflowValidationService:
    """Service for validating workflow definitions."""
    
    @staticmethod
    def validate_workflow_dsl(dsl: dict) -> List[str]:
        """
        Validate a workflow DSL and return list of validation errors.
        
        Args:
            dsl: The workflow DSL to validate
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        # Check basic structure
        if not isinstance(dsl, dict):
            errors.append("DSL must be a dictionary")
            return errors
        
        # Check required fields
        required_fields = ['nodes', 'edges']
        for field in required_fields:
            if field not in dsl:
                errors.append(f"Missing required field: {field}")
        
        # Validate nodes
        nodes = dsl.get('nodes', [])
        if not isinstance(nodes, list):
            errors.append("'nodes' must be a list")
        else:
            node_ids = set()
            for i, node in enumerate(nodes):
                if not isinstance(node, dict):
                    errors.append(f"Node {i} must be a dictionary")
                    continue
                
                # Check required node fields
                if 'id' not in node:
                    errors.append(f"Node {i} missing 'id' field")
                    continue
                
                node_id = node['id']
                if node_id in node_ids:
                    errors.append(f"Duplicate node ID: {node_id}")
                node_ids.add(node_id)
                
                if 'type' not in node:
                    errors.append(f"Node {node_id} missing 'type' field")
        
        # Validate edges
        edges = dsl.get('edges', [])
        if not isinstance(edges, list):
            errors.append("'edges' must be a list")
        else:
            node_ids = {node.get('id') for node in nodes if isinstance(node, dict) and 'id' in node}
            
            for i, edge in enumerate(edges):
                if not isinstance(edge, dict):
                    errors.append(f"Edge {i} must be a dictionary")
                    continue
                
                # Check required edge fields
                required_edge_fields = ['source', 'target']
                for field in required_edge_fields:
                    if field not in edge:
                        errors.append(f"Edge {i} missing '{field}' field")
                        continue
                    
                    # Check if referenced nodes exist
                    if edge[field] not in node_ids:
                        errors.append(f"Edge {i} references unknown node: {edge[field]}")
        
        return errors 