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

# How to Create a New Block (IDE)

A "block" is a visual step that users drag onto the Blockly workspace. Blocks are **data-driven** — you create a JSON file and register it in the catalog. No TypeScript changes are needed.

## Step 1 — Decide the category

Blocks live in category folders under `ide/public/blocks/`. Pick an existing category or create a new one:

| Category folder | When to use |
|----------------|-------------|
| `mock/` | Blocks that set up mock HTTP endpoints |
| `wait/` | Blocks that pause until something happens |
| `function/` | Pure data transforms (UUID, JSON path, etc.) |
| `flow/` | Execution control (retry, delay, log) |
| `edc-connector/` | EDC Management API operations |
| `digital-twin-registry/` | AAS/DTR operations |
| `discovery-finder/` | BPN/EDC discovery lookups |
| `http/` | Direct HTTP calls |
| `notification/` | Catena-X notification steps |
| `validation/` | Schema/policy validation |

For this tutorial, we'll add a block called **"Check Health"** to the `http/` category. It sends a GET request to a health endpoint and checks the response.

## Step 2 — Create the block JSON file

Create `ide/public/blocks/http/check_health.json`:

```json
{
  "type": "check_health",
  "label": "Check Health",
  "description": "Send a GET request to a health endpoint and verify it responds.",
  "params": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "Health endpoint URL (e.g., https://example.com/health)"
    },
    {
      "name": "expected_status",
      "type": "number",
      "required": false,
      "description": "Expected HTTP status code",
      "default": 200
    },
    {
      "name": "timeout_s",
      "type": "number",
      "required": false,
      "description": "Request timeout in seconds",
      "default": 10
    }
  ],
  "outputs": [
    { "name": "status_code", "description": "HTTP status code returned" },
    { "name": "response_body", "description": "Response body content" }
  ]
}
```

**Field reference:**

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Unique step identifier. Becomes Blockly block type `step_check_health`. Must match the Python step type. |
| `label` | Yes | Human-readable name shown on the block in the editor. |
| `description` | Yes | Tooltip text shown on hover. |
| `params` | Yes | Array of input parameters rendered as fields on the block. |
| `outputs` | No | Array of named outputs. If present, the block gets an `expect:` section and outputs are auto-stored via `store_in_memory`. |
| `depends_on` | No | Array of block types that must exist in the workspace (shows a warning if missing). |

**Parameter types:**

| Type | Renders as | Use case |
|------|-----------|----------|
| `string` | Value input (accepts `value_string`, `variable_get`) | Text inputs, URLs, IDs |
| `number` | Numeric field | Timeouts, counts, status codes |
| `boolean` | Boolean value input | Flags |
| `dropdown` | Dropdown menu (requires `options` array) | Fixed choices (GET/POST/PUT) |
| `json` | Statement input (accepts `key_value_pair` chains) | Request bodies, headers |
| `service_ref` | Dynamic dropdown (services from ServiceStore) | Connector/DTR/discovery references |
| `endpoint_ref` | Dynamic dropdown (mock endpoints from workspace) | Mock endpoint references |
| `schema_path` | Dynamic dropdown (schemas from project) | Schema file references |
| `variable` | Dynamic dropdown (workspace variables) | Variable references |
| `steps` | Statement input (accepts step blocks) | Nested step chains (e.g., retry body) |

## Step 3 — Register the block in the catalog manifest

Open `ide/public/blocks/index.json` and add your block path to the correct category:

```json
{
  "name": "HTTP",
  "description": "Send HTTP requests directly or via EDC Dataplane",
  "blocks": [
    "http/http_call.json",
    "http/http_call_dataplane.json",
    "http/check_health.json"
  ]
}
```

The order in the `blocks` array determines the order in the toolbox flyout.

## Step 4 — Verify in the browser

```bash
cd ide
npm run dev
```

1. Open `http://localhost:5173`
2. Create or open a test
3. Look for the "HTTP" category in the toolbox
4. You should see "Check Health" as a draggable block
5. Drag it onto the workspace and connect value blocks to its inputs
6. Check the YAML preview — it should serialize correctly

## Step 5 — Build check

```bash
cd ide
npx tsc --noEmit     # TypeScript type check (should pass — no TS changes)
npx vite build       # Production build
```

!!! tip "No TypeScript needed"
    The block registration system (`catalogBlocks.ts`) reads your JSON at runtime and dynamically generates the Blockly block definition. You don't need to write a single line of TypeScript to add a new block.

!!! warning "File name must match"
    The `type` field in your JSON **must** be unique across all blocks. It becomes the Blockly block type as `step_{type}` and must match the Python step executor's registered type exactly.
