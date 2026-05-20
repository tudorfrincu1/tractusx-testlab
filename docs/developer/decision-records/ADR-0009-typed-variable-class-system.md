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
  "class": "auth_token",
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
  "accepts": ["auth_token"],
  "description": "Authentication token for the dataplane call"
}
```

### Rules

1. `class` is a flat snake_case string identifier — no dots, no hierarchy.
2. `accepts` is an array of class strings. An input accepts a variable if the variable's class appears in the array.
3. If `accepts` is omitted, the input shows all variables (backward compatible).
4. If `class` is omitted on an output, the variable is treated as class `"string"` (backward compatible).
5. `uuid` class is **not** universally compatible. Inputs that should accept UUIDs must explicitly list `"uuid"` in their `accepts` array alongside their primary class (e.g., `"accepts": ["asset_id", "uuid"]`). This keeps the system predictable — no hidden wildcard rules.
6. New classes can be added by editing the class registry JSON — no TypeScript or Python code changes required.
7. The IDE dropdown provides a "Show all variables" toggle for advanced users who need to bypass filtering.

### Class Taxonomy

The initial taxonomy is flat (no inheritance). Classes are semantic, not structural:

| Class | Semantics | Example Producers |
|-------|-----------|-------------------|
| `auth_token` | Authentication/authorization token | `pull_data_filtered`, `initiate_transfer` |
| `dataplane_url` | EDC dataplane endpoint URL | `pull_data_filtered`, `initiate_transfer` |
| `agreement_id` | Contract agreement identifier | `negotiate`, `pull_data_filtered` |
| `asset_id` | EDC asset identifier | `create_asset` |
| `policy_id` | Policy definition identifier | `create_policy` |
| `offer_id` | Catalog offer identifier | `query_catalog` |
| `negotiation_id` | Contract negotiation identifier | `negotiate` |
| `transfer_id` | Transfer process identifier | `initiate_transfer` |
| `endpoint_id` | Mock endpoint identifier | `mock_endpoint` |
| `service_ref` | Service reference (connector, DTR) | services config |
| `bpn` | Business Partner Number | environment/config |
| `shell_id` | AAS shell descriptor ID | `register_aas_shell` |
| `submodel_id` | Submodel identifier | `create_submodel` |
| `status_code` | HTTP response status code | `http_call`, `http_call_dataplane` |
| `response_body` | HTTP response body (JSON) | `http_call`, `http_call_dataplane` |
| `uuid` | Generated UUID string | `generate_uuid` |
| `url` | Generic URL | various |
| `string` | Generic untyped string (fallback) | any output without `class` |

### Class Registry

The canonical class registry lives at **`ide/public/blocks/classes.json`**. Format:

```json
{
  "classes": [
    {
      "id": "auth_token",
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
