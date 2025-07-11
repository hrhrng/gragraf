"""
Value Objects for the Workflow domain.
Value objects are immutable and defined by their attributes.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID, uuid4
from dataclasses import dataclass
from enum import Enum


class WorkflowStatus(str, Enum):
    """Workflow execution status."""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


@dataclass(frozen=True)
class WorkflowId:
    """Strong-typed workflow identifier."""
    value: UUID
    
    @classmethod
    def generate(cls) -> 'WorkflowId':
        """Generate a new unique workflow ID."""
        return cls(uuid4())
    
    @classmethod
    def from_string(cls, id_str: str) -> 'WorkflowId':
        """Create WorkflowId from string representation."""
        return cls(UUID(id_str))
    
    def __str__(self) -> str:
        return str(self.value)


@dataclass(frozen=True)
class WorkflowMetadata:
    """Metadata about a workflow."""
    name: str
    description: Optional[str]
    version: int
    tags: tuple[str, ...]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    def __post_init__(self):
        """Validate metadata fields."""
        if not self.name or not self.name.strip():
            raise ValueError("Workflow name cannot be empty")
        if self.version < 1:
            raise ValueError("Workflow version must be positive")
        if len(self.name) > 255:
            raise ValueError("Workflow name cannot exceed 255 characters")


@dataclass(frozen=True)
class WorkflowDefinition:
    """The actual workflow definition (DSL)."""
    dsl: Dict[str, Any]
    
    def __post_init__(self):
        """Validate workflow definition."""
        if not self.dsl:
            raise ValueError("Workflow DSL cannot be empty")
        if not isinstance(self.dsl, dict):
            raise ValueError("Workflow DSL must be a dictionary")
        
        # Basic DSL structure validation
        required_keys = {'nodes', 'edges'}
        if not all(key in self.dsl for key in required_keys):
            raise ValueError(f"Workflow DSL must contain: {required_keys}")
        
        if not isinstance(self.dsl.get('nodes'), list):
            raise ValueError("Workflow DSL 'nodes' must be a list")
        if not isinstance(self.dsl.get('edges'), list):
            raise ValueError("Workflow DSL 'edges' must be a list")


@dataclass(frozen=True)
class ExecutionStatistics:
    """Statistics about workflow executions."""
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    last_executed_at: Optional[datetime] = None
    average_execution_time_ms: Optional[float] = None
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_executions == 0:
            return 0.0
        return (self.successful_executions / self.total_executions) * 100
    
    def __post_init__(self):
        """Validate statistics."""
        if self.total_executions < 0:
            raise ValueError("Total executions cannot be negative")
        if self.successful_executions < 0:
            raise ValueError("Successful executions cannot be negative")
        if self.failed_executions < 0:
            raise ValueError("Failed executions cannot be negative")
        if self.successful_executions + self.failed_executions > self.total_executions:
            raise ValueError("Sum of successful and failed executions cannot exceed total") 