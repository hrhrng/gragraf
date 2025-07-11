"""
REST API endpoints for workflow management.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from ..domain.value_objects import WorkflowId, WorkflowStatus
from ..domain.repositories import DuplicateWorkflowError
from ..application.services import WorkflowApplicationService
from ..infrastructure.repositories import RepositoryFactory


# Pydantic models for API
class CreateWorkflowRequest(BaseModel):
    name: str = Field(..., description="Workflow name (must be unique)")
    dsl: Dict[str, Any] = Field(..., description="Workflow definition")
    description: Optional[str] = Field(None, description="Optional description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Optional tags")
    created_by: Optional[str] = Field(None, description="Creator identifier")


class UpdateWorkflowRequest(BaseModel):
    dsl: Dict[str, Any] = Field(..., description="New workflow definition")


class UpdateWorkflowMetadataRequest(BaseModel):
    name: Optional[str] = Field(None, description="New name")
    description: Optional[str] = Field(None, description="New description")
    tags: Optional[List[str]] = Field(None, description="New tags")


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    version: int
    status: str
    tags: List[str]
    created_at: str
    updated_at: str
    created_by: Optional[str]
    definition: Dict[str, Any]
    statistics: Dict[str, Any]


class WorkflowListResponse(BaseModel):
    workflows: List[WorkflowResponse]
    total: int
    offset: int
    limit: Optional[int]


class ExecutionRecordRequest(BaseModel):
    success: bool = Field(..., description="Whether execution was successful")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    executed_at: Optional[datetime] = Field(None, description="When execution occurred")


class HealthResponse(BaseModel):
    status: str
    health_score: float
    success_rate: float
    total_executions: int
    last_executed_at: Optional[str]
    average_execution_time_ms: Optional[float]


# Dependency injection
def get_workflow_service() -> WorkflowApplicationService:
    """Get workflow application service instance."""
    from ..server import db_manager
    if db_manager is None:
        raise RuntimeError("Database not initialized. Application startup may have failed.")
    factory = RepositoryFactory(db_manager)
    return WorkflowApplicationService(factory)


# Router
router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    request: CreateWorkflowRequest,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Create a new workflow."""
    try:
        workflow = await service.create_workflow(
            name=request.name,
            dsl=request.dsl,
            description=request.description,
            tags=request.tags,
            created_by=request.created_by
        )
        return _workflow_to_response(workflow)
    except DuplicateWorkflowError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Get a workflow by ID."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.get_workflow(wf_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid workflow ID: {e}")


@router.get("/name/{name}", response_model=WorkflowResponse)
async def get_workflow_by_name(
    name: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Get a workflow by name."""
    workflow = await service.get_workflow_by_name(name)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return _workflow_to_response(workflow)


@router.get("/", response_model=WorkflowListResponse)
async def list_workflows(
    status: Optional[str] = Query(None, description="Filter by status"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    name_contains: Optional[str] = Query(None, description="Filter by name containing text"),
    created_by: Optional[str] = Query(None, description="Filter by creator"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """List workflows with optional filtering."""
    try:
        # Parse filters
        status_filter = WorkflowStatus(status) if status else None
        tags_filter = tags.split(',') if tags else None
        
        # Get workflows and count
        workflows = await service.list_workflows(
            status=status_filter,
            tags=tags_filter,
            name_contains=name_contains,
            created_by=created_by,
            limit=limit,
            offset=offset
        )
        
        total = await service.count_workflows(
            status=status_filter,
            tags=tags_filter,
            name_contains=name_contains,
            created_by=created_by
        )
        
        return WorkflowListResponse(
            workflows=[_workflow_to_response(wf) for wf in workflows],
            total=total,
            offset=offset,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{workflow_id}/definition", response_model=WorkflowResponse)
async def update_workflow_definition(
    workflow_id: str,
    request: UpdateWorkflowRequest,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Update a workflow's definition."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.update_workflow_definition(wf_id, request.dsl)
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{workflow_id}/metadata", response_model=WorkflowResponse)
async def update_workflow_metadata(
    workflow_id: str,
    request: UpdateWorkflowMetadataRequest,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Update a workflow's metadata."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.update_workflow_metadata(
            wf_id,
            name=request.name,
            description=request.description,
            tags=request.tags
        )
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{workflow_id}/activate", response_model=WorkflowResponse)
async def activate_workflow(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Activate a workflow for execution."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.activate_workflow(wf_id)
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{workflow_id}/deactivate", response_model=WorkflowResponse)
async def deactivate_workflow(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Deactivate a workflow."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.deactivate_workflow(wf_id)
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{workflow_id}/archive", response_model=WorkflowResponse)
async def archive_workflow(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Archive a workflow (permanent deactivation)."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.archive_workflow(wf_id)
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Delete a workflow if allowed."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        deleted = await service.delete_workflow(wf_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"message": "Workflow deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/active/list", response_model=List[WorkflowResponse])
async def get_active_workflows(
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Get all active workflows."""
    workflows = await service.get_active_workflows()
    return [_workflow_to_response(wf) for wf in workflows]


@router.post("/{workflow_id}/executions", response_model=WorkflowResponse)
async def record_execution(
    workflow_id: str,
    request: ExecutionRecordRequest,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Record a workflow execution result."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        workflow = await service.record_workflow_execution(
            wf_id,
            success=request.success,
            execution_time_ms=request.execution_time_ms,
            executed_at=request.executed_at
        )
        return _workflow_to_response(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{workflow_id}/health", response_model=HealthResponse)
async def get_workflow_health(
    workflow_id: str,
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Get health metrics for a workflow."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        health = await service.get_workflow_health(wf_id)
        
        if health.get("status") == "not_found":
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Convert datetime to string if present
        if health.get("last_executed_at") and not isinstance(health["last_executed_at"], str):
            health["last_executed_at"] = health["last_executed_at"].isoformat()
        
        return HealthResponse(**health)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{workflow_id}/similar", response_model=List[WorkflowResponse])
async def get_similar_workflows(
    workflow_id: str,
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Similarity threshold"),
    service: WorkflowApplicationService = Depends(get_workflow_service)
):
    """Find workflows similar to the given one."""
    try:
        wf_id = WorkflowId.from_string(workflow_id)
        similar_workflows = await service.find_similar_workflows(wf_id, threshold)
        return [_workflow_to_response(wf) for wf in similar_workflows]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _workflow_to_response(workflow) -> WorkflowResponse:
    """Convert domain workflow to API response."""
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.metadata.description,
        version=workflow.version,
        status=workflow.status.value,
        tags=list(workflow.metadata.tags),
        created_at=workflow.metadata.created_at.isoformat(),
        updated_at=workflow.metadata.updated_at.isoformat(),
        created_by=workflow.metadata.created_by,
        definition=workflow.definition.dsl,
        statistics={
            "total_executions": workflow.statistics.total_executions,
            "successful_executions": workflow.statistics.successful_executions,
            "failed_executions": workflow.statistics.failed_executions,
            "success_rate": workflow.statistics.success_rate,
            "last_executed_at": workflow.statistics.last_executed_at.isoformat() if workflow.statistics.last_executed_at else None,
            "average_execution_time_ms": workflow.statistics.average_execution_time_ms
        }
    ) 