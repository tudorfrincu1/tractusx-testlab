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

# Sync Layer

The sync layer converts data between three representations: **YAML text**, **TypeScript model**, and **React Flow graph**. These modules live in `src/sync/`.

## YAML → Model

**File:** `src/sync/yamlToModel.ts`

**Export:** `yamlToModel(yaml: string): ParseResult`

```typescript
type ParseResult =
  | { ok: true; model: TestLabDocument }
  | { ok: false; error: string };
```

### Parsing logic

1. Parse YAML string with `js-yaml.load()`
2. Auto-detect `kind` if missing:
   - If the raw object has a `tests` array → `"tck"`
   - Otherwise → `"test"`
3. Map raw fields to typed model:
   - `ScriptDefinition`: name, version, description, variables, services, setup, steps, teardown, listen
   - `TckDefinition`: name, version, description, author, standards, tags, variables, tests
4. Handle mixed `tests` entries:
   - Object with `test` key → `TestRef`
   - Object with `kind: "test"` → inline `ScriptDefinition`
   - String → `!include` path
5. Parse standards as shorthand strings or full objects with version
6. Return `{ ok: true, model }` or `{ ok: false, error }` on any exception

### Error handling

All exceptions are caught and returned as `{ ok: false, error: message }`. The error message is human-readable and includes the YAML parse error if applicable.

## Model → YAML

**File:** `src/sync/modelToYaml.ts`

**Export:** `modelToYaml(model: TestLabDocument): string`

### Serialization logic

1. Deep-clone the model to avoid mutations
2. Strip empty values recursively (null, undefined, empty arrays, empty objects)
3. Handle mixed `tests` entries (inline scripts, refs, strings)
4. Serialize with `js-yaml.dump()`:
   - 2-space indent
   - 120-character line width
   - No YAML refs (`noRefs: true`)
   - Custom quote rules (strings with special chars get quoted)

### Output format

```yaml
kind: test
name: my_test
version: "1.0"
description: A test description

variables:
  asset_url:
    type: str
    default: "https://example.com"

services:
  - name: saturn
    type: edc_connector_saturn
    config:
      base_url: "https://saturn.local"

steps:
  - type: create_asset
    name: Create Asset
    params:
      base_url: "@asset_url"
    store_in_memory:
      asset_id: "$"
    validate:
      - output: asset_id
        not_null: true
```

## Model → Graph

**File:** `src/sync/modelToGraph.ts`

**Export:** `modelToGraph(model: TestLabDocument, mode: GraphMode): GraphData`

```typescript
interface GraphData {
  nodes: Node[];
  edges: Edge[];
}
```

### Graph modes

#### Execution flow

Linear step-by-step visualization with phase groupings.

**Nodes created:**

| Node type | Description |
|-----------|-------------|
| `start` | Green entry point |
| `phase` | Semi-transparent group label (Setup, Steps, Teardown) |
| `step` | Color-coded step block |
| `end` | Red exit point |

**Edges:**

- Sequential: step → next step (grey solid lines)
- Phase boundaries: phase → first step, last step → next phase
- Auto-cleanup hint: dashed animated edge if test has no explicit teardown

**Step node data:**

```typescript
{
  label: string,          // Step name
  stepType: string,       // Category key for color
  color: string,          // Hex from theme
  hasAssertions: boolean, // Has validate[] entries
  storesMemory: boolean,  // Has store_in_memory
  conditional: boolean,   // Has if: condition
  serviceName?: string    // Service reference
}
```

#### Data flow

Extends the execution flow with service and variable dependency nodes.

**Additional nodes:**

| Node type | Description |
|-----------|-------------|
| `service` | Teal box — each configured service |
| `variable` | Purple diamond — each memory variable |

**Additional edges:**

| Edge | Style | Label |
|------|-------|-------|
| Step → Service | Dashed | "uses" |
| Step → Variable (write) | Dotted, animated | "stores" |
| Variable → Step (read) | Dotted, animated | "reads" |

**Variable detection:**

Variables are collected from `store_in_memory` mappings in steps. Template outputs are injected via the `TEMPLATE_OUTPUTS` static map in `blockDefinitions.ts`.

### Test case graph

When the model is a `TckDefinition` without inline tests, a summary graph is built showing:

- `testcase` node at top
- `test` nodes for each test reference
- `include` nodes for `!include` entries
- Sequential edges showing execution order

## YAML Line Map

**File:** `src/sync/yamlLineMap.ts`

**Export:** `findStepLineRange(yaml: string, stepName: string, phase?: string): YamlLineRange | null`

```typescript
interface YamlLineRange {
  startLine: number;  // 1-based, inclusive
  endLine: number;    // 1-based, inclusive
}
```

### Purpose

Maps a step name to its line range in the YAML text. Used by the Monaco editor to highlight the YAML lines corresponding to the selected Blockly block.

### Algorithm

1. Scan the YAML text line by line
2. Identify `setup:`, `steps:`, `teardown:` section headers (by indentation)
3. Within each section, find list items (`- type: ...`)
4. Match items by their `name:` field value
5. Determine the item's line range (start = `- type:` line, end = line before next item or section)
6. Return 1-based inclusive line range

If `phase` is specified (e.g., `"setup"`), only that section is searched. Otherwise all sections are scanned.

## Theme

**File:** `src/theme/tractusxTheme.ts`

**Exports:** `theme`, `stepCategoryMap`, `getStepColor()`

### Design tokens

The `theme` object centralizes all colors and sizing used across the IDE:

```typescript
theme.colors.primary      // "#FFD700" (gold)
theme.colors.bg            // "#1a1a1a" (main background)
theme.colors.surface       // "#2a2a2a" (card/panel background)
theme.colors.text          // "#e0e0e0" (default text)
theme.colors.textMuted     // "#999999" (secondary text)
theme.colors.border        // "#404040"
theme.colors.error         // "#ff6b6b"
theme.colors.warning       // "#ffa726"
theme.colors.success       // "#66bb6a"
```

### Step colors

```typescript
theme.stepColors.mock       // "#475569" (slate)
theme.stepColors.edc        // "#1E40AF" (blue)
theme.stepColors.dtr        // "#065F46" (green)
theme.stepColors.discovery  // "#7C2D12" (orange)
theme.stepColors.flow       // "#6D28D9" (purple)
theme.stepColors.assert     // "#9F1239" (red)
theme.stepColors.data       // "#374151" (gray)
theme.stepColors.app        // "#4338CA" (indigo)
```

### Graph tokens

```typescript
theme.graph.nodeBg          // "#262626"
theme.graph.nodeBorder      // "#3a3a3a"
theme.graph.nodeRadius      // 10
theme.graph.edgeColor       // "#4a4a4a"
```

### Step category mapping

`stepCategoryMap` maps step types to category keys:

```typescript
stepCategoryMap["create_asset"] = "edc"
stepCategoryMap["mock_endpoint"] = "mock"
stepCategoryMap["catalog_negotiation"] = "edc"
// etc.
```

`getStepColor(stepType)` looks up the category and returns the corresponding color from `theme.stepColors`.
