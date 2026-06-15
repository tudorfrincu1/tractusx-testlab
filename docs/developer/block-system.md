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

# Block System

The visual editor is built on [Blockly 12](https://developers.google.com/blockly). This page covers the block catalog, how blocks are registered, how the toolbox is built, and how blocks serialize to/from the YAML model.

## Block catalog

Block definitions are **not hardcoded**. They live as JSON files under `ide/public/blocks/`, organized by category.

### Manifest: `public/blocks/index.json`

```json
{
  "version": "3.0",
  "categories": [
    {
      "name": "Mock",
      "description": "Mock HTTP endpoints for testing",
      "blocks": ["mock/mock_endpoint.json", "mock/mock_dtr.json"]
    },
    {
      "name": "EDC Connector",
      "service_type": "edc_connector",
      "blocks": ["edc-connector/create_asset.json", ...]
    },
    ...
  ]
}
```

Each category has:

- `name` — Display label in the toolbox
- `description` — Tooltip text
- `service_type` — (optional) If set, category only appears when a matching service is configured
- `blocks` — Array of paths relative to `public/blocks/`

### Block JSON format

Each block file (e.g., `edc-connector/create_asset.json`) defines one step type:

```json
{
  "type": "create_asset",
  "label": "Create an Asset",
  "description": "Creates a new EDC asset...",
  "params": [
    {
      "name": "service",
      "type": "service_ref",
      "required": true,
      "description": "EDC connector service"
    },
    {
      "name": "asset_id",
      "type": "string",
      "required": false,
      "description": "Asset ID (auto-generated if omitted)"
    },
    {
      "name": "base_url",
      "type": "string",
      "required": true,
      "description": "Data source base URL"
    }
  ],
  "outputs": [
    { "name": "asset_id", "description": "The created asset's ID" }
  ]
}
```

**Key fields:**

| Field | Purpose |
|-------|---------|
| `type` | Unique identifier, becomes the Blockly block type prefixed with `step_` |
| `label` | Human-readable name shown on the block |
| `params` | Input fields rendered on the block |
| `outputs` | Named outputs — auto-stored in memory at runtime via `store_in_memory` |
| `depends_on` | Block types that must precede this one (informational) |

Param types: `string`, `number`, `boolean`, `select` (with `options` array), `json`, `multiline`, `service_ref`, `dropdown`.

## Block registration

All block registration happens in `src/components/BlockEditor/blockDefinitions.ts`.

### Loading the catalog

```
loadBlockCatalog()
  → fetches public/blocks/index.json
  → for each category, fetches each block JSON in parallel
  → returns BlockCatalog (categories + blocks array)
  → cached in module-level catalogCache
```

### registerBlocks(Blockly, catalog)

Called once during workspace initialization. Registers all block types with Blockly's block registry.

**Built-in blocks** (not from catalog):

| Block type | Purpose |
|------------|---------|
| `value_string` | String literal value |
| `value_number` | Number literal value |
| `value_boolean` | Boolean literal value |
| `variable_get` | Variable reference (`@var_name`) |
| `test_root` | Root block for tests (undeletable) — has SETUP, STEPS, TEARDOWN inputs |
| `tck_root` | Root block for TCKs (undeletable) — has TESTS input |
| `test_ref` | Reference to another test (with optional `with:` overrides) |
| `variable_def` | Variable declaration (name, type, default, runtime, description) |
| `export_variable` | Export a variable in teardown |
| `import_variable` | Import a variable from another test file |
| `step_template` | Template step with custom outputs |
| `schema_import` | Import a JSON schema |
| `depends_on_entry` | Dependency entry |
| `output_entry` | Output declaration entry |
| `auth_oauth2` | OAuth2 authentication block |
| `auth_api_key` | API key authentication block |
| Assertion blocks | `assert_equals`, `assert_not_equals`, `assert_contains`, `assert_matches`, `assert_schema`, `assert_compare`, `assert_between`, `assert_not_null`, `assert_not_empty` |

**Catalog-driven blocks:**

For each block in the catalog, a `step_{type}` block is registered. The block shape is generated from the JSON definition:

- `NAME` field: Step name (text input, defaults to the block's `label`)
- One input per param: value input accepting `value_string`, `value_number`, `value_boolean`, or `variable_get` blocks
- `EXPECT` statement input: Chain of assertion blocks (only if the block has `outputs`)
- Color: Derived from the block's category via `blockColors.ts`

**No output fields are rendered on step blocks.** Outputs are auto-stored in memory at serialization time (see [Serialization](#serialization)).

### Custom field: FieldWrappedText

`src/components/BlockEditor/FieldWrappedText.ts` is a custom Blockly field that renders multi-line text with wrapping. Used for long text inputs (descriptions, JSON bodies). Features:

- SVG multi-line rendering (max 3 visible lines, 320px width)
- Click opens a modal textarea editor
- Ctrl/Cmd+Enter saves, Escape cancels

## Dynamic dropdowns

Several blocks have dropdown menus whose options depend on workspace state. These are implemented as Blockly `FieldDropdown` with a function generator.

### dynamicDropdown(provider)

A wrapper function in `blockDefinitions.ts` that:

1. Calls the `provider()` function to get current options
2. Preserves the current field value in the options list (even if the provider doesn't include it)
3. Returns `[["(no items)", "__NONE__"]]` if no options are available

This prevents Blockly from resetting a dropdown value to the first option when the options list changes.

### Dropdown providers

| Provider | Block | What it collects |
|----------|-------|-----------------|
| `collectMockEndpointIds()` | Assertion blocks | Mock block IDs from workspace |
| `collectServiceRefs(serviceType)` | EDC/DTR/Discovery blocks | Service names from `useServiceStore`, filtered by type |
| `collectSchemaPaths()` | `schema_import` | Schema names from `useProjectStore.schemas` as `../schemas/{name}.json` |
| `collectTestFilePaths()` | `import_variable` | Other test names from `useProjectStore.tests` as `tests/{name}.yaml` |
| `collectExportedVariables(testName)` | `import_variable` | Scans the selected test's teardown for `export_variable` steps |
| `collectWorkspaceVariables(ws)` | `export_variable`, `variable_get` | All variable names available in the workspace |

### collectWorkspaceVariables(ws)

This is the most complex provider. It aggregates variables from multiple sources:

1. **Step outputs** — Reads `store_in_memory` keys from step blocks in the workspace
2. **Template outputs** — Looks up `TEMPLATE_OUTPUTS` static map for known step types (e.g., `catalog-negotiation` → `[contract_agreement_id, data_address, edr_token]`)
3. **import_variable blocks** — Reads `OUTPUT_VAR` field from import blocks
4. **Test-case variables** — Reads from `useProjectStore.getState().tck.variables`
5. **Project store scripts** — Scans the `tests` Map for `store_in_memory` keys, template outputs, and `import_variable` targets across all tests (via `collectFromSteps` helper)
6. **variable_get blocks** — Reads referenced variable names to keep them in the dropdown even if the source isn't visible

### Dropdown refresh

When the workspace changes structurally (blocks added/removed), the toolbox is rebuilt after a 300ms debounce. This refreshes the variable list in toolbox fly-outs.

After loading blocks from model (via `populateWorkspaceFromModel`), `refreshDropdownFields(ws)` explicitly calls `getOptions(true)` on every dropdown field and updates `selectedOption_` to match the stored value. This ensures dropdowns show the correct label after file switches.

## Toolbox

`buildToolbox(catalog, modelKind, variables)` generates a Blockly toolbox definition.

### For test mode (`kind: "test"`)

The toolbox contains these categories (in order):

1. **Service categories** — One per catalog category that has `service_type` matching a configured service (e.g., "EDC Connector" only shows if an EDC connector service is configured). Within each, one flyout block per catalog block in the category.
2. **Template** — `step_template` block
3. **Auth** — `auth_oauth2`, `auth_api_key` blocks
4. **Variables** — One pre-filled `variable_get` block per known variable
5. **Assertions** — All assertion blocks
6. **Values** — `value_string`, `value_number`, `value_boolean`
7. **Mock** — Mock endpoint blocks (always visible, no service_type requirement)
8. **Wait** — Wait blocks
9. **Function** — Data function blocks
10. **Flow** — Flow control blocks
11. **JSON** — JSON pair blocks
12. **Import/Export** — `import_variable`, `export_variable`, `schema_import`

### For tck mode (`kind: "tck"`)

A simplified toolbox:

1. **Tests** — `test_ref` blocks (one pre-filled per existing test in project)
2. **Auth** — Authentication blocks
3. **Service categories** — Same as test mode

## Serialization

### Workspace → Model (`workspaceToModel`)

Traverses the Blockly workspace and produces a `TestLabDocument`:

1. Finds the root block (`test_root` or `tck_root`)
2. Reads metadata fields (NAME, VERSION, DESCRIPTION)
3. For each statement chain (SETUP, STEPS, TEARDOWN):
   - Walks the block chain
   - For each step block, calls `blockToStep()` which:
     - Reads the step `type` (strips `step_` prefix)
     - Reads the `NAME` field
     - Collects all param value inputs into `params`
     - Collects assertion chain from `EXPECT` input
     - **Auto-generates `store_in_memory`** from catalog outputs: for each output defined in the catalog, creates `{ output_name: "$" }` (identity mapping)
   - Special handling for `export_variable`, `import_variable`, `schema_import`, `step_template`
4. Loads services from `useServiceStore` (services are not blocks)

!!! note "Variables are auto-generated"
    Variables are **not** rendered as blocks on the root block. They are derived automatically from the `store_in_memory` mappings of step blocks and from the project’s tck-level `variables:` section. The `variable_def` block type still exists for standalone use but is no longer attached to root blocks.

### Model → Workspace (`populateWorkspaceFromModel`)

Rebuilds blocks from a model:

1. Delegates to `populateTest()` or `populateTck()` based on model kind
2. For each step in setup/steps/teardown:
   - Creates the appropriate `step_{type}` block
   - Sets field values from params
   - Creates value blocks (string/number/boolean/variable_get) and connects them
   - Attaches assertion chain if `validate` is present
3. Renders all blocks
4. Calls `refreshDropdownFields()` to update dynamic dropdown values

!!! note "Variable blocks are not populated"
    Variables from the model’s `variables:` section are **not** materialized as `variable_def` blocks on root blocks. They are collected from the project store and step outputs instead.

### setDropdownValue(block, fieldName, value)

A utility that sets a dropdown field value while bypassing Blockly's validation. This is necessary because during population, the dropdown options may not yet include the target value. The function:

1. Gets the field
2. Calls `getOptions(true)` to force refresh
3. Sets `selectedOption_` directly
4. Calls `setValue(value)` or falls back to `value_` assignment

## Block colors

`src/components/BlockEditor/blockColors.ts` maps category names to hex colors:

| Category | Color | Hex |
|----------|-------|-----|
| Root | Dark slate | `#1E293B` |
| Variables | Purple | `#5B21B6` |
| Assertions | Red | `#BE123C` |
| Auth | Violet | `#7C3AED` |
| Test ref | Blue | `#1D4ED8` |
| JSON | Gray | `#374151` |
| Mock | Slate | `#475569` |
| Wait | Amber | `#92400E` |
| Function | Gray | `#374151` |
| Flow | Purple | `#6D28D9` |
| EDC Connector | Blue | `#1E40AF` |
| DTR | Green | `#065F46` |
| Discovery | Orange | `#7C2D12` |
| HTTP | Teal | `#115E59` |
| Notification | Indigo | `#4338CA` |
| Validation | Emerald | `#065F46` |

`getCategoryColor(categoryName)` returns the hex color for a category, with `#374151` as fallback.

## Block selection tracking

`src/components/BlockEditor/blockSelection.ts` exports `resolveStepName(block)`:

- If the block is a step block (`type.startsWith("step_")`), returns its NAME field
- Otherwise walks up the parent chain to find the nearest step block
- Used by BlocklyWorkspace to emit `selectStep(stepName)` when a block is clicked, which triggers YAML line highlighting in the Monaco editor

## Error boundary

`src/components/BlockEditor/BlockEditorErrorBoundary.tsx` is a React class component (the only class component in the codebase — required by React's Error Boundary API).

- Catches Blockly rendering errors
- Shows a "Reload" button for the first error
- Shows a "Reset Workspace" button if errors recur rapidly (2+ in 5 seconds)
- Reset clears all blocks and loads an empty workspace
