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

# Welcome Screen

The Welcome Screen is the first thing you see when opening the IDE. It lets you create a new project, open an existing one, or load a built-in example.

![Welcome Screen](../assets/images/ide/welcome-screen.png)

## Creating a New Project

1. Click the **New Project** card
2. A blank test case is created with a default name
3. The IDE transitions to the editor view

The new project starts with an empty `index.yaml` test case file. You can rename it in the Project Explorer.

## Opening an Existing Project

1. Click the **Open File** card
2. A file picker opens — select a `.yaml`, `.yml`, or `.zip` file
3. The IDE loads the project and opens the editor

**Supported formats:**

| Format | Description |
|--------|-------------|
| `.yaml` / `.yml` | Single test or test case file |
| `.zip` | Full project archive (test case + tests + schemas) |

## Loading an Example

The bottom section shows built-in example projects organized by category:

![Example Templates](../assets/images/ide/welcome-examples.png)

| Category | Examples |
|----------|----------|
| **Base Tests** | Connector Ping, DTR Ping |
| **Industry Core** | Industry Core Validation |
| **Use Cases** | Traceability Notification, Certificate Management, Special Characteristics, Product Carbon Footprint |

Click any example card to load it instantly. Each example comes with pre-configured services, blocks, and tests that you can explore and modify.

!!! tip "Try Connector Ping first"
    The **Connector Ping** example is the simplest — it sends a health check to an EDC connector. It's a great starting point to understand how blocks, services, and YAML work together.

## Returning to the Welcome Screen

Click the **TestLab IDE** logo in the top-left corner of the top bar at any time to return to the Welcome Screen.

!!! warning "Unsaved changes"
    Returning to the Welcome Screen does not discard your project. Your work is preserved in browser local storage and will be available when you return.
