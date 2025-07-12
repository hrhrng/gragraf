"""
Application services for workflow management.
Implements use cases and coordinates between domain and infrastructure layers.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass

from ..domain.entities import Workflow
from ..domain.value_objects import WorkflowId, WorkflowStatus
from ..domain.repositories import UnitOfWork, WorkflowFilter
from ..domain.services import WorkflowDomainService, WorkflowValidationService
from ..infrastructure.repositories import RepositoryFactory


@dataclass
class WorkflowFilterCriteria:
    """Implementation of WorkflowFilter protocol for application layer."""
    status: Optional[WorkflowStatus] = None
    tags: Optional[List[str]] = None
    name_contains: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    created_by: Optional[str] = None


class WorkflowApplicationService:
    """
    Application service for workflow management.
    Implements business use cases and transactions.
    """
    
    def __init__(self, repository_factory: RepositoryFactory):
        self._repository_factory = repository_factory
    
    async def create_workflow(
        self,
        name: str,
        dsl: Dict[str, Any],
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
            Created workflow
            
        Raises:
            ValueError: If DSL validation fails
            DuplicateWorkflowError: If name already exists
        """
        # Validate DSL
        validation_errors = WorkflowValidationService.validate_workflow_dsl(dsl)
        if validation_errors:
            raise ValueError(f"Invalid workflow DSL: {'; '.join(validation_errors)}")
        
        async with self._repository_factory.create_unit_of_work() as uow:
            domain_service = WorkflowDomainService(uow.workflows)
            workflow = await domain_service.create_workflow(
                name=name,
                dsl=dsl,
                description=description,
                tags=tags,
                created_by=created_by
            )
            await uow.commit()
            return workflow
    
    async def get_workflow(self, workflow_id: WorkflowId) -> Optional[Workflow]:
        """Get a workflow by ID."""
        async with self._repository_factory.create_unit_of_work() as uow:
            return await uow.workflows.find_by_id(workflow_id)
    
    async def get_workflow_by_name(self, name: str) -> Optional[Workflow]:
        """Get a workflow by name."""
        async with self._repository_factory.create_unit_of_work() as uow:
            return await uow.workflows.find_by_name(name)
    
    async def update_workflow_definition(
        self,
        workflow_id: WorkflowId,
        new_dsl: Dict[str, Any]
    ) -> Workflow:
        """
        Update a workflow's definition.
        
        Args:
            workflow_id: The workflow ID
            new_dsl: New workflow definition
            
        Returns:
            Updated workflow
            
        Raises:
            ValueError: If DSL validation fails or workflow not found
        """
        # Validate DSL
        validation_errors = WorkflowValidationService.validate_workflow_dsl(new_dsl)
        if validation_errors:
            raise ValueError(f"Invalid workflow DSL: {'; '.join(validation_errors)}")
        
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            updated_workflow = workflow.update_definition(new_dsl)
            await uow.workflows.save(updated_workflow)
            await uow.commit()
            return updated_workflow
    
    async def update_workflow_metadata(
        self,
        workflow_id: WorkflowId,
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Workflow:
        """
        Update a workflow's metadata.
        
        Args:
            workflow_id: The workflow ID
            name: New name (optional)
            description: New description (optional)
            tags: New tags (optional)
            
        Returns:
            Updated workflow
            
        Raises:
            ValueError: If workflow not found
            DuplicateWorkflowError: If name conflicts with another workflow
        """
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            # Check for name conflicts if name is being changed
            if name is not None and name != workflow.metadata.name:
                existing_workflow = await uow.workflows.find_by_name(name)
                if existing_workflow is not None and existing_workflow.id != workflow_id:
                    from ..domain.repositories import DuplicateWorkflowError
                    raise DuplicateWorkflowError(name)
            
            updated_workflow = workflow.update_metadata(
                name=name,
                description=description,
                tags=tags
            )
            await uow.workflows.save(updated_workflow)
            await uow.commit()
            return updated_workflow
    
    async def activate_workflow(self, workflow_id: WorkflowId) -> Workflow:
        """Activate a workflow for execution."""
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            activated_workflow = workflow.activate()
            await uow.workflows.save(activated_workflow)
            await uow.commit()
            return activated_workflow
    
    async def deactivate_workflow(self, workflow_id: WorkflowId) -> Workflow:
        """Deactivate a workflow."""
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            deactivated_workflow = workflow.deactivate()
            await uow.workflows.save(deactivated_workflow)
            await uow.commit()
            return deactivated_workflow
    
    async def archive_workflow(self, workflow_id: WorkflowId) -> Workflow:
        """Archive a workflow (permanent deactivation)."""
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            archived_workflow = workflow.archive()
            await uow.workflows.save(archived_workflow)
            await uow.commit()
            return archived_workflow
    
    async def delete_workflow(self, workflow_id: WorkflowId) -> bool:
        """
        Delete a workflow if allowed.
        
        Args:
            workflow_id: The workflow ID
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            ValueError: If workflow cannot be deleted
        """
        async with self._repository_factory.create_unit_of_work() as uow:
            domain_service = WorkflowDomainService(uow.workflows)
            
            if not await domain_service.can_delete_workflow(workflow_id):
                workflow = await uow.workflows.find_by_id(workflow_id)
                if workflow:
                    raise ValueError(
                        f"Cannot delete workflow {workflow_id}: "
                        f"active workflows must be deactivated first"
                    )
                return False
            
            deleted = await uow.workflows.delete(workflow_id)
            if deleted:
                await uow.commit()
            return deleted
    
    async def list_workflows(
        self,
        status: Optional[WorkflowStatus] = None,
        tags: Optional[List[str]] = None,
        name_contains: Optional[str] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        created_by: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Workflow]:
        """
        List workflows with optional filtering.
        
        Returns:
            List of matching workflows
        """
        filter_criteria = WorkflowFilterCriteria(
            status=status,
            tags=tags,
            name_contains=name_contains,
            created_after=created_after,
            created_before=created_before,
            created_by=created_by
        )
        
        async with self._repository_factory.create_unit_of_work() as uow:
            return await uow.workflows.find_all(filter_criteria, limit, offset)
    
    async def count_workflows(
        self,
        status: Optional[WorkflowStatus] = None,
        tags: Optional[List[str]] = None,
        name_contains: Optional[str] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        created_by: Optional[str] = None
    ) -> int:
        """
        Count workflows with optional filtering.
        
        Returns:
            Number of matching workflows
        """
        filter_criteria = WorkflowFilterCriteria(
            status=status,
            tags=tags,
            name_contains=name_contains,
            created_after=created_after,
            created_before=created_before,
            created_by=created_by
        )
        
        async with self._repository_factory.create_unit_of_work() as uow:
            return await uow.workflows.count(filter_criteria)
    
    async def get_active_workflows(self) -> List[Workflow]:
        """Get all active workflows."""
        async with self._repository_factory.create_unit_of_work() as uow:
            return await uow.workflows.find_active_workflows()
    
    async def record_workflow_execution(
        self,
        workflow_id: WorkflowId,
        success: bool,
        execution_time_ms: float,
        executed_at: Optional[datetime] = None
    ) -> Workflow:
        """
        Record a workflow execution result.
        
        Args:
            workflow_id: The workflow ID
            success: Whether execution was successful
            execution_time_ms: Execution time in milliseconds
            executed_at: When execution occurred (defaults to now)
            
        Returns:
            Updated workflow with execution statistics
            
        Raises:
            ValueError: If workflow not found
        """
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            updated_workflow = workflow.record_execution(
                success=success,
                execution_time_ms=execution_time_ms,
                executed_at=executed_at
            )
            await uow.workflows.save(updated_workflow)
            await uow.commit()
            return updated_workflow
    
    async def get_workflow_health(self, workflow_id: WorkflowId) -> Dict[str, Any]:
        """
        Get health metrics for a workflow.
        
        Args:
            workflow_id: The workflow ID
            
        Returns:
            Health metrics dictionary
        """
        async with self._repository_factory.create_unit_of_work() as uow:
            domain_service = WorkflowDomainService(uow.workflows)
            return await domain_service.get_workflow_health(workflow_id)
    
    async def find_similar_workflows(
        self, 
        workflow_id: WorkflowId,
        similarity_threshold: float = 0.7
    ) -> List[Workflow]:
        """
        Find workflows similar to the given one.
        
        Args:
            workflow_id: The reference workflow ID
            similarity_threshold: Minimum similarity score (0.0 to 1.0)
            
        Returns:
            List of similar workflows
            
        Raises:
            ValueError: If workflow not found
        """
        async with self._repository_factory.create_unit_of_work() as uow:
            workflow = await uow.workflows.find_by_id(workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            domain_service = WorkflowDomainService(uow.workflows)
            return await domain_service.find_similar_workflows(
                workflow, 
                similarity_threshold
            ) 