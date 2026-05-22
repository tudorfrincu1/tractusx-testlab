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

# ADR-0009: Typed Variable Class System

## Status

Accepted

## Date

2026-05-19

## Context

Blocks in the TestLab IDE produce output variables that downstream blocks consume as inputs. Currently, input dropdowns display **all** available variables in the workspace with no type filtering. Users must memorize which variable belongs to which semantic category (e.g., an EDR token vs. an asset ID vs. a policy ID). This makes test authoring error-prone, especially for non-technical certification testers who lack deep knowledge of block internals.

The auto-link system (PAT-2) partially mitigates this by pre-filling the nearest compatible output, but when users manually select a variable they still see the full unfiltered list. As the block catalog grows, the problem worsens — a workspace with 15+ steps can easily have 30+ variables in the dropdown.

### Forces

- Non-technical users are the primary audience — they cannot distinguish `agreement_id` from `negotiation_id` by name alone.
- The block catalog is JSON-driven (AD-1) — any typing system must be expressed in JSON, not in TypeScript code.
- Backward compatibility is mandatory — existing block definitions without type annotations must continue to work.
- The class taxonomy must be extensible without code changes as new blocks and protocols are added.
- The IDE must remain responsive — filtering logic runs on every dropdown open.

## Decision

We introduce a **typed variable class system** with two new optional fields in the block JSON schema:

1. **`class`** on outputs — declares the semantic type of the produced variable.
2. **`accepts`** on input params — declares which classes the input can consume.

### Schema Changes

**Output definition (adding `class`):**

```json
{
  "name": "edr_token",
  "class": "AuthToken",
  "schema": { "type": "string" },
  "description": "EDR token for dataplane authentication"
}
```

**Input param definition (adding `accepts`):**

```json
{
  "name": "edr_token",
  "type": "string",
  "required": true,
  "accepts": ["AuthToken"],
  "description": "Authentication token for the dataplane call"
}
```

### Rules

1. `class` is a PascalCase string identifier — maps directly to Python/TypeScript class names. No dots, no hierarchy. Pattern: `^[A-Z][a-zA-Z0-9]*$`.
2. `accepts` is an array of class strings. An input accepts a variable if the variable's class appears in the array.
3. If `accepts` is omitted, the input shows all variables (backward compatible).
4. If `class` is omitted on an output, the variable has **no class constraint** — it appears in all input dropdowns regardless of `accepts` filters. This is the default for outputs that don't need type routing.
5. `Uuid` class is **not** universally compatible. Inputs that should accept UUIDs must explicitly list `"Uuid"` in their `accepts` array alongside their primary class (e.g., `"accepts": ["AssetId", "Uuid"]`). This keeps the system predictable — no hidden wildcard rules.
6. New classes can be added by editing the class registry JSON — no TypeScript or Python code changes required.
7. The IDE dropdown provides a "Show all variables" toggle for advanced users who need to bypass filtering.
8. `class` is **optional** on `returns` declarations. Not every output needs a class. Use `class` only when you want to enforce that the output is routed to specific inputs via `accepts` filtering. Outputs without `class` appear in all dropdowns and have no routing constraint. Example — a step that returns a plain description string doesn't need a class:
   ```yaml
   returns:
     description:
       type: string
   ```
   vs. a step that returns an asset ID that should only appear in asset-accepting inputs:
   ```yaml
   returns:
     asset_id:
       type: string
       class: AssetId
   ```

### Primitive Type System

The `type` field declares the structural data type of a variable. It is distinct from `class` (which declares semantic meaning). Every symbol in the symbol table and every output in an instruction's `returns` block carries a `type`.

| Type | Description | JSON Representation | Runtime Behavior |
|------|-------------|---------------------|------------------|
| `string` | Text value | `"hello"` | Stored and returned as-is |
| `integer` | Whole number | `42` | Stored and returned as-is |
| `boolean` | True/false | `true` / `false` | Stored and returned as-is |
| `object` | JSON object (serializable) | `{ "key": "value" }` | Stored and returned as-is |
| `array` | JSON array (serializable) | `[1, 2, 3]` | Stored and returned as-is |
| `class` | Live class instance (not JSON-serializable) | N/A | Created by factory (boot) or step executor (runtime). Never serialized. |

**Rules:**
- Primitives (`string`, `integer`, `boolean`) are JSON-native and serializable.
- `object` and `array` are JSON-native and serializable — they represent plain data.
- `class` indicates a live Python object (e.g., a `ConnectorService` or `MockInstance`). The IR stores only the factory recipe or step declaration; the Player instantiates it at runtime.
- The `type` field enables the Player to distinguish "pass this value as-is" from "this is a live object handle" without inspecting the value.

### Class Taxonomy

The class taxonomy is flat (no inheritance). Classes are semantic, not structural:

#### Identifiers

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `AssetId` | EDC asset identifier | `create_asset` |
| `PolicyId` | Policy definition identifier | `create_policy` |
| `ContractDefId` | Contract definition identifier | `create_contract_definition` |
| `OfferId` | Catalog offer/dataset identifier | `query_catalog` |
| `NegotiationId` | Contract negotiation process identifier | `negotiate` |
| `AgreementId` | Contract agreement identifier | `negotiate`, `pull_data_filtered` |
| `TransferId` | Transfer process identifier | `initiate_transfer` |
| `EndpointId` | Mock endpoint identifier (for wait blocks) | `mock_endpoint` |
| `ShellId` | AAS shell descriptor identifier | `register_aas_shell` |
| `SubmodelId` | Submodel descriptor identifier | `create_submodel` |
| `Uuid` | Generated UUID v4 string | `generate_uuid` |
| `Bpn` | Business Partner Number (BPNL/BPNS/BPNA) | environment/config |
| `Did` | Decentralized Identifier (DID) | preconditions/config |

#### URLs and Endpoints

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `Url` | Generic URL string | various |
| `DataplaneUrl` | EDC dataplane public API endpoint URL | `pull_data_filtered`, `initiate_transfer` |

#### Authentication

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `AuthToken` | Authentication/authorization token (e.g., EDR) | `pull_data_filtered`, `initiate_transfer` |

#### HTTP Response Data

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `StatusCode` | HTTP response status code | `http_call`, connector steps |
| `ResponseBody` | HTTP response body (JSON object) | `http_call`, connector steps |
| `ResponseHeaders` | HTTP response headers (key-value pairs) | `http_call`, connector steps |

#### Structured Data

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `Catalog` | Full catalog response object | `query_catalog` |
| `Datasets` | Array of catalog datasets/offers | `query_catalog` |
| `ShellDescriptor` | Full AAS shell descriptor object | `get_shell` |
| `ShellIds` | Array of matching shell IDs | `lookup_shells` |
| `CallbackPayload` | JSON payload received from SUT callback | `mock/wait` |
| `ExtractedValue` | Value extracted via JSON path (type varies) | `extract_field` |

#### State and Enums

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `State` | Process state string (e.g., FINALIZED, STARTED) | `get_transfer_state`, `get_negotiation_state` |
| `Enum` | Enumeration value from a known set | preconditions/config |

#### Live Instances (type: class)

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `ConnectorService` | Live EDC connector service instance | service factory (boot time) |
| `MockInstance` | Live mock server endpoint instance | `mock/api` step executor |

#### Fallback

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `String` | Generic untyped string (fallback when no class applies) | any output without explicit `class` |

> **Note:** When `class` is `null` on a symbol table entry, the variable has no semantic type constraint. It will appear in all dropdowns regardless of `accepts` filters (backward-compatible behavior). When `type` is `"class"`, the `class` field doubles as the factory registry key (see ADR-0014 §3.4.6).

### Class Naming Convention

Class identifiers use **PascalCase** — identical to their corresponding Python class names. This eliminates any mapping layer between the YAML/IR `class` field and the runtime factory registry.

| Convention | Example | Rationale |
|------------|---------|----------|
| PascalCase | `ConnectorService` | Maps directly to `class ConnectorService` in Python |
| No underscores | `MockInstance` not `Mock_Instance` | Clean, consistent, one style |
| No abbreviations | `ResponseBody` not `RespBody` | Readable by non-developers |
| Compound words | `AuthToken`, `DataplaneUrl` | Each word capitalized |

**Pattern:** `^[A-Z][a-zA-Z0-9]*$`

**Rationale:** When the Player's factory registry receives `"class": "ConnectorService"`, it can directly resolve `registry["ConnectorService"]` to the Python class without any `snake_to_pascal()` conversion. The class name in YAML IS the class name in code.

### Class Registry

The canonical class registry lives at **`ide/public/blocks/classes.json`**. Format:

```json
{
  "classes": [
    {
      "id": "AuthToken",
      "label": "Auth Token",
      "description": "Authentication or authorization token",
      "color": "#E8A838"
    }
  ]
}
```

This file serves as documentation, IDE color-coding source, and validation reference. The IDE loads it alongside `index.json` at startup.

### Composite Outputs

Blocks that produce structured objects (e.g., a data address with `.endpoint` and `.authorization`) declare **multiple named outputs**, each with its own class. The block JSON already supports an `outputs` array — each entry gets its own `class`. There is no "dot-path" accessor; the block must explicitly decompose its result into individually typed outputs.

### Compiler/YAML Validation

The YAML compiler SHOULD validate class compatibility when `accepts` metadata is available. This is a **warning**, not an error — the user may intentionally pass a mismatched type for advanced use cases. The IDE filtering is the primary enforcement mechanism.

## Consequences

### Positive

- Drastically reduces user errors — dropdowns show only contextually relevant variables.
- Makes block authoring self-documenting — `accepts` declares the contract explicitly.
- Enables future features: enhanced auto-link scoring, type-aware validation markers, visual type indicators (colored variable chips).
- Zero breaking changes — both fields are optional with sensible defaults.
- Extensible without code changes — new classes are a JSON edit.

### Negative

- Every block JSON file in `public/blocks/` must be updated to add `class` and `accepts` fields (one-time migration effort).
- The class taxonomy must be maintained as new blocks are added — risk of inconsistency if contributors forget.
- The class registry adds one more file to keep in sync with the block catalog.

### Risks

- Over-constraining classes could make the system too rigid for edge cases. Mitigated by the "Show all" override and the explicit `uuid`/`string` escape hatches.
- Contributors may assign incorrect classes. Mitigated by CI validation that checks all outputs have a `class` from the registry and all `accepts` entries reference valid classes.

## Implementation Plan

| Step | Description | Agent |
|------|-------------|-------|
| 1 | Create `ide/public/blocks/classes.json` with the full taxonomy | `testlab-ide-master` |
| 2 | Add `class` to all output definitions in `public/blocks/` | `testlab-ide-master` |
| 3 | Add `accepts` to all input params that consume variables | `testlab-ide-master` |
| 4 | Update TypeScript types (`BlockOutput`, `BlockParam`) | `testlab-ide-master` |
| 5 | Implement `collectTypedVariables()` in the variable system | `testlab-ide-master` |
| 6 | Update `dynamicDropdown()` to filter by `accepts` | `testlab-ide-master` |
| 7 | Add "Show all" toggle to the dropdown UI | `testlab-ide-master` |
| 8 | Add compiler warning for class mismatches | `testlab-master` |
| 9 | Update documentation (block-system, block-lifecycle) | `testlab-docs-master` |
