# Architect Knowledge Base — Tractus-X TestLab

> This file is the living architectural memory of `testlab-architect`.
> It is read at the start of every session and updated whenever new architectural knowledge is gained.
> Organized by category. Append new entries — never delete old ones (use strikethrough if superseded).

---

## Architectural Decisions

<!-- Format: ### AD-{n}: {Title} | Date: YYYY-MM-DD | Status: Active | Superseded | Deprecated -->

### AD-1: Block definitions are JSON, never TypeScript
- **Date**: 2025
- **Status**: Active
- **Decision**: Block definitions live in `ide/public/blocks/{category}/{block}.json`. TypeScript only loads them at runtime via `blockDefinitions.ts`. Never hardcode block structure in `.tsx` or `.ts` files.
- **Rationale**: Separates content from code. Non-developers can add blocks without touching TypeScript.
- **Consequences**: `ide/public/blocks/index.json` is the manifest; all tooling must respect it.

### AD-2: Python testlab is a thin orchestration layer
- **Date**: 2025
- **Status**: Active
- **Decision**: `tractusx_testlab` delegates all protocol logic to `tractusx-sdk>=0.7.0`. Never reimplement EDC connector logic, DSP flows, or AAS operations in the testlab itself.
- **Rationale**: SDK is the canonical implementation of Tractus-X protocols. Duplication creates drift.
- **Consequences**: Any protocol change requires an SDK upgrade, not a testlab change.

### AD-3: ~~Variable syntax is `@variable_name` in YAML~~
- **Date**: 2025
- **Status**: Superseded by AD-6
- **Decision**: ~~All variable references in test YAML use `@variable_name` syntax.~~
- **Rationale**: ~~Unambiguous, simple to parse, consistent across all test cases.~~

### AD-6: YAML Syntax v2 — Scoped variable system (GHA-inspired)
- **Date**: 2026-05-20
- **Status**: Active (ADR-0010)
- **Decision**: Variable references use `${{ vars.x }}` for step-output variables and `${{ env.x }}` for environment/TCK-global variables. Keywords change: `type`→`uses`, `params`→`with`, `store_in_memory`→`returns`. No backward compatibility with `@` syntax.
- **Rationale**: GHA-style is familiar to developers, scoped references enable compile-time ambiguity detection, typed `returns` integrates with the class system (AD-5).
- **Consequences**: Full migration required across IDE + backend. Migration CLI needed for existing YAML files. See `docs/developer/yaml-v2-variable-migration-plan.md`.

### AD-7: Environment and services managed at TCK level (ADR-0011)
- **Date**: 2026-05-20
- **Status**: Active (ADR-0011)
- **Decision**: All services and env variables are declared in the TCK manifest `env:` block. Tests cannot declare their own. Services have a `role` (internal/external/additional), a type from a registry (edc_connector, mock_server, dtr, discovery_finder), and optional `auth`. Variables have an acquisition `type` (input/manual/function) and optional `secret` flag.
- **Rationale**: One configuration point per TCK avoids duplication, enables compile-time validation of all references, and maps 1:1 to the IDE Environment Editor.
- **Consequences**: Tests are never self-contained — they always need a parent TCK manifest. Manual variables introduce async complexity (runtime pauses). Service type registry must be maintained.

### AD-4: No file exceeds 300 lines
- **Date**: 2025
- **Status**: Active
- **Decision**: Every source file (Python, TypeScript, Markdown docs) must stay under 300 lines. Split into modules when approaching the limit.
- **Rationale**: Keeps files readable, reviewable, and focused on a single responsibility.

### AD-5: Typed variable class system for block I/O
- **Date**: 2026-05-19
- **Status**: Proposed (ADR-0009)
- **Decision**: Block outputs declare a `class` (semantic type). Block inputs declare `accepts` (list of compatible classes). The IDE filters dropdowns by class compatibility. A class registry at `ide/public/blocks/classes.json` is the canonical taxonomy. Both fields are optional for backward compatibility.
- **Rationale**: Unfiltered variable dropdowns cause user errors. Typing makes block contracts explicit and enables auto-link improvements.
- **Consequences**: One-time migration of all block JSONs. Taxonomy must be maintained. "Show all" override prevents over-constraining.

---

## Established Patterns

<!-- Patterns that have proven effective and should be reused -->

### PAT-1: Step outputs become draggable variables
- Blockly blocks expose typed outputs. After a step runs, its output auto-appears as a variable block that can be dropped into subsequent steps. Never require manual variable declaration.

### PAT-2: Auto-link on drop
- When a block is dragged into the workspace, inputs are auto-filled from the nearest compatible output above. This reduces friction for non-technical users.

### PAT-3: Hide plumbing in test_root
- Connector URLs, API base addresses, and infrastructure config come from `test_root` configuration, never from individual block fields. Blocks only contain business-level parameters.

### PAT-4: Setup → Execution → Teardown phases
- Every test case has three first-class phases. Prerequisites are explicit and ordered. Teardown runs even on failure to avoid resource leaks.

### PAT-5: Reuse-first for blocks and capabilities
- Before creating a new block, check if an existing block can be parameterized. Shared blocks across test cases reduce maintenance burden.

### PAT-6: Agent team split by codebase boundary
- Frontend work (`ide/`) → `testlab-ide-master`. Backend work (`src/`) → `testlab-master`. Tests (`tests/`) → `testlab-test-master`. Docs (`docs/`) → `testlab-docs-master`. Never mix agents across boundaries in the same work package.

---

## Anti-Patterns

<!-- Things that have been tried and should NOT be done -->

### ANTI-1: Hardcoding block structure in TypeScript
- Blocks defined inline in `.tsx` files break the JSON-driven block catalog and make tooling discovery impossible.

### ANTI-2: Using `print()` in Python source
- All logging must go through `logging.getLogger(__name__)`. `print()` bypasses structured logging and disappears in production.

### ANTI-3: Catching bare `Exception`
- Always catch the narrowest exception type. Bare `except Exception:` swallows unexpected errors and makes debugging impossible.

### ANTI-4: Reimplementing SDK protocols
- Any attempt to reimplement EDC catalog negotiation, DSP flows, or DTR operations directly in testlab code creates an unmaintainable fork.

---

## Known Risks

<!-- Recurring risks to flag in every plan -->

### RISK-1: 300-line limit violations during feature expansion
- Large features frequently push files over the limit. Always check line counts in acceptance criteria.

### RISK-2: SDK version drift
- `tractusx-sdk` is a moving dependency. New testlab features may assume SDK APIs that don't exist yet in the pinned version. Always verify against the installed SDK version.

### RISK-3: Block catalog desync
- `ide/public/blocks/index.json` must stay in sync with the actual block files. A missing or wrong path in the manifest silently breaks block loading.

### RISK-4: ~~YAML variable reference errors~~
- ~~Using `${var}` instead of `@var` in YAML generates no parse error but produces wrong runtime behavior.~~ Superseded by AD-6 — only `${{ }}` syntax is valid now.

### RISK-6: YAML v2 migration breakage
- **Date**: 2026-05-20
- The v2 migration touches every layer (models, parser, resolver, compiler, IDE serialization). Shipping frontend before backend (or vice versa) creates a window where generated YAML is rejected. Must ship atomically or behind feature flag.

### RISK-5: Block catalog class taxonomy drift
- **Date**: 2026-05-19
- As new blocks are added, contributors may forget to assign `class`/`accepts` fields or use non-registry classes. CI validation should check all outputs reference valid classes from `ide/public/blocks/classes.json`.

---

## Lessons Learned

<!-- Specific lessons from past work — what went wrong and what worked -->

_No entries yet. Append lessons here as they are discovered._

---

## Module Map

<!-- High-level map of which modules own which concerns -->

### Python (`src/tractusx_testlab/`)

| Module | Owns |
|--------|------|
| `compiler/` | YAML → internal model compilation, validation |
| `player/` | Test execution engine, phase runner |
| `steps/` | Individual step executors (one class per step type) |
| `server/` | Mock server (FastAPI) for inbound callbacks |
| `models/` | Pydantic value objects, test case schema |
| `scripting/` | YAML parser, builder utilities |
| `cli/` | Typer CLI commands (`testlab run`, `compile`, `validate`) |
| `services/` | Service manager, lifecycle |
| `config/` | Environment and configuration loading |
| `security/` | Crypto key generation |

### Frontend (`ide/src/`)

| Module | Owns |
|--------|------|
| `components/` | React UI components |
| `hooks/` | Custom hooks (logic extracted from components) |
| `stores/` | Zustand state slices |
| `blockDefinitions.ts` | Runtime block catalog loading |
| `sync/` | workspace → model → YAML sync pipeline |

### Block Catalog (`ide/public/blocks/`)

Category order: Mock → Wait → Function → Flow → EDC Connector → Digital Twin Registry → Discovery Finder → HTTP → Notification → Validation

---

## Open Architectural Questions

<!-- Questions not yet decided — update with decision when resolved -->

_No open questions. Add here when unresolved trade-offs arise._
