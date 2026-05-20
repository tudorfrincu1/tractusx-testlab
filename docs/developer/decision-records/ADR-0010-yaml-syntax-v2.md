<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# ADR-0010: YAML Syntax v2 (GHA-Inspired)

## Status

Draft

## Date

2026-05-20

## Context

TestLab YAML v1 used a custom syntax (`type:`, `params:`, `@variable_name`, `store_in_memory:`) that was unfamiliar to most developers. This created a learning curve and made the format feel proprietary. After evaluating four alternatives — GitHub Actions (GHA), GitLab CI, Azure Pipelines, and keeping v1 — we chose the GHA-inspired syntax for the following reasons:

| Criterion | GHA | GitLab CI | Azure Pipelines | v1 (current) |
|-----------|-----|-----------|-----------------|--------------|
| Developer familiarity | Very high | High | Medium | None |
| Step-as-function model | Native (`uses`/`with`) | Partial | Partial | Custom |
| Variable interpolation | `${{ }}` (expressive) | `$VARIABLE` (flat) | `$(var)` (flat) | `@var` (custom) |
| Typed outputs | `outputs` concept exists | No | No | `store_in_memory` |
| Ecosystem tooling | Broad | Narrow | Narrow | None |
| Inline assertions | No (we extend with `validate:`) | No | No | Custom |

### Forces

- Primary users are certification testers — syntax must be learnable in minutes.
- The IDE auto-generates YAML from blocks — human authoring is secondary but must be pleasant.
- The compiler must validate structural correctness and variable resolution at compile time.
- Steps produce typed outputs (ADR-0009) — the syntax must express return types and classes.
- TCK manifests define shared environment (services, schemas, variables) inherited by all tests.
- Migration from v1 must be automatable with a CLI command.

## Decision

We adopt a GHA-inspired YAML syntax with the following specification.

---

### 1. Keywords

| Keyword | Purpose | Required | Scope |
|---------|---------|----------|-------|
| `id` | Stable step identifier | Yes (IDE auto-generates) | Step |
| `uses` | Step type (replaces v1 `type:`) | Yes | Step |
| `name` | Human-readable label | Yes | Step |
| `with` | Input parameters (replaces v1 `params:`) | No | Step |
| `returns` | Typed output declarations | No | Step |
| `validate` | Inline assertions | No | Step |
| `kind` | Document type (`tck`, `test`, `schema`) | Yes | Document root |
| `env` | Environment block (variables, services, schemas) | No | TCK manifest |
| `setup` | Pre-test steps | No | Test file |
| `steps` | Main test steps | Yes | Test file |
| `teardown` | Post-test cleanup steps | No | Test file |
| `preconditions` | TCK-level precondition steps | No | TCK manifest |
| `tests` | List of test file references | Yes | TCK manifest |

### 2. Step Field Ordering

Fields within a step MUST appear in this canonical order:

```yaml
- id: create_asset_1
  uses: edc/create_asset
  name: Create the test asset
  with:
    asset_id: ${{ vars.generated_id }}
    description: "Test asset for negotiation"
  returns:
    asset_id:
      type: string
      class: asset_id
  validate:
    - status_code == 200
    - response_body.id != null
```

Order: **id → uses → name → with → returns → validate**

The compiler MUST reject steps where `id` does not appear first or `uses` does not appear second. Remaining fields may appear in any order but the canonical order is enforced by IDE serialization.

### 3. Variable Interpolation

#### 3.1 Syntax

All variable references use the `${{ }}` expression syntax:

| Pattern | Scope | Source | Example |
|---------|-------|--------|---------|
| `${{ vars.x }}` | Test-local | Step `returns` values | `${{ vars.asset_id }}` |
| `${{ vars.step_id.returns.x }}` | Test-local (qualified) | Specific step's return | `${{ vars.create_asset_1.returns.asset_id }}` |
| `${{ env.x }}` | TCK-global | TCK manifest `env.variables` | `${{ env.provider_url }}` |
| `${{ env.schemas.name }}` | TCK-global | TCK manifest `env.schemas` | `${{ env.schemas.asset_schema }}` |

#### 3.2 Resolution Rules

1. **Flat `${{ vars.x }}`** resolves by searching all preceding steps' `returns` for key `x`.
2. If exactly one match exists → resolved.
3. If zero matches → **compiler error**: `Unresolved variable: vars.x — no preceding step returns 'x'`.
4. If multiple matches → **compiler error**: `Ambiguous variable: vars.x — returned by steps [step_a, step_b]. Use qualified form: ${{ vars.step_a.returns.x }}`.
5. **Qualified `${{ vars.step_id.returns.x }}`** always resolves to exactly that step's return. If the step or return does not exist → compiler error.
6. **`${{ env.x }}`** resolves from the TCK manifest `env.variables` block. If not defined → compiler error.
7. **`${{ env.schemas.name }}`** resolves to the schema file path declared in `env.schemas`. If not defined → compiler error.
8. Variables are resolved **top-to-bottom** — a step can only reference returns from steps above it (including setup steps when referenced from main steps).

#### 3.3 Variable Lifecycle

| Phase | Visibility |
|-------|-----------|
| `setup` steps | Visible to `steps` and `teardown` |
| `steps` | Visible to subsequent `steps` and `teardown` |
| `teardown` | Can reference all preceding variables |
| `preconditions` (TCK-level) | Visible to all tests in the TCK |
| `env` variables | Visible everywhere (TCK-global) |

### 4. Step IDs

| Rule | Specification |
|------|---------------|
| Pattern | `[a-z][a-z0-9_]{0,49}` |
| Max length | 50 characters |
| Uniqueness | Unique within a test file (across setup + steps + teardown) |
| Stability | IDs do not change when steps are reordered |
| Generation | IDE auto-generates from step type (e.g., `create_asset_1`, `negotiate_2`) |
| User override | Users may set custom IDs via the IDE or YAML |

**Compiler rules:**

- Reject duplicate IDs within a test file.
- Reject IDs that do not match the pattern.
- Reject IDs that collide with reserved words: `env`, `vars`, `returns`, `steps`, `setup`, `teardown`.

### 5. Returns (Step Outputs)

Every step MAY declare `returns:`. Each return is a named output with metadata:

```yaml
returns:
  agreement_id:
    type: string
    class: agreement_id
  negotiation_id:
    type: string
    class: negotiation_id
```

| Field | Required | Description |
|-------|----------|-------------|
| key (name) | Yes | Output variable name — must be unique within the step |
| `type` | Yes | Data type: `string`, `integer`, `boolean`, `object`, `array` |
| `class` | Yes | Semantic class from ADR-0009 class registry |

**Rules:**

- ALL `returns` values are auto-persisted in test memory at runtime. No opt-in flag.
- The runtime populates return values after step execution completes successfully.
- If a step fails, its returns are NOT populated (downstream references will be `null`).
- A step with no `returns:` block produces no variables.
- Return names must match `[a-z][a-z0-9_]{0,49}`.

### 6. Validate (Assertions)

```yaml
validate:
  - status_code == 200
  - response_body.id != null
  - response_body.type == "Asset"
  - ${{ vars.transfer_id }} != null
```

**Why `validate:` not `assert:`:** The keyword is domain-specific to certification testing. "Validate" communicates intent to non-technical users more naturally than "assert" (which implies unit testing). No CI system uses `validate:`, avoiding confusion.

**Assertion expression syntax:**

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equals | `status_code == 200` |
| `!=` | Not equals | `response_body.error != null` |
| `>`, `>=`, `<`, `<=` | Numeric comparison | `response_body.items.length > 0` |
| `contains` | String/array contains | `response_body.type contains "Asset"` |
| `matches` | Regex match | `response_body.id matches "^[0-9a-f-]{36}$"` |
| `schema` | JSON Schema validation | `response_body schema ${{ env.schemas.asset_schema }}` |

**Context variables available in `validate:`:**

- `status_code` — HTTP response status (integer)
- `response_body` — Parsed JSON response (object, supports dot-path access)
- `response_headers` — Response headers (object)
- Any `${{ vars.x }}` or `${{ env.x }}` reference

### 7. Document Kinds

#### 7.1 TCK Manifest (`kind: tck`)

```yaml
kind: tck
metadata:
  name: EDC Connector Certification
  version: "1.0"
  standard: catena-x/edc
  standard_version: jupiter

env:
  variables:
    provider_url: "https://provider.local"
    consumer_url: "https://consumer.local"
    provider_bpn: "BPNL000000000001"
    consumer_bpn: "BPNL000000000002"
  services:
    provider:
      type: edc_connector
      url: ${{ env.provider_url }}
      auth:
        type: oauth2
        token_url: "https://auth.local/token"
    consumer:
      type: edc_connector
      url: ${{ env.consumer_url }}
      auth:
        type: oauth2
        token_url: "https://auth.local/token"
  schemas:
    asset_schema: schemas/asset.yaml
    policy_schema: schemas/policy.yaml

preconditions:
  - id: verify_health
    uses: edc/health_check
    name: Verify provider is healthy
    with:
      service: provider
    validate:
      - status_code == 200

tests:
  - tests/create-asset.yaml
  - tests/negotiate-contract.yaml
  - tests/transfer-data.yaml
```

#### 7.2 Test File (`kind: test`)

```yaml
kind: test
metadata:
  name: Create and verify an asset
  description: Tests asset creation via the management API

setup:
  - id: gen_id
    uses: util/generate_uuid
    name: Generate asset ID
    returns:
      generated_id:
        type: string
        class: uuid

steps:
  - id: create_asset_1
    uses: edc/create_asset
    name: Create the test asset
    with:
      asset_id: ${{ vars.generated_id }}
      description: "Test asset"
      service: provider
    returns:
      asset_id:
        type: string
        class: asset_id
    validate:
      - status_code == 200
      - response_body.id == ${{ vars.generated_id }}

  - id: get_asset_1
    uses: edc/get_asset
    name: Retrieve the created asset
    with:
      asset_id: ${{ vars.create_asset_1.returns.asset_id }}
      service: provider
    validate:
      - status_code == 200
      - response_body.id == ${{ vars.asset_id }}

teardown:
  - id: delete_asset_1
    uses: edc/delete_asset
    name: Clean up test asset
    with:
      asset_id: ${{ vars.asset_id }}
      service: provider
```

#### 7.3 Schema File (`kind: schema`)

```yaml
kind: schema
metadata:
  name: asset_schema
  description: JSON Schema for EDC asset response

schema:
  type: object
  required:
    - "@id"
    - "@type"
  properties:
    "@id":
      type: string
      pattern: "^[0-9a-f-]{36}$"
    "@type":
      type: string
      enum: ["edc:Asset"]
```

### 8. Import Rule

Tests inherit **ALL** environment from the TCK manifest:

- All `env.variables` — available as `${{ env.x }}`
- All `env.services` — referenceable by name in `with:` blocks
- All `env.schemas` — available as `${{ env.schemas.name }}`

There is no cherry-picking or partial import. A test file does not declare its own `env:` — it inherits from the TCK.

**Rationale:** Cherry-picking creates divergence. If a test needs a variable, it belongs in the TCK manifest. This keeps the environment centralized and auditable.

### 9. `uses:` Namespace Convention

Step types follow a namespace/action pattern:

| Namespace | Scope | Examples |
|-----------|-------|----------|
| `edc/` | EDC connector operations | `edc/create_asset`, `edc/negotiate`, `edc/initiate_transfer` |
| `dtr/` | Digital Twin Registry | `dtr/register_shell`, `dtr/lookup_shell` |
| `discovery/` | Discovery services | `discovery/lookup_bpn`, `discovery/register_endpoint` |
| `http/` | Generic HTTP operations | `http/call`, `http/call_dataplane` |
| `mock/` | Mock server operations | `mock/create_endpoint`, `mock/wait_for_call` |
| `util/` | Utility operations | `util/generate_uuid`, `util/wait`, `util/log` |
| `validate/` | Validation operations | `validate/json_schema`, `validate/compare` |
| `notification/` | Notification operations | `notification/send`, `notification/wait` |
| `flow/` | Control flow | `flow/if`, `flow/repeat`, `flow/parallel` |

---

## Compiler Rules

The compiler validates YAML files and rejects invalid documents with actionable error messages.

### Structural Validation

| Rule | Error Message |
|------|---------------|
| Missing `kind:` | `Missing required field 'kind' at document root` |
| Unknown `kind:` value | `Invalid kind: '{value}'. Expected: tck, test, schema` |
| Missing `steps:` in test | `Test file must contain a 'steps' field` |
| Missing `tests:` in TCK | `TCK manifest must contain a 'tests' field` |
| Empty `steps:` array | `'steps' must contain at least one step` |
| Step missing `id:` | `Step at index {n} is missing required field 'id'` |
| Step missing `uses:` | `Step '{id}' is missing required field 'uses'` |
| Step missing `name:` | `Step '{id}' is missing required field 'name'` |

### ID Validation

| Rule | Error Message |
|------|---------------|
| Invalid ID pattern | `Step ID '{id}' does not match pattern [a-z][a-z0-9_]{0,49}` |
| Duplicate ID | `Duplicate step ID '{id}' — first defined at step index {n}` |
| Reserved word | `Step ID '{id}' is a reserved word` |

### Variable Resolution

| Rule | Error Message |
|------|---------------|
| Unresolved `vars.x` | `Unresolved variable 'vars.{x}' in step '{id}' — no preceding step returns '{x}'` |
| Ambiguous `vars.x` | `Ambiguous variable 'vars.{x}' in step '{id}' — returned by [{ids}]. Use: ${{{{ vars.{first_id}.returns.{x} }}}}` |
| Unresolved qualified ref | `Unresolved reference 'vars.{step_id}.returns.{x}' — step '{step_id}' does not return '{x}'` |
| Step ID not found | `Unknown step ID '{step_id}' in variable reference 'vars.{step_id}.returns.{x}'` |
| Forward reference | `Forward reference in step '{id}' — step '{ref_id}' is defined after current step` |
| Unresolved `env.x` | `Unresolved environment variable 'env.{x}' — not defined in TCK manifest env.variables` |
| Unresolved schema | `Unresolved schema 'env.schemas.{name}' — not defined in TCK manifest env.schemas` |

### Returns Validation

| Rule | Error Message |
|------|---------------|
| Missing `type:` in return | `Return '{name}' in step '{id}' is missing required field 'type'` |
| Missing `class:` in return | `Return '{name}' in step '{id}' is missing required field 'class'` |
| Invalid `type:` value | `Invalid type '{value}' for return '{name}' in step '{id}'. Expected: string, integer, boolean, object, array` |
| Unknown `class:` value | `Unknown class '{value}' for return '{name}' in step '{id}'. See classes.json for valid classes` |
| Duplicate return name | `Duplicate return name '{name}' in step '{id}'` |

### Validate Block

| Rule | Error Message |
|------|---------------|
| Invalid expression syntax | `Invalid validate expression at index {n} in step '{id}': {details}` |
| Unknown operator | `Unknown operator '{op}' in validate expression at index {n} in step '{id}'` |

---

## IDE Serialization Rules

The IDE (Blockly workspace → YAML) MUST follow these rules when serializing:

1. **Field order**: Always emit `id → uses → name → with → returns → validate`.
2. **ID generation**: Auto-generate from `uses` value + incrementing suffix (e.g., `create_asset_1`).
3. **Empty blocks omitted**: Do not emit `with:`, `returns:`, or `validate:` if they have no content.
4. **String quoting**: Quote strings containing special characters (`${{ }}`, `:`, `#`, `{`, `}`). Do not quote plain strings.
5. **Indentation**: 2 spaces, no tabs.
6. **Document separator**: Each file starts with `kind:` — no `---` separator needed (single-document files).
7. **Variable serialization**: Always emit the flat form `${{ vars.x }}` unless the compiler has previously flagged ambiguity for that variable name.

---

## Runtime Execution Rules

The runtime (Python player) executes steps with these semantics:

1. **Sequential by default**: Steps execute top-to-bottom within each phase.
2. **Phase order**: `preconditions` → `setup` → `steps` → `teardown`.
3. **Returns auto-persist**: After successful step execution, all declared `returns` are stored in the test memory dict keyed by `{step_id}.returns.{name}` and also by flat `{name}`.
4. **Failure handling**: If a step fails, its `returns` are NOT stored. Subsequent steps referencing those returns receive `null`.
5. **Teardown always runs**: Even if `steps` fail, `teardown` executes (best-effort cleanup).
6. **Validate execution**: Assertions in `validate:` run immediately after the step completes. A failed assertion marks the step as failed but does NOT abort the test — remaining steps still execute (fail-continue mode).
7. **Environment immutable**: `env` variables are read-only at runtime. Steps cannot modify them.

---

## Migration Guide: v1 → v2

### Keyword Mapping

| v1 Syntax | v2 Syntax | Notes |
|-----------|-----------|-------|
| `type: create_asset` | `uses: edc/create_asset` | Namespace prefix added |
| `params:` | `with:` | Direct rename |
| `@variable_name` | `${{ vars.variable_name }}` | Expression syntax |
| `store_in_memory: key` | `returns:` block | Declares type and class |
| (no equivalent) | `id:` | New required field |
| (no equivalent) | `validate:` | Replaces external assertions |

### Automated Migration

The CLI provides a migration command:

```bash
testlab migrate v1-to-v2 --input tests/ --output tests-v2/
```

Migration steps performed automatically:

1. `type: x` → `uses: {namespace}/x` (namespace inferred from step registry)
2. `params:` → `with:`
3. `@var` → `${{ vars.var }}`
4. `store_in_memory: key` → `returns:` with `type: string`, `class: string` (conservative defaults — user should refine)
5. Auto-generate `id:` from step type + index
6. Wrap file in `kind: test` structure
7. Extract environment to TCK manifest `kind: tck`

### Manual Steps Required After Migration

- Review and correct `class:` values on all `returns` (migration uses `string` as default).
- Review and correct `type:` values on all `returns`.
- Verify auto-generated `id:` values are meaningful.
- Add `validate:` blocks where assertions were previously external.
- Create `schemas/` files for any JSON Schema validations.

---

## Full Example: End-to-End TCK

### `tck.yaml`

```yaml
kind: tck
metadata:
  name: EDC Jupiter Connector Certification
  version: "2.0"
  standard: catena-x/edc
  standard_version: jupiter

env:
  variables:
    provider_url: "https://provider.local/management"
    consumer_url: "https://consumer.local/management"
    provider_bpn: "BPNL000000000001"
    consumer_bpn: "BPNL000000000002"
    callback_url: "https://testlab.local/callback"
  services:
    provider:
      type: edc_connector
      url: ${{ env.provider_url }}
      auth:
        type: api_key
        key: "test-api-key"
    consumer:
      type: edc_connector
      url: ${{ env.consumer_url }}
      auth:
        type: api_key
        key: "test-api-key"
  schemas:
    asset_response: schemas/asset-response.yaml
    catalog_response: schemas/catalog-response.yaml

preconditions:
  - id: health_provider
    uses: edc/health_check
    name: Provider health check
    with:
      service: provider
    validate:
      - status_code == 200

  - id: health_consumer
    uses: edc/health_check
    name: Consumer health check
    with:
      service: consumer
    validate:
      - status_code == 200

tests:
  - tests/asset-crud.yaml
  - tests/contract-negotiation.yaml
```

### `tests/contract-negotiation.yaml`

```yaml
kind: test
metadata:
  name: Contract negotiation happy path
  description: Negotiate a contract and verify agreement is created

setup:
  - id: gen_asset_id
    uses: util/generate_uuid
    name: Generate unique asset ID
    returns:
      generated_id:
        type: string
        class: uuid

  - id: create_asset
    uses: edc/create_asset
    name: Create provider asset
    with:
      asset_id: ${{ vars.generated_id }}
      service: provider
    returns:
      asset_id:
        type: string
        class: asset_id
    validate:
      - status_code == 200

  - id: create_policy
    uses: edc/create_policy
    name: Create access policy
    with:
      service: provider
      policy:
        type: open
    returns:
      policy_id:
        type: string
        class: policy_id
    validate:
      - status_code == 200

  - id: create_contract_def
    uses: edc/create_contract_definition
    name: Create contract definition
    with:
      asset_id: ${{ vars.asset_id }}
      access_policy_id: ${{ vars.policy_id }}
      contract_policy_id: ${{ vars.policy_id }}
      service: provider
    validate:
      - status_code == 200

steps:
  - id: query_catalog
    uses: edc/query_catalog
    name: Query provider catalog from consumer
    with:
      provider_url: ${{ env.provider_url }}
      service: consumer
    returns:
      offer_id:
        type: string
        class: offer_id
    validate:
      - status_code == 200
      - response_body schema ${{ env.schemas.catalog_response }}

  - id: negotiate
    uses: edc/negotiate
    name: Initiate contract negotiation
    with:
      offer_id: ${{ vars.offer_id }}
      provider_url: ${{ env.provider_url }}
      service: consumer
    returns:
      negotiation_id:
        type: string
        class: negotiation_id
      agreement_id:
        type: string
        class: agreement_id
    validate:
      - status_code == 200
      - ${{ vars.agreement_id }} != null

teardown:
  - id: delete_asset
    uses: edc/delete_asset
    name: Remove test asset
    with:
      asset_id: ${{ vars.create_asset.returns.asset_id }}
      service: provider
```

---

## Consequences

### Positive

- **Instant familiarity**: Developers who know GitHub Actions can read TestLab YAML without documentation.
- **Steps are functions**: `uses` + `with` + `returns` maps cleanly to function call semantics.
- **Compile-time safety**: Variable resolution is fully validated before execution — no runtime surprises.
- **IDE-friendly**: The canonical field order and auto-generated IDs make serialization deterministic.
- **Extensible**: New step namespaces and variable scopes can be added without syntax changes.
- **Typed outputs**: `returns` with `type` and `class` enable IDE filtering (ADR-0009) and documentation.

### Negative

- **Breaking change from v1**: All existing YAML files must be migrated (mitigated by CLI tool).
- **Verbosity increase**: `${{ vars.x }}` is longer than `@x` (mitigated by IDE auto-completion).
- **Learning curve for `${{ }}`**: Users unfamiliar with GHA must learn expression syntax (mitigated by IDE doing the heavy lifting).
- **Strict ordering**: Canonical field order adds one more thing the compiler must validate.

### Risks

| Risk | Mitigation |
|------|-----------|
| v1 YAML files break silently | Compiler detects `type:` and `params:` as v1 markers → emits "This appears to be v1 syntax. Run `testlab migrate v1-to-v2`." |
| Users forget `returns:` metadata | IDE blocks auto-declare returns from block JSON — user never writes them manually |
| Schema files drift from actual API | Schema validation is optional (only when `schema` operator is used in `validate:`) |
| Qualified variable syntax is verbose | IDE defaults to flat form; only switches to qualified on ambiguity |

---

## References

- [ADR-0009: Typed Variable Class System](ADR-0009-typed-variable-class-system.md) — defines `class` taxonomy used in `returns:`
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — inspiration source
- [Product Scope](../product-scope.md) — lifecycle: IDE → YAML → compile → execute → feedback
