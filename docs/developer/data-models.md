<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# Data Models

All TypeScript types live in `src/models/schema.ts`. They mirror the Python Pydantic models in `src/tractusx_testlab/models/`.

## Core types

### TestLabDocument

Union type representing any document the editor can open:

```typescript
type TestLabDocument = ScriptDefinition | TckDefinition;
```

### ScriptDefinition (kind: "test")

An individual test script — the main authoring unit.

```typescript
interface ScriptDefinition {
  kind: "test";
  name: string;
  version?: string;
  dataspace_version?: string;
  description?: string;
  variables?: Record<string, VariableDefinition>;
  services?: ServiceDefinition[];
  setup?: Step[];                          // Pre-test steps
  steps: Step[];                           // Main test steps (required, ≥1)
  teardown?: Step[];                       // Cleanup steps
}
```

### TckDefinition (kind: "tck")

A container that groups multiple tests into an execution pipeline.

```typescript
interface TckDefinition {
  kind: "tck";
  name: string;
  version?: string;
  dataspace_version?: string;
  description?: string;
  author?: string;
  standards?: StandardRef[];
  tags?: string[];
  variables?: Record<string, VariableDefinition>;
  tests: (ScriptDefinition | TestRef | string)[];  // Mixed entries
}
```

The `tests` array can contain:

- **Inline scripts**: Full `ScriptDefinition` objects (embedded tests)
- **Test references**: `TestRef` objects pointing to other test files
- **Include strings**: File paths for `!include` directives

### StepDefinition

A single action in a test (e.g., "Create an Asset", "Wait for Callback").

```typescript
interface StepDefinition {
  type: string;                            // Step type from catalog (e.g., "create_asset")
  name: string;                            // Display name
  params: Record<string, unknown>;         // Step-specific inputs
  validate?: Assertion[];                    // Validation rules
  store_in_memory?: Record<string, string>;// { varName: JSONPath or "$" }
  on_failure?: FailurePolicy;              // "ABORT" | "CONTINUE" | "SKIP_REST"
  timeout_s?: number;
  if?: string;                             // Conditional expression
}
```

### VariableDefinition

Declares a variable with metadata for runtime resolution.

```typescript
interface VariableDefinition {
  type: string;            // "str" | "int" | "bool" | "float"
  default?: unknown;       // Default value
  runtime?: boolean;       // Prompt user at runtime
  description?: string;
}
```

Variables appear in the YAML under the `variables:` key:

```yaml
variables:
  asset_url:
    type: str
    default: "https://example.com/data"
    description: "URL of the data asset"
  timeout:
    type: int
    default: 30
    runtime: true
```

### Assertion

Validation rule applied to a step's output.

```typescript
interface Assertion {
  output: string;                          // Output name to validate
  [operator: string]: unknown;             // Operator + expected value
}
```

### TestRef

Reference to another test file.

```typescript
interface TestRef {
  test: string;                            // Test name
  with?: Record<string, unknown>;          // Variable overrides
  description?: string;
}
```

### ServiceDefinition

Configuration for an external service used by steps.

```typescript
interface ServiceDefinition {
  name: string;
  type: ServiceType;
  config: Record<string, unknown>;
  auth?: string;                           // Reference to AuthDefinition.name
}
```

### AuthDefinition

Authentication credentials.

```typescript
interface AuthDefinition {
  name: string;
  type: AuthType;                          // "oauth2" | "api_key"
  config: Record<string, unknown>;
}
```

## Enums and constants

### AssertionOperator

```typescript
type AssertionOperator =
  | "equals" | "not_equals"
  | "contains" | "not_contains"
  | "matches"                              // Regex
  | "schema"                               // JSON Schema validation
  | "not_null" | "not_empty"
  | "greater_than" | "less_than"
  | "greater_or_equal" | "less_or_equal"
  | "between";                             // [min, max] range
```

### FailurePolicy

```typescript
type FailurePolicy = "ABORT" | "CONTINUE" | "SKIP_REST";
```

### ServiceType

```typescript
type ServiceType =
  | "edc_connector_saturn" | "edc_connector_jupiter"
  | "aas"
  | "discovery_finder" | "edc_discovery" | "bpn_discovery";
```

### AuthType

```typescript
type AuthType = "oauth2" | "api_key";
```

### SdkCallMode

```typescript
type SdkCallMode = "ALLOWLIST" | "OPEN";
```

## Type guards

```typescript
isTest(doc: TestLabDocument): doc is ScriptDefinition
isTck(doc: TestLabDocument): doc is TckDefinition
isTestRef(entry: unknown): entry is TestRef
isTemplateStep(step: Step): boolean       // step.type === "template"
```

## Factory functions

```typescript
createEmptyTck(): TckDefinition
createEmptyTest(): ScriptDefinition
```

These create minimal valid documents with required fields.

## Variable syntax

Variables are referenced in YAML using the `@` prefix:

```yaml
steps:
  - type: create_asset
    name: Create Asset
    params:
      base_url: "@asset_url"
      asset_id: "@generated_id"
```

The `@variable_name` syntax is the canonical format. Legacy formats (`${var}`, `{{var}}`) are auto-converted to `@var` during import.

## store_in_memory

Steps can store their outputs in memory for use by later steps:

```yaml
steps:
  - type: create_asset
    name: Create Asset
    params:
      base_url: "https://example.com"
    store_in_memory:
      asset_id: "$"        # Store entire output as "asset_id"
      asset_url: "$.url"   # Store nested field as "asset_url"
```

In the IDE, `store_in_memory` is **auto-generated** from the block catalog's `outputs` definition. If a catalog block declares `outputs: [{ name: "asset_id" }]`, the serializer automatically adds `store_in_memory: { asset_id: "$" }` — the user never manually configures this.

---

# Validation

Real-time validation is implemented in `src/models/validator.ts`.

## API

```typescript
validate(doc: TestLabDocument): ValidationError[]
setKnownStepTypes(types: string[]): void
```

`setKnownStepTypes()` is called during block catalog loading to register valid step types.

## ValidationError

```typescript
interface ValidationError {
  path: string;              // JSON path (e.g., "steps[0].params.base_url")
  message: string;
  severity: "error" | "warning";
  line?: number;             // 1-based line number in YAML
}
```

## Validation rules

### Document level

- `name` is required
- `kind` must be `"test"` or `"tck"`

### Script (test) level

- At least one step (warning if empty)
- All services have `name`, `type`, and `config`

### Step level

- `type` is a known step type (from catalog)
- `name` is present (warning if missing)
- `on_failure` is a valid enum value (`ABORT`, `CONTINUE`, `SKIP_REST`)
- Assertions have an `output` field and a valid operator

### Variable references

- `@var_name` references are checked against defined variables (from `variables:` section and `store_in_memory` in preceding steps)
- Undefined variable references produce warnings

### Test case level

- At least one test entry (warning if empty)
- Test ref names resolve to existing tests in the project
