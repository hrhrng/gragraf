"""
SQLAlchemy models for the Workflow domain.
These models represent the database schema and handle ORM mappings.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from uuid import UUID

from sqlalchemy import Column, String, Text, Integer, DateTime, JSON, Float, Index
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.types import TypeDecorator, CHAR

from .database import Base


def utc_now():
    """Return current UTC time for database defaults."""
    return datetime.now(timezone.utc)


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise uses CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PostgresUUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, UUID):
                return str(value)
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, UUID):
                return UUID(value)
            return value


class JSONType(TypeDecorator):
    """Cross-platform JSON type."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSON())
        elif dialect.name == 'sqlite':
            return dialect.type_descriptor(SQLiteJSON())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            if isinstance(value, str):
                return json.loads(value)
            return value
        return value


class WorkflowModel(Base):
    """SQLAlchemy model for Workflow entities."""
    
    __tablename__ = "workflows"
    
    # Primary key
    id = Column(GUID, primary_key=True, index=True)
    
    # Metadata fields
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    tags = Column(JSONType, nullable=False, default=list)  # List of strings
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
    created_by = Column(String(255), nullable=True, index=True)
    
    # Status
    status = Column(String(50), nullable=False, default="draft", index=True)
    
    # Workflow definition (DSL)
    definition_dsl = Column(JSONType, nullable=False)
    
    # Execution statistics
    total_executions = Column(Integer, nullable=False, default=0)
    successful_executions = Column(Integer, nullable=False, default=0)
    failed_executions = Column(Integer, nullable=False, default=0)
    last_executed_at = Column(DateTime, nullable=True)
    average_execution_time_ms = Column(Float, nullable=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_workflows_name_status', 'name', 'status'),
        Index('idx_workflows_created_by_status', 'created_by', 'status'),
        Index('idx_workflows_created_at', 'created_at'),
        Index('idx_workflows_updated_at', 'updated_at'),
        Index('idx_workflows_last_executed_at', 'last_executed_at'),
    )
    
    def __repr__(self):
        return (
            f"<WorkflowModel(id={self.id}, name='{self.name}', "
            f"version={self.version}, status='{self.status}')>"
        )
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_executions == 0:
            return 0.0
        return (self.successful_executions / self.total_executions) * 100
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary representation."""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'version': self.version,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'status': self.status,
            'definition_dsl': self.definition_dsl,
            'statistics': {
                'total_executions': self.total_executions,
                'successful_executions': self.successful_executions,
                'failed_executions': self.failed_executions,
                'success_rate': self.success_rate,
                'last_executed_at': self.last_executed_at.isoformat() if self.last_executed_at else None,
                'average_execution_time_ms': self.average_execution_time_ms
            }
        }
    
    @classmethod
    def from_domain_entity(cls, workflow) -> 'WorkflowModel':
        """Create a model instance from a domain entity."""
        from ..domain.entities import Workflow
        
        if not isinstance(workflow, Workflow):
            raise TypeError("Expected Workflow domain entity")
        
        return cls(
            id=workflow.id.value,
            name=workflow.metadata.name,
            description=workflow.metadata.description,
            version=workflow.metadata.version,
            tags=list(workflow.metadata.tags),
            created_at=workflow.metadata.created_at,
            updated_at=workflow.metadata.updated_at,
            created_by=workflow.metadata.created_by,
            status=workflow.status.value,
            definition_dsl=workflow.definition.dsl,
            total_executions=workflow.statistics.total_executions,
            successful_executions=workflow.statistics.successful_executions,
            failed_executions=workflow.statistics.failed_executions,
            last_executed_at=workflow.statistics.last_executed_at,
            average_execution_time_ms=workflow.statistics.average_execution_time_ms
        )
    
    def to_domain_entity(self):
        """Convert model to domain entity."""
        from ..domain.entities import Workflow
        from ..domain.value_objects import (
            WorkflowId, WorkflowMetadata, WorkflowDefinition, 
            WorkflowStatus, ExecutionStatistics
        )
        
        # Create value objects
        workflow_id = WorkflowId(self.id)
        
        metadata = WorkflowMetadata(
            name=self.name,
            description=self.description,
            version=self.version,
            tags=tuple(self.tags or []),
            created_at=self.created_at,
            updated_at=self.updated_at,
            created_by=self.created_by
        )
        
        definition = WorkflowDefinition(dsl=self.definition_dsl)
        
        status = WorkflowStatus(self.status)
        
        statistics = ExecutionStatistics(
            total_executions=self.total_executions,
            successful_executions=self.successful_executions,
            failed_executions=self.failed_executions,
            last_executed_at=self.last_executed_at,
            average_execution_time_ms=self.average_execution_time_ms
        )
        
        # Create and return domain entity
        return Workflow(
            id=workflow_id,
            metadata=metadata,
            definition=definition,
            status=status,
            statistics=statistics
        ) 