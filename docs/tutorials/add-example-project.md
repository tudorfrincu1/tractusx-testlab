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

# How to Add a New Example Project

Example projects are bundled in the IDE and appear on the Welcome Screen and in the top bar's Examples dropdown.

## Step 1 — Create the project folder

```bash
mkdir -p ide/public/examples/my-example-v1.0/tests/
```

## Step 2 — Create the TCK file

Create `ide/public/examples/my-example-v1.0/index.yaml`:

```yaml
kind: tck
name: my-example
version: "1.0"
description: A brief description of what this example demonstrates.

variables:
  some_input:
    type: str
    description: Describe this variable

tests:
  - test: tests/my_test.yaml
    description: What this test does
```

## Step 3 — Create the test files

Create `ide/public/examples/my-example-v1.0/tests/my_test.yaml`:

```yaml
kind: test
name: my-test
version: "1.0"
description: Detailed test description.

steps:
  - type: http_call
    name: Call API
    params:
      url: "@some_input"
      method: GET
    store_in_memory:
      status_code: "$"
    expect:
      - output: status_code
        equals: 200
```

## Step 4 — Register in the Welcome Screen

Open `ide/src/components/WelcomeScreen/WelcomeScreen.tsx` and add your example to the examples array:

```typescript
{
  name: "My Example",
  path: "my-example-v1.0",
  icon: "🔧",
  description: "Brief description of what users will learn",
},
```

## Step 5 — Register in the TopBar

Open `ide/src/components/Layout/TopBar.tsx` and add the same entry to the examples dropdown list.

## Step 6 — Verify

1. Reload the IDE
2. Click "My Example" on the Welcome Screen
3. The project should load with the TCK dashboard showing your test(s)
4. Click a test to see it in the block editor
5. Verify the YAML preview matches your YAML files
