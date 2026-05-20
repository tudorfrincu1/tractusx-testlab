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

# Block Editor

The Block Editor is the main workspace where you build tests visually. It uses [Blockly](https://developers.google.com/blockly) — the same technology behind Scratch — to let you drag, connect, and configure blocks without writing code.

!!! info "Block Editor layout"
    The workspace has a **Toolbox** on the left with block categories, a central **canvas** where you drag and connect blocks, and a **trashcan** icon in the bottom-right for deleting blocks.

## Toolbar

The Block Editor toolbar sits above the workspace:

| Button | Description |
|--------|-------------|
| **Add/Remove Services** | Opens the [Service Dialog](services.md) to configure connectors and registries |
| **Save** | Manually saves the current file |
| **Auto-save** | Toggle automatic saving (on by default) |
| **Trash** | Shows red when the trashcan contains deleted blocks |
| **Hide/Show** | Toggles the right panel (YAML/Graph) |

## Toolbox

The **Toolbox** is the panel on the left side of the workspace. It contains all available blocks organized by category.

Click a category to expand its flyout and see the available blocks. Categories are color-coded for quick identification:

| Category | Description |
|----------|-------------|
| **Mock** | Set up mock HTTP endpoints for testing without real infrastructure |
| **Wait** | Pause execution until a condition is met |
| **Function** | Pure data transforms — UUID generation, JSON path extraction, etc. |
| **Flow** | Execution control — retry loops, delays, log messages |
| **EDC Connector** | EDC Management API operations — assets, policies, contracts, transfers |
| **Digital Twin Registry** | AAS/DTR operations — shell registration, submodel lookups |
| **Discovery Finder** | BPN and EDC discovery service lookups |
| **HTTP** | Direct HTTP requests to any endpoint |
| **Notification** | Catena-X notification steps |
| **Validation** | Schema and policy validation |

!!! info "Service-gated categories"
    Some categories (EDC Connector, Digital Twin Registry, Discovery Finder) only appear when you have configured the corresponding service. See [Services](services.md) to add them.

## Adding Blocks

1. Click a toolbox category to open its flyout
2. **Drag** a block from the flyout onto the workspace
3. The block appears with default values and input slots

## Connecting Blocks

Blocks snap together like puzzle pieces:

- **Step blocks** connect vertically — the bottom of one step connects to the top of the next
- **Value blocks** connect horizontally — plug them into input slots on step blocks
- **Assertion blocks** chain inside a step's `validate:` section

### Auto-linking

When you drop a block onto the workspace, the IDE **automatically fills compatible inputs** from the nearest matching output above. For example, if a previous step outputs `contract_agreement_id`, a new "Transfer Data" block will auto-link to it.

## Configuring Block Fields

Each block has fields you can edit directly on the block:

| Field Type | How to Edit |
|------------|-------------|
| **Text** | Click the field and type |
| **Number** | Click and enter a numeric value |
| **Dropdown** | Click to open a menu of options |
| **Service reference** | Dropdown populated from configured services |
| **Variable reference** | Dropdown populated from outputs of previous steps |
| **JSON (key-value)** | Attach `key_value_pair` blocks to build objects |

## Using Variables

Every step block with `outputs` automatically stores its results as variables. These variables appear as options in downstream blocks' dropdowns.

To reference a variable manually:

1. Find the **Variable** blocks in the toolbox
2. Drag a variable block and attach it to an input slot
3. Select the variable name from the dropdown

Variables use the `@variable_name` syntax in the generated YAML.

## Deleting Blocks

To remove a block:

- **Drag** it to the trashcan icon in the bottom-right corner
- Or **select** the block and press ++delete++ or ++backspace++

## Workspace Navigation

| Action | Control |
|--------|---------|
| **Pan** | Click and drag on empty space |
| **Zoom in/out** | Mouse scroll wheel or pinch gesture |
| **Zoom to fit** | Double-click on empty workspace area |

## Real-Time Sync

Every change you make in the Block Editor is immediately reflected in the [YAML Preview](yaml-preview.md) and the [Graph View](graph-view.md). The sync happens with a 150ms debounce to keep the UI responsive.

!!! tip "Check the YAML"
    Always glance at the YAML preview after making changes. It's the source of truth for what your test will actually do when executed.
