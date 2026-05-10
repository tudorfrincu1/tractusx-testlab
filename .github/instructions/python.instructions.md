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
