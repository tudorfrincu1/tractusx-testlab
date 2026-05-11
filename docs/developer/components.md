<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

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

# Components

Every React component in the IDE, organized by directory.

## Layout — `src/components/Layout/`

### TopBar.tsx

Application header bar (44px fixed height).

**Content:**

- Tractus-X logo and "TestLab IDE" title
- Current project name with dirty indicator (•)
- Active file badge showing the type and name of the open file
- **Import button**: Opens a file picker for `.yaml`, `.yml`, or `.zip` files
- **Export button**: Opens the `ExportDialog`
- **Examples dropdown**: Lists 7 bundled example projects (e.g., "Connector Ping", "DTR Ping", "Industry Core"). Clicking one calls `importExampleFolder()` which fetches the example from `public/examples/`.
- **New Project button**: Creates a blank project via `useProjectStore.createProject()`

### StatusBar.tsx

Bottom footer bar (24px fixed height).

**Displays:**

- Error count (red icon) and warning count (orange icon), or a green checkmark if no issues
- Step count (for tests) or test count (for test cases)
- Current file path: `{projectName} / {fileName}` with dirty indicator
- "Tractus-X TestLab IDE" branding text

## ProjectExplorer — `src/components/ProjectExplorer/`

### ProjectExplorer.tsx

Left sidebar file tree with drag-and-drop reordering.

**Props:** `{ onSelectFile: (file: ActiveFile) => void, onCollapse?: () => void }`

**Tree structure:**

```
📁 {projectName}          ← click opens TestCaseDashboard
├── 📄 index.yaml          ← test case file
├── 📁 tests/
│   ├── 1. test_one.yaml   ← numbered by execution order
│   ├── 2. test_two.yaml
│   └── ...
└── 📁 schemas/
    ├── my-schema.json
    └── ...
```

**Features:**

- **Drag reorder**: Tests can be dragged to reorder within `testOrder`
- **Context menus**: Right-click on any item opens `ExplorerContextMenu`
- **Dirty indicators**: Orange dot on unsaved files
- **Active file highlight**: Gold left border on the currently open file
- **Collapse**: Button hides the explorer panel

### ExplorerContextMenu.tsx

Right-click context menu with actions depending on the target type.

| Target | Available actions |
|--------|-------------------|
| Test file | Rename, Duplicate, Delete, Move Up/Down, Export YAML, View YAML |
| Test case | Export YAML, View YAML |
| Tests folder | New Test, Upload Test(s) |
| Schemas folder | Download from Tractus-X (opens SchemaDownloadDialog), Upload Schema(s) |
| Schema file | Rename, Delete, Export JSON |
| Project root | Rename Project, Export ZIP, New Project |

**Special features:**

- **Inline rename**: Shows a text input overlay for renaming files
- **YAML preview**: Opens a modal showing the serialized content
- **Upload**: Accepts `.yaml`/`.yml`/`.json` files, parses and adds to project

### ExplorerActions.tsx

Bottom action buttons in the explorer panel: "Download Schema", "New Test", "Upload".

## BlockEditor — `src/components/BlockEditor/`

### BlocklyWorkspace.tsx

The main Blockly workspace component. This is the most complex component in the IDE.

**Props:** `{ onTrashChange?: (hasItems: boolean) => void }`

**Lifecycle:**

1. **Mount**: Fetches block catalog → registers all blocks → creates Blockly workspace with dark theme
2. **Restore or build**: Checks for saved canvas state. If found, restores via `Blockly.serialization.workspaces.load()`. If not, creates root block and calls `populateWorkspaceFromModel()`.
3. **Change listener**: Debounced handlers for:
   - Model sync (150ms): `workspaceToModel()` → store
   - Canvas save (500ms): Blockly serialization → `setWorkspaceState()`
   - Toolbox refresh (300ms): `collectWorkspaceVariables()` → `buildToolbox()` → `updateToolbox()`
4. **Model sync effect**: When `lastEditSource` is `"yaml"` or `"load"`, disposes all block chains and rebuilds from model
5. **File switch**: Saves old canvas state, updates file key ref
6. **Unmount**: Saves canvas state, disposes workspace

**Key refs:**

| Ref | Purpose |
|-----|---------|
| `workspaceRef` | The `Blockly.WorkspaceSvg` instance |
| `catalogRef` | Loaded block catalog |
| `isUpdatingFromStore` | Suppresses change events during programmatic block updates |
| `pendingUpdateRef` | Debounce timer for model sync |
| `pendingCanvasSaveRef` | Debounce timer for canvas state save |
| `pendingToolboxRef` | Debounce timer for toolbox refresh |
| `activeFileKeyRef` | Current file name (for canvas state indexing) |
| `initGenerationRef` | Project generation at init time (prevents stale saves after project reload) |

### BlockEditorErrorBoundary.tsx

Error boundary wrapping BlocklyWorkspace. Class component (React requirement).

- Catches render errors from Blockly
- "Reload" button on first error (resets error state)
- "Reset Workspace" button on repeated errors (clears blocks, loads empty model)
- Tracks error frequency (2+ in 5 seconds = rapid errors)

### blockDefinitions.ts

The largest file in the IDE (~2200 lines). Contains all block registration, serialization, and toolbox logic. See [Block System](block-system.md) for full details.

### blockColors.ts

Maps block category names to hex color values. Exports `blockColors` object and `getCategoryColor()` function.

### blockSelection.ts

Exports `resolveStepName(block)` — walks up the block tree to find the nearest step block's NAME field. Used for YAML highlighting.

### FieldWrappedText.ts

Custom Blockly field for multi-line text with SVG wrapping and a modal editor popup. Extends `Blockly.FieldTextInput`.

## YamlEditor — `src/components/YamlEditor/`

### MonacoEditor.tsx

Monaco-based YAML editor with validation markers and completions.

**Props:** `{ readOnly?: boolean }`

**Features:**

- **Custom dark theme**: Tractus-X gold accents, JetBrains Mono font
- **Validation markers**: Red squiggles for errors, orange for warnings (from `useTestLabStore.errors`)
- **Completion provider**: Suggests top-level fields, step types from catalog, enum values, and snippets
- **Line highlighting**: Highlights YAML lines matching the selected Blockly block (via `yamlLineMap.ts`)
- **Debounced parsing**: 500ms delay before `setModelFromYaml()` to prevent lag while typing
- **Read-only mode**: Gray styling, disabled editing

### SchemaEditor.tsx

Read-only Monaco editor for JSON schema files. Shows syntax-highlighted JSON with the Tractus-X dark theme.

## GraphView — `src/components/GraphView/`

### DependencyGraph.tsx

React Flow visualization of test execution and data flow.

**Features:**

- **Mode toggle**: "Execution Flow" vs "Data Flow" buttons
- **Dagre layout**: Applies hierarchical layout via `layoutEngine.ts`
- **Auto-fit**: Recenters graph on model changes (200ms animation)
- **Node selection**: Click node → highlights in model
- **Mini-map and controls**: Zoom, pan, reset view

**Execution flow** shows: Start → Phase nodes (Setup/Steps/Teardown) → Step nodes → End

**Data flow** adds: Service nodes (teal, showing which steps use them), Variable nodes (purple, showing store_in_memory reads/writes)

### layoutEngine.ts

Exports `applyDagreLayout(nodes, edges, direction)`. Uses Dagre to compute hierarchical positions with 40px node spacing and 60px rank separation.

### nodeTypes.tsx

Custom React Flow node components:

| Node type | Visual | Used in |
|-----------|--------|---------|
| `step` | Color-coded box with category border | Both modes |
| `phase` | Semi-transparent label (Setup/Steps/Teardown) | Both modes |
| `start` | Green rounded terminal | Both modes |
| `end` | Red rounded terminal | Both modes |
| `service` | Teal box with ⚡ icon | Data flow |
| `variable` | Purple diamond | Data flow |
| `testcase` | Test case summary node | Test case graph |
| `test` | Test summary node | Test case graph |
| `include` | Include reference node | Test case graph |

## WelcomeScreen — `src/components/WelcomeScreen/`

### WelcomeScreen.tsx

Landing page shown when no project is loaded.

**Content:**

- Hero section: "Tractus-X TestLab" title
- Quick actions: "New Project" (primary), "Open File" (secondary)
- Examples grid (2-column): 7 bundled example projects with icons and descriptions. Each loads via `importExampleFolder()`.

## ExportDialog — `src/components/ExportDialog/`

### ExportDialog.tsx

Modal dialog for exporting project files.

**Props:** `{ onClose: () => void }`

**Layout:**

- **Left panel**: File tree showing `index.yaml`, `tests/*.yaml`, `schemas/*.json` with file sizes
- **Right panel**: Syntax-highlighted preview of the selected file
- **Export buttons**: "Export ZIP" (downloads full project), individual file export icons

Also contains its own `BlocklyWorkspace.tsx` — a lightweight read-only Blockly workspace for preview purposes.

## ServiceDialog — `src/components/ServiceDialog/`

### ServiceDialog.tsx

Modal dialog for configuring services (connectors, registries, discovery) and authentication.

**Props:** `{ onClose: () => void }`

**Layout:**

- **Left panel**: List of configured services with type labels, edit/delete buttons
- **Right panel**: Edit form rendered from `SERVICE_SCHEMAS` / `AUTH_SCHEMAS` field definitions

**Form rendering:** Each service type has a schema defining its fields (label, type, required, secret). The dialog iterates over the schema and renders appropriate inputs. Secret fields are masked.

## TestCaseDashboard — `src/components/TestCaseDashboard/`

Shown when the test case file (`index.yaml`) is the active file. Provides an overview of the entire project.

### TestCaseDashboard.tsx

Main dashboard component with two tabs: **Pipeline** and **Data Flow**.

**Props:** `{ onSelectFile: (file: ActiveFile) => void }`

### MetadataSection.tsx

Editable metadata fields: name, version, dataspace version, author, description, standards (chip input with version parsing), tags (chip input).

### TestPipelineTable.tsx

Ordered list of tests with:

- Sequence numbers in gold circles
- Vertical gold connector line between tests
- Drag-to-reorder
- Actions: Edit (navigates to test), Duplicate, Delete
- Info: test name, description, step count, services used
- "Add Test" button at the bottom

### VariablesOverview.tsx

Table of all aggregated project variables:

- Name, Type, Default (editable inline), Runtime indicator
- "Used by" column showing which tests reference each variable
- Auto-imports from test-level variables

### DataFlowView.tsx

Visualizes variable flow between tests:

- Shared variables banner at top
- Flow nodes for each test showing inputs, outputs, services
- Edge connectors showing variable passing between tests

### dataFlowBuilder.ts

Computes the data flow graph. Exports `buildDataFlow()`.

**Algorithm:**

1. Scans each test for variables (inputs), export_variable steps (outputs), store_in_memory mappings, and services
2. Builds a producer map: `{ varName → testName }`
3. Creates edges from producers to consumers

### ChipFields.tsx

Reusable chip input components:

- `StandardsField`: For standards with ID + version (e.g., "CX-0002 – v1.0.0")
- `TagField`: Simple tag input with customizable chip colors

### FormFields.tsx

Shared form building blocks:

- `SectionCard`: Container with title header
- `InlineField`: Click-to-edit text/textarea
- `SelectField`: Dropdown with options
- `VersionField`: Semantic version input with validation

## SchemaDownloadDialog — `src/components/SchemaDownloadDialog/`

### SchemaDownloadDialog.tsx

Multi-step dialog for downloading semantic schemas from the `eclipse-tractusx/sldt-semantic-models` GitHub repository.

**Steps:**

1. **Model selection**: Search and filter `io.catenax.*` models from GitHub API
2. **Version selection**: List available versions for the chosen model
3. **Download**: Fetch the schema JSON and add to project

**Error handling:** Shows a message if GitHub API rate limit is exceeded (60 requests/hour for unauthenticated requests).
