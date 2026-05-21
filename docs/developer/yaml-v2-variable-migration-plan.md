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

Migrate the entire tractusx-testlab codebase (IDE frontend + Python backend) from the legacy `@variable_name` syntax to the new scoped `${{ vars.x }}` / `${{ env.x }}` variable system defined in ADR-0010. This introduces explicit scope separation between step-output variables and environment/TCK-global variables, enables compile-time ambiguity detection, and eliminates a proprietary syntax in favor of GHA-familiar patterns. **No backward compatibility** — all `@` syntax code paths are removed.

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
┌─────────────────────────────────────────────────────┐
│ TCK Manifest (env scope)                            │
│   env:                                              │
│     variables:                                      │
│       provider_url: { type: string }                │
│     schemas:                                        │
│       asset_schema: schemas/asset.json              │
│     services:                                       │
│       provider: { type: edc_connector_saturn, ... } │
│                                                     │
│   Referenced as: ${{ env.provider_url }}             │
│                  ${{ env.schemas.asset_schema }}     │
└─────────────────────────────────────────────────────┘
           │ inherits into ▼
┌─────────────────────────────────────────────────────┐
│ Test File (vars scope)                              │
│   steps:                                            │
│     - id: create_asset_1                            │
│       uses: edc/create_asset                        │
│       returns:                                      │
│         asset_id: { type: string, class: asset_id } │
│                                                     │
│   Referenced as: ${{ vars.asset_id }}                │
│              or: ${{ vars.create_asset_1.returns.asset_id }} │
└─────────────────────────────────────────────────────┘
```

### 3.2 Resolution Rules (from ADR-0010 §3.2)

1. `${{ vars.x }}` — search preceding steps' `returns` for key `x`
2. Single match → resolved
3. Zero matches → **compiler error**
4. Multiple matches → **compiler error** (use qualified form)
5. `${{ vars.step_id.returns.x }}` — direct step reference
6. `${{ env.x }}` — from TCK manifest `env.variables`
7. Top-to-bottom resolution order

### 3.3 Keyword Mapping (v1 → v2)

| v1 Keyword | v2 Keyword | Notes |
|------------|------------|-------|
| `type:` | `uses:` | Step type identifier |
| `params:` | `with:` | Step input parameters |
| `store_in_memory:` | `returns:` | Step output declarations |
| `@variable` | `${{ vars.x }}` | Step-output reference |
| `@env_var` | `${{ env.x }}` | Environment variable reference |
| `variables:` (flat) | `env.variables:` (typed) | Environment variable definitions |

### 3.4 Block Type Mapping

| v1 Block Type | v2 Block Type | Serialized As |
|---------------|---------------|---------------|
| `output_variable` | `vars_ref` | `${{ vars.x }}` |
| `variable_get` | `env_ref` | `${{ env.x }}` |

### 3.5 `uses:` Namespace Migration

Step types migrate from flat identifiers to a hierarchical `namespace/[sub-namespace/]action` system.

#### Old → New Step Type Mapping

| v1 `type:` | v2 `uses:` | Namespace |
|------------|------------|----------|
| `edc_create_asset` | `connector/provider/create_asset` | `connector/provider/` |
| `edc_create_policy` | `connector/provider/create_policy` | `connector/provider/` |
| `edc_create_contract_definition` | `connector/provider/create_contract_definition` | `connector/provider/` |
| `edc_negotiate` | `connector/consumer/negotiate` | `connector/consumer/` |
| `edc_initiate_transfer` | `connector/consumer/initiate_transfer` | `connector/consumer/` |
| `edc_get_catalog` | `connector/consumer/get_catalog` | `connector/consumer/` |
| `edc_call_dataplane` | `connector/http/call_via_dataplane` | `connector/http/` |
| `http_call` | `http/call` | `http/` |
| `mock_create_endpoint` | `mock/create_endpoint` | `mock/` |
| `mock_wait_for_call` | `mock/wait_for_call` | `mock/` |
| `generate_uuid` | `util/generate_uuid` | `util/` |
| `wait` | `util/wait` | `util/` |
| `validate_json_schema` | `validate/json_schema` | `validate/` |
| `send_notification` | `notification/send` | `notification/` |
| `if` | `flow/if` | `flow/` |

#### Namespace Categories

| Namespace | Purpose |
|-----------|--------|
| `connector/provider/` | Provider-side EDC connector operations |
| `connector/consumer/` | Consumer-side EDC connector operations |
| `connector/http/` | Dataplane HTTP operations |
| `http/` | Generic HTTP calls |
| `mock/` | Mock server operations |
| `util/` | Utility operations |
| `validate/` | Validation/assertion operations |
| `notification/` | Notification operations |
| `flow/` | Flow control |

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
- Add qualified variable ref support: `${{ vars.step_id.returns.x }}`

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
export function extractVarName(value: string): string | undefined {
  const match = NEW_VAR_REF_RE.exec(value);
  return match ? match[1] : undefined;
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
- Update `toVarRef`/`toEnvRef` usage to use correct scope detection (output vars from preceding steps → `vars`, env store vars → `env`)

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
- Blocks do NOT display `env.` or `vars.` prefixes — the scope is implicit from the block type
- The serializer adds the `${{ env.x }}` or `${{ vars.x }}` wrapper automatically based on which block type is used
- Two distinct block types with different UX:

| Block | Display | Editable? | Source |
|-------|---------|-----------|--------|
| **env_ref** | Dropdown showing env variable names (e.g., `consumer_bpn`) | User selects from dropdown | TCK manifest `env.variables` |
| **vars_ref** | Static label showing output name (e.g., `http_dataplane.status_code`) | NOT editable — auto-generated from step returns | Preceding steps' `returns` |

**Changes**:
- `env_ref` block: dropdown populated from environment store, shows plain name (no `env.` prefix)
- `vars_ref` block: read-only label showing the variable name (no `vars.` prefix), cannot be renamed or selected by user — created automatically when a step declares `returns`
- Serialization emits `${{ env.x }}` for `env_ref` blocks, `${{ vars.x }}` for `vars_ref` blocks
- Remove any visual prefix (`env.`, `vars.`) from block rendering — scope is determined by block type alone

---

### WP-F4: Population — Update Step Output Tracking

**Files**:
- `ide/src/components/BlockEditor/serialization/populate/stepOutputTracker.ts`
- `ide/src/components/BlockEditor/serialization/populate/populateTest.ts`

**Changes**:
- `trackStepOutputs()`: read `returns` instead of `store_in_memory`
- `createValueBlockWithOutputResolution()`: use `isVarsRef()` / `isEnvRef()` for block type selection
- Remove all `PURE_VAR_REF` regex that includes `@` pattern

---

### WP-F5: JSON Modal Editor — Replace `@var` Placeholder System

**Files**: `ide/src/components/BlockEditor/blocks/json/modal/jsonVarRefs.ts`

**Changes**:
- Replace `@variable_name` placeholder system with `${{ vars.x }}` / `${{ env.x }}`
- Update `replaceVarRefs()` to handle `${{ }}` syntax inside JSON
- Since `${{ vars.x }}` is a valid JSON string value (unlike bare `@var`), the placeholder system may be simplified or removed entirely

---

### WP-F6: Template Policies — Update Hardcoded References

**Files**: `ide/src/components/PreconditionsPanel/templatePolicies.ts`

**Changes**:
- Replace all `"@consumer_bpn"` → `"${{ env.consumer_bpn }}"`
- Replace all `"@asset_id"` → `"${{ vars.asset_id }}"`
- Replace all `"@provider_backend_url"` → `"${{ env.provider_backend_url }}"`
- Replace `"@contract_def_id"`, `"@access_policy_id"`, `"@usage_policy_id"` → appropriate scoped refs

---

### WP-F7: Graph View — Update Variable Detection

**Files**:
- `ide/src/sync/graph/graphHelpers.ts`
- `ide/src/sync/graph/modelToGraph.ts`

**Changes**:
- `collectVariableRefs()`: remove `@(\w+)` and `\$\{([^}]+)\}` from regex, keep only `${{ vars.x }}` and `${{ env.x }}`
- `modelToGraph()`: read `returns` instead of `store_in_memory`
- Update node data: `storesMemory` → `hasReturns` (or similar)

---

### WP-F8: Validator — Simplify Variable Reference Detection

**Files**: `ide/src/models/validator.ts`

**Changes**:
- Remove `@(\w+)` and `\$\{([^}]+)\}` regex branches
- Keep only `${{ vars.x }}` and `${{ env.x }}` pattern matching
- Add env scope validation: `${{ env.x }}` must exist in environment store
- Add ambiguity detection per ADR-0010 §3.2 rules 3-4

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
- Services section: emit under `env.services:` key

---

### WP-F10: Serialization Helpers — Remove Legacy Parsing

**Files**: `ide/src/components/BlockEditor/serialization/helpers.ts`

**Changes**:
- `readValueBlockAsString()`: clarify `vars_ref` → `${{ vars.x }}`, `env_ref` → `${{ env.x }}`
- `createValueBlockFromString()`: remove `@` pattern matching, remove `{{x}}`/`${x}` fallbacks
- Only parse `${{ vars.x }}` and `${{ env.x }}` syntax

---

### WP-F11: Toolbox Builder — Update Variable Category

**Files**: `ide/src/components/BlockEditor/toolbox/toolboxBuilder.ts`

**Changes**:
- Update variable category to show `vars_ref` blocks (from step outputs) and `env_ref` blocks (from env store)
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
  VARS_REF = re.compile(r"\$\{\{\s*vars\.(\w+)\s*\}\}")
  ENV_REF = re.compile(r"\$\{\{\s*env\.(\w+)\s*\}\}")
  QUALIFIED_VARS_REF = re.compile(r"\$\{\{\s*vars\.(\w+)\.returns\.(\w+)\s*\}\}")
  ANY_VAR_REF = re.compile(r"\$\{\{\s*(?:vars|env)\.[\w.]+\s*\}\}")
  ```
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
- `resolve_str()`: replace `@var` + `${var}` logic with `${{ vars.x }}` and `${{ env.x }}` parsing
- Add scope-aware resolution:
  - `${{ vars.x }}` → lookup in `context._step_variables` (populated from `returns`)
  - `${{ env.x }}` → lookup in `context._env_variables` (populated from TCK manifest)
- Support qualified refs: `${{ vars.step_id.returns.x }}`
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
    # Whole-string ${{ vars.x }} → return raw typed value
    m = patterns.VARS_REF.fullmatch(value.strip())
    if m:
        return context.get_step_variable(m.group(1), value)
    # Whole-string ${{ env.x }} → return raw typed value
    m = patterns.ENV_REF.fullmatch(value.strip())
    if m:
        return context.get_env_variable(m.group(1), value)
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
- Add `set_step_variable(name, value, step_id)` and `get_step_variable(name)`
- Add `set_env_variable(name, value)` and `get_env_variable(name)`
- Support qualified lookup: `get_step_variable("step_id.returns.x")`

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
- Update TCK manifest parsing: `env.variables`, `env.services`, `env.schemas`

---

### WP-B7: Compiler Validator — New Resolution Rules

**Files**: `src/tractusx_testlab/compiler/validator.py`

**Changes**:
- Replace `_VAR_REF = re.compile(r"\$\{(\w+)}")` with scoped patterns
- `_check_var_refs()`: detect `${{ vars.x }}` and `${{ env.x }}` separately
- For `vars`: check if variable name exists in any preceding step's `returns`
- For `env`: check if variable name exists in TCK manifest `env.variables`
- Implement ambiguity detection (ADR-0010 §3.2 rule 4)
- Add field ordering validation: `id` must be first, `uses` must be second

---

### WP-B8: Mock Server Step — Update Variable Resolution

**Files**: `src/tractusx_testlab/steps/server/mock.py`

**Changes**:
- `_resolve_variables()`: replace `@` prefix check with `${{ vars.x }}` / `${{ env.x }}` pattern
- Use the shared resolver from `player/loading/resolver.py` instead of local implementation

---

### WP-B9: Assertion Step — Update Variable Resolution

**Files**: `src/tractusx_testlab/steps/assertions.py`

**Changes**:
- Update inline `@var` resolution to use `${{ vars.x }}` pattern
- Use shared resolver

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
| `tests/test_compiler.py` | Update variable validation expectations |
| `tests/test_mocks.py` | Replace `@var` in test data with `${{ vars.x }}` |
| `tests/test_step_executors.py` | Update params using variable refs |
| `tests/test_runner.py` | Update `store_step_outputs` expectations |
| `tests/test_models.py` | Update `StepDefinition` construction |
| `tests/factories.py` | Update factory methods for new model fields |
| `tests/fixtures/` | Update YAML fixture files |
| `tests/test_precondition_steps.py` | Update store_in_memory references |
| `tests/test_precondition_steps_policy_contract.py` | Same |

### 6.2 New Tests to Add

| Test | Purpose |
|------|---------|
| `test_vars_ref_resolution.py` | `${{ vars.x }}` resolves from preceding step returns |
| `test_env_ref_resolution.py` | `${{ env.x }}` resolves from manifest |
| `test_qualified_vars_ref.py` | `${{ vars.step_id.returns.x }}` resolves correctly |
| `test_ambiguity_detection.py` | Compiler rejects ambiguous flat vars refs |
| `test_scope_isolation.py` | vars and env scopes don't leak into each other |

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
| **Qualified ref complexity** — `${{ vars.step_id.returns.x }}` adds parsing complexity | Low | Qualified refs are optional — flat refs are the default. Only needed for disambiguation. |
| **JSON-LD `@id` false positives** — test data contains `"@id"` (JSON-LD) that looks like legacy vars | Low | Post-migration grep will not confuse these — they're inside quoted JSON strings, not in param positions. |
| **Environment variable naming** — existing env vars referenced as `@provider_url` need scope assignment | Medium | All variables currently in `variables:` block become `env` scope. All `store_in_memory` outputs become `vars` scope. |

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
3. Convert `@variable_name` → `${{ vars.variable_name }}` or `${{ env.variable_name }}` based on context
4. Add `id:` field to steps (auto-generate from step type)
5. Validate the result with the v2 compiler
6. Write converted files (with `--dry-run` option)

This ensures existing TCK test suites can be mechanically upgraded.
