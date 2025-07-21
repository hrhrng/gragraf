# Gragraf Agent Configuration

## Commands
- **Test**: `make test` (all), `make test-unit` (unit only), `make test-integration` (integration only)
- **Single Test**: `python -m pytest tests/test_specific_file.py::test_function_name -v`
- **Lint**: `make lint` (ruff + mypy), `make format` (auto-format)
- **Server**: `make server` (starts FastAPI server from src/)
- **Build**: `uv sync` (install deps), `cd frontend && npm install` (frontend deps)

## Architecture
- **Backend**: FastAPI + LangGraph + SQLAlchemy, follows DDD (domain/, infrastructure/, application/)
- **Frontend**: React + TypeScript + React Flow (visual workflow canvas)
- **Database**: SQLite with async support, models in `infrastructure/models.py`
- **Core**: DSL parser (`parser.py`) → Graph compiler (`compiler.py`) → LangGraph execution
- **Nodes**: Agent (LLM), HTTP request, Branch (conditional), Knowledge base (RAG)
- **API**: RESTful workflow CRUD + streaming execution (`/run/stream`)

## Code Style
- **Imports**: stdlib → third-party → local (with dots)
- **Naming**: PascalCase (classes), snake_case (functions/vars), ALL_CAPS (constants)
- **Types**: Comprehensive type annotations, Pydantic models for validation
- **Errors**: Validation-first, custom exceptions, graceful degradation patterns  
- **Format**: f-strings, trailing commas, ~100 char lines, async/await consistently
