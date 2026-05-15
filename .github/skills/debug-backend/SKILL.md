---
name: debug-backend
description: "Systematic debugging workflow for the Python backend codebase. Use when diagnosing runtime errors, test failures, async issues, Pydantic validation errors, CLI problems, mock server failures, step execution bugs, or SDK integration issues. Provides a structured approach to isolate, reproduce, and fix backend issues. Keywords: debug, backend, Python, async, Pydantic, pytest, error, traceback, runtime, CLI, mock server, SDK, tractusx, fix, diagnose, troubleshoot."
---

# Debug Backend

## What This Skill Produces

A systematic diagnosis and fix for a backend bug, delivered as:
1. **Root cause analysis** — what is broken and why
2. **Reproduction steps** — minimal way to trigger the bug (pytest command or CLI invocation)
3. **Fix** — code changes that resolve the issue
4. **Verification** — proof the fix works (tests pass, no regressions)

## When to Use

- Python runtime errors (tracebacks, `TypeError`, `AttributeError`, etc.)
- Test failures (`pytest` red)
- Pydantic validation errors (model instantiation failures, schema mismatches)
- Async bugs (deadlocks, `RuntimeError: Event loop is closed`, task cancellation)
- CLI command failures (`testlab run`, `testlab compile`, `testlab validate`)
- Mock server not starting or responding incorrectly
- Step execution failures (step raises unexpected exception, wrong output)
- SDK integration issues (wrong API calls, auth failures, version incompatibility)
- Import errors or circular dependencies
- Configuration loading failures

## Workflow

### Phase 1: Reproduce & Isolate

1. **Get the error** — exact traceback, error message, or unexpected behavior description
2. **Identify the module** — which package/module raised the error?
   - `cli/` — CLI command handling
   - `compiler/` — YAML compilation & validation
   - `models/` — Pydantic model definitions
   - `player/` — Test execution engine
   - `server/` — Mock server (FastAPI)
   - `services/` — Service manager
   - `steps/` — Step executors
3. **Find the minimal reproduction**:
   - For test failures: `python -m pytest tests/path/to/test.py::test_name -x -v`
   - For CLI issues: `testlab <command> --verbose`
   - For runtime: isolate the failing function call

### Phase 2: Diagnose

1. **Read the traceback bottom-up** — the last frame is where it failed, trace upward for context
2. **Read the relevant source** — start from the failing function, trace dependencies
3. **Check the type chain**:
   - Input types → function signature → return type → consumer expectations
   - Pydantic model fields → validators → serialization
4. **Check async flow**:
   - Is the function `async`? Is it being `await`ed correctly?
   - Are context managers (`async with`) being used for resources?
   - Is `asyncio.TaskGroup` used correctly?
5. **Check SDK integration**:
   - Verify the SDK API being called exists in the installed version
   - Check parameter names and types match the SDK's signature
   - Verify auth/connection setup matches SDK expectations
6. **Look for common failure modes**:
   - Missing `await` on async function call
   - Pydantic `model_validate()` vs constructor confusion
   - Mutable default arguments
   - Bare `except Exception:` swallowing the real error
   - Import cycle between modules
   - Wrong Pydantic field alias in serialization
   - SDK version mismatch (jupiter vs saturn dataspace version)

### Phase 3: Fix

1. **Make the minimal change** — fix only what is broken, do not refactor
2. **Preserve existing patterns** — match the style of surrounding code
3. **Add type annotations** if the fix touches a public function missing them
4. **Ensure error context** — if adding error handling, include what failed, expected, received
5. **Check file size** — if the fix pushes a file over 300 lines, split immediately

### Phase 4: Verify

1. **Run affected tests**: `python -m pytest tests/path/to/test.py -x -v` — must pass
2. **Run full suite**: `python -m pytest tests/ -x -q` — must pass
3. **File size**: `find src -name '*.py' | xargs wc -l | awk '$1 > 300 && !/total/'` — must be empty
4. **No bare exceptions**: `grep -rn "except Exception:" src/ --include="*.py"` — must be empty
5. **No print statements**: `grep -rn "print(" src/ --include="*.py" | grep -v "_fingerprint"` — must be empty

## Debugging Cheat Sheet

| Symptom | Start Here |
|---------|-----------|
| `ValidationError` from Pydantic | Check model fields, validators, input data shape |
| `TypeError: ... got unexpected keyword` | SDK API signature changed — check installed version |
| `RuntimeError: Event loop is closed` | Async resource not cleaned up — check context managers |
| Test passes alone, fails in suite | Shared mutable state — check fixtures scope |
| `ImportError` / `ModuleNotFoundError` | Circular import — check `__init__.py` barrel exports |
| CLI exits with no output | Exception swallowed — check error handlers in CLI layer |
| Mock server 404 | Route not registered — check `server/` route definitions |
| Step returns `None` unexpectedly | Missing `return` or wrong branch — trace control flow |
| `AttributeError: 'NoneType'` | Upstream step failed silently — check error propagation |
| Auth/token failures with SDK | Check `OAuth2Manager` setup, token scope, expiry |

## Common Backend Failure Patterns

- **Pydantic v2 migration residue**: Using v1 patterns (`class Config:`) instead of `model_config = ConfigDict(...)`
- **Async/sync boundary**: Calling `async` function without `await`, or `await`ing a sync function
- **SDK version drift**: Code written for `tractusx-sdk>=0.7.0` but testing against older version
- **Frozen model mutation**: Trying to set attributes on `frozen=True` Pydantic models
- **Service lifecycle**: Service not started before use (missing `async with` context manager)
- **Test isolation**: Shared fixtures modifying state across tests (use `function` scope)
- **Circular imports**: `__init__.py` re-exporting from modules that import from `__init__.py`

## Completion Criteria

- [ ] Root cause identified and documented in the response
- [ ] Fix implemented with minimal code changes
- [ ] `python -m pytest tests/ -x -q` passes
- [ ] No file exceeds 300 lines
- [ ] No bare `except Exception:` introduced
- [ ] No `print()` statements introduced
- [ ] Type annotations present on any new/modified public functions
- [ ] Existing patterns preserved

<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 Licensed under the Creative Commons Attribution 4.0 International License
 (the "License"); you may not use this file except in compliance with the
 License. You may obtain a copy of the License at

    https://creativecommons.org/licenses/by/4.0/

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: CC-BY-4.0
-->
