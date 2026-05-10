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

# YAML Preview

The YAML Preview panel shows the generated test definition in real time. It sits on the right side of the editor and uses the [Monaco Editor](https://microsoft.github.io/monaco-editor/) (the same editor that powers VS Code).

![YAML Preview](../assets/images/ide/yaml-preview.png)

## Viewing YAML

As you drag and connect blocks in the Block Editor, the YAML preview updates automatically. The generated YAML is the exact test definition that the TestLab runtime will execute.

### Syntax Highlighting

The editor uses a custom dark theme with color-coded tokens:

| Token | Color |
|-------|-------|
| Keywords (`kind`, `name`, `steps`) | Gold/yellow |
| Strings | Tan/orange |
| Numbers | Light green |
| Comments | Green |
| Variables (`@variable_name`) | Highlighted |

### Step Highlighting

When you **click a block** in the Block Editor, the corresponding YAML lines are highlighted in gold and the editor auto-scrolls to show them.

![Step Highlighting](../assets/images/ide/yaml-step-highlight.png)

This works both ways — the block and YAML stay in sync.

## Editing YAML Directly

By default the YAML editor is in **read-only mode** — indicated by a lock icon. To edit YAML directly:

1. Click the **lock icon** to toggle read-only mode off
2. Edit the YAML text
3. Changes sync back to the Block Editor after a 1-second debounce

![Read-Only Toggle](../assets/images/ide/yaml-readonly-toggle.png)

When read-only mode is off:

- Line numbers are visible
- Code folding is enabled
- The minimap appears on the right edge
- The cursor changes to a standard text cursor

!!! warning "Two-way sync"
    Editing YAML directly updates the blocks, and editing blocks updates the YAML. The IDE prevents infinite loops by tracking which side made the last change. If you see unexpected behavior, try clicking on an empty area first to clear the selection.

## Auto-Completion

When editing in writable mode, the editor provides smart auto-completion:

| Category | Suggestions |
|----------|-------------|
| **Top-level fields** | `kind`, `name`, `version`, `dataspace_version`, `description`, `variables`, `services`, `steps` |
| **Step types** | `http_request`, `create_asset`, `transfer_data`, `negotiate_contract`, etc. |
| **Assertion types** | `STATUS_CODE`, `CONTAINS`, `SCHEMA`, `REGEX`, `NOT_CONTAINS`, `EXACT` |
| **Service types** | `CONNECTOR_CONSUMER`, `CONNECTOR_PROVIDER`, `DSP_CONSUMER`, `DSP_PROVIDER`, `DTR` |
| **Snippets** | `step`, `variable`, `service` — pre-built templates for common structures |

Press ++ctrl+space++ (or ++cmd+space++ on macOS) to trigger auto-completion manually.

## Error Markers

The editor shows validation errors inline:

| Marker | Meaning |
|--------|---------|
| Red squiggly underline | Error — the test will not compile |
| Yellow/orange squiggly underline | Warning — the test may behave unexpectedly |

Hover over a marker to see the error message in a tooltip.

![Error Markers](../assets/images/ide/yaml-error-markers.png)

Errors are also summarized in the [Status Bar](#status-bar) at the bottom of the IDE.

## Switching to Graph View

The right panel has two tabs: **YAML** and **Graph**. Click the **Graph** tab to switch to the [Graph View](graph-view.md). You can switch back at any time — your YAML content is preserved.
