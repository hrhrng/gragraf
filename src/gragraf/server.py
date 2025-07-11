from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .compiler import GraphCompiler
from .schemas.graph import Graph
from .utils.templating import get_debug_info
from .api.workflows import router as workflows_router
from .infrastructure.database import initialize_database, DatabaseConfig
import logging
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, AsyncGenerator

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

@app.post("/run")
def execute_graph(dsl: Graph):
    """Execute workflow synchronously."""
    try:
        compiler = GraphCompiler(dsl.model_dump())
        app_instance = compiler.compile()
        result = app_instance.invoke({})
        
        return {
            "status": "success",
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/run/stream")
async def execute_graph_stream(dsl: Graph):
    """Execute workflow with streaming updates."""
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send start event
            yield f"data: {json.dumps({'type': 'start', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Execute workflow
            compiler = GraphCompiler(dsl.model_dump())
            app_instance = compiler.compile()
            
            # Stream execution
            final_state = {}
            for chunk in app_instance.stream({}):
                final_state.update(chunk)
                yield f"data: {json.dumps({'type': 'progress', 'data': chunk, 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete', 'result': final_state, 'timestamp': datetime.now().isoformat()})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming execution failed: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'timestamp': datetime.now().isoformat()})}\n\n"
    
    return StreamingResponse(
        event_generator(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.get("/debug/template-info")
def get_template_debug_info(
    config_type: str = "AgentConfig",
    system_prompt: str = "You are a {{role}} assistant",
    user_prompt: str = "Help with {{task}}",
    name: str = "test",
    greeting: str = "hello"
):
    """Debug endpoint for template variable analysis."""
    try:
        from .nodes.agent import AgentConfig
        
        mock_config = AgentConfig(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        mock_state = {
            "name": name,
            "greeting": greeting,
            "role": "assistant",
            "task": "analysis"
        }
        
        debug_info = get_debug_info(mock_config, mock_state)
        return debug_info
        
    except Exception as e:
        logger.error(f"Debug info generation failed: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

 