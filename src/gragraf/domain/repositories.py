"""
Repository interfaces for the Workflow domain.
Defines contracts for data access without coupling to specific implementations.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Protocol, runtime_checkable
from datetime import datetime

from .entities import Workflow
from .value_objects import WorkflowId, WorkflowStatus


@runtime_checkable
class WorkflowFilter(Protocol):
    """Protocol for workflow filtering criteria."""
    status: Optional[WorkflowStatus]
    tags: Optional[List[str]]
    name_contains: Optional[str]
    created_after: Optional[datetime]
    created_before: Optional[datetime]
    created_by: Optional[str]


class WorkflowRepository(ABC):
    """Abstract repository interface for Workflow entities."""
    
    @abstractmethod
    async def save(self, workflow: Workflow) -> None:
        """
        Save or update a workflow.
        
        Args:
            workflow: The workflow entity to save
            
        Raises:
            RepositoryError: If save operation fails
        """
        pass
    
    @abstractmethod
    async def find_by_id(self, workflow_id: WorkflowId) -> Optional[Workflow]:
        """
        Find a workflow by its ID.
        
        Args:
            workflow_id: The workflow ID to search for
            
        Returns:
            The workflow if found, None otherwise
            
        Raises:
            RepositoryError: If query operation fails
        """
        pass
    
    @abstractmethod
    async def find_by_name(self, name: str) -> Optional[Workflow]:
        """
        Find a workflow by its name.
        
        Args:
            name: The workflow name to search for
            
        Returns:
            The workflow if found, None otherwise
            
        Raises:
            RepositoryError: If query operation fails
        """
        pass
    
    @abstractmethod
    async def find_all(
        self, 
        filter_criteria: Optional[WorkflowFilter] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Workflow]:
        """
        Find workflows matching the given criteria.
        
        Args:
            filter_criteria: Optional filtering criteria
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of matching workflows
            
        Raises:
            RepositoryError: If query operation fails
        """
        pass
    
    @abstractmethod
    async def count(self, filter_criteria: Optional[WorkflowFilter] = None) -> int:
        """
        Count workflows matching the given criteria.
        
        Args:
            filter_criteria: Optional filtering criteria
            
        Returns:
            Number of matching workflows
            
        Raises:
            RepositoryError: If query operation fails
        """
        pass
    
    @abstractmethod
    async def delete(self, workflow_id: WorkflowId) -> bool:
        """
        Delete a workflow by its ID.
        
        Args:
            workflow_id: The workflow ID to delete
            
        Returns:
            True if workflow was deleted, False if not found
            
        Raises:
            RepositoryError: If delete operation fails
        """
        pass
    
    @abstractmethod
    async def exists(self, workflow_id: WorkflowId) -> bool:
        """
        Check if a workflow exists.
        
        Args:
            workflow_id: The workflow ID to check
            
        Returns:
            True if workflow exists, False otherwise
            
        Raises:
            RepositoryError: If check operation fails
        """
        pass
    
    @abstractmethod
    async def find_active_workflows(self) -> List[Workflow]:
        """
        Find all active workflows.
        
        Returns:
            List of active workflows
            
        Raises:
            RepositoryError: If query operation fails
        """
        pass


class UnitOfWork(ABC):
    """
    Unit of Work pattern for managing transactions.
    Ensures consistency across multiple repository operations.
    """
    
    @abstractmethod
    async def __aenter__(self):
        """Start a new unit of work (transaction)."""
        pass
    
    @abstractmethod
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Complete the unit of work (commit or rollback)."""
        pass
    
    @abstractmethod
    async def commit(self) -> None:
        """Commit the current transaction."""
        pass
    
    @abstractmethod
    async def rollback(self) -> None:
        """Rollback the current transaction."""
        pass
    
    @property
    @abstractmethod
    def workflows(self) -> WorkflowRepository:
        """Get the workflow repository for this unit of work."""
        pass


class RepositoryError(Exception):
    """Base exception for repository operations."""
    pass


class WorkflowNotFoundError(RepositoryError):
    """Raised when a workflow is not found."""
    
    def __init__(self, workflow_id: WorkflowId):
        self.workflow_id = workflow_id
        super().__init__(f"Workflow with ID {workflow_id} not found")


class DuplicateWorkflowError(RepositoryError):
    """Raised when attempting to create a workflow with duplicate name."""
    
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"Workflow with name '{name}' already exists")


class WorkflowConflictError(RepositoryError):
    """Raised when there's a version conflict during update."""
    
    def __init__(self, workflow_id: WorkflowId, expected_version: int, actual_version: int):
        self.workflow_id = workflow_id
        self.expected_version = expected_version
        self.actual_version = actual_version
        super().__init__(
            f"Version conflict for workflow {workflow_id}: "
            f"expected {expected_version}, got {actual_version}"
        ) 