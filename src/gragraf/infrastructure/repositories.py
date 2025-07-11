"""
SQLAlchemy implementation of repositories.
Production-ready implementation supporting SQLite and PostgreSQL.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from ..domain.entities import Workflow
from ..domain.value_objects import WorkflowId, WorkflowStatus
from ..domain.repositories import (
    WorkflowRepository, WorkflowFilter, UnitOfWork,
    RepositoryError, WorkflowNotFoundError, 
    DuplicateWorkflowError, WorkflowConflictError
)
from .models import WorkflowModel
from .database import DatabaseManager


class SQLAlchemyWorkflowRepository(WorkflowRepository):
    """SQLAlchemy implementation of WorkflowRepository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def save(self, workflow: Workflow) -> None:
        """Save or update a workflow."""
        try:
            # Check if workflow already exists
            existing_model = await self._session.get(WorkflowModel, workflow.id.value)
            
            if existing_model is None:
                # Create new workflow
                model = WorkflowModel.from_domain_entity(workflow)
                self._session.add(model)
            else:
                # Update existing workflow
                # Check for optimistic locking (version conflict)
                if existing_model.version != workflow.version - 1:
                    if workflow.version > 1:  # Only check for updates, not new workflows
                        raise WorkflowConflictError(
                            workflow.id, 
                            workflow.version - 1, 
                            existing_model.version
                        )
                
                # Update all fields
                existing_model.name = workflow.metadata.name
                existing_model.description = workflow.metadata.description
                existing_model.version = workflow.metadata.version
                existing_model.tags = list(workflow.metadata.tags)
                existing_model.updated_at = workflow.metadata.updated_at
                existing_model.created_by = workflow.metadata.created_by
                existing_model.status = workflow.status.value
                existing_model.definition_dsl = workflow.definition.dsl
                existing_model.total_executions = workflow.statistics.total_executions
                existing_model.successful_executions = workflow.statistics.successful_executions
                existing_model.failed_executions = workflow.statistics.failed_executions
                existing_model.last_executed_at = workflow.statistics.last_executed_at
                existing_model.average_execution_time_ms = workflow.statistics.average_execution_time_ms
            
            await self._session.flush()
            
        except IntegrityError as e:
            await self._session.rollback()
            # Check if it's a unique constraint violation on name
            if "name" in str(e).lower():
                raise DuplicateWorkflowError(workflow.name)
            raise RepositoryError(f"Database integrity error: {e}")
        except SQLAlchemyError as e:
            await self._session.rollback()
            raise RepositoryError(f"Database error during save: {e}")
    
    async def find_by_id(self, workflow_id: WorkflowId) -> Optional[Workflow]:
        """Find a workflow by its ID."""
        try:
            model = await self._session.get(WorkflowModel, workflow_id.value)
            return model.to_domain_entity() if model else None
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during find by ID: {e}")
    
    async def find_by_name(self, name: str) -> Optional[Workflow]:
        """Find a workflow by its name."""
        try:
            stmt = select(WorkflowModel).where(WorkflowModel.name == name)
            result = await self._session.execute(stmt)
            model = result.scalar_one_or_none()
            return model.to_domain_entity() if model else None
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during find by name: {e}")
    
    async def find_all(
        self, 
        filter_criteria: Optional[WorkflowFilter] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Workflow]:
        """Find workflows matching the given criteria."""
        try:
            stmt = select(WorkflowModel)
            
            # Apply filters
            if filter_criteria:
                stmt = self._apply_filters(stmt, filter_criteria)
            
            # Apply ordering (newest first)
            stmt = stmt.order_by(WorkflowModel.created_at.desc())
            
            # Apply pagination
            if offset > 0:
                stmt = stmt.offset(offset)
            if limit is not None:
                stmt = stmt.limit(limit)
            
            result = await self._session.execute(stmt)
            models = result.scalars().all()
            
            return [model.to_domain_entity() for model in models]
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during find all: {e}")
    
    async def count(self, filter_criteria: Optional[WorkflowFilter] = None) -> int:
        """Count workflows matching the given criteria."""
        try:
            stmt = select(func.count(WorkflowModel.id))
            
            # Apply filters
            if filter_criteria:
                stmt = self._apply_filters(stmt, filter_criteria)
            
            result = await self._session.execute(stmt)
            return result.scalar()
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during count: {e}")
    
    async def delete(self, workflow_id: WorkflowId) -> bool:
        """Delete a workflow by its ID."""
        try:
            model = await self._session.get(WorkflowModel, workflow_id.value)
            if model is None:
                return False
            
            await self._session.delete(model)
            await self._session.flush()
            return True
        except SQLAlchemyError as e:
            await self._session.rollback()
            raise RepositoryError(f"Database error during delete: {e}")
    
    async def exists(self, workflow_id: WorkflowId) -> bool:
        """Check if a workflow exists."""
        try:
            stmt = select(func.count(WorkflowModel.id)).where(
                WorkflowModel.id == workflow_id.value
            )
            result = await self._session.execute(stmt)
            count = result.scalar()
            return count > 0
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during exists check: {e}")
    
    async def find_active_workflows(self) -> List[Workflow]:
        """Find all active workflows."""
        try:
            stmt = select(WorkflowModel).where(
                WorkflowModel.status == WorkflowStatus.ACTIVE.value
            ).order_by(WorkflowModel.created_at.desc())
            
            result = await self._session.execute(stmt)
            models = result.scalars().all()
            
            return [model.to_domain_entity() for model in models]
        except SQLAlchemyError as e:
            raise RepositoryError(f"Database error during find active workflows: {e}")
    
    def _apply_filters(self, stmt, filter_criteria: WorkflowFilter):
        """Apply filter criteria to a query statement."""
        conditions = []
        
        # Status filter
        if filter_criteria.status is not None:
            conditions.append(WorkflowModel.status == filter_criteria.status.value)
        
        # Tags filter (workflow must have ALL specified tags)
        if filter_criteria.tags:
            for tag in filter_criteria.tags:
                # For SQLite and PostgreSQL JSON contains
                conditions.append(
                    text("JSON_EXTRACT(tags, '$') LIKE :tag OR tags LIKE :tag_alt").bindparams(
                        tag=f'%"{tag}"%',
                        tag_alt=f'%{tag}%'
                    )
                )
        
        # Name contains filter
        if filter_criteria.name_contains:
            conditions.append(
                WorkflowModel.name.ilike(f"%{filter_criteria.name_contains}%")
            )
        
        # Date range filters
        if filter_criteria.created_after:
            conditions.append(WorkflowModel.created_at >= filter_criteria.created_after)
        if filter_criteria.created_before:
            conditions.append(WorkflowModel.created_at <= filter_criteria.created_before)
        
        # Created by filter
        if filter_criteria.created_by:
            conditions.append(WorkflowModel.created_by == filter_criteria.created_by)
        
        # Apply all conditions
        if conditions:
            stmt = stmt.where(and_(*conditions))
        
        return stmt


class SQLAlchemyUnitOfWork(UnitOfWork):
    """SQLAlchemy implementation of Unit of Work pattern."""
    
    def __init__(self, db_manager: DatabaseManager):
        self._db_manager = db_manager
        self._session: Optional[AsyncSession] = None
        self._workflow_repository: Optional[SQLAlchemyWorkflowRepository] = None
    
    async def __aenter__(self):
        """Start a new unit of work (transaction)."""
        session_factory = self._db_manager.get_async_session_factory()
        self._session = session_factory()
        await self._session.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Complete the unit of work (commit or rollback)."""
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()
        
        await self._session.__aexit__(exc_type, exc_val, exc_tb)
    
    async def commit(self) -> None:
        """Commit the current transaction."""
        if self._session:
            await self._session.commit()
    
    async def rollback(self) -> None:
        """Rollback the current transaction."""
        if self._session:
            await self._session.rollback()
    
    @property
    def workflows(self) -> WorkflowRepository:
        """Get the workflow repository for this unit of work."""
        if self._workflow_repository is None:
            if self._session is None:
                raise RuntimeError("Unit of Work not started. Use 'async with' statement.")
            self._workflow_repository = SQLAlchemyWorkflowRepository(self._session)
        return self._workflow_repository


class RepositoryFactory:
    """Factory for creating repository instances."""
    
    def __init__(self, db_manager: DatabaseManager):
        self._db_manager = db_manager
    
    def create_unit_of_work(self) -> UnitOfWork:
        """Create a new unit of work."""
        return SQLAlchemyUnitOfWork(self._db_manager)
    
    async def create_workflow_repository(self) -> WorkflowRepository:
        """Create a workflow repository with a new session."""
        session_factory = self._db_manager.get_async_session_factory()
        session = session_factory()
        return SQLAlchemyWorkflowRepository(session) 