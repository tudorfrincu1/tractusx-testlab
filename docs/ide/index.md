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

# IDE User Manual

The **TestLab IDE** is a visual test authoring tool for Eclipse Tractus-X dataspaces. You build tests by dragging and connecting blocks — no coding required. The IDE generates valid YAML test definitions in real time.

## Quick Start

### 1. Launch the IDE

```bash
cd ide && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Create or open a project

On the Welcome Screen, choose one of:

- **New Project** — start with a blank test case
- **Open File** — import an existing `.yaml`, `.yml`, or `.zip` project
- **Example** — load a pre-built example to explore

![Welcome Screen](../assets/images/ide/welcome-screen.png)

### 3. Build your test

1. Click a test in the **Project Explorer** to open it in the Block Editor
2. Drag blocks from the **Toolbox** on the left
3. Snap blocks together to build your test flow
4. Watch the **YAML Preview** update in real time on the right

### 4. Export

Click **Export** in the top bar to download your project as a `.zip` archive or individual files.

---

## IDE Layout

The IDE uses a multi-panel layout that adapts to what you're editing.

![IDE Layout Overview](../assets/images/ide/layout-overview.png)

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                                                      │
├──────────┬──────────────────────┬────────────────────────────┤
│          │                      │                            │
│ Project  │  Block Editor        │  YAML Preview              │
│ Explorer │  (or Dashboard)      │  (or Graph View)           │
│          │                      │                            │
├──────────┴──────────────────────┴────────────────────────────┤
│ Status Bar                                                    │
└─────────────────────────────────────────────────────────────┘
```

| Panel | Purpose |
|-------|---------|
| **Top Bar** | Project name, active file, import/export, examples |
| **Project Explorer** | File tree — test case, tests, schemas |
| **Block Editor** | Blockly workspace for visual test building |
| **YAML Preview** | Live YAML output with syntax highlighting |
| **Graph View** | Visual dependency graph (toggle with YAML) |
| **Status Bar** | Validation status, step/test count, file path |

Each panel is described in detail in the following pages:

- [Welcome Screen](welcome-screen.md) — Creating and opening projects
- [Project Explorer](project-explorer.md) — Navigating files and folders
- [Block Editor](block-editor.md) — Dragging, connecting, and configuring blocks
- [YAML Preview](yaml-preview.md) — Viewing and editing raw YAML
- [Graph View](graph-view.md) — Visualizing execution and data flow
- [Services](services.md) — Configuring connectors, DTR, and discovery services
- [Export & Import](export-import.md) — Saving and sharing projects
- [Test Case Dashboard](test-case-dashboard.md) — Managing test pipelines
