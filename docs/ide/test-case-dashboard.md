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

# Test Case Dashboard

The Test Case Dashboard appears when you select the `index.yaml` (test case) file in the Project Explorer. It provides an overview of your entire test pipeline.

![Test Case Dashboard](../assets/images/ide/test-case-dashboard.png)

## Dashboard Header

The header displays the test case name with version and dataspace version badges.

## Tabs

The dashboard has two tabs:

### Pipeline Tab

The Pipeline tab (default) shows three sections:

#### Metadata Section

Edit the test case's top-level properties:

| Field | Description |
|-------|-------------|
| **Name** | Test case name (displayed in the top bar) |
| **Version** | Semantic version string |
| **Dataspace Version** | Target dataspace version (e.g., `saturn`, `jupiter`) |
| **Description** | Free-text description of what the test case validates |

![Metadata Section](../assets/images/ide/dashboard-metadata.png)

#### Variables Overview

Lists all variables defined at the test-case level. Each variable shows:

- Variable name
- Type (`str`, `int`, `bool`, etc.)
- Default value (if set)
- Description

These variables are available to all tests in the pipeline via `@variable_name` syntax.

![Variables Overview](../assets/images/ide/dashboard-variables.png)

#### Test Pipeline Table

A table showing all tests in their execution order:

| Column | Description |
|--------|-------------|
| **Test Name** | Name of the test file |
| **Steps** | Number of steps in the test |
| **Services Used** | Which services the test references |
| **Overrides** | Any variable overrides specific to this test |

![Test Pipeline](../assets/images/ide/dashboard-pipeline.png)

**Interactions:**

- **Click a test** → opens it in the Block Editor
- **Drag tests** → reorder the execution sequence
- **Hover** → shows additional details

### Data Flow Tab

The Data Flow tab will show a visualization of how data flows between tests in the pipeline — which variables are produced and consumed across tests.

!!! note "Coming soon"
    The Data Flow tab is under development and will be available in a future release.

## Editing the Test Case

All metadata fields are editable directly in the dashboard. Changes sync to the YAML representation in real time — you can verify by switching to a test file and checking the generated output.
