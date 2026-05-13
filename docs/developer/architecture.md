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

# Architecture

## Overview

The TestLab IDE is a single-page React application that lets users visually author dataspace integration tests using a block-based editor (Blockly). The application has three synchronized representations of the same test data:

1. **Block workspace** — Drag-and-drop visual editor (primary editing surface)
2. **YAML editor** — Text-based editing with Monaco Editor
3. **Dependency graph** — Read-only React Flow visualization

All three derive from a shared in-memory model (`TestLabDocument`) managed via Zustand.

## System diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser Window                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Project   │  │ Block Workspace  │  │ YAML Editor (Monaco) │  │
│  │ Explorer  │  │ (Blockly)        │  │                      │  │
│  │           │  │                  │  │  or                  │  │
│  │ File tree │  │  drag/connect    │  │  Dependency Graph    │  │
│  │ + context │  │  blocks          │  │  (React Flow)        │  │
│  │   menus   │  │                  │  │                      │  │
│  └─────┬─────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│        │                 │                        │              │
│        │        workspaceToModel()        yamlToModel()          │
│        │                 │                        │              │
│        │                 ▼                        ▼              │
│        │    ┌────────────────────────────────┐                   │
│        │    │   useTestLabStore (Zustand)     │                  │
│        │    │                                │                   │
│        │    │   model: TestLabDocument        │                  │
│        │    │   yaml: string                 │                   │
│        │    │   errors: ValidationError[]     │                  │
│        │    │   lastEditSource: "blocks"      │                  │
│        │    │         | "yaml" | "load"       │                  │
│        │    └────────────┬───────────────────┘                   │
│        │                 │                                       │
│        │          onModelChange()                                │
│        │                 │                                       │
│        │                 ▼                                       │
│        │    ┌────────────────────────────────┐                   │
│        ├───▶│   useProjectStore (Zustand)    │                   │
│             │                                │                   │
│             │   tests: Map<name, Script>     │                   │
│             │   tck: TckDefinition  │                  │
│             │   schemas: Map<name, Schema>    │                  │
│             │   activeFile: ActiveFile        │                  │
│             │   workspaceStates: per-file     │                  │
│             └────────────┬───────────────────┘                   │
│                          │                                       │
│                   localStorage                                   │
│                  (auto-save 1s)                                  │
└──────────────────────────────────────────────────────────────────┘
```

## The sync loop

The most important mechanism to understand is the **bidirectional sync loop** between Blockly and YAML. Without proper guarding, changes from one side would trigger the other side to update, creating an infinite loop. The `lastEditSource` field prevents this.

### Blocks → Model → YAML

```
User drags block
  → Blockly fires change event
  → debounced 150ms
  → workspaceToModel(Blockly, ws, catalog) → TestLabDocument
  → useTestLabStore.setModelFromBlocks(model)
    → sets lastEditSource = "blocks"
    → validate(model)
    → modelToYaml(model) → yaml string
    → onModelChange callback → useProjectStore.updateTest()
```

### YAML → Model → Blocks

```
User types in Monaco
  → debounced 500ms
  → useTestLabStore.setModelFromYaml(yaml)
    → yamlToModel(yaml) → TestLabDocument
    → sets lastEditSource = "yaml"
    → validate(model)
    → onModelChange callback → useProjectStore.updateTest()
  → BlocklyWorkspace model-sync effect fires (because lastEditSource === "yaml")
    → disposes existing block chains (SETUP, STEPS, TEARDOWN)
    → populateWorkspaceFromModel(ws, root, model, catalog)
    → refreshes dropdown fields
```

### File switch (click in ProjectExplorer)

```
User clicks different file in explorer
  → useProjectStore.setActiveFile(file)
  → BlocklyWorkspace file-switch effect:
    → saves current workspace state under old file name
    → updates activeFileKeyRef
  → App.tsx loads new model via useTestLabStore.loadModel()
    → sets lastEditSource = "load"
  → BlocklyWorkspace model-sync effect fires (because lastEditSource === "load")
    → disposes all chains (SETUP, STEPS, TEARDOWN)
    → populateWorkspaceFromModel() rebuilds blocks from new model
    → refreshDropdownFields() ensures variable dropdowns show correct values
```

### Loop prevention

The `lastEditSource` field is the key guard:

| `lastEditSource` | Blocks react? | YAML reacts? |
|---|---|---|
| `"blocks"` | No (it was the source) | Yes, updates YAML text |
| `"yaml"` | Yes, rebuilds blocks | No (it was the source) |
| `"load"` | Yes, rebuilds blocks | Yes, updates YAML text |
| `"none"` | No | No |

Additionally, `isUpdatingFromStore` ref in BlocklyWorkspace suppresses change events while programmatically modifying blocks, preventing spurious model updates during population.

## Panel layout

```
┌──────────────────────────────────────────────────────┐
│  TopBar (44px fixed)                                 │
│  Logo | Project Name | Import | Export | Examples    │
├────────┬─────────────────────────┬───────────────────┤
│Explorer│  Center Panel           │  Right Panel      │
│(resize │  (BlocklyWorkspace      │  (YamlEditor      │
│ 160-   │   or SchemaEditor       │   or Graph        │
│ 500px) │   or TckDashboard) │   or hidden)      │
│        │                         │                   │
├────────┴─────────────────────────┴───────────────────┤
│  StatusBar (24px fixed)                              │
│  Errors: 0 | Warnings: 0 | Steps: 5 | File: test.y  │
└──────────────────────────────────────────────────────┘
```

The center panel content depends on the active file type:

| Active file type | Center panel | Right panel options |
|---|---|---|
| `test` | BlocklyWorkspace | YAML Editor, Dependency Graph |
| `tck` | TckDashboard | YAML Editor |
| `schema` | SchemaEditor (read-only JSON) | Hidden |
| None | WelcomeScreen | Hidden |

## Canvas state persistence

Each file gets its own Blockly canvas state (block positions, detached blocks, zoom level). When switching files:

1. The current canvas is serialized via `Blockly.serialization.workspaces.save()` and stored in `useProjectStore.workspaceStates[fileName]`.
2. On return to that file, the saved state is restored via `Blockly.serialization.workspaces.load()`, preserving exact block positions.
3. After restore, `refreshDropdownFields()` runs to ensure all dynamic dropdowns (variables, services, schemas) show current values.

If no saved state exists (first time opening a file), the workspace is built from the model via `populateWorkspaceFromModel()`.

## Project persistence

The entire project (TCK, all tests, schemas, test order) is serialized to `localStorage` under the key `"testlab-project"`. Auto-save runs on a 1-second debounce after any model change.

The project can also be exported as a ZIP file with this structure:

```
{projectName}/
├── index.yaml              ← Test case definition
├── tests/
│   ├── test_one.yaml
│   └── test_two.yaml
└── schemas/
    └── my-schema.json
```
