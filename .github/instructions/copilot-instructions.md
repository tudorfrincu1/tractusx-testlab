---
applyTo: "**/*"
---

# Tractus-X TestLab — Project Conventions

## Overview
**tractusx-testlab** is a visual test authoring tool for Eclipse Tractus-X dataspaces. It has two codebases:
- `ide/` — Block-based visual editor (TypeScript, React 19, Blockly 12, Vite 6)
- `src/tractusx_testlab/` — Python library (PyPI: `tractusx-testlab`)

## Product Scope Contract
- Canonical scope definition: `docs/developer/product-scope.md`
- Always align feature work to this lifecycle: IDE authoring -> YAML generation -> compile validation -> runtime execution -> user feedback.
- Treat certification testing as the primary use case. TestLab validates SUT behavior in both directions:
  - inbound to TestLab mocks/callbacks
  - outbound from TestLab clients to SUT APIs
- Reuse-first model: capabilities and blocks are shared across TCKs and standard versions, extended additively.
- Execution semantics are prerequisite-aware and order-sensitive. Setup, execution, and teardown are first-class phases.
- Prioritize non-technical usability: domain labels, safe defaults, minimal required inputs, and explicit error context.

## Design Principles
1. **One way to do things.** Never offer two approaches to the same result.
2. **Steps are functions.** Every block has typed inputs and typed outputs. Outputs auto-appear as draggable variables.
3. **Auto-link.** Dropping a block auto-fills inputs from the nearest compatible output above.
4. **Auto-generate IDs.** asset_id, policy_id, contract_id = auto-generated UUIDs. Never ask the user.
5. **Hide plumbing.** Connector addresses come from test_root config, not per-step fields.
6. **Labels, not code.** "Create an Asset" not `create_asset`.
7. **Defaults everywhere.** Blocks work with minimal input. Optional fields behind "▼ More".

## Variable Syntax
- Use `${{ ... }}` for variable references in YAML (e.g. `${{ env.X }}`, `${{ steps.<id>.<out> }}`) per ADR-0010 (never `@variable_name` or `${var}`)

## Source of Truth
- Block catalog: `ide/public/blocks/index.json` — manifest listing all block categories and file paths
- Individual block definitions: `ide/public/blocks/{category}/{block}.json` — one JSON file per block

## File Size & Modularity
- No source-code file (Python, TypeScript) should exceed 300 lines — split into modules
- **Max 5 source files per folder** — a folder (any language: `.py`, `.ts`, `.tsx`, `.scss`) holds at most 5 files, EXCLUDING its barrel (`index.ts` / `__init__.py` / `_index.scss`). When a folder would exceed 5, reorganize the files into responsibility-grouped sub-folders (and sub-sub-folders), each with its own barrel that the parent forwards through. This keeps the public surface stable while the tree stays shallow and navigable.
- Documentation folders (`docs/**`) are EXEMPT from the 5-file rule; documentation files are EXEMPT from the 300-line rule — prefer sub-pages for readability, but a cohesive reference may exceed 300 lines when splitting would harm comprehension
- **Write modular code from the start** — the 300-line and 5-file limits are symptoms, not the goal. Organize code into small, single-responsibility units (functions, hooks, modules) grouped into folders by responsibility, with clear, typed boundaries.
- **When splitting an oversized file, extract reusable units** — pull shared logic into well-named helpers/modules that other code can import. Never split by arbitrarily cutting a file in half; split along responsibility seams (one concern per module).
- **Prefer composition and reuse over duplication** — if the same logic appears twice, extract it. A new module must have a single, nameable purpose and a minimal public surface.

## License
- Apache-2.0 license header on all source files
- AI-generated code subtitle per `.github/instructions/ai_generated_code.instructions.md`

## Languages
- Python ≥ 3.12, Pydantic v2 for models, async runner
- TypeScript strict mode, React 19 functional components only

## Code Quality — Senior Engineering Standards
All code must read as though written by a senior engineering team. Specifically:

### Architecture
- **Single Responsibility**: Every function, class, and module does one thing well
- **Dependency Inversion**: Depend on abstractions (protocols/ABCs), not concretions
- **Explicit over implicit**: No magic strings, no hidden side effects, no mutable globals
- **Fail fast, fail loud**: Validate at boundaries, raise typed exceptions, never swallow errors silently

### TypeScript / React
- Discriminated unions over stringly-typed enums where possible
- Pure functions for data transforms — no side effects in mappers
- Custom hooks extract all non-trivial logic out of components
- Props interfaces co-located with components, exported for testing
- `as const` assertions on literal objects; avoid `any` — use `unknown` + narrowing
- Event handlers named `onXxx` / `handleXxx` consistently

### Python
- Protocols and ABCs for all extension points (runners, templates, steps)
- `@dataclass(frozen=True)` or Pydantic `model_config = ConfigDict(frozen=True)` for value objects
- Context managers for resource lifecycle (mock servers, connections)
- Structured logging via `logging.getLogger(__name__)` — never `print()`
- All public functions have type annotations; private helpers prefixed with `_`
- Async code uses `asyncio.TaskGroup` over bare `create_task` where applicable

### Naming
- Booleans: `is_*`, `has_*`, `should_*`
- Factory functions: `create_*`
- Converters: `to_*`, `from_*`
- Collections: plural nouns (`steps`, `assertions`, not `step_list`)

### Error Handling
- Define domain-specific exception hierarchy (e.g., `TestLabError → CompilationError | ExecutionError | MockServerError`)
- Never catch `Exception` bare — always catch the narrowest type
- Include context in error messages: what failed, what was expected, what was received

### Testing
- Arrange-Act-Assert structure
- One assertion concept per test (multiple related asserts are fine)
- Test names describe the scenario: `test_compiler_rejects_unknown_step_type`
- Use fixtures and factories, not copy-pasted setup
