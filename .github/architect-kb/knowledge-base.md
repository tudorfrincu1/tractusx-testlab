# Architect Knowledge Base — Tractus-X TestLab

> This file is the living architectural memory of `testlab-architect`.
> It is read at the start of every session and updated whenever new architectural knowledge is gained.
> Organized by category. Append new entries — never delete old ones (use strikethrough if superseded).

---

## Architectural Decisions

<!-- Format: ### AD-{n}: {Title} | Date: YYYY-MM-DD | Status: Active | Superseded | Deprecated -->

### AD-1: Block definitions are JSON, never TypeScript
- **Date**: 2026
- **Status**: Active
- **Decision**: Block definitions live in `ide/public/blocks/{category}/{block}.json`. TypeScript only loads them at runtime via `blockDefinitions.ts`. Never hardcode block structure in `.tsx` or `.ts` files.
- **Rationale**: Separates content from code. Non-developers can add blocks without touching TypeScript.
- **Consequences**: `ide/public/blocks/index.json` is the manifest; all tooling must respect it.

### AD-2: Python testlab is a thin orchestration layer
- **Date**: 2026
- **Status**: Active
- **Decision**: `tractusx_testlab` delegates all protocol logic to `tractusx-sdk>=0.7.0`. Never reimplement EDC connector logic, DSP flows, or AAS operations in the testlab itself.
- **Rationale**: SDK is the canonical implementation of Tractus-X protocols. Duplication creates drift.
- **Consequences**: Any protocol change requires an SDK upgrade, not a testlab change.

### AD-3: Variable syntax is `@variable_name` in YAML
- **Date**: 2026
- **Status**: Active
- **Decision**: All variable references in test YAML use `@variable_name` syntax. Never `${var}`, `{{var}}`, or other templating styles.
- **Rationale**: Unambiguous, simple to parse, consistent across all test cases.

### AD-4: No file exceeds 300 lines
- **Date**: 2026
- **Status**: Active
- **Decision**: Every source file (Python, TypeScript, Markdown docs) must stay under 300 lines. Split into modules when approaching the limit.
- **Rationale**: Keeps files readable, reviewable, and focused on a single responsibility.

### AD-5: query_catalog uses flat filter params, not raw DSP filter objects
- **Date**: 2026-05-11
- **Status**: Active
- **Decision**: Replace the `filter: json` parameter (which exposed `operand_left`, `operator`, `operand_right` DSP semantics) with three flat params: `filter_by` (dropdown: `dct:type` | `asset_id`), `operator` (dropdown: `=` | `like` | `!=`), `filter_value` (string).
- **Rationale**: Raw DSP filter structure violates the "Labels, not code" design principle. Non-technical users should not see protocol internals.
- **Trade-offs accepted**: Compound filters (AND/OR) are not supported. No current CX standard requires them. Future workaround: chain two `query_catalog` steps.
- **Files**: `ide/public/blocks/edc-connector/query_catalog.json`

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

### PAT-7: TestLab-as-provider test direction
- **Date**: 2026-05-11
- TestLab can act as an EDC **provider** to test the SUT in its **consumer** role. This requires:
  1. A dedicated `testlab_edc` service entry in `test_root`.
  2. Four variables: `testlab_management_url`, `testlab_dsp_url`, `testlab_mock_base_url` (optional/auto-injected), `sut_response_timeout` (optional, default 300 s).
  3. A `create_asset` + `create_policy` + `create_contract_def` prologue before the mock endpoint.
- This direction is **independent** of consumer-tests (tests 1–4). Do not declare tests 1–4 as prerequisites for the provider-direction test.
- Reference: `ide/public/examples/certificate-management-v1.0/expose_testlab_asset.yaml`

### PAT-8: Notification send+receive ordering (register mock BEFORE send)
- **Date**: 2026-05-11
- When a test both sends a notification AND awaits an inbound callback/acknowledgement:
  1. Register `mock_endpoint` **first** (so the endpoint is live before the SUT can reply).
  2. Negotiate and initiate the transfer.
  3. Call `send_notification` with `type: SEND`.
  4. Call `wait_for_call` **after** the send.
- Reversing steps 1 and 3 creates a race condition where the SUT reply arrives before the endpoint is registered.
- Reference: `ide/public/examples/certificate-management-v1.0/send_feedback.yaml`

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

### RISK-4: YAML variable reference errors
- Using `${var}` instead of `@var` in YAML generates no parse error but produces wrong runtime behavior. Always verify variable syntax in acceptance criteria.

### RISK-5: `testlab_mock_base_url` auto-injection gap
- **Date**: 2026-05-11
- **Status**: Unresolved
- When TestLab registers an asset (test 5 / expose_testlab_asset), the asset's `base_url` must be the mock server's publicly reachable address. If the runtime does not auto-inject this from `test_root` config, the SUT's EDC data plane will try to pull from a wrong or unreachable URL. Verify auto-injection support in the player/server before shipping test 5.

### RISK-6: SUT out-of-band trigger gap in expose_testlab_asset
- **Date**: 2026-05-11
- **Status**: Open
- Test 5 waits for the SUT to initiate a catalog query → negotiation → transfer against TestLab. Nothing in the YAML explicitly signals the SUT operator to start. A `wait_for_call` with a 300 s timeout will fail silently if the operator never triggers their connector. Consider adding a `send_notification` step to the SUT as a trigger signal before `wait_for_call`.

### RISK-7: BPN policy identity ambiguity (SUT consumer BPN)
- **Date**: 2026-05-11
- **Status**: Open
- Test 5 creates an access policy using `@provider_bpn`. If the SUT's consumer connector uses a different BPN (separate consumer/provider connectors), negotiation is rejected. Introduce an optional `sut_consumer_bpn` variable (defaulting to `@provider_bpn`) if this case arises.

---

## Lessons Learned

<!-- Specific lessons from past work — what went wrong and what worked -->

### 2026-05-11 — Delegation order: architect before implementation
- Domain specialists (`testlab-ide-master`, `testlab-master`) must provide a **concrete proposal** before a work package is written. The Architect reviews the proposal, identifies risks, and only then creates the implementation WP.
- Skipping this step in past sessions led to ambiguous work packages with unresolved trade-offs discovered mid-implementation.
- Enforcing this order today produced better-scoped, less-ambiguous WPs and fewer revision cycles.

### 2026-05-11 — CX-0135 example structure: 5 tests across two directions
- The certificate-management example requires tests in **both** consumer→provider and provider→consumer directions.
- Tests 1–4 cover the consumer direction (TestLab initiates). Test 5 covers the provider direction (SUT initiates, TestLab waits).
- These two directions are **independent axes** — no cross-prerequisites. Coupling them would make test 5 fail whenever tests 1–4 are skipped.

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

### OQ-1: Does the runtime auto-inject `testlab_mock_base_url` into asset registration?
- **Date**: 2026-05-11
- **Context**: Test 5 (`expose_testlab_asset.yaml`) registers an asset with a `base_url` pointing to the TestLab mock server. If the player does not auto-resolve this from `test_root`, the value must be manually provided.
- **Blocked on**: Runtime/player implementation review.

### OQ-2: Should `expose_testlab_asset` include a `send_notification` to trigger the SUT?
- **Date**: 2026-05-11
- **Context**: After registering the asset, test 5 immediately waits (300 s) for the SUT to negotiate. Without an explicit signal, the SUT operator must manually trigger their connector.
- **Options**: (a) Add `send_notification` step to signal SUT, (b) document as manual step, (c) add a human-pause block.

### OQ-3: Should `sut_consumer_bpn` be a separate variable from `provider_bpn`?
- **Date**: 2026-05-11
- **Context**: The access policy in test 5 uses `@provider_bpn`. If the SUT has separate BPNs for its consumer and provider connectors, policy enforcement will reject the negotiation.
- **Options**: (a) Add optional `sut_consumer_bpn` variable defaulting to `@provider_bpn`, (b) require single BPN per SUT.
