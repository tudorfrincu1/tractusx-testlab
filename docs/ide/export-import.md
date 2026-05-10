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

# Export & Import

The IDE supports exporting your project for execution and importing existing projects for editing.

## Exporting a Project

Click the **Export** button in the top bar to open the Export Dialog.

### Export Dialog

The dialog shows two panels:

- **Left panel** — File tree showing all project files:
    - `index.yaml` (test case)
    - `tests/` folder with all test files
    - `schemas/` folder with all schema files
- **Right panel** — Preview of the selected file's content

Click any file in the tree to preview its content before exporting.

### Export Options

| Option | Description |
|--------|-------------|
| **Export as ZIP** | Downloads the entire project as a `.zip` archive containing all files |
| **Export Individual File** | Downloads a single selected file |

The ZIP archive preserves the folder structure:

```
my-project.zip
├── index.yaml
├── tests/
│   ├── test-one.yaml
│   └── test-two.yaml
└── schemas/
    └── model-schema.json
```

## Importing a Project

There are two ways to import:

### From the Welcome Screen

1. Click the **Open File** card
2. Select a `.yaml`, `.yml`, or `.zip` file
3. The project loads into the editor

### From the Top Bar

1. Click the **Import** button in the top bar
2. Select a file from the file picker
3. The project loads, replacing the current project

### Supported Import Formats

| Format | What happens |
|--------|-------------|
| `.zip` | Extracts the full project — test case, tests, and schemas |
| `.yaml` / `.yml` (test case) | Loads as a project with the test case and referenced tests |
| `.yaml` / `.yml` (single test) | Loads as a minimal project with one test |

## Auto-Save & Local Storage

The IDE automatically saves your project to **browser local storage**:

- Changes are saved with a 1-second debounce after each edit
- Your project persists across browser sessions
- Closing and reopening the browser restores your last project

!!! warning "Browser storage limits"
    Local storage is limited (typically 5–10 MB). Very large projects with many schemas should be exported regularly as ZIP files for backup.

## Running Exported Tests

After exporting, run your tests with the TestLab CLI:

```bash
# Validate the test definition
testlab validate my-project/tests/my-test.yaml

# Run the test
testlab run my-project/tests/my-test.yaml
```

See the [Tutorials](../tutorials/index.md) for more details on CLI usage.
