<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

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

# YAML Syntax v2 — Variable System Migration Plan

**Branch**: `spike/yaml-syntax-v2-variable-demo`  
**ADR**: [ADR-0010](decision-records/ADR-0010-yaml-syntax-v2.md)  
**Date**: 2026-05-20  

---

## 1. Executive Summary

Migrate the entire tractusx-testlab codebase (IDE frontend + Python backend) from the legacy `@variable_name` syntax to the new scoped variable system defined in ADR-0010, ADR-0011, and ADR-0013. The primary scopes are:

- `${{ steps.<step_id>.<field> }}` — step output references (always qualified)
- `${{ env.x }}` — environment variables from TCK manifest
- `${{ env.services.<name>.<field> }}` — service class handles
- `${{ env.schemas.<name> }}` — schema file references
- `${{ metadata.x }}` — TCK manifest metadata
- `${{ execution.x }}` — runtime-injected context
- `${{ preconditions.<id>.<field> }}` — precondition returns
- `${{ setup.<id>.<field> }}` — setup phase step returns

This introduces explicit scope separation, enables compile-time validation, and eliminates a proprietary syntax in favor of GHA-familiar patterns. **No backward compatibility** — all `@` syntax code paths are removed.

---

## 2. Current State Analysis

### 2.1 Variable Resolution Patterns (Legacy) - TO BE REMOVED NO BACKWARD COMPATIBILITY

| Pattern | Meaning | Where Used |
|---------|---------|------------|
| `@variable_name` | Unscoped variable ref | YAML params, mock bodies, IDE serialization |
| `${variable_name}` | Alternate unscoped ref | Python resolver, compiler validator |
| `${!test:output}` | Cross-test output ref | Python `OUTPUT_REF` pattern |
| `store_in_memory: {key: path}` | Step output declaration | YAML keyword, models, IDE serialization |

### 2.2 Files Containing Legacy Variable Logic

#### Frontend (`ide/src/`)

| File | Legacy Usage |
|------|-------------|
| `components/BlockEditor/serialization/varSyntax.ts` | `LEGACY_VAR_REF_RE` regex, `extractVarName()` parses `@` |
| `components/BlockEditor/serialization/helpers.ts` | `createValueBlockFromString()` parses `@`/`{{}}` patterns |
| `components/BlockEditor/serialization/workspaceToModel.ts` | Emits `store_in_memory` YAML keyword |
| `components/BlockEditor/serialization/populate/stepOutputTracker.ts` | Reads `store_in_memory` to build output map |
| `components/BlockEditor/serialization/populate/populateTest.ts` | Creates `output_variable` vs `variable_get` blocks |
| `components/BlockEditor/blocks/json/modal/jsonVarRefs.ts` | Parses `@var` inside JSON with placeholder swap |
| `components/BlockEditor/blocks/valueBlocks.ts` | `output_variable` and `variable_get` block definitions |
| `components/PreconditionsPanel/templatePolicies.ts` | Hardcoded `@consumer_bpn`, `@asset_id`, etc. |
| `models/validator.ts` | Regex matches `@var`, `${var}`, `${{ vars.x }}` simultaneously |
| `models/schema.ts` | `store_in_memory` field on `StepDefinition` |
| `sync/graph/graphHelpers.ts` | `collectVariableRefs()` regex matches `@var` |
| `sync/graph/modelToGraph.ts` | Reads `store_in_memory` for graph node labels |
| `components/EnvironmentEditor/yamlPreview.ts` | Quotes strings starting with `@` |
| `store/slices/useEnvironmentStore.ts` | Environment variable state (needs scope alignment) |

#### Backend (`src/tractusx_testlab/`)

| File | Legacy Usage |
|------|-------------|
| `syntax/patterns.py` | `AT_VAR_REF = re.compile(r"@([\w]+)")` — canonical `@` pattern |
| `syntax/keys.py` | `STORE_IN_MEMORY = "store_in_memory"` constant |
| `player/loading/resolver.py` | `resolve_str()` — resolves both `@var` and `${var}` |
| `player/loading/_constants.py` | `K_STORE_IN_MEMORY` constant |
| `player/loading/_parser.py` | Reads `store_in_memory` from YAML dicts |
| `player/execution/step_runner.py` | `store_step_outputs()` — stores outputs via `store_in_memory` |
| `player/execution/context.py` | `StepContext._variables` — flat dict (no scope) |
| `compiler/validator.py` | `_VAR_REF = re.compile(r"\$\{(\w+)}")` + `_check_var_refs()` |
| `scripting/_builders.py` | Reads `store_in_memory`, `store_in_variable` |
| `scripting/parser.py` | Builds `StepDefinition` with `store_in_memory` |
| `steps/server/mock.py` | `_resolve_variables()` — replaces `@var` in mock bodies |
| `steps/assertions.py` | Auto-resolves `@var` in assertion values |
| `models/definitions.py` | `StepDefinition.store_in_memory: Optional[dict[str, str]]` |

#### Tests (`tests/`)

| File | Impact |
|------|--------|
| `test_compiler_preconditions.py` | Uses `store_in_memory={"asset_log": "."}` |
| `test_mocks.py` | Likely tests `@var` resolution in mock bodies |
| `test_step_executors.py` | Variable resolution in step params |
| `test_runner.py` | `store_in_memory` flow |
| `factories.py` | Factory methods creating `StepDefinition` with `store_in_memory` |

---

## 3. Target State

### 3.1 Variable Scoping Model

```
┌──────────────────────────────────────────────────────────────────┐
│ TCK Manifest (env + metadata scopes)                             │
│   metadata:                                                      │
│     dataspace_version: saturn                                    │
│   env:                                                           │
│     variables:                                                   │
│       provider_url: { type: string }                             │
│     schemas:                                                     │
│       asset_schema: schemas/asset.json                           │
│     services:                                                    │
│       - name: testlab_connector                                  │
│         uses: service/connector_service                          │
│         with:                                                    │
│           base_url: ${{ env.provider_url }}                       │
│           dataspace_version: ${{ metadata.dataspace_version }}    │
│           auth: { type: api_key, api_key: "...", ... }           │
│         returns:                                                 │
│           connector_service: { type: class, class: ConnectorService } │
│                                                                  │
│   Referenced as: ${{ env.provider_url }}                          │
│                  ${{ env.schemas.asset_schema }}                  │
│                  ${{ env.services.testlab_connector.connector_service }} │
│                  ${{ metadata.dataspace_version }}                │
└──────────────────────────────────────────────────────────────────┘
           │ inherits into ▼
┌──────────────────────────────────────────────────────────────────┐
│ Test File — Preconditions (preconditions scope)                  │
│   preconditions:                                                 │
│     - id: gen_asset_id                                           │
│       uses: precondition/generate                                │
│       returns:                                                   │
│         asset_id: { type: string }                               │
│                                                                  │
│   Referenced as: ${{ preconditions.gen_asset_id.asset_id }}       │
└──────────────────────────────────────────────────────────────────┘
           │ inherits into ▼
┌──────────────────────────────────────────────────────────────────┐
│ Test File — Setup Phase (setup scope)                            │
│   setup:                                                         │
│     - id: create_asset_1                                         │
│       uses: connector/create_asset                               │
│       returns:                                                   │
│         asset_id: { type: string, class: asset_id }              │
│                                                                  │
│   Referenced as: ${{ setup.create_asset_1.asset_id }}             │
└──────────────────────────────────────────────────────────────────┘
           │ inherits into ▼
┌──────────────────────────────────────────────────────────────────┐
│ Test File — Steps (steps scope)                                  │
│   steps:                                                         │
│     - id: create_asset_1                                         │
│       uses: connector/create_asset                               │
│       returns:                                                   │
│         asset_id: { type: string, class: asset_id }              │
│                                                                  │
│   Referenced ${{ steps.create_asset_1.asset_id }}             │
└──────────────────────────────────────────────────────────────────┘
           │ available in ▼
┌──────────────────────────────────────────────────────────────────┐
│ Test File — Teardown Phase                                       │
│   teardown:                                                      │
│     - id: cleanup                                                │
│       uses: connector/delete_asset                               │
│       with:                                                      │
│         asset_id: ${{ steps.create_asset_1.asset_id }}           │
│                                                                  │
│   Can reference: steps, setup, env, preconditions, metadata      │
└──────────────────────────────────────────────────────────────────┘
           │ runtime context ▼
┌──────────────────────────────────────────────────────────────────┐
│ Execution Context (execution scope)                              │
│   Runtime-injected: execution_id, timestamp, run_mode, ...       │
│                                                                  │
│   Referenced as: ${{ execution.execution_id }}                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Resolution Rules (from ADR-0010 §3.2)

1. `${{ steps.<step_id>.<field> }}` — directly resolves to step's return field. If step ID or field doesn't exist → **compiler error**
2. `${{ env.x }}` — from TCK manifest `env.variables`
3. `${{ env.services.<name>.<field> }}` — service class handle from manifest
4. `${{ env.schemas.<name> }}` — schema file path from manifest
5. `${{ metadata.x }}` — from TCK manifest `metadata`
6. `${{ execution.x }}` — runtime-injected values
7. `${{ preconditions.<id>.<field> }}` — from precondition step returns
8. `${{ setup.<id>.<field> }}` — from setup phase step returns
9. Top-to-bottom resolution order within each phase

There is no flat/unqualified form for step references — every `steps` reference must include both the step ID and the field name.

### 3.3 Keyword Mapping (v1 → v2)

| v1 Keyword | v2 Keyword | Notes |
|------------|------------|-------|
| `type:` | `uses:` | Step type identifier |
| `params:` | `with:` | Step input parameters |
| `store_in_memory:` | `returns:` | Step output declarations |
| `@variable` | `${{ steps.<step_id>.<field> }}` | Step-output reference (always qualified) |
| `@env_var` | `${{ env.x }}` | Environment variable reference |
| `variables:` (flat) | `env.variables:` (typed) | Environment variable definitions |
| — | `${{ env.services.<name>.<field> }}` | Service class handle reference |
| — | `${{ metadata.x }}` | Manifest metadata reference |
| — | `${{ execution.x }}` | Runtime context reference |
| — | `${{ preconditions.<id>.<field> }}` | Precondition output reference |
| — | `${{ setup.<id>.<field> }}` | Setup phase output reference |

### 3.4 Block Type Mapping

| v1 Block Type | v2 Block Type | Serialized As |
|---------------|---------------|---------------|
| `output_variable` | `steps_ref` | `${{ steps.<step_id>.<field> }}` |
| `variable_get` | `env_ref` | `${{ env.x }}` |

### 3.5 `uses:` Namespace Migration

Step types migrate from flat identifiers to a hierarchical `namespace/action` system.

#### Old → New Step Type Mapping

| v1 `type:` | v2 `uses:` | Namespace |
|------------|------------|----------|
| `edc_create_asset` | `connector/provider/create_asset` | `connector/` |
| `edc_create_policy` | `connector/provider/create_policy` | `connector/` |
| `edc_create_contract_definition` | `connector/provider/create_contract_definition` | `connector/` |
| `edc_negotiate` | `connector/consumer/negotiate` | `connector/` |
| `edc_initiate_transfer` | `connector/consumer/initiate_transfer` | `connector/` |
| `edc_get_catalog` | `connector/consumer/query_catalog` | `connector/` |
| `edc_call_dataplane` | `connector/dataplane/http_request` | `connector/` |
| `edc_health_check` | `connector/health_check` | `connector/` |
| `edc_delete_asset` | `connector/delete_asset` | `connector/` |
| `edc_delete_policy` | `connector/delete_policy` | `connector/` |
| `edc_delete_contract_def` | `connector/delete_contract_def` | `connector/` |
| `edc_pull_data_filtered` | `connector/pull_data_filtered` | `connector/` (base level — orchestrates both provider and consumer operations) |
| `http_call` | `http/call` | `http/` |
| `mock_create_endpoint` | `mock/api` | `mock/` |
| `mock_wait_for_call` | `mock/wait/http_request` | `mock/` |
| `generate_uuid` | `util/generate_uuid` | `util/` |
| `wait` | `util/wait` | `util/` |
| `validate_json_schema` | `validate/schema` | `validate/` |
| `validate_assert` | `validate/assert` | `validate/` |
| `validate_field` | `validate/field` | `validate/` |
| `validate_object` | `validate/object` | `validate/` |
| `validate_query_param` | `validate/query_param` | `validate/` |
| `send_notification` | `notification/send` | `notification/` |
| `if` | `flow/if` | `flow/` |

#### Namespace Categories

| Namespace | Purpose |
|-----------|--------|
| `connector/` | EDC connector operations (both provider and consumer) & dataplane calls. Note: `connector/pull_data_filtered` lives at the base `connector/` level (not under `provider/` or `consumer/`) because it's a composite orchestration function combining catalog query, negotiation, transfer, and EDR retrieval. Returns multiple outputs: `catalog`, `datasets`, `asset_id`, `negotiation_id`, `transfer_process_id`, `edr_token`, `dataplane_url`. |
| `http/` | HTTP operations|
| `mock/` | Mock server operations |
| `mock/wait/` | Mock server wait/polling operations |
| `util/` | Utility operations |
| `validate/` | Validation/assertion operations (standalone steps) |
| `notification/` | Notification operations |
| `flow/` | Flow control |
| `precondition/` | Precondition categories: `generate`, `provide`, `input` |
| `service/` | Service declarations in TCK manifest |

#### Precondition Categories (ADR-0013)

| `uses:` | Purpose |
|---------|---------|
| `precondition/generate` | Auto-generate values (UUIDs, timestamps) |
| `precondition/provide` | Provide fixed values from manifest |
| `precondition/input` | Require user input at runtime |
| Any other `uses:` | Executable check (runs a step as a precondition) |

#### Service Declaration Pattern (ADR-0011)

Services declared in `env.services` produce typed class handles:

```yaml
env:
  services:
    - name: testlab_connector
      uses: service/connector_service
      with:
        base_url: ${{ env.provider_url }}
        dataspace_version: ${{ metadata.dataspace_version }}
        auth:
          type: api_key
          api_key: "test-api-key"
          api_key_header: "X-Api-Key"
      returns:
        connector_service:
          type: class
          class: ConnectorService
```

Referenced as: `${{ env.services.testlab_connector.connector_service }}`

#### Setup/Teardown Phases

`setup:` and `teardown:` are first-class phases in test files:
- Setup runs before steps, outputs referenced via `${{ setup.<step_id>.<field> }}`
- Teardown runs after steps (even on failure), can reference `steps`, `setup`, `env`, `preconditions`, `metadata`

#### Inline Validate Shorthand

Inside a step's own `validate:` block, `input` can be the bare field name (no `${{ }}`) referencing the step's own returns:

```yaml
- id: check_catalog
  uses: connector/query_catalog
  with:
    connector_service: ${{ env.services.testlab_connector.connector_service }}
  returns:
    catalog: { type: object }
  validate:
    - uses: validate/field
      with:
        input: catalog  # bare name — references this step's own returns
        field: "dcat:dataset"
        operator: exists
```

The authoritative enum of valid `uses:` values is defined in `docs/specification/schemas/test-file.schema.json`.

---

## 4. Frontend Work Packages

### WP-F1: Variable Syntax Module — Remove Legacy Support

**Files**: `ide/src/components/BlockEditor/serialization/varSyntax.ts`

**Changes**:
- Remove `LEGACY_VAR_REF_RE` regex
- Remove legacy branch in `extractVarName()`
- Remove legacy branch in `isVarRef()`
- Remove `@(\w+)` from `VAR_REF_GLOBAL_PATTERN`
- Add variable ref support: `${{ steps.<step_id>.<field> }}` (always qualified — no flat form)
- Add scope detection for all scopes: `steps`, `env`, `env.services`, `env.schemas`, `metadata`, `execution`, `preconditions`, `setup`

**Before**:
```typescript
export function extractVarName(value: string): string | undefined {
  const newMatch = NEW_VAR_REF_RE.exec(value);
  if (newMatch) return newMatch[1];
  const legacyMatch = LEGACY_VAR_REF_RE.exec(value);
  if (legacyMatch) return legacyMatch[1];
  return undefined;
}
```

**After**:
```typescript
export function extractVarName(value: string): { scope: string; name: string } | undefined {
  const stepsMatch = STEPS_REF_RE.exec(value);
  if (stepsMatch) return { scope: "steps", name: `${stepsMatch[1]}.${stepsMatch[2]}` };
  const envMatch = ENV_REF_RE.exec(value);
  if (envMatch) return { scope: "env", name: envMatch[1] };
  const servicesMatch = SERVICES_REF_RE.exec(value);
  if (servicesMatch) return { scope: "env.services", name: `${servicesMatch[1]}.${servicesMatch[2]}` };
  const preconditionsMatch = PRECONDITIONS_REF_RE.exec(value);
  if (preconditionsMatch) return { scope: "preconditions", name: `${preconditionsMatch[1]}.${preconditionsMatch[2]}` };
  const setupMatch = SETUP_REF_RE.exec(value);
  if (setupMatch) return { scope: "setup", name: `${setupMatch[1]}.${setupMatch[2]}` };
  const metadataMatch = METADATA_REF_RE.exec(value);
  if (metadataMatch) return { scope: "metadata", name: metadataMatch[1] };
  const executionMatch = EXECUTION_REF_RE.exec(value);
  if (executionMatch) return { scope: "execution", name: executionMatch[1] };
  return undefined;
}
```

---

### WP-F2: Serialization — Replace `store_in_memory` with `returns`

**Files**:
- `ide/src/components/BlockEditor/serialization/workspaceToModel.ts`
- `ide/src/models/schema.ts`

**Changes**:
- Rename `store_in_memory` → `returns` in model interfaces
- Update `workspaceToModel()` to emit `returns: { key: { type, class } }` instead of `store_in_memory: { key: path }`
- Update `toStepsRef`/`toEnvRef` usage to use correct scope detection (output vars from preceding steps → `steps`, env store vars → `env`, services → `env.services`, preconditions → `preconditions`, setup → `setup`)

**Before** (`schema.ts`):
```typescript
export interface StepDefinition {
  store_in_memory?: Record<string, string>;
}
```

**After**:
```typescript
export interface StepReturnDef {
  type: string;
  class?: string;
}
export interface StepDefinition {
  id: string;
  uses: string;
  name: string;
  with?: Record<string, unknown>;
  returns?: Record<string, StepReturnDef>;
  validate?: Assertion[];
}
```

---

### WP-F3: Block System — Scope Variable Blocks (No Prefix Display)

**Files**:
- `ide/src/components/BlockEditor/blocks/valueBlocks.ts`
- `ide/src/components/BlockEditor/blocks/registration/values/valueBlocks.ts`

**Design Rules**:
- Blocks do NOT display `env.` or `steps.` prefixes — the scope is implicit from the block type
- The serializer adds the `${{ env.x }}` or `${{ steps.<step_id>.<field> }}` wrapper automatically based on which block type is used
- Multiple distinct block types with different UX:

| Block | Display | Editable? | Source |
|-------|---------|-----------|--------|
| **env_ref** | Dropdown showing env variable names (e.g., `consumer_bpn`) | User selects from dropdown | TCK manifest `env.variables` |
| **steps_ref** | Static label showing output name (e.g., `create_asset_1.asset_id`) | NOT editable — auto-generated from step returns | Preceding steps' `returns` |
| **services_ref** | Dropdown showing service handles | User selects from dropdown | TCK manifest `env.services` |
| **preconditions_ref** | Static label showing precondition output | NOT editable — from precondition returns | Precondition phase `returns` |
| **setup_ref** | Static label showing setup output | NOT editable — from setup returns | Setup phase `returns` |
| **metadata_ref** | Dropdown showing metadata keys | User selects from dropdown | TCK manifest `metadata` |

**Changes**:
- `env_ref` block: dropdown populated from environment store, shows plain name (no `env.` prefix)
- `steps_ref` block: read-only label showing the variable name (no `steps.` prefix), cannot be renamed or selected by user — created automatically when a step declares `returns`
- `services_ref` block: dropdown for service class handles
- `preconditions_ref` block: read-only label from precondition returns
- `setup_ref` block: read-only label from setup phase returns
- `metadata_ref` block: dropdown from manifest metadata keys
- Serialization emits `${{ env.x }}` for `env_ref`, `${{ steps.<step_id>.<field> }}` for `steps_ref`, `${{ env.services.n.f }}` for `services_ref`, etc.
- Remove any visual prefix from block rendering — scope is determined by block type alone

---

### WP-F4: Population — Update Step Output Tracking

**Files**:
- `ide/src/components/BlockEditor/serialization/populate/stepOutputTracker.ts`
- `ide/src/components/BlockEditor/serialization/populate/populateTest.ts`

**Changes**:
- `trackStepOutputs()`: read `returns` instead of `store_in_memory`
- `createValueBlockWithOutputResolution()`: use `isStepsRef()` / `isEnvRef()` / `isServicesRef()` / `isPreconditionsRef()` / `isSetupRef()` for block type selection
- Remove all `PURE_VAR_REF` regex that includes `@` pattern
- Add tracking for precondition and setup outputs as available references

---

### WP-F5: JSON Modal Editor — Replace `@var` Placeholder System

**Files**: `ide/src/components/BlockEditor/blocks/json/modal/jsonVarRefs.ts`

**Changes**:
- Replace `@variable_name` placeholder system with `${{ steps.<step_id>.<field> }}` / `${{ env.x }}` and other scopes
- Update `replaceVarRefs()` to handle `${{ }}` syntax inside JSON
- Since `${{ steps.<step_id>.<field> }}` is a valid JSON string value (unlike bare `@var`), the placeholder system may be simplified or removed entirely

---

### WP-F6: Template Policies — Update Hardcoded References

**Files**: `ide/src/components/PreconditionsPanel/templatePolicies.ts`

**Changes**:
- Replace all `"@consumer_bpn"` → `"${{ env.consumer_bpn }}"`
- Replace all `"@asset_id"` → `"${{ steps.asset_id }}"`
- Replace all `"@provider_backend_url"` → `"${{ env.provider_backend_url }}"`
- Replace `"@contract_def_id"`, `"@access_policy_id"`, `"@usage_policy_id"` → appropriate scoped refs (`${{ steps.<step_id>.<field> }}` for step outputs, `${{ preconditions.<id>.<field> }}` for precondition outputs)

---

### WP-F7: Graph View — Update Variable Detection

**Files**:
- `ide/src/sync/graph/graphHelpers.ts`
- `ide/src/sync/graph/modelToGraph.ts`

**Changes**:
- `collectVariableRefs()`: remove `@(\w+)` and `\$\{([^}]+)\}` from regex, keep only `${{ steps.<step_id>.<field> }}`, `${{ env.x }}`, and other scoped patterns
- `modelToGraph()`: read `returns` instead of `store_in_memory`
- Update node data: `storesMemory` → `hasReturns` (or similar)
- Add edges for cross-phase references (setup → steps, preconditions → steps)

---

### WP-F8: Validator — Simplify Variable Reference Detection

**Files**: `ide/src/models/validator.ts`

**Changes**:
- Remove `@(\w+)` and `\$\{([^}]+)\}` regex branches
- Keep only `${{ steps.<step_id>.<field> }}`, `${{ env.x }}`, and all other scoped pattern matching
- Add env scope validation: `${{ env.x }}` must exist in environment store
- Add services scope validation: `${{ env.services.<name>.<field> }}` must reference declared service
- Add step ref validation: step ID must exist in preceding steps, field must exist in that step's `returns`
- Add validation for `preconditions`, `setup`, `metadata`, `execution` scopes

---

### WP-F9: Environment Editor — Align with `env` Scope

**Files**:
- `ide/src/components/EnvironmentEditor/yamlPreview.ts`
- `ide/src/components/EnvironmentEditor/VariablesSection.tsx`
- `ide/src/components/EnvironmentEditor/VariableRow.tsx`
- `ide/src/store/slices/useEnvironmentStore.ts`

**Changes**:
- YAML preview: emit variables under `env.variables:` key
- Remove `@` quoting logic (no longer needed)
- Environment variables are now referenced as `${{ env.x }}` — update tooltips/labels
- Services section: emit under `env.services:` key with `name`, `uses`, `with`, `returns` structure
- Add schemas section: emit under `env.schemas:` key
- Add metadata section handling

---

### WP-F10: Serialization Helpers — Remove Legacy Parsing

**Files**: `ide/src/components/BlockEditor/serialization/helpers.ts`

**Changes**:
- `readValueBlockAsString()`: clarify `steps_ref` → `${{ steps.<step_id>.<field> }}`, `env_ref` → `${{ env.x }}`, `services_ref` → `${{ env.services.n.f }}`
- `createValueBlockFromString()`: remove `@` pattern matching, remove `{{x}}`/`${x}` fallbacks
- Only parse `${{ steps.<step_id>.<field> }}`, `${{ env.x }}`, `${{ env.services.n.f }}`, `${{ preconditions.id.f }}`, `${{ setup.id.f }}`, `${{ metadata.x }}`, `${{ execution.x }}` syntax

---

### WP-F11: Toolbox Builder — Update Variable Category

**Files**: `ide/src/components/BlockEditor/toolbox/toolboxBuilder.ts`

**Changes**:
- Update variable category to show `steps_ref` blocks (from step outputs), `env_ref` blocks (from env store), `services_ref`, `preconditions_ref`, `setup_ref`, and `metadata_ref` blocks
- Remove references to `variable_get` as a generic block name

---

## 5. Backend Work Packages

### WP-B1: Syntax Patterns — New Regex Module

**Files**:
- `src/tractusx_testlab/syntax/patterns.py`
- `src/tractusx_testlab/syntax/keys.py`

**Changes**:
- Replace `AT_VAR_REF` with:
  ```python
  STEPS_REF = re.compile(r"\$\{\{\s*steps\.(\w+)\.(\w+)\s*\}\}")
  ENV_REF = re.compile(r"\$\{\{\s*env\.(\w+)\s*\}\}")
  SERVICES_REF = re.compile(r"\$\{\{\s*env\.services\.(\w+)\.(\w+)\s*\}\}")
  SCHEMAS_REF = re.compile(r"\$\{\{\s*env\.schemas\.(\w+)\s*\}\}")
  PRECONDITIONS_REF = re.compile(r"\$\{\{\s*preconditions\.(\w+)\.(\w+)\s*\}\}")
  METADATA_REF = re.compile(r"\$\{\{\s*metadata\.(\w+)\s*\}\}")
  EXECUTION_REF = re.compile(r"\$\{\{\s*execution\.(\w+)\s*\}\}")
  SETUP_REF = re.compile(r"\$\{\{\s*setup\.(\w+)\.(\w+)\s*\}\}")
  ANY_VAR_REF = re.compile(r"\$\{\{\s*(?:steps|env|metadata|execution|preconditions|setup)[\w.]*\s*\}\}")
  ```
  Note: there is no flat/unqualified `STEPS_REF` — all step references require both step ID and field name.
- Remove `VAR_REF` (`${var}` pattern)
- Replace `STORE_IN_MEMORY` key → `RETURNS` key
- Add `USES`, `WITH`, `RETURNS`, `ID` keyword constants

---

### WP-B2: Models — Update StepDefinition

**Files**: `src/tractusx_testlab/models/definitions.py`

**Changes**:
```python
# Before
class StepDefinition(BaseModel):
    type: str
    params: dict = Field(default_factory=dict)
    store_in_memory: Optional[dict[str, str]] = None
    store_in_variable: Optional[str] = None

# After
class StepReturnDef(BaseModel):
    type: str = "string"
    var_class: Optional[str] = Field(default=None, alias="class")

class StepDefinition(BaseModel):
    id: str
    uses: str  # replaces type
    name: str
    with_params: dict = Field(default_factory=dict, alias="with")  # replaces params
    returns: Optional[dict[str, StepReturnDef]] = None  # replaces store_in_memory
    validate: list[Assertion] = Field(default_factory=list)
```

---

### WP-B3: Resolver — Scoped Variable Resolution

**Files**: `src/tractusx_testlab/player/loading/resolver.py`

**Changes**:
- `resolve_str()`: replace `@var` + `${var}` logic with `${{ steps.<step_id>.<field> }}`, `${{ env.x }}`, and all other scoped patterns
- Add scope-aware resolution:
  - `${{ steps.<step_id>.<field> }}` → qualified lookup by step ID + field in `context._step_variables`
  - `${{ env.x }}` → lookup in `context._env_variables` (populated from TCK manifest)
  - `${{ env.services.<name>.<field> }}` → lookup in `context._services`
  - `${{ env.schemas.<name> }}` → lookup in `context._schemas`
  - `${{ metadata.x }}` → lookup in `context._metadata`
  - `${{ execution.x }}` → lookup in `context._execution`
  - `${{ preconditions.<id>.<field> }}` → lookup in `context._precondition_outputs`
  - `${{ setup.<id>.<field> }}` → lookup in `context._setup_outputs`
- All step references are always qualified (step_id + field) — no flat form
- Type-preserving: whole-string refs return raw value, inline refs stringify

**Before**:
```python
def resolve_str(value: str, context: "StepContext") -> str:
    if value.startswith("@") and patterns.AT_VAR_REF.fullmatch(value):
        var_name = value[1:]
        resolved = context.get_variable(var_name)
        return resolved if resolved is not None else value
```

**After**:
```python
def resolve_str(value: str, context: "StepContext") -> Any:
    # ${{ steps.<step_id>.<field> }} → qualified lookup
    m = patterns.STEPS_REF.fullmatch(value.strip())
    if m:
        return context.get_step_variable(m.group(1), m.group(2), value)
    # Whole-string ${{ env.x }} → return raw typed value
    m = patterns.ENV_REF.fullmatch(value.strip())
    if m:
        return context.get_env_variable(m.group(1), value)
    # Whole-string ${{ env.services.<name>.<field> }}
    m = patterns.SERVICES_REF.fullmatch(value.strip())
    if m:
        return context.get_service_handle(m.group(1), m.group(2), value)
    # Whole-string ${{ preconditions.<id>.<field> }}
    m = patterns.PRECONDITIONS_REF.fullmatch(value.strip())
    if m:
        return context.get_precondition_output(m.group(1), m.group(2), value)
    # Whole-string ${{ setup.<id>.<field> }}
    m = patterns.SETUP_REF.fullmatch(value.strip())
    if m:
        return context.get_setup_output(m.group(1), m.group(2), value)
    # Whole-string ${{ metadata.x }}
    m = patterns.METADATA_REF.fullmatch(value.strip())
    if m:
        return context.get_metadata(m.group(1), value)
    # Whole-string ${{ execution.x }}
    m = patterns.EXECUTION_REF.fullmatch(value.strip())
    if m:
        return context.get_execution(m.group(1), value)
    # Inline interpolation for mixed strings
    ...
```

---

### WP-B4: Execution Context — Scoped Variable Storage

**Files**: `src/tractusx_testlab/player/execution/context.py`

**Changes**:
- Split `_variables: dict[str, Any]` into:
  - `_step_variables: dict[str, Any]` — populated from step `returns`
  - `_env_variables: dict[str, Any]` — populated from TCK manifest `env.variables`
  - `_services: dict[str, Any]` — populated from TCK manifest `env.services` returns
  - `_schemas: dict[str, str]` — populated from TCK manifest `env.schemas`
  - `_metadata: dict[str, Any]` — populated from TCK manifest `metadata`
  - `_execution: dict[str, Any]` — runtime-injected values
  - `_precondition_outputs: dict[str, dict[str, Any]]` — from precondition phase returns
  - `_setup_outputs: dict[str, dict[str, Any]]` — from setup phase returns
- Add `set_step_variable(step_id, field, value)` and `get_step_variable(step_id, field)` — always qualified, no flat lookup
- Add `set_env_variable(name, value)` and `get_env_variable(name)`
- Add `get_service_handle(service_name, field)`
- Add `get_precondition_output(precondition_id, field)`
- Add `get_setup_output(setup_id, field)`
- Add `get_metadata(key)` and `get_execution(key)`

---

### WP-B5: Step Runner — Use `returns` Instead of `store_in_memory`

**Files**: `src/tractusx_testlab/player/execution/step_runner.py`

**Changes**:
- `store_step_outputs()`: read `step_def.returns` instead of `step_def.store_in_memory`
- Store outputs with step ID as namespace: `context.set_step_variable(key, value, step_id=step_def.id)`
- Remove `store_in_variable` special case (absorbed into `returns`)

---

### WP-B6: YAML Parser — Parse v2 Syntax

**Files**:
- `src/tractusx_testlab/scripting/_builders.py`
- `src/tractusx_testlab/scripting/parser.py`
- `src/tractusx_testlab/player/loading/_parser.py`
- `src/tractusx_testlab/player/loading/_constants.py`

**Changes**:
- Parse `uses` → `step_def.uses`, `with` → `step_def.with_params`, `returns` → `step_def.returns`
- Parse `id` as required field
- Remove `store_in_memory` and `store_in_variable` parsing
- Update TCK manifest parsing: `env.variables`, `env.services` (with `name`, `uses`, `with`, `returns`), `env.schemas`
- Add `metadata` section parsing from TCK manifest
- Add `preconditions` phase parsing (categories: `precondition/generate`, `precondition/provide`, `precondition/input`, executable checks)
- Add `setup` and `teardown` phase parsing as first-class phases
- Parse inline `validate:` blocks within steps (assertions as standalone steps with own `id`)

---

### WP-B7: Compiler Validator — New Resolution Rules

**Files**: `src/tractusx_testlab/compiler/validator.py`

**Changes**:
- Replace `_VAR_REF = re.compile(r"\$\{(\w+)}")` with all scoped patterns from WP-B1
- `_check_var_refs()`: detect `${{ steps.<step_id>.<field> }}`, `${{ env.x }}`, `${{ env.services.n.f }}`, `${{ preconditions.id.f }}`, `${{ setup.id.f }}`, `${{ metadata.x }}`, `${{ execution.x }}` separately
- For `steps`: check that step ID exists in preceding steps AND the field exists in that step's `returns` — compiler error otherwise
- For `env`: check if variable name exists in TCK manifest `env.variables`
- For `env.services`: check if service name and field exist in manifest `env.services` returns
- For `preconditions`: check if precondition ID and field exist in precondition phase
- For `setup`: check if setup step ID and field exist in setup phase
- No ambiguity detection needed — all step references are always qualified with step ID + field
- Add field ordering validation: `id` must be first, `uses` must be second

---

### WP-B8: Mock Server Step — Update Variable Resolution

**Files**: `src/tractusx_testlab/steps/server/mock.py`

**Changes**:
- `_resolve_variables()`: replace `@` prefix check with `${{ steps.<step_id>.<field> }}` / `${{ env.x }}` and all scoped patterns
- Use the shared resolver from `player/loading/resolver.py` instead of local implementation

---

### WP-B9: Assertion Step — Update Variable Resolution

**Files**: `src/tractusx_testlab/steps/assertions.py`

**Changes**:
- Update inline `@var` resolution to use `${{ steps.<step_id>.<field> }}` pattern
- Use shared resolver
- Support `validate/assert`, `validate/field`, `validate/schema`, `validate/object`, `validate/query_param` as standalone steps with their own `id`

---

### WP-B10: Remove Legacy Code Paths

**Files** (cleanup pass across all backend files):
- Remove `AT_VAR_REF` pattern from `syntax/patterns.py`
- Remove `VAR_REF` (`${var}`) pattern
- Remove `OUTPUT_REF` (`${!test:output}`) pattern (replaced by qualified vars)
- Remove `STORE_IN_MEMORY` from `syntax/keys.py`
- Remove all `@` prefix checks in step implementations

---

## 6. Test Migration

### 6.1 Test Files Requiring Updates

| File | Changes Needed |
|------|---------------|
| `tests/test_compiler_preconditions.py` | Replace `store_in_memory=` with `returns=` |
| `tests/test_compiler.py` | Update variable validation expectations to use `${{ steps.<step_id>.<field> }}` |
| `tests/test_mocks.py` | Replace `@var` in test data with `${{ steps.<step_id>.<field> }}` |
| `tests/test_step_executors.py` | Update params using variable refs to scoped syntax |
| `tests/test_runner.py` | Update `store_step_outputs` expectations |
| `tests/test_models.py` | Update `StepDefinition` construction |
| `tests/factories.py` | Update factory methods for new model fields |
| `tests/fixtures/` | Update YAML fixture files to v2 syntax |
| `tests/test_precondition_steps.py` | Update store_in_memory references, add `${{ preconditions.x.y }}` tests |
| `tests/test_precondition_steps_policy_contract.py` | Same + test precondition scope isolation |

### 6.2 New Tests to Add

| Test | Purpose |
|------|---------|
| `test_steps_ref_resolution.py` | `${{ steps.<step_id>.<field> }}` resolves correctly; unknown step_id or field produces compiler error |
| `test_env_ref_resolution.py` | `${{ env.x }}` resolves from manifest |
| `test_services_ref_resolution.py` | `${{ env.services.<name>.<field> }}` resolves service handles |
| `test_preconditions_ref_resolution.py` | `${{ preconditions.<id>.<field> }}` resolves from precondition returns |
| `test_setup_ref_resolution.py` | `${{ setup.<id>.<field> }}` resolves from setup phase returns |
| `test_metadata_ref_resolution.py` | `${{ metadata.x }}` resolves from manifest metadata |
| `test_execution_ref_resolution.py` | `${{ execution.x }}` resolves from runtime context |
| `test_scope_isolation.py` | steps, env, preconditions, setup scopes don't leak into each other |
| `test_inline_validate_shorthand.py` | Bare field names in inline `validate:` blocks resolve against own step returns |
| `test_teardown_scope_access.py` | Teardown phase can reference all prior scopes |

---

## 7. Dependency Graph

```
WP-B1 (syntax/patterns)
  │
  ├──► WP-B2 (models) ──► WP-B6 (parser) ──► WP-B7 (validator)
  │                    │
  │                    └──► WP-B5 (step runner) ──► WP-B8 (mock step)
  │                                             └──► WP-B9 (assertions)
  │
  └──► WP-B3 (resolver) ──► WP-B4 (context)
                         └──► WP-B10 (cleanup)

WP-F1 (varSyntax)
  │
  ├──► WP-F2 (serialization/schema) ──► WP-F3 (block system)
  │                                 └──► WP-F4 (population)
  │                                 └──► WP-F10 (helpers)
  │
  ├──► WP-F5 (JSON modal)
  ├──► WP-F6 (template policies)
  ├──► WP-F7 (graph view)
  ├──► WP-F8 (validator)
  ├──► WP-F9 (environment editor)
  └──► WP-F11 (toolbox)
```

### Parallelization Opportunities

| Parallel Group | Work Packages |
|----------------|---------------|
| **Group A** (Backend foundations) | WP-B1, WP-B2, WP-B3, WP-B4 — can all start simultaneously |
| **Group B** (Backend consumers) | WP-B5, WP-B6, WP-B7, WP-B8, WP-B9 — after Group A |
| **Group C** (Frontend foundations) | WP-F1, WP-F2 — can start simultaneously with Group A |
| **Group D** (Frontend consumers) | WP-F3–F11 — after Group C |
| **Group E** (Cleanup) | WP-B10, test migration — after Groups B and D |

**Critical path**: WP-B1 → WP-B2 → WP-B6 → WP-B7 (model changes ripple through parser and validator)

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Model breaking change** — renaming `type`→`uses`, `params`→`with` breaks all existing YAML test files | High | Ship a `testlab migrate` CLI command that auto-converts. Run on all fixtures before merging. |
| **300-line limit violations** — new model classes and resolver logic may bloat files | Medium | Split `StepReturnDef` into own file. Keep resolver as separate module (already is). |
| **Existing TCK packages** — compiled `.tckpkg` archives contain old format | Medium | Bump package format version. Old packages fail validation with clear error. |
| **IDE rollback** — if frontend ships before backend, YAML preview shows v2 but backend rejects it | High | Ship backend first (or simultaneously). Use feature flag during transition. |
| **Qualified ref complexity** — `${{ steps.step_id.field }}` requires users to know the step ID | Low | Step IDs are auto-generated from the block type and always visible in the IDE. All step refs are qualified — no ambiguity possible. |
| **JSON-LD `@id` false positives** — test data contains `"@id"` (JSON-LD) that looks like legacy vars | Low | Post-migration grep will not confuse these — they're inside quoted JSON strings, not in param positions. |
| **Environment variable naming** — existing env vars referenced as `@provider_url` need scope assignment | Medium | All variables currently in `variables:` block become `env` scope. All `store_in_memory` outputs become `steps` scope. Precondition outputs → `preconditions` scope. |

---

## 9. Suggested Agent Assignment

| Work Package | Agent | Rationale |
|--------------|-------|-----------|
| WP-F1–F11 | `testlab-ide-master` | All frontend TypeScript/React changes |
| WP-B1–B10 | `testlab-master` | All Python backend changes |
| Test migration | `testlab-test-master` | Test file updates and new test creation |
| ADR-0010 finalization | `testlab-docs-master` | Update ADR status from Draft → Accepted |
| Migration CLI command | `testlab-master` | `testlab migrate` command for existing YAML files |

### Execution Order

1. **Phase 1** — Backend foundations (WP-B1, B2, B3, B4) + Frontend foundations (WP-F1, F2)
2. **Phase 2** — Backend consumers (WP-B5–B9) + Frontend consumers (WP-F3–F11)
3. **Phase 3** — Cleanup (WP-B10) + Test migration
4. **Phase 4** — Integration testing, migration CLI, docs update

---

## 10. Migration CLI (Bonus WP)

A `testlab migrate` CLI command should:

1. Walk all `.yaml`/`.yml` files in a directory
2. Replace `type:` → `uses:`, `params:` → `with:`, `store_in_memory:` → `returns:`
3. Convert `@variable_name` → `${{ steps.<step_id>.<field> }}` or `${{ env.variable_name }}` based on context (step refs require identifying the source step ID)
4. Map old step type names to new namespaces (e.g., `edc_create_asset` → `connector/create_asset`, `mock_create_endpoint` → `mock/api`)
5. Add `id:` field to steps (auto-generate from step type)
6. Convert `mock_wait_for_call` → `mock/wait/http_request`
7. Convert `edc_call_dataplane` → `connector/dataplane/http_request`
8. Validate the result with the v2 compiler
9. Write converted files (with `--dry-run` option)

This ensures existing TCK test suites can be mechanically upgraded.
