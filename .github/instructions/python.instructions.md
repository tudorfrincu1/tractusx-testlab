---
applyTo: "src/**/*.py"
---

# TestLab Python Package Conventions

## Package Structure
- Package: `tractusx_testlab` (src-layout in `src/tractusx_testlab/`)
- Depends on `tractusx-sdk>=0.7.0`
- Import services from `tractusx_sdk.dataspace.services` and `tractusx_sdk.industry.services`

## Models
- Pydantic v2 BaseModel for all data models (`models/test_models.py`)
- Type hints required on all function signatures

## Runner
- Async runner: all step execution is async (`async def execute()`)
- Mock server: FastAPI + uvicorn in background thread, one per mock config

## CLI
- Typer CLI — commands: `testlab run`, `testlab compile`, `testlab validate`

## Imports
- No wildcard imports — explicit imports only

## Tests
- Tests in `tests/` at repo root
- pytest + pytest-asyncio

## Hard Rules
- **No file may exceed 300 lines** — split into focused modules
- **Write modular code from the start** — organize into small, single-responsibility functions and modules with typed boundaries. Prefer pure functions and protocols/ABCs for extension points.
- **When splitting, extract reusable units along responsibility seams** — one concern per module (e.g. one step class per file, `_helpers.py` for shared logic, `_constants.py` for literals). Shared logic becomes an importable helper; never copy-paste it.
- **No bare `except Exception:` or `except:`** — catch the narrowest exception type
- **No `print()` for output** — use `logging.getLogger(__name__)`
- **No `: Any` unless unavoidable** — use specific types or generics
- **All public functions must have type annotations**
