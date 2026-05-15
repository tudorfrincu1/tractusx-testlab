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

# Project Explorer

The Project Explorer is the left sidebar that shows the structure of your project. It displays your TCK, tests, and schemas in a tree view.

## Project Structure

Every project has three sections:

| Section | Contents |
|---------|----------|
| **index** | The TCK file (`index.yaml`) — project metadata, variables, and test pipeline |
| **Tests** | Individual test files — each contains steps, assertions, and service references |
| **Schemas** | JSON schema files — used for schema validation assertions |

## Navigating Files

**Click** any file to open it in the editor:

- Clicking the **index** file opens the [TCK Dashboard](tck-dashboard.md)
- Clicking a **test** file opens the [Block Editor](block-editor.md) with the YAML Preview
- Clicking a **schema** file opens a JSON schema editor

The **active file** is highlighted with a gold border. Files with unsaved changes show a dot indicator (•).

## Managing Tests

**Right-click** on the Tests folder or any test file to see the context menu:

| Action | Description |
|--------|-------------|
| **Add Test** | Creates a new blank test file |
| **Rename** | Renames the selected test |
| **Duplicate** | Creates a copy of the selected test |
| **Delete** | Removes the test (with confirmation) |

## Reordering Tests

Tests execute in the order shown in the explorer. To change the execution order:

1. Hover over a test — a drag handle appears
2. Click and drag the test to the desired position
3. Release to drop — the order updates immediately

The new order is reflected in the TCK's `tests:` array in YAML.

## Managing Schemas

**Right-click** on the Schemas folder to add or manage schema files:

| Action | Description |
|--------|-------------|
| **Download Model** | Opens the [Schema Download Dialog](#downloading-semantic-models) to fetch schemas from the Tractus-X semantic model repository |
| **Rename** | Renames the selected schema |
| **Delete** | Removes the schema |

## Downloading Semantic Models

The Schema Download Dialog lets you browse and download JSON schemas from the Eclipse Tractus-X `sldt-semantic-models` GitHub repository.

1. Open the dialog from the Schemas context menu → **Download Model**
2. **Search** for a model by name (e.g., `bill_of_material`)
3. **Select** the model from the results
4. **Choose a version** from the available versions list
5. The schema downloads and is added to your project's `schemas/` folder

!!! note "GitHub API rate limits"
    The schema browser uses the GitHub API, which allows 60 requests per hour for unauthenticated users. If you hit the limit, wait a few minutes before trying again.

## Collapsing the Explorer

Click the **collapse button** in the explorer header to hide the sidebar. When collapsed, a vertical "Explorer" label appears — click it to expand again.

The explorer width is resizable: drag the right edge to adjust.
