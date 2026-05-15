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

# How to Modify the Sync Flow

The sync loop is the core mechanism that keeps blocks, YAML, and the dependency graph in sync. Modify with extreme care.

## Understanding the flow

```
User drags block
  → Blockly fires change event
  → 150ms debounce
  → workspaceToModel() reads all blocks → TestLabDocument
  → useTestLabStore.setModelFromBlocks(model)
    → lastEditSource = "blocks"
    → validate(model)
    → modelToYaml(model) → YAML string
    → onModelChange → useProjectStore.updateTest()
  → Monaco editor displays updated YAML
```

```
User types in Monaco
  → 500ms debounce
  → yamlToModel(yaml) → TestLabDocument
  → useTestLabStore.setModelFromYaml(model)
    → lastEditSource = "yaml"
    → validate(model)
    → onModelChange → useProjectStore.updateTest()
  → BlocklyWorkspace detects lastEditSource === "yaml"
    → disposes block chains, rebuilds from model
    → refreshDropdownFields()
```

## Key files

| File | Responsibility |
|------|---------------|
| `serialization/workspaceToModel.ts` | Reads Blockly workspace → `TestLabDocument` |
| `serialization/modelToWorkspace.ts` | Rebuilds blocks from `TestLabDocument` |
| `serialization/populateTest.ts` | Populates test steps/assertions from model |
| `serialization/helpers.ts` | Shared utilities (make blocks, read values, etc.) |
| `sync/modelToYaml.ts` | Converts model → YAML string |
| `sync/yamlToModel.ts` | Parses YAML string → model |
| `sync/modelToGraph.ts` | Converts model → React Flow graph |
| `store/useTestLabStore.ts` | Central state with `lastEditSource` guard |

## Adding a new field to the sync

If you add a new field to the YAML schema (e.g., a `priority` field on steps):

1. **Add to TypeScript types** in `src/models/schema.ts`
2. **Read it in `workspaceToModel.ts`** — extract the field from the Blockly block
3. **Write it in `populateTest.ts`** — set the field on the Blockly block during model → workspace
4. **Serialize it in `modelToYaml.ts`** — ensure it appears in the YAML output
5. **Parse it in `yamlToModel.ts`** — extract it from the raw YAML object
6. **Validate it in `validator.ts`** — add validation rules if needed

## Loop prevention rules

Never modify the sync loop without understanding `lastEditSource`:

| Value | Blocks react? | YAML reacts? |
|-------|--------------|--------------|
| `"blocks"` | No | Yes |
| `"yaml"` | Yes | No |
| `"load"` | Yes | Yes |
| `"none"` | No | No |

!!! danger "Infinite loop risk"
    If you remove or bypass the `lastEditSource` guard, blocks and YAML will trigger each other indefinitely, freezing the browser. Always test sync changes with both editing surfaces.
