from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from .compiler import GraphCompiler
from .schemas.graph import Graph
from .utils.templating import get_debug_info
from .api.workflows import router as workflows_router
from .infrastructure.database import initialize_database, DatabaseConfig
import logging
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, AsyncGenerator, Optional
from langgraph.types import Interrupt, Command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Global database manager
db_manager = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    global db_manager
    try:
        logger.info("Initializing database...")
        config = DatabaseConfig()
        db_manager = initialize_database(config)

        # Create tables if they don't exist
        await db_manager.create_tables()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up database connections on application shutdown."""
    global db_manager
    if db_manager:
        try:
            await db_manager.close()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

app.include_router(workflows_router)


class StreamRequest(BaseModel):
    dsl: Graph
    thread_id: Optional[str] = None
    human_input: Optional[Dict[str, Any]] = None
    runtime_inputs: Optional[Dict[str, Any]] = None  # 分离的运行时输入


@app.post("/run/stream")
async def execute_graph_stream(request: StreamRequest):
    """Execute workflow with streaming updates and human-in-loop support."""
    async def event_generator() -> AsyncGenerator[str, None]:
        # Ensure we have a thread_id
        thread_id = request.thread_id or f"thread_{datetime.now().timestamp()}_{id(request)}"
        logger.info(f"Executing workflow with thread_id: {thread_id}")

        try:
            # Send start event
            yield f"data: {json.dumps({'type': 'start', 'timestamp': datetime.now().isoformat(), 'thread_id': thread_id})}\n\n"

            # Execute workflow
            dsl_data = request.dsl.model_dump()
            compiler = GraphCompiler(dsl_data)
            app_instance = compiler.compile()
            # Configure for streaming with thread support
            config = {"configurable": {"thread_id": thread_id}}
            # Stream execution
            final_state = {}
            interrupt_info = None
            # 处理 human-in-loop resume
            logger.info(f"request.human_input: {request.human_input}")
            if request.human_input:
                input_of_graph = Command(resume=list(request.human_input.values())[0])
            else:
                input_of_graph = request.runtime_inputs or {}
            logger.info(f"input_of_graph: {input_of_graph}")
            for chunk in app_instance.stream(input_of_graph, config):
                final_state.update(chunk)
                # Check for human-in-loop interrupts
                interrupt_info: tuple[Interrupt] | None = chunk.get('__interrupt__', None)
                if interrupt_info is not None:
                    logger.info(f"yield data: {interrupt_info[0].value}")
                    yield f"data: {json.dumps({'type': 'human_input_required', 'interrupt_info': interrupt_info[0].value, 'timestamp': datetime.now().isoformat(), 'thread_id': thread_id})}\n\n"
                    return  # Stop execution, wait for human input
                else:
                    logger.info(f"yield data: {chunk}")
                    yield f"data: {json.dumps({'type': 'progress', 'data': chunk, 'timestamp': datetime.now().isoformat(), 'thread_id': thread_id})}\n\n"
            # Send completion event
            logger.info(f"final_state: {final_state}")
            yield f"data: {json.dumps({'type': 'complete', 'result': final_state, 'timestamp': datetime.now().isoformat(), 'thread_id': thread_id})}\n\n"

        except Exception as e:
            logger.error(f"Streaming execution failed: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'timestamp': datetime.now().isoformat(), 'thread_id': thread_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
