<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Catena-X Automotive Network e.V.
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

# Backend Refactor Plan — `src/tractusx_testlab/`

> **Scope:** structural-only (no behavior or contract change). **Tone:** preventive
> hygiene & hardening, **not** an architectural rescue. The backend is already
> senior-grade and modular.

---

## 1. Current-State Assessment

The backend is **already modular and healthy**. Baseline metrics (verified
2026-05-29):

| Metric | Result |
|--------|--------|
| Files exceeding 300 lines | **0** |
| `except Exception` / bare `except:` | **0** |
| `print(` (excluding `_fingerprint`) | **0** |
| Layered package layout | Intact (12 top-level layers) |

This is **not** a rescue refactor. Every change below is **preventive**: keeping
near-limit files from crossing 300, and tightening a few multi-responsibility
modules so future additions stay clean.

### 1a. Near-limit watch list (actual line counts)

These files are within ~40 lines of the 300 limit. They are **fine today** but
will overflow on the next feature touch — they are the early-warning set.

| File | Lines | Status |
|------|------:|--------|
| [steps/connector/consume.py](../../../src/tractusx_testlab/steps/connector/consume.py) | 300 | **At limit** — split next |
| [compiler/_ir_helpers.py](../../../src/tractusx_testlab/compiler/_ir_helpers.py) | 299 | Watch |
| [server/streaming.py](../../../src/tractusx_testlab/server/streaming.py) | 298 | Watch |
| [player/execution/player.py](../../../src/tractusx_testlab/player/execution/player.py) | 298 | Watch |
| [compiler/ir_builder.py](../../../src/tractusx_testlab/compiler/ir_builder.py) | 278 | Watch |
| [server/routes.py](../../../src/tractusx_testlab/server/routes.py) | 271 | Watch |
| [steps/conditions.py](../../../src/tractusx_testlab/steps/conditions.py) | 267 | Watch |
| [player/loading/_parser.py](../../../src/tractusx_testlab/player/loading/_parser.py) | 267 | Watch |
| [services/manager.py](../../../src/tractusx_testlab/services/manager.py) | 262 | Watch |
| [cli/compile.py](../../../src/tractusx_testlab/cli/compile.py) | 260 | Watch |

### 1b. Multi-responsibility files (below the limit, but worth tidying)

These are not near the limit, but mix two concerns under one roof. Extracting the
secondary concern improves reuse and testability without changing behavior.

- **[steps/connector/consume.py](../../../src/tractusx_testlab/steps/connector/consume.py)** — one `_DspConsumer` helper class **plus five** `BaseStep` subclasses (`QueryCatalogStep`, `QueryCatalogByAssetIdStep`, `QueryCatalogByBpnlStep`, `NegotiateContractStep`, `TransferDataStep`) in a single module.
- **[player/execution/_phase_runners.py](../../../src/tractusx_testlab/player/execution/_phase_runners.py)** (180 lines) — `execute_setup_steps`, `execute_main_steps`, `execute_teardown_steps` each re-implement the same per-step loop (monitor → condition gate → resolve step class → run → collect).
- **[steps/conditions.py](../../../src/tractusx_testlab/steps/conditions.py)** — `ConditionEvaluator` plus **eight** module-level compiled regexes and parsing free-functions for the `${{ ... }}` / legacy `${ }` expression grammar.
- **[steps/precondition/policy_config.py](../../../src/tractusx_testlab/steps/precondition/policy_config.py)** — `_build_jupiter_policy` and `_build_saturn_policy` are two version-specific ODRL body builders embedded next to the step class.

---

## 2. Target Architecture

The layered structure is **confirmed**. This section defines the **complete nested
end-state** the migration phases (§4) converge to — not just the top-level layers,
but every meaningful sub-package down to the responsibility seam. Items marked
**(new)** are introduced by a phase; everything else exists today. Each directory
owns one concern and exposes its public surface via a barrel `__init__.py`.

### 2.1 Layering & import rules (apply at every depth)

The dependency arrows point **one way only** — inner layers never import outer ones:

```
syntax  ──▶  (leaf: pure constants, no testlab imports)
models  ──▶  syntax
config  ──▶  models, syntax
security ─▶  models
services ─▶  models, config, security        (SDK service wiring)
steps   ──▶  models, services, syntax, config (NEVER imports player/server/cli)
compiler ─▶  models, syntax, steps (registry only)
player  ──▶  steps, services, models, config, compiler
server  ──▶  player, compiler, services, models
cli     ──▶  compiler, player, server, config   (thinnest layer, top of stack)
```

Rules enforced by these arrows:

- **`steps/` is the keystone** — it depends *downward* on `models`/`services`/`syntax`
  but is imported *upward* by `compiler` (for `@step` registry validation) and
  `player` (for execution). A step module must **never** import from `player/`,
  `server/`, or `cli/`.
- **`models/` holds no behavior** — only Pydantic data, enums, exceptions. Anything
  with logic belongs in `services`, `steps`, `compiler`, or `player`.
- **`__init__.py` is a barrel only** at every level — it re-exports the package's
  public surface and contains **no logic**. Sub-packages re-export their leaves so
  callers import `from ...steps.connector import QueryCatalogStep`, never the file.
- **Private helpers** (`_*.py`) are package-internal — never re-exported through the
  barrel, never imported across package boundaries.

### 2.2 Complete nested tree

```
tractusx_testlab/
  __init__.py                      # top barrel — public package surface only
  __main__.py                      # `python -m tractusx_testlab` → cli entrypoint

  cli/                             # Typer command groups — thin; delegate, never compute
    __init__.py                    #   barrel: assembles `app` via add_typer(...)
    compile.py                     #   `testlab compile` — calls compiler/, no IR logic here
    run.py                         #   `testlab run` — calls player/, no execution logic here
    validate.py                    #   `testlab validate` — calls compiler validator only
    serve.py                       #   `testlab serve` — boots server/app
    keys.py                        #   `testlab keys` — calls security/crypto

  compiler/                        # COMPILE-TIME: YAML → IR → validation → package
    __init__.py                    #   barrel: Compiler, Validator, Packager
    compiler.py                    #   orchestrator: drives build → validate → package
    ir_builder.py                  #   YAML doc → intermediate representation (IR)
    validator.py                   #   IR → diagnostics (public validation entrypoint)
    packager.py                    #   IR → `.stck` package on disk
    _ir_compilation.py             #   (priv) IR lowering passes
    _ir_helpers.py                 #   (priv) IR node assembly helpers   [watch: 299L]
    _assets.py                     #   (priv) asset-node IR construction
    _expressions.py                #   (priv) compile-time expression checks (see §3 grammar)
    _validation.py                 #   (priv) individual validation rules
    _fingerprint.py                #   (priv) deterministic package fingerprint

  config/                          # configuration loading & settings (data + I/O only)
    __init__.py                    #   barrel: ConfigLoader, settings types
    loader.py                      #   read/merge config sources → TestlabConfig
    settings.py                    #   Pydantic settings models (no behavior)

  logging/                         # structured logging — cross-cutting, depends on nothing
    __init__.py                    #   barrel: StructuredLogger / get_logger
    structured.py                  #   JSON/structured log formatter + adapter

  models/                          # Pydantic DATA ONLY — no behavior, no I/O
    __init__.py                    #   barrel: all public models/enums/exceptions
    enums.py                       #   ServiceState, ServiceType, phase enums, ...
    exceptions.py                  #   TestLabError hierarchy (Compilation/Execution/...)
    definitions.py                 #   step/TCK definition models
    jobs.py                        #   JobStatus and job lifecycle models
    results.py                     #   step/assertion result + execution-trace models
    preconditions.py               #   precondition declaration models
    security.py                    #   key/identity/trust data models
    server.py                      #   mock-server request/response models

  player/                          # RUN-TIME: load → execute → track jobs
    __init__.py                    #   barrel: TestlabPlayer, job API
    jobs.py                        #   in-flight job registry + status tracking

    loading/                       #   run-time YAML/package → executable script
      __init__.py                  #     barrel: loader public surface
      loader.py                    #     package/YAML → Script object
      _parser.py                   #     (priv) YAML → raw structures   [watch: 267L]
      _constants.py                #     (priv) loader keys/defaults
      ordering.py                  #     phase/step ordering (setup→main→teardown)
      resolver.py                  #     variable/@ref + dependency resolution

    execution/                     #   the step-execution engine
      __init__.py                  #     barrel: player, context, monitor
      player.py                    #     orchestration: runs phases via _phase_runners  [watch: 298L]
      context.py                   #     StepContext — per-run state container (data)
      monitor.py                   #     ExecutionMonitor — progress/event emission
      step_runner.py               #     single-step driver: resolve → run → collect outputs
      preconditions.py             #     precondition evaluation gate before main phase
      mock_server.py               #     run-time mock-server lifecycle hook
      _helpers.py                  #     (priv) shared execution utilities
      _phase_runners.py            #     (priv) phase loops → refactored to one _run_phase
      phases/                      #     (new, Phase 2) one driver, thin phase wrappers
        __init__.py                #       barrel: run_setup/run_main/run_teardown
        _run_phase.py              #       (new) shared async per-step loop (single source)
        setup.py                   #       (new) setup wrapper: stop-on-fail + gate
        main.py                    #       (new) main wrapper: stop-on-fail + gate
        teardown.py                #       (new) teardown wrapper: runs unconditionally

  scripting/                       # script object model + builder DSL (author-facing)
    __init__.py                    #   barrel: Script, registry, builders
    script.py                      #   Script aggregate (phases, steps, metadata)
    parser.py                      #   author YAML → Script
    registry.py                    #   step-type registry lookup
    _builders.py                   #   (priv) fluent builder helpers

  security/                        # crypto + trust (logic over models/security.py)
    __init__.py                    #   barrel: keygen, signing, trust public API
    crypto/                        #   cryptographic primitives
      __init__.py                  #     barrel: keygen/sign/encrypt entrypoints
      keygen.py                    #     key generation + fingerprint
      signing.py                   #     sign/verify operations
      encryption.py                #     encrypt/decrypt operations
    trust/                         #   identity & trust-store management
      __init__.py                  #     barrel: identity, trust store, vault
      identity.py                  #     participant identity handling
      trust_store.py               #     trusted-key/cert store
      vault.py                     #     secret/key vault access

  server/                          # FastAPI mock server + compile/run HTTP surface
    __init__.py                    #   barrel: app factory, CallbackManager, storage
    app.py                         #   FastAPI app factory + wiring
    routes.py                      #   route handlers (→ split by group if grows)  [watch: 271L]
    compile.py                     #   compile endpoint handler
    callbacks.py                   #   inbound callback/input endpoint handling
    streaming.py                   #   SSE streaming (→ split fmt vs lifecycle)  [watch: 298L]
    _event_buffer.py               #   (priv) SSE event ring buffer
    mock_registry.py               #   registered mock-route table
    storage.py                     #   PackageStorage — package persistence

  services/                        # SDK SERVICE WIRING + lifecycle (no protocol reimpl)
    __init__.py                    #   barrel: ServiceManager, participant API
    manager.py                     #   create/own SDK connector/discovery/AAS services  [watch: 262L]
    participants.py                #   participant ↔ service mapping & config

  steps/                           # STEP EXECUTORS — one domain per sub-package
    __init__.py                    #   barrel: BaseStep, @step registry, all step types
    base.py                        #   BaseStep ABC + @step decorator/registry
    assertions.py                  #   assertion evaluation steps
    conditions.py                  #   ConditionEvaluator orchestration only  [Phase 3]
    _condition_parsing.py          #   (new, Phase 3) regex grammar + _evaluate_* helpers
    _checks.py                     #   (priv) shared check primitives
    _json_path_validation.py       #   (priv) JSONPath validation helper
    _path_extraction.py            #   (priv) JSONPath/value extraction helper

    connector/                     #   EDC connector / DSP domain steps
      __init__.py                  #     barrel: all connector step classes
      consume.py                   #     → barrel re-export after split  [Phase 1]
      _dsp_consumer.py             #     (new, Phase 1) _DspConsumer helper
      catalog_query.py             #     (new, Phase 1) the 3 QueryCatalog* steps
      catalog_filter.py            #     catalog filter-expression step
      provision.py                 #     provider-side asset provisioning step
      extract.py                   #     dataplane/EDR extraction step
      dataplane.py                 #     dataplane GET step
      cleanup.py                   #     connector teardown/cleanup step
      utils.py                     #     connector-step shared utilities
      dsp.py                       #     → barrel re-export for dsp/ subpackage
      dsp/                         #     low-level DSP protocol steps (one verb/file)
        __init__.py                #       barrel: dsp step classes
        version.py                 #       DSP version-negotiation step
        catalog.py                 #       DSP catalog request step
        negotiate.py               #       DSP contract-negotiation step
        transfer.py                #       DSP transfer step
        resolve.py                 #       DSP endpoint/EDR resolve step
        generic.py                 #       generic DSP request step
        _constants.py              #       (priv) DSP context/property keys

    industry/                      #   Industry / AAS / DTR domain steps
      __init__.py                  #     barrel: industry step classes
      dtr.py                       #     Digital Twin Registry steps
      submodels.py                 #     submodel CRUD steps
      semantic.py                  #     semantic-model steps
      notification.py              #     notification (EDC/industry) steps

    precondition/                  #   precondition setup steps (idempotent config)
      __init__.py                  #     barrel: precondition step classes
      asset_config.py              #     asset precondition step
      contract_config.py           #     contract precondition step
      policy_config.py             #     policy step class only  [Phase 4]
      _policy_builders.py          #     (new, Phase 4) Jupiter/Saturn ODRL builders

    pull_data/                     #   data-pull domain steps
      __init__.py                  #     barrel: pull-data step(s)
      _executor.py                 #     (priv) pull execution helper
      _constants.py                #     (priv) pull keys/defaults

    server/                        #   mock-server-facing steps
      __init__.py                  #     barrel: mock/wait steps
      mock.py                      #     register-mock step
      wait.py                      #     wait-for-callback step

    utility/                       #   pure helper/value steps (no external I/O)
      __init__.py                  #     barrel: utility step classes
      uuid_gen.py                  #     auto-generate UUID step
      variables.py                 #     set/transform variable step
      json_extract.py              #     extract value from JSON step
      load_schema.py               #     load JSON schema step

  syntax/                          # LEAF: default syntax constants — no testlab imports
    __init__.py                    #   barrel: defaults, keys, patterns, context vars
    defaults.py                    #   default syntax values
    keys.py                        #   canonical key names
    patterns.py                    #   regex/token patterns (grammar tokens)
    context_vars.py                #   built-in context variable names

  schemas/                         # packaged JSON schemas (data assets, no code)
    __init__.py                    #   barrel / package marker
```

> **Note on `schemas/`:** holds shipped JSON-schema assets (resources), not Python
> logic. It stays a flat data package — no nesting needed.

### 2.3 Where mixed-concern files split (seam, not arbitrary cut)

The four splits below are the only files whose nesting changes; each extracts a
**reusable** unit along a responsibility seam (detail in §3/§4):

- `steps/connector/consume.py` (5 steps + helper) → `_dsp_consumer.py` + `catalog_query.py`
  (+ existing `dsp/negotiate.py`, `dsp/transfer.py`); `consume.py` becomes a barrel.
- `player/execution/_phase_runners.py` (3 near-identical loops) → `execution/phases/`
  with one `_run_phase.py` driver and thin `setup/main/teardown` wrappers.
- `steps/conditions.py` (orchestration + grammar) → `_condition_parsing.py` (grammar)
  + `conditions.py` (orchestration only).
- `steps/precondition/policy_config.py` (step + 2 builders) → `_policy_builders.py`.

### Layer-boundary notes (blur to watch, not fix-now)

- **`steps/execution` import direction:** `_phase_runners.py` imports `run_step` /
  `store_step_outputs` from `step_runner` via **function-local imports** to dodge a
  circular import. This is a smell, but resolving it means re-ordering module
  dependencies — out of scope for a structural-only pass. Document it; do not
  rewire it now.
- **`compiler` ↔ `player/loading`:** both parse YAML-ish input (`ir_builder` /
  `_ir_helpers` vs `loading/_parser`). The boundary is correct (compile-time vs
  run-time), but the **expression/condition grammar** is the one rule set that
  must stay single-sourced (see Phase 3) to avoid drift between compile validation
  and runtime evaluation.

No layer needs to be created, merged, or moved.

---

## 3. Module / Responsibility Map

| Module | Current responsibility | Proposed split (preventive) |
|--------|------------------------|-----------------------------|
| `steps/connector/consume.py` | DSP consumer helper + 5 catalog/negotiate/transfer step classes | `_dsp_consumer.py` (move `_DspConsumer`); `catalog_query.py` (3 `QueryCatalog*` steps); keep `negotiate.py` + `transfer.py` as own files; barrel re-export from `consume.py` or `connector/__init__.py` |
| `player/execution/_phase_runners.py` | 3 near-identical phase loops | Extract shared `async _run_phase(...)` driving one step iteration; setup/main/teardown become thin wrappers configuring stop-on-failure & condition policy |
| `steps/conditions.py` | `ConditionEvaluator` + regex grammar + parse helpers | `_condition_parsing.py` (compiled regexes + `_evaluate_*` free-functions); `conditions.py` keeps only `ConditionEvaluator` orchestration |
| `steps/precondition/policy_config.py` | step class + Jupiter/Saturn policy builders | `_policy_builders.py` (`_build_jupiter_policy`, `_build_saturn_policy`, shared ODRL scaffolding); dedupe common permission/constraint assembly |
| `compiler/_ir_helpers.py` (299) | IR assembly helpers | **Watch only** — if it grows, split by IR node category (`_ir_assets.py`, `_ir_policies.py`) |
| `server/streaming.py` (298) | SSE streaming | **Watch only** — split event-formatting from connection lifecycle if it grows |
| `player/execution/player.py` (298) | execution orchestration | **Watch only** — extract result/trace formatting if it grows |
| `server/routes.py` (271) | FastAPI route handlers | **Watch only** — split by route group (compile / run / callback) if it grows |

---

## 4. Migration Phases (leaf-first, preventive)

Ordered so each step is independent and leaf-first (no module is split before its
dependents are stable). Every phase is **pure move + re-export** — public import
paths preserved via barrels, tests unchanged.

### Phase 1 — `steps/connector/consume.py` (P1, at limit)
1. Create `steps/connector/_dsp_consumer.py`; move `_DspConsumer`.
2. Create `steps/connector/catalog_query.py`; move the three `QueryCatalog*` steps.
3. Move `NegotiateContractStep` → `negotiate.py`, `TransferDataStep` → `transfer.py`.
4. Turn `consume.py` (or `connector/__init__.py`) into a barrel re-export so the
   `@step(...)` registry and existing imports resolve unchanged.
5. `pytest -x -q` — connector + integration suites green.

### Phase 2 — `player/execution/_phase_runners.py` (P1, dedup)
1. Add private `async _run_phase(*, script, phase, stop_on_failure, gate_conditions, ...)`.
2. Rewrite `execute_setup_steps` / `execute_main_steps` / `execute_teardown_steps`
   as thin wrappers configuring policy (setup & main stop on failure + gate on
   `if_condition`; teardown runs unconditionally).
3. Keep the existing function-local `step_runner` imports (do not rewire circular
   dependency in this pass).
4. `pytest -x -q` — runner / execution / precondition-execution suites green.

### Phase 3 — `steps/conditions.py` (P2, grammar isolation)
1. Create `steps/_condition_parsing.py`; move the 8 compiled regexes and
   `_evaluate_status_fn` / `_evaluate_step_outcome` / comparison helpers.
2. `conditions.py` imports from it; `ConditionEvaluator` keeps orchestration only.
3. This single-sources the expression grammar referenced by compile-time
   validation and runtime evaluation — guard against drift.
4. `pytest -x -q` — condition / sse / pause-resume suites green.

### Phase 4 — `steps/precondition/policy_config.py` (P2, dedupe)
1. Create `steps/precondition/_policy_builders.py`; move both version builders +
   shared ODRL scaffolding (constraint/permission assembly).
2. `policy_config.py` keeps the `@step` class only.
3. `pytest -x -q` — precondition policy/contract suites green.

### Phase 5 — Watch-list guard (P2, no-op unless touched)
No moves now. Record the watch list (§1a) in repo memory so the **next** feature
touching any near-limit file triggers a split-first rule rather than an overflow.

---

## 5. Risks

**Overall risk: LOW.** Every phase is a mechanical move-and-re-export with no logic
change, validated by the existing suite.

| Risk | Severity | Mitigation |
|------|----------|------------|
| Step `@step(...)` registry breaks if a moved module isn't imported | Medium | Keep barrel re-exports in `consume.py` / `connector/__init__.py`; assert registry membership in tests after each phase |
| Circular-import regression in `player/execution` | Medium | Preserve existing function-local imports in `_phase_runners`; do **not** rewire in this pass |
| Condition-grammar drift between compile & runtime | Medium | Phase 3 single-sources the grammar in one module; both callers import it |
| Hidden behavior change during dedupe (Phase 2/4) | Low | Pure extraction; identical inputs/outputs; suite is the gate |

### Cross-codebase contract touch points (ship in lockstep with frontend)

These serialization ↔ YAML ↔ compiler boundaries are **contracts shared with the
IDE**. This plan does **not** change them — but any future change here must ship
together with the frontend agent's matching change:

- **YAML v2 syntax** (`@variable_name` refs, `${{ }}` expressions) — touched
  indirectly by Phase 3 (grammar isolation). Verify no token/precedence change.
- **Block schema** (`ide/public/blocks/**`) — step `type` strings are the join key;
  renames are forbidden in a structural pass.
- **TCK manifest model** — compiler input contract; untouched.
- **`.stck` package format** — compiler output contract; untouched.

---

## 6. Acceptance Criteria

All must hold after **every** phase (run from repo root):

```bash
# 1. No source file exceeds 300 lines
find src -name '*.py' | xargs wc -l | awk '$1>300 && !/total/'   # → empty

# 2. No broad exception handling
grep -rn "except Exception:\|except:" src/ --include="*.py"      # → empty

# 3. No print statements
grep -rn "print(" src/ --include="*.py" | grep -v "_fingerprint" # → empty

# 4. Test suite green
python -m pytest tests/ -x -q                                    # → pass
```

Plus structural checks:

- [ ] Layered package layout intact (12 top-level layers, barrels expose public surface only).
- [ ] Step `@step(...)` registry resolves all moved step types unchanged.
- [ ] No public import path broken (existing `from tractusx_testlab...` imports still resolve).
- [ ] Condition grammar single-sourced in one module.
- [ ] Each split is a responsibility seam (one concern per new file), not an arbitrary cut.
