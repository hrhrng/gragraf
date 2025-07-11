"""
Database configuration and connection management.
"""

import os
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class DatabaseConfig:
    """Database configuration settings."""
    
    def __init__(
        self,
        database_url: str = None,
        echo: bool = False,
        pool_size: int = 10,
        max_overflow: int = 20
    ):
        self.database_url = database_url or os.getenv(
            "DATABASE_URL", 
            "sqlite+aiosqlite:///./workflows.db"
        )
        self.echo = echo
        self.pool_size = pool_size
        self.max_overflow = max_overflow
    
    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.database_url.startswith("sqlite")
    
    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL for migrations."""
        if self.is_sqlite:
            return self.database_url.replace("sqlite+aiosqlite://", "sqlite://")
        return self.database_url.replace("+aiosqlite", "").replace("+asyncpg", "")


class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._async_engine = None
        self._sync_engine = None
        self._async_session_factory = None
        self._sync_session_factory = None
    
    def get_async_engine(self):
        """Get or create async database engine."""
        if self._async_engine is None:
            if self.config.is_sqlite:
                # SQLite-specific configuration
                self._async_engine = create_async_engine(
                    self.config.database_url,
                    echo=self.config.echo,
                    poolclass=StaticPool,
                    connect_args={
                        "check_same_thread": False,
                    }
                )
            else:
                # PostgreSQL or other database configuration
                self._async_engine = create_async_engine(
                    self.config.database_url,
                    echo=self.config.echo,
                    pool_size=self.config.pool_size,
                    max_overflow=self.config.max_overflow
                )
        return self._async_engine
    
    def get_sync_engine(self):
        """Get or create sync database engine for migrations."""
        if self._sync_engine is None:
            if self.config.is_sqlite:
                self._sync_engine = create_engine(
                    self.config.sync_database_url,
                    echo=self.config.echo,
                    poolclass=StaticPool,
                    connect_args={"check_same_thread": False}
                )
            else:
                self._sync_engine = create_engine(
                    self.config.sync_database_url,
                    echo=self.config.echo,
                    pool_size=self.config.pool_size,
                    max_overflow=self.config.max_overflow
                )
        return self._sync_engine
    
    def get_async_session_factory(self):
        """Get async session factory."""
        if self._async_session_factory is None:
            self._async_session_factory = async_sessionmaker(
                bind=self.get_async_engine(),
                class_=AsyncSession,
                expire_on_commit=False
            )
        return self._async_session_factory
    
    def get_sync_session_factory(self):
        """Get sync session factory."""
        if self._sync_session_factory is None:
            self._sync_session_factory = sessionmaker(
                bind=self.get_sync_engine()
            )
        return self._sync_session_factory
    
    async def create_tables(self):
        """Create all database tables."""
        from .models import WorkflowModel  # Import here to avoid circular imports
        
        async with self.get_async_engine().begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def drop_tables(self):
        """Drop all database tables."""
        async with self.get_async_engine().begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async database session."""
        session_factory = self.get_async_session_factory()
        async with session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def close(self):
        """Close database connections."""
        if self._async_engine:
            await self._async_engine.dispose()
        if self._sync_engine:
            self._sync_engine.dispose()


# Global database manager instance
db_manager: DatabaseManager = None


def initialize_database(config: DatabaseConfig = None) -> DatabaseManager:
    """Initialize the global database manager."""
    global db_manager
    if config is None:
        config = DatabaseConfig()
    db_manager = DatabaseManager(config)
    return db_manager


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    if db_manager is None:
        raise RuntimeError("Database not initialized. Call initialize_database() first.")
    
    async for session in db_manager.get_session():
        yield session 