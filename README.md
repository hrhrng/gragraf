# Gragraf

Gragraf is a workflow orchestration application similar to Dify or n8n, built with LangGraph and React. It provides a visual canvas to build and execute graphs of nodes, including HTTP requests, code execution, conditional branching, and AI agents.

## Technologies Used

- **Backend**:
  - [LangGraph](https://github.com/langchain-ai/langgraph)
  - [FastAPI](https://fastapi.tiangolo.com/)
  - [Pydantic](https://docs.pydantic.dev/)
  - [pytest](https://docs.pytest.org/)
- **Frontend**:
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [React Flow](https://reactflow.dev/)
  - [Radix UI](https://www.radix-ui.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/) 3.12+
- [uv](https://github.com/astral-sh/uv)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd gragraf
    ```

2.  **Backend Setup:**
    ```bash
    # Install dependencies
    uv sync
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```

### Running the Application

1.  **Start the backend server:**
    From the root of the project, run:
    ```bash
    uvicorn src.gragraf.server:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

2.  **Start the frontend development server:**
    In a separate terminal, from the `frontend` directory, run:
    ```bash
    npm start
    ```
    The frontend will be running at `http://localhost:3000`.

### Testing

The project includes comprehensive test coverage with unit tests and integration tests.

**Available test commands:**
```bash
# Run all tests
make test

# Run unit tests only  
make test-unit

# Run integration tests only
make test-integration

# Run tests with verbose output
make test-verbose

# Generate test coverage report
make test-coverage

# Quick test (current development focus)
make test-quick

# Or use pytest directly
python -m pytest tests/ -v
```

**Test Structure:**
- `tests/test_end_to_end.py` - End-to-end integration tests
- `tests/test_*_node.py` - Individual node type tests (agent, branch, http_request, knowledge_base)
- `tests/test_graph_compiler.py` - Graph compilation and state management tests
- `tests/test_dsl_parser.py` - DSL parsing and validation tests
- `tests/test_server.py` - API endpoint tests
- `tests/test_enhanced_variable_resolution.py` - Advanced variable templating tests
- `tests/test_multi_start_nodes.py` - Multi-node workflow tests

### `OPENAI_API_KEY`

To use the Agent node, you will need to have an `OPENAI_API_KEY` environment variable set. You can get a key from [OpenAI](https://platform.openai.com/account/api-keys).

```bash
export OPENAI_API_KEY="your_key_here"
```

## How it Works

The application consists of a React-based frontend and a Python backend.

- **Frontend**: A drag-and-drop canvas built with React Flow allows you to create workflows by connecting different types of nodes. The configuration for each node can be edited in a sidebar. When you run the workflow, the frontend generates a DSL (Domain-Specific Language) representation of the graph and sends it to the backend.

- **Backend**: The FastAPI server receives the DSL, parses it, and uses LangGraph to compile it into an executable graph. The graph is then executed, and the final state is returned to the frontend.

### Features

#### 🔄 Real-time Streaming Execution
- **Server-Sent Events (SSE)**: Real-time progress updates during workflow execution
- **Live Progress Tracking**: See which nodes are running, completed, or failed in real-time
- **Detailed Logging**: Node-level logs and execution statistics
- **Automatic Fallback**: Falls back to regular execution if streaming fails

#### 📊 Advanced Execution Monitoring
- **Execution Timeline**: Track start time, end time, and duration for each node
- **Progress Visualization**: Beautiful UI showing execution progress with status badges
- **Error Handling**: Comprehensive error tracking and retry mechanisms
- **Result Display**: Organized presentation of workflow results and outputs

#### ⚡ Concurrent Execution Support
- **Parallel Node Processing**: Multiple nodes can execute simultaneously without conflicts
- **Custom State Reducer**: Advanced state management system that handles concurrent updates safely
- **Dynamic State Preservation**: Original state data is preserved and merged correctly across parallel branches
- **No Race Conditions**: Eliminates LangGraph's `INVALID_CONCURRENT_GRAPH_UPDATE` errors through proper state handling

### API Endpoints

#### Core Execution
- `POST /run` - Execute workflow (synchronous)
- `POST /run/stream` - Execute workflow with real-time streaming updates
- `GET /debug/template-info` - Get template variable debugging information

#### Workflow Management (RESTful API)
The application provides a comprehensive RESTful API for workflow management:

**CRUD Operations:**
- `POST /workflows/` - Create new workflow
- `GET /workflows/{id}` - Get workflow by ID  
- `GET /workflows/name/{name}` - Get workflow by name
- `GET /workflows/` - List workflows with filtering and pagination
- `PUT /workflows/{id}/definition` - Update workflow definition
- `PUT /workflows/{id}/metadata` - Update workflow metadata
- `DELETE /workflows/{id}` - Delete workflow

**Status Management:**
- `POST /workflows/{id}/activate` - Activate workflow
- `POST /workflows/{id}/deactivate` - Deactivate workflow  
- `POST /workflows/{id}/archive` - Archive workflow
- `GET /workflows/active/list` - Get all active workflows

**Execution & Monitoring:**
- `POST /workflows/{id}/executions` - Record execution result
- `GET /workflows/{id}/health` - Get workflow health metrics
- `GET /workflows/{id}/similar` - Find similar workflows

**API Features:**
- Full CRUD operations with validation
- Advanced filtering and pagination
- Execution tracking and health monitoring  
- Workflow similarity analysis
- Complete test coverage (19 integration tests)

### Node Types

- **HTTP Request**: Executes an HTTP request with full configuration options (headers, timeout, retries, etc.)
- **Branch**: A conditional node that directs the workflow based on a Python expression
- **Knowledge Base**: An enhanced RAG node that can retrieve information from URLs or text documents in real-time, with configurable retrieval count and document chunking
- **Agent**: An AI agent powered by LangChain and OpenAI that can respond to prompts

### Current Status (January 2025)

✅ **Complete Features**:
- Visual workflow builder with drag-and-drop interface
- All core node types implemented and tested
- Real-time streaming execution with SSE
- Advanced execution monitoring and progress tracking
- Comprehensive error handling and retry mechanisms
- Modern React UI with Radix UI components
- Full DSL parsing and graph compilation
- Template variable system with debugging support

🎯 **Ready for Production**: 
- Frontend: React + TypeScript + Radix UI running on http://localhost:3000
- Backend: Python + FastAPI + LangGraph running on http://localhost:8000
- Real-time streaming execution with automatic fallback
- Comprehensive test suite with 25/25 tests passing (6 end-to-end + 19 API integration)
- Production-ready testing infrastructure with Makefile automation
