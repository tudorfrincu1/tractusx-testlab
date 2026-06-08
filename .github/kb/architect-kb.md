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

### AD-7: ~~Environment and services managed at TCK level (ADR-0011)~~
- **Date**: 2026-05-20
- **Status**: Partially superseded by AD-9 (§ service config moved to engine bindings)
- **Decision**: ~~All services and env variables are declared in the TCK manifest `env:` block with full config (URL, auth).~~ Service *configuration* now lives at engine level (AD-9); the TCK declares abstract *requirements*. Env-variable management at TCK level still stands.
- **Rationale**: One configuration point per TCK avoids duplication, enables compile-time validation of all references, and maps 1:1 to the IDE Environment Editor.
- **Consequences**: Tests are never self-contained — they always need a parent TCK manifest. Manual variables introduce async complexity (runtime pauses). Service type registry must be maintained.

### AD-9: Service Requirements (TCK) vs Engine Bindings (operator) — ADR-0019
- **Date**: 2026-06-04
- **Status**: Proposed (ADR-0019, amends ADR-0011 §1–§4)
- **Decision**: Two top-level blocks replace `env.services`. (1) `dataspace:` = ecosystem **context** (`ecosystem` e.g. Catena-X, `version` e.g. saturn) — NOT a bindable service; it supplies the default `version` constraints inherit. (2) `infrastructure:` names two bindable **sides**: `engine` (embedding host operates — TestLab as a library, named generically for host-agnosticism) and `sut` (System Under Test must provide). Side keys are plain identifiers (no hyphens) so they stay valid in `${{ }}` dot-paths. Under each side, capabilities are keyed (`connector`, `dtr`); value = object with explicit `required: true|false` (the required/optional marker) plus an optional `standard` constraint — an object with `id` (e.g. CX-0018) and `version` (e.g. 2.1.3), where `standard.version` inherits from `dataspace.version`. The old `metadata.dataspace_version` is REMOVED — `dataspace.version` is the single source, nothing duplicates it. Constraints are the EXCEPTION not the rule — only write them where the TCK genuinely certifies a specific version (usually the SUT under test); common case is bare `required: true`. No `name`/`role` fields, no list. Operator supplies `bindings` mirroring the `infrastructure` shape; secrets live only there. Engine matches keys, validates constraints, fails fast; unbound `sut` capability = unmet precondition (unifies with ADR-0018). Steps reference `${{ infrastructure.<side>.<capability> }}`; IDE class filtering keys off capability. A capability GATES its blocks — a block whose capability is not `required: true` cannot be used; using it fails fast in the IDE and at compile time with a typed error (no silent runtime no-op). Rationale for `required: true|false`: not every certification needs every capability — e.g. Discovery Finder, BPN/EDC discovery, shared services (BPDM) authorize via IAM (OAuth2/OIDC), NOT connector contract authorization, so those TCKs mark `connector: { required: false }` and the engine neither demands a connector binding nor offers connector blocks. Direction (provider/consumer, "inbound/outbound") is NOT modelled — it is per-step; one capability = one instance per side. Two distinct connectors on one side deliberately deferred. Mock server is NOT a bindable capability — it is the engine's own built-in component (never declared/bound). Shared dataspace operator services (discovery finder, identity, BPN/EDC discovery) deliberately NOT modelled as bindable capabilities — over-engineering rejected (human, 2026-06-04): pinning versions on services the operator can't upgrade is a brittle gate.
- **Rationale**: Separates portable "what a TCK needs" from volatile "how it is deployed" — the Helm/npm peerDependencies & ports-and-adapters pattern. Removes per-TCK config duplication, keeps secrets out of portable test content, and turns the near-universal "SUT must expose a connector" need into a first-class declared requirement instead of repeated config.
- **Consequences**: TCKs become deployment-portable (swap binding profile). New maintained surfaces: capability registry + binding-profile schema/loader. Migration converts existing `env.services` → `requires`/`sut` keys + default binding profile. Open: binding-profile location (CLI flag / engine config / env injection).

### AD-10: Frontend vendors its own copy of the policy JSON Schemas (Option A)
- **Date**: 2026-06-08
- **Status**: Active (ADR-0020)
- **Decision**: The policy JSON Schemas are duplicated into the frontend at `ide/schemas/policies/{saturn,jupiter}/` (build-time data dir — NOT `public/`, NOT `src/`). The codegen `ide/scripts/generate-constraint-registry/index.ts` reads only from inside `ide/` (`resolve(scriptDir, "../../schemas/policies")`); no path climbs to `../../src`. The backend keeps its own copy at `src/tractusx_testlab/schemas/policies/` as the Python-player runtime contract. The two independent copies are kept byte-identical by a blocking CI diff guard (`diff -r`), with NO shared package.
- **Rationale**: Frontend and backend must be independent — neither codebase may reach across the boundary. The codegen is build-only (the browser never fetches the schemas), so the schemas belong in a non-served, non-bundled data dir.
- **Consequences**: Drift risk accepted, mitigated by CI diff. 30 saturn JSONs stay flat (5-file rule is source-code-only). Only the emitted `saturnSource`/`jupiterSource` provenance strings change in the generated registry; constraint data is byte-identical. The un-vendored dspace `contract-schema.json` refs are unaffected (codegen never resolves them).
- **Refinement (2026-06-08, see AD-11)**: AD-10 established the independent-copies boundary; AD-11 refines *how versions are declared* on top of it (config-driven manifest). AD-10 is NOT superseded — the vendoring + independence decision stands; AD-11 builds on it.

### AD-11: Config-driven manifest model for policy versions (refines AD-10/ADR-0020)
- **Date**: 2026-06-08
- **Status**: Active (ADR-0020, refinement of AD-10)
- **Decision**: Dataspace versions are declared as DATA in `ide/schemas/policies/manifest.json` (per-version `id`, schema folder, ref-resolution `strategy`, optional editorial overlay). The codegen `ide/scripts/generate-constraint-registry/` ITERATES the manifest and never names a version literally. Ref resolution is pluggable via two registered STRATEGIES: `catenax-atomic-buckets` (saturn-style external + per-constraint `$ref`s) and `selfcontained-defs` (jupiter-style internal `$defs`). Generated output is keyed by version: `PolicyVersion` union from manifest ids, `POLICY_VERSIONS`, `VERSION_SCHEMAS`, `VERSION_BUCKETING`, `CONSTRAINTS_BY_VERSION`; `preconditionTypes.ts` re-exports the generated union. Consumers read keyed/manifest-derived data, never hardcoded version lists. Per-version overlay is OPTIONAL with sane defaults. **Zero-code new-version contract**: a version fitting an existing strategy = drop schema folder (both vendored copies) + one manifest entry + `npm run generate:registry` → ZERO code. The single documented exception: a genuinely new ref-resolution shape needs one new strategy function.
- **Rationale**: Imperatively naming versions in the codegen and hardcoding version lists in consumers made every new version a code change. Making the version set data-driven turns the common case into pure configuration and keeps "one way to do things".
- **Consequences**: Two CI guards in `.github/workflows/test.yml` job `frontend-checks`: `verify:registry` (regen-clean) and `verify:schemas` (per-version frontend↔backend `diff -r` + manifest↔backend parity). The schema guard iterates the manifest, so it scales to N versions with no workflow edit. Independence/no-cross-boundary is now a guarded invariant. Verified green on landing: tsc 0, build, 27 goldens, regen-clean.
- **Refinement (2026-06-08) — 1:1 upstream mirror**: Where an upstream folder exists, the vendored copy is a VERBATIM byte-for-byte, folder-for-folder mirror — not just the files codegen reads. SATURN now mirrors upstream CX-0152 `assets/` (catenax-eV/catenax-ev.github.io, pinned SHA `85f1ad8acdb6a835a40a3422119c3ecd2a1ec055`): root atomic/context/policy schemas + `PROVENANCE.txt`; `constraint/` (27); `context/` (`context.jsonld`, `odrl.jsonld`); `samples/` (31). `context/` + `samples/` are carried even though codegen ignores them, so a spec bump is a RE-DOWNLOAD not a reshuffle. Frontend + backend saturn copies are byte-identical (recursive `verify:schemas`, now covering nested dirs). **constraintDir mechanism**: codegen tolerates upstream nesting via a new OPTIONAL manifest field `constraintDir` (`"constraint"` for saturn, ABSENT for jupiter) — nesting versions set it, flat ones omit it; "new version = data only" contract preserved. jupiter (our own schema, no upstream) stays FLAT/self-contained. **sync:schemas**: opt-in script (`ide/scripts/sync-schemas/`) re-downloads the upstream tree at the pinned SHA, prunes files no longer upstream, rewrites `PROVENANCE.txt`; NOT in CI (codegen never needs network) → future bump is one command. **Deliberate divergence-drop**: vendored copy carries NOTHING beyond upstream — local-only constraints `managed-legal-entity-bpnl` + `managed-legal-entity-region` were DROPPED (27 upstream vs our prior 29); saturn `usage_permission` 24→22. Human rationale: "official schema = source of truth, clean, no backward compat." (`cx.sharing.managedLegalEntity:1` survives as an enum VALUE of `confidential-information-sharing` — upstream, unrelated to the dropped left-operands.) **Headers**: vendored upstream JSON carry NO Apache/AI headers (third-party data, even though same-org hosted); provenance lives in `PROVENANCE.txt`. Verified green: tsc 0, vite build, 27 goldens, `verify:schemas` PASS, python 320 passed.

### AD-4: No source-code file exceeds 300 lines
- **Date**: 2025 (revised 2026-05-29)
- **Status**: Active
- **Decision**: Every source-code file (Python, TypeScript) must stay under 300 lines. Split into modules when approaching the limit. **Documentation files (Markdown — ADRs, specifications, guides) are EXEMPT**: prefer splitting long pages into sub-pages for readability, but a self-contained reference may exceed 300 lines when splitting would harm comprehension.
- **Modularity directive**: The 300-line limit is a symptom check, not the goal. Code must be written modular from the start — small single-responsibility units with typed boundaries. When a file is split, extract **reusable** units along responsibility seams (hooks, pure functions, helper modules, one step/class per file), not arbitrary fragments. Shared logic is extracted into importable helpers; never duplicated.
- **Rationale**: The limit keeps code readable, reviewable, and single-responsibility. Documentation has different constraints — a cohesive reference (e.g. an ADR or spec) is often more useful kept whole than fragmented across pages.

### AD-5: Typed variable class system for block I/O
- **Date**: 2026-05-19
- **Status**: Proposed (ADR-0009)
- **Decision**: Block outputs declare a `class` (semantic type). Block inputs declare `accepts` (list of compatible classes). The IDE filters dropdowns by class compatibility. A class registry at `ide/public/blocks/classes.json` is the canonical taxonomy. Both fields are optional for backward compatibility.
- **Rationale**: Unfiltered variable dropdowns cause user errors. Typing makes block contracts explicit and enables auto-link improvements.
- **Consequences**: One-time migration of all block JSONs. Taxonomy must be maintained. "Show all" override prevents over-constraining.

### AD-8: Unified Variables model — preconditions become complex variables
- **Date**: 2026-06-04
- **Status**: Proposed (ADR-0018, PR #16, branch feat/refactor/ide_backend)
- **Decision**: Unify preconditions and variables into one `Variable` discriminated union (`kind: simple | complex`). Simple is discriminated again on `source: value | input | generated`; complex (= today's preconditions) carries `builder`, canonical `payload` JSON and an optional `formula` authoring lens. Runtime classification rule: `input`→REQUEST, `value`→KNOWN, `generated`→GENERATE. A new resolution phase seeds `StepContext` before steps; the existing `@name` resolver is reused unchanged. Generators live in a backend registry exposed via `GET /generators` (catalog like blocks/index.json); IDE consumes via `useGeneratorCatalog()`. Legacy `preconditions` field + `PreconditionLog` kept; `to_variable()` converter + parser synthesis preserve back-compat.
- **Rationale**: Two authoring models + two runtime code paths for one user intent ("prepare the run") violate "one way to do things". Reuse-first: precondition editor becomes the complex-variable editor.
- **Consequences**: Converter/parser-synthesis layer maintained until legacy field deprecated. Two persisted reps (payload canonical + formula lens) need sync rules. New maintained surfaces: generator registry + format catalog.

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

### PAT-7: Vendor shared external data per-codebase + CI diff guard
- **Date**: 2026-06-08
- When two independent codebases both need the same external contract data (e.g. official JSON Schemas), give each its own checked-in copy and keep them honest with a blocking CI `diff -r` guard — never a shared package or a cross-boundary path read. Independence at the code level, drift protection at the CI level. Vendored data is build/runtime input, not source code: keep it flat, out of `public/` if build-only, out of `src/`.
- **Refinement (2026-06-08) — mirror upstream verbatim when it exists**: when the external data has an upstream folder, vendor a 1:1 byte-for-byte / folder-for-folder mirror (incl. files codegen never reads, e.g. `context/`, `samples/`) so a version bump is a re-download not a reshuffle; pin provenance to an upstream commit SHA in `PROVENANCE.txt` + an opt-in `sync:schemas` refresh script (NOT in CI); tolerate upstream nesting in tooling via an OPTIONAL config field (e.g. manifest `constraintDir`) so flat versions stay flat; carry NOTHING beyond upstream (drop local supersets — official schema is the source of truth); vendored upstream JSON carry no Apache/AI headers (third-party data).

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

### ANTI-5: Parallel abandoned UI implementations
- **Date**: 2026-06-01
- The precondition configurator has THREE overlapping trees: the active `features/preconditions/` panel (renders `with` as raw `JSON.stringify` in plain inputs), a dead schema-aware editor `shared/ui/PreconditionsDialog/` (pill toggles, version schemas, constraint registry — never rendered), and a half-ported `features/preconditions/rules/` (`RuleSection` only exported, never consumed). Rebuilding a feature from scratch instead of moving the existing structured editor left two dead trees and shipped the worst UX. Before building a "new" view, search for an existing implementation of the same concept and relocate it.

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

### RISK-7: Vendored schema-copy drift (frontend vs backend)
- **Date**: 2026-06-08
- The policy schemas now exist twice (`ide/schemas/policies/` + `src/tractusx_testlab/schemas/policies/`). Silent divergence between the IDE's enumerated constraints and the player's validation is a nasty bug class. Mitigation: blocking CI `diff -r` guard. Also watch the generated registry's `saturnSource`/`jupiterSource` provenance strings — they are emitted into the file, so a source-path change produces a (small, expected) diff that must be committed.

---

## Lessons Learned

<!-- Specific lessons from past work — what went wrong and what worked -->

_No entries yet. Append lessons here as they are discovered._

### LESSON-1: Check for an existing implementation before building a "new" view
- **Date**: 2026-06-01
- The precondition gap analysis revealed a fully schema-aware editor already existed (`shared/ui/PreconditionsDialog/`, matching the mockup) but was abandoned when the `features/preconditions/` panel was rebuilt with raw-JSON inputs. The fix is mostly *relocation + wiring*, not new construction. Always grep for the concept (`Precondition`, `Policy`, `Constraint`) across `features/` AND `shared/` before scoping a rebuild.

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
