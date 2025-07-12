"""
Domain Entities for the Workflow domain.
Entities have identity and lifecycle, and encapsulate business logic.
"""

from datetime import datetime, timezone
from typing import Optional, List
from dataclasses import dataclass, field

from .value_objects import (
    WorkflowId, 
    WorkflowMetadata, 
    WorkflowDefinition, 
    WorkflowStatus,
    ExecutionStatistics
)


@dataclass
class Workflow:
    """
    Workflow aggregate root entity.
    Represents a complete workflow with its metadata, definition, and statistics.
    """
    id: WorkflowId
    metadata: WorkflowMetadata
    definition: WorkflowDefinition
    status: WorkflowStatus
    statistics: ExecutionStatistics = field(default_factory=ExecutionStatistics)
    
    def __post_init__(self):
        """Validate entity state."""
        if not isinstance(self.id, WorkflowId):
            raise TypeError("Workflow ID must be a WorkflowId instance")
        if not isinstance(self.metadata, WorkflowMetadata):
            raise TypeError("Metadata must be a WorkflowMetadata instance")
        if not isinstance(self.definition, WorkflowDefinition):
            raise TypeError("Definition must be a WorkflowDefinition instance")
    
    @classmethod
    def create_new(
        cls,
        name: str,
        dsl: dict,
        description: Optional[str] = None,
        tags: List[str] = None,
        created_by: Optional[str] = None
    ) -> 'Workflow':
        """
        Factory method to create a new workflow.
        
        Args:
            name: Human-readable workflow name
            dsl: Workflow definition as dictionary
            description: Optional workflow description
            tags: Optional list of tags
            created_by: Optional creator identifier
            
        Returns:
            New Workflow instance
        """
        now = datetime.now(timezone.utc)
        workflow_id = WorkflowId.generate()
        
        metadata = WorkflowMetadata(
            name=name,
            description=description,
            version=1,
            tags=tuple(tags or []),
            created_at=now,
            updated_at=now,
            created_by=created_by
        )
        
        definition = WorkflowDefinition(dsl=dsl)
        
        return cls(
            id=workflow_id,
            metadata=metadata,
            definition=definition,
            status=WorkflowStatus.DRAFT
        )
    
    def update_definition(self, new_dsl: dict) -> 'Workflow':
        """
        Update the workflow definition and increment version.
        
        Args:
            new_dsl: New workflow definition
            
        Returns:
            Updated workflow instance
        """
        new_definition = WorkflowDefinition(dsl=new_dsl)
        new_metadata = WorkflowMetadata(
            name=self.metadata.name,
            description=self.metadata.description,
            version=self.metadata.version + 1,
            tags=self.metadata.tags,
            created_at=self.metadata.created_at,
            updated_at=datetime.now(timezone.utc),
            created_by=self.metadata.created_by
        )
        
        return Workflow(
            id=self.id,
            metadata=new_metadata,
            definition=new_definition,
            status=self.status,
            statistics=self.statistics
        )
    
    def update_metadata(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> 'Workflow':
        """
        Update workflow metadata and increment version.
        
        Args:
            name: New name (optional)
            description: New description (optional)
            tags: New tags (optional)
            
        Returns:
            Updated workflow instance
        """
        new_metadata = WorkflowMetadata(
            name=name if name is not None else self.metadata.name,
            description=description if description is not None else self.metadata.description,
            version=self.metadata.version + 1,
            tags=tuple(tags) if tags is not None else self.metadata.tags,
            created_at=self.metadata.created_at,
            updated_at=datetime.now(timezone.utc),
            created_by=self.metadata.created_by
        )
        
        return Workflow(
            id=self.id,
            metadata=new_metadata,
            definition=self.definition,
            status=self.status,
            statistics=self.statistics
        )
    
    def activate(self) -> 'Workflow':
        """Make the workflow active (ready for execution)."""
        if self.status == WorkflowStatus.ARCHIVED:
            raise ValueError("Cannot activate an archived workflow")
        
        return Workflow(
            id=self.id,
            metadata=self.metadata,
            definition=self.definition,
            status=WorkflowStatus.ACTIVE,
            statistics=self.statistics
        )
    
    def deactivate(self) -> 'Workflow':
        """Make the workflow inactive (not available for execution)."""
        return Workflow(
            id=self.id,
            metadata=self.metadata,
            definition=self.definition,
            status=WorkflowStatus.INACTIVE,
            statistics=self.statistics
        )
    
    def archive(self) -> 'Workflow':
        """Archive the workflow (permanent deactivation)."""
        return Workflow(
            id=self.id,
            metadata=self.metadata,
            definition=self.definition,
            status=WorkflowStatus.ARCHIVED,
            statistics=self.statistics
        )
    
    def record_execution(
        self, 
        success: bool, 
        execution_time_ms: float,
        executed_at: Optional[datetime] = None
    ) -> 'Workflow':
        """
        Record a workflow execution result.
        
        Args:
            success: Whether the execution was successful
            execution_time_ms: Execution time in milliseconds
            executed_at: When the execution occurred (defaults to now)
            
        Returns:
            Updated workflow instance
        """
        if executed_at is None:
            executed_at = datetime.now(timezone.utc)
        
        # Calculate new statistics
        new_total = self.statistics.total_executions + 1
        new_successful = self.statistics.successful_executions + (1 if success else 0)
        new_failed = self.statistics.failed_executions + (0 if success else 1)
        
        # Calculate rolling average execution time
        if self.statistics.average_execution_time_ms is None:
            new_avg_time = execution_time_ms
        else:
            # Weighted average with more weight on recent executions
            weight = 0.1  # 10% weight for new execution
            new_avg_time = (
                (1 - weight) * self.statistics.average_execution_time_ms + 
                weight * execution_time_ms
            )
        
        new_statistics = ExecutionStatistics(
            total_executions=new_total,
            successful_executions=new_successful,
            failed_executions=new_failed,
            last_executed_at=executed_at,
            average_execution_time_ms=new_avg_time
        )
        
        return Workflow(
            id=self.id,
            metadata=self.metadata,
            definition=self.definition,
            status=self.status,
            statistics=new_statistics
        )
    
    @property
    def is_executable(self) -> bool:
        """Check if the workflow can be executed."""
        return self.status == WorkflowStatus.ACTIVE
    
    @property
    def version(self) -> int:
        """Get the current version of the workflow."""
        return self.metadata.version
    
    @property
    def name(self) -> str:
        """Get the workflow name."""
        return self.metadata.name
    
    def __str__(self) -> str:
        return f"Workflow(id={self.id}, name='{self.name}', version={self.version}, status={self.status})"
    
    def __repr__(self) -> str:
        return (
            f"Workflow(id={self.id!r}, metadata={self.metadata!r}, "
            f"definition={self.definition!r}, status={self.status!r}, "
            f"statistics={self.statistics!r})"
        ) 