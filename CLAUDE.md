# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

### Backend (Python)
```bash
# Install dependencies
uv sync

# Start backend server
make server
# or
uvicorn src.gragraf.server:app --reload

# Run tests
make test
make test-unit        # Node-specific tests
make test-integration # API and end-to-end tests
make test-quick       # Core functionality tests

# Code quality
make lint
make format
```

### Frontend (React/TypeScript)
```bash
cd frontend
npm install
npm start              # Dev server on http://localhost:3000
npm run build          # Production build
npm test               # React tests
```

## System Architecture

**GraGraf** is a visual workflow orchestrator with:
- **Backend**: Python + LangGraph + FastAPI (port 8000)
- **Frontend**: React + ReactFlow + TypeScript (port 3000)
- **Database**: SQLite with SQLAlchemy ORM
- **LLM Integration**: OpenAI via LangChain

## Key Directories

```
src/gragraf/
├── api/workflows.py          # REST API endpoints
├── application/services.py   # Business logic orchestration
├── domain/                   # Core entities and value objects
├── infrastructure/           # Database repositories
├── nodes/                    # Node implementations (Agent, HTTP, etc.)
└── schemas/                  # API data models

frontend/src/
├── components/               # React components (ConfigPanel, RunForm, etc.)
├── nodes.tsx                 # ReactFlow node definitions
└── services/workflowApi.ts   # API client
```

## Core Concepts

**Workflow DSL**: JSON-based configuration defining nodes and edges
**Node Types**: Agent, HTTP Request, Knowledge Base, Branch, Human-in-Loop, Start/End
**Execution**: LangGraph compilation with real-time streaming via Server-Sent Events
**State**: Thread-based execution with checkpoint persistence

## Development Patterns

- **Domain-Driven Design**: Clear separation between domain, application, and infrastructure
- **Clean Architecture**: Dependency inversion with repository pattern
- **Event-Driven**: Streaming execution with human approval interrupts
- **Visual Programming**: Drag-and-drop workflow design with ReactFlow

## Environment Setup

Required environment variable:
```bash
export OPENAI_API_KEY="your_key_here"  # For Agent nodes
```

## Testing Strategy

- **Unit tests**: Individual node behavior (`tests/test_*_node.py`)
- **Integration tests**: API endpoints and workflow execution (`tests/test_end_to_end.py`)
- **DSL tests**: Graph compilation and parsing (`tests/test_dsl_parser.py`)
- **Concurrent execution**: Multi-node workflow tests (`tests/test_multi_start_nodes.py`)

## API Endpoints

**Core Execution**:
- POST `/run` - Synchronous workflow execution
- POST `/run/stream` - Streaming execution with SSE
- POST `/workflows/` - Create workflow
- GET `/workflows/{id}` - Get workflow
- PUT `/workflows/{id}/definition` - Update workflow