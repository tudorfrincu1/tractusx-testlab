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

# State Management

The IDE uses three **Zustand** stores. Each has a single responsibility and they communicate via callbacks and direct reads.

## Store overview

| Store | File | Purpose |
|-------|------|---------|
| `useTestLabStore` | `src/store/useTestLabStore.ts` | Active editor state (current model, YAML, errors) |
| `useProjectStore` | `src/store/useProjectStore.ts` | Project structure (all tests, schemas, file tree) |
| `useServiceStore` | `src/store/useServiceStore.ts` | Service and authentication configuration |

## useTestLabStore

Holds the **currently open document** in the editor. Only one document is active at a time.

### State properties

| Property | Type | Description |
|----------|------|-------------|
| `model` | `TestLabDocument` | The active test or tck model |
| `yaml` | `string` | YAML text representation (generated from model) |
| `errors` | `ValidationError[]` | Real-time validation errors and warnings |
| `lastEditSource` | `"blocks" \| "yaml" \| "load" \| "none"` | Who changed the model last (prevents sync loops) |
| `selectedNodeId` | `string \| null` | Selected node in the dependency graph |
| `selectedStepName` | `string \| null` | Selected step name (for YAML line highlighting) |
| `graphMode` | `"execution" \| "dataflow"` | Which graph mode is active |
| `onModelChange` | `OnModelChange \| null` | Callback fired on every model change |

### Key actions

**`setModelFromBlocks(model)`** — Called by Blockly when blocks change.

- Sets `lastEditSource = "blocks"`
- Validates the model
- Converts model → YAML via `modelToYaml()`
- Fires `onModelChange(model)` callback (which updates ProjectStore)

**`setModelFromYaml(yaml)`** — Called by Monaco Editor when the user types YAML.

- Parses YAML → model via `yamlToModel()`
- Sets `lastEditSource = "yaml"`
- Validates the model
- Fires `onModelChange(model)` callback

**`loadModel(model)`** — Called when switching files or importing.

- Sets `lastEditSource = "load"` (triggers both block and YAML refresh)
- Validates and generates YAML

**`setOnModelChange(cb)`** — Wired by `App.tsx` on mount. The callback updates the active file in ProjectStore.

### How lastEditSource prevents loops

When Blockly changes blocks:

1. `setModelFromBlocks()` sets `lastEditSource = "blocks"`
2. BlocklyWorkspace's model-sync effect checks `if (lastEditSource !== "yaml" && lastEditSource !== "load") return;` — it returns, no block rebuild
3. Monaco receives the updated YAML from the store and displays it

When the user types in YAML:

1. `setModelFromYaml()` sets `lastEditSource = "yaml"`
2. BlocklyWorkspace's model-sync effect sees `lastEditSource === "yaml"` — rebuilds blocks from model
3. During rebuild, `isUpdatingFromStore` ref is `true`, so Blockly change events are suppressed

## useProjectStore

Holds the **entire project** — all files, their content, and navigation state.

### State properties

| Property | Type | Description |
|----------|------|-------------|
| `hasProject` | `boolean` | Whether a project is loaded |
| `projectName` | `string` | Display name |
| `projectGeneration` | `number` | Incremented on project load (prevents stale workspace state saves) |
| `tck` | `TckDefinition` | The root tck document |
| `tests` | `Map<string, ScriptDefinition>` | All tests in the project, keyed by name |
| `schemas` | `Map<string, SchemaFile>` | All JSON schemas, keyed by name |
| `testOrder` | `string[]` | Execution order of tests |
| `activeFile` | `ActiveFile \| null` | Currently open file: `{ type, name }` |
| `dirty` | `Map<string, boolean>` | Unsaved change tracking per file |
| `workspaceStates` | `Record<string, object>` | Blockly canvas serialization per file |

### Key actions

**Project lifecycle:**

- `createProject(name?)` — Creates a blank project with an empty TCK
- `loadFromDocument(doc)` — Loads a single YAML file as a project
- `loadFromLocalStorage()` — Restores saved project on app startup
- `saveToLocalStorage()` — Persists project (auto-called on changes, throttled)

**Test management:**

- `addTest(name?)` — Creates a new test, auto-generates name if not provided, returns the assigned name
- `removeTest(name)` — Deletes a test from the project
- `renameTest(oldName, newName)` — Renames a test (updates tck.tests references too)
- `duplicateTest(name)` — Deep-copies a test with a suffixed name
- `reorderTest(name, newIndex)` — Moves a test in the execution order
- `updateTest(name, model)` — Replaces the model for a specific test

**Schema management:**

- `addSchema(name, content)` — Adds a JSON schema file
- `removeSchema(name)` — Deletes a schema
- `renameSchema(oldName, newName)` — Renames a schema

**Navigation:**

- `setActiveFile(file)` — Sets which file is being edited. `App.tsx` reacts and loads the model into TestLabStore.
- `getActiveModel()` — Returns the current model for the active file (test, tck, or schema).

**Aggregation queries:**

- `getTestSummaries()` — Returns `{ name, stepCount, services, description }[]` for the dashboard pipeline table
- `getAggregatedVariables()` — Merges variables from all tests into a unified list with usage info

**Canvas state:**

- `setWorkspaceState(key, state)` — Saves Blockly canvas serialization for a file
- `getWorkspaceState(key)` — Retrieves saved canvas state

**Export/import:**

- `exportZip()` — Downloads the project as a ZIP file
- `exportFile(name, type)` — Downloads a single YAML/JSON file
- `importProjectZip(file)` — Parses an uploaded ZIP and loads it

### Persistence format

Stored in `localStorage` under key `"testlab-project"` as JSON:

```json
{
  "projectName": "my-project",
  "tck": "kind: tck\nname: ...",
  "tests": { "test_one": "kind: test\nname: ...", ... },
  "schemas": { "my-schema": { "name": "my-schema", "content": "{...}" } },
  "testOrder": ["test_one", "test_two"],
  "activeFile": { "type": "test", "name": "test_one" }
}
```

Tests and the TCK are stored as YAML strings. Schemas are stored as `{ name, content }` objects.

## useServiceStore

Holds **service and authentication configurations** for connectors, registries, and discovery services.

### State properties

| Property | Type | Description |
|----------|------|-------------|
| `services` | `ServiceDefinition[]` | Configured service instances |
| `authentications` | `AuthDefinition[]` | OAuth2 / API key credentials |

### Supported service types

| Type key | Display name | Required fields |
|----------|-------------|-----------------|
| `edc_connector_saturn` | EDC Connector (Saturn) | `base_url`, `dma_path` |
| `edc_connector_jupiter` | EDC Connector (Jupiter) | `base_url`, `dma_path` |
| `aas` | Digital Twin Registry | `base_url`, `lookup_url`, `api_path` |
| `discovery_finder` | Discovery Finder | `base_url` |
| `edc_discovery` | EDC Discovery | `base_url` |
| `bpn_discovery` | BPN Discovery | `base_url` |

### Supported auth types

| Type key | Fields |
|----------|--------|
| `oauth2` | `auth_url`, `realm`, `client_id`, `client_secret` (secret) |
| `api_key` | `api_key` (secret), `header_name` |

### Key actions

- `addService()`, `updateService(index, service)`, `removeService(index)`, `setServices(arr)`
- `addAuth()`, `updateAuth(index, auth)`, `removeAuth(index)`, `setAuthentications(arr)`
- `getServicesByType(type)` — Filter services by type
- `hasServiceType(type)` — Check if any service of a type is configured

### Schema constants

`SERVICE_SCHEMAS` and `AUTH_SCHEMAS` are exported constants defining the field catalog for each service/auth type. Each field specifies `label`, `type` (text/select/number), `required`, `secret`, and `options` (for selects). The `ServiceDialog` component renders forms from these schemas.

## projectIO.ts — Import/export utilities

Located at `src/store/projectIO.ts`, this module handles file I/O operations.

### Exports

**`exportProjectZip(projectName, tck, tests, schemas, testOrder)`**

Creates a ZIP file with the project structure:

```
{projectName}/
├── index.yaml              ← TCK
├── tests/*.yaml            ← individual tests
└── schemas/*.json          ← JSON schemas
```

Uses JSZip. Triggers a browser download.

**`importProjectZip(file: File)`**

Parses an uploaded `.zip` file. Returns an `ImportedProject` struct with all parsed content. Auto-detects the root folder prefix. Preserves test order from the TCK's `tests:` array.

**`importExampleFolder(examplePath: string)`**

Fetches example projects from `public/examples/{name}/` via HTTP. Resolves relative file paths (e.g., `tests/foo.yaml`), fetches schemas in parallel, and relinks schema paths in step params.

**`downloadFile(filename, content, mimeType)`**

Utility to trigger a browser file download from a string or blob.

## Store interaction diagram

```
App.tsx (on mount)
  │
  ├─ useProjectStore.loadFromLocalStorage()
  │    → restores project from localStorage
  │
  ├─ useTestLabStore.setOnModelChange(callback)
  │    → callback = (model) => useProjectStore.updateTest(activeFile, model)
  │
  └─ useTestLabStore.loadModel(activeModel)
       → loads the active file's model into the editor

User edits blocks
  │
  ├─ workspaceToModel() → model
  ├─ useTestLabStore.setModelFromBlocks(model)
  │    → validates, generates YAML
  │    → fires onModelChange(model)
  │         → useProjectStore.updateTest(name, model)
  │              → markDirty(name)
  │              → saveToLocalStorage() (debounced)
  └─ done

User clicks different file
  │
  ├─ useProjectStore.setActiveFile(newFile)
  ├─ App.tsx detects activeFile change
  │    → model = useProjectStore.getActiveModel()
  │    → useTestLabStore.loadModel(model)
  └─ BlocklyWorkspace rebuilds blocks from new model
```
