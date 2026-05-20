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

# Step-by-Step Tutorials

This page contains hands-on tutorials for the most common developer tasks. Each tutorial walks you through every file you need to create or modify, explains why, and shows you how to verify your work.

---

## How to Create a New Block (IDE)

A "block" is a visual step that users drag onto the Blockly workspace. Blocks are **data-driven** — you create a JSON file and register it in the catalog. No TypeScript changes are needed.

### Step 1 — Decide the category

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

### Step 2 — Create the block JSON file

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
| `outputs` | No | Array of named outputs. If present, the block gets an `validate:` section and outputs are auto-stored via `store_in_memory`. |
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

### Step 3 — Register the block in the catalog manifest

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

### Step 4 — Verify in the browser

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

### Step 5 — Build check

```bash
cd ide
npx tsc --noEmit     # TypeScript type check (should pass — no TS changes)
npx vite build       # Production build
```

!!! tip "No TypeScript needed"
    The block registration system (`catalogBlocks.ts`) reads your JSON at runtime and dynamically generates the Blockly block definition. You don't need to write a single line of TypeScript to add a new block.

!!! warning "File name must match"
    The `type` field in your JSON **must** be unique across all blocks. It becomes the Blockly block type as `step_{type}` and must match the Python step executor's registered type exactly.

---

## How to Create a New Block Category (IDE)

If your blocks don't fit any existing category, create a new one.

### Step 1 — Create the category folder

```bash
mkdir ide/public/blocks/my-category/
```

### Step 2 — Create block JSON files in the folder

Follow the same format as [How to Create a New Block](#how-to-create-a-new-block-ide). Place your `.json` files in the new folder.

### Step 3 — Add the category to `index.json`

Open `ide/public/blocks/index.json` and add a new category entry:

```json
{
  "name": "My Category",
  "description": "Description shown as tooltip in the toolbox",
  "blocks": [
    "my-category/my_block_one.json",
    "my-category/my_block_two.json"
  ]
}
```

**Optional: Service-gated categories.** If your category should only appear when a specific service is configured, add `service_type`:

```json
{
  "name": "My Category",
  "description": "Only visible when a my_service is configured",
  "service_type": "my_service",
  "blocks": ["my-category/my_block.json"]
}
```

When `service_type` is set, the category only appears in the toolbox if the user has configured a service of that type in the Service Dialog.

### Step 4 — Add a color for the category

Open `ide/src/components/BlockEditor/blockColors.ts` and add an entry:

```typescript
"My Category": "#2563EB",   // Pick a distinct hex color
```

This color is used for:

- Block fill color in the Blockly workspace
- Node border color in the dependency graph
- Category indicator in the toolbox

### Step 5 — Service type resolution (if service-gated)

If your category uses `service_type`, open `ide/src/components/BlockEditor/toolbox/toolboxBuilder.ts` and add the mapping to `SERVICE_TYPE_RESOLUTION`:

```typescript
const SERVICE_TYPE_RESOLUTION: Record<string, string[]> = {
  "edc-connector": ["edc-connector"],
  "digital-twin-registry": ["digital-twin-registry"],
  "discovery-finder": ["discovery-finder"],
  "my-category": ["my_service"],  // ← add this
};
```

### Step 6 — Verify

Reload the IDE. Your new category should appear in the toolbox (or after configuring the required service, if service-gated).

---

## How to Create a New Step Executor (Python)

A step executor is the Python code that runs when a block is executed at runtime. Every block type needs a corresponding step executor.

### Step 1 — Decide the location

Step executors live under `src/tractusx_testlab/steps/`:

```
steps/
├── connector/     # EDC connector steps (DSP, dataplane, provision, consume)
├── industry/      # Industry layer steps (DTR, notifications, submodels)
├── base.py        # BaseStep abstract class
├── assertions.py  # Assertion evaluation engine
└── conditions.py  # Conditional execution ("if" expressions)
```

For our "Check Health" example, we'll put it in a new file since it's a general HTTP step.

### Step 2 — Create the step file

Create `src/tractusx_testlab/steps/health.py`:

```python
################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2026 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
################################################################################
"""Step executor for health check HTTP requests."""

import logging

import httpx

from tractusx_sdk.extensions.testlab.models.definitions import StepDefinition
from tractusx_sdk.extensions.testlab.player.execution.context import StepContext

from tractusx_testlab.steps.base import BaseStep, StepOutput, HttpRequest, HttpResponse
from tractusx_testlab.scripting.registry import step

logger = logging.getLogger(__name__)


@step("check_health")
class CheckHealthStep(BaseStep):
    """Send a GET request to a health endpoint and return status + body.

    Params:
        url (str): Health endpoint URL.
        expected_status (int, optional): Expected HTTP status code (default 200).
        timeout_s (int, optional): Request timeout in seconds (default 10).
    """

    async def execute(
        self,
        params: dict,
        context: StepContext,
        definition: StepDefinition,
    ) -> StepOutput:
        url = params["url"]
        timeout_s = params.get("timeout_s", 10)

        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(url)

        body = resp.text
        try:
            body = resp.json()
        except Exception:
            pass

        logger.info("Health check %s → %d", url, resp.status_code)

        return StepOutput(
            value={"status_code": resp.status_code, "response_body": body},
            request=HttpRequest(method="GET", url=url),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )
```

**Key rules:**

1. **Class extends `BaseStep`** — implement the `async execute()` method
2. **Decorate with `@step("type_name")`** — the string must match the block JSON's `type` field exactly
3. **Return `StepOutput`** — with `value` (dict matching your `outputs`), `request`, and `response`
4. **Use `logging`** — never `print()`
5. **Access services via `context`** — e.g., `context.get_consumer_service(name)` for EDC connectors

### Step 3 — Register the module for auto-import

The step registry uses the `@step` decorator, but the module must be imported for the decorator to run. Open `src/tractusx_testlab/steps/__init__.py` and add:

```python
from tractusx_testlab.steps import health  # noqa: F401
```

### Step 4 — Dataspace-version-specific steps

If your step behaves differently on Jupiter vs Saturn, register with a version constraint:

```python
@step("check_health", dataspace_version="saturn")
class CheckHealthSaturnStep(BaseStep):
    """Saturn-specific implementation."""
    ...

@step("check_health", dataspace_version="jupiter")
class CheckHealthJupiterStep(BaseStep):
    """Jupiter-specific implementation."""
    ...
```

Version-specific registrations take priority over global ones at runtime.

### Step 5 — Write a test

Create `tests/test_check_health.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tractusx_testlab.steps.health import CheckHealthStep


@pytest.mark.asyncio
async def test_check_health_returns_status_and_body():
    """CheckHealthStep returns status_code and response_body from GET."""
    step = CheckHealthStep()
    params = {"url": "https://example.com/health", "timeout_s": 5}
    context = MagicMock()
    definition = MagicMock()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"status": "UP"}'
    mock_response.json.return_value = {"status": "UP"}
    mock_response.headers = {"content-type": "application/json"}

    with patch("tractusx_testlab.steps.health.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_client.return_value)
        mock_client.return_value.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value.get = AsyncMock(return_value=mock_response)

        result = await step.execute(params, context, definition)

    assert result.value["status_code"] == 200
    assert result.value["response_body"] == {"status": "UP"}
    assert result.request.method == "GET"
    assert result.request.url == "https://example.com/health"
```

### Step 6 — Run the test

```bash
cd /path/to/tractusx-testlab
pytest tests/test_check_health.py -v
```

---

## How to Add a New Service Type

Service types control which block categories are visible and how the runtime connects to external systems.

### Step 1 — Define the service type in Python

In `src/tractusx_testlab/models/enums.py` (or equivalent), add the new service type:

```python
class ServiceType(str, enum.Enum):
    EDC_CONNECTOR_SATURN = "edc_connector_saturn"
    EDC_CONNECTOR_JUPITER = "edc_connector_jupiter"
    AAS = "aas"
    DISCOVERY_FINDER = "discovery_finder"
    MY_SERVICE = "my_service"  # ← add this
```

### Step 2 — Add the service schema in the IDE

Open `ide/src/store/useServiceStore.ts` and add your service to the `SERVICE_SCHEMAS` constant:

```typescript
my_service: {
  label: "My Service",
  fields: [
    { name: "base_url", label: "Base URL", type: "text", required: true },
    { name: "api_key", label: "API Key", type: "text", required: false, secret: true },
  ],
},
```

This schema drives the Service Dialog form. Each field renders as an input in the dialog.

### Step 3 — Wire the service in the runtime ServiceManager

In `src/tractusx_testlab/services/manager.py`, add a method to instantiate your service:

```python
def get_my_service(self, name: str) -> MyServiceClient:
    """Return a live MyService client instance."""
    definition = self._get_definition(name, ServiceType.MY_SERVICE)
    config = definition.config
    return MyServiceClient(
        base_url=config["base_url"],
        api_key=config.get("api_key"),
    )
```

### Step 4 — Gate block categories to the service

See [How to Create a New Block Category](#how-to-create-a-new-block-category-ide), step 3 — use `"service_type": "my_service"` in `index.json`.

---

## How to Add a New Assertion Type

Assertions validate step outputs. The IDE and Python runtime both need to know about new assertion types.

### Step 1 — Add the assertion block in the IDE

Open `ide/src/components/BlockEditor/blocks/assertionBlocks.ts`. Add a new block registration inside `registerAssertionBlocks()`:

```typescript
Blockly.Blocks["assert_my_check"] = {
  init(this: Block) {
    this.appendDummyInput()
      .appendField("assert my check:");

    this.appendDummyInput()
      .appendField("output:")
      .appendField(
        new Blockly.FieldDropdown(outputDropdown as () => Array<[string, string]>),
        "OUTPUT"
      );

    this.appendValueInput("THRESHOLD")
      .appendField("threshold:")
      .setCheck("param_value");

    this.setPreviousStatement(true, "assertion");
    this.setNextStatement(true, "assertion");
    this.setColour(blockColors.Assertions);
    this.setTooltip("Custom assertion description");
  },
};
```

### Step 2 — Handle serialization (workspace → model)

In `ide/src/components/BlockEditor/serialization/workspaceToModel.ts`, find the assertion reading section in `readAssertionChain` (in `helpers.ts`) and add a case for your new block type:

```typescript
case "assert_my_check": {
  const output = readDropdownValue(block, "OUTPUT");
  const threshold = readValueBlockAsString(block, "THRESHOLD");
  assertions.push({ output, my_check: threshold });
  break;
}
```

### Step 3 — Handle deserialization (model → workspace)

In `ide/src/components/BlockEditor/serialization/populateTest.ts`, find the assertion population switch and add:

```typescript
case "my_check":
  ab = makeBlock(ws, "assert_my_check");
  setDropdownValue(ab, "OUTPUT", output);
  connectValue(ab, "THRESHOLD", createValueBlockFromString(ws, String(val ?? "")));
  break;
```

### Step 4 — Add the assertion type in Python

In `src/tractusx_testlab/steps/assertions.py`, add the evaluation logic in `AssertionEngine.evaluate()`:

```python
elif assertion_type == "my_check":
    threshold = assertion_value
    actual = extract_output(output, output_name)
    passed = actual >= threshold  # your custom logic
    results.append(AssertionResult(
        output=output_name,
        type="my_check",
        expected=threshold,
        actual=actual,
        passed=passed,
    ))
```

### Step 5 — Verify

1. Reload the IDE — the new assertion block should appear in the "Assertions" toolbox category
2. Drag it under a step's `validate:` section
3. Check the YAML preview — it should serialize as `my_check: <value>`
4. Run `pytest` to verify the Python assertion engine handles it correctly

---

## How to Add a New Example Project

Example projects are bundled in the IDE and appear on the Welcome Screen and in the top bar's Examples dropdown.

### Step 1 — Create the project folder

```bash
mkdir -p ide/public/examples/my-example-v1.0/tests/
```

### Step 2 — Create the TCK file

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

### Step 3 — Create the test files

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
    validate:
      - output: status_code
        equals: 200
```

### Step 4 — Register in the Welcome Screen

Open `ide/src/components/WelcomeScreen/WelcomeScreen.tsx` and add your example to the examples array:

```typescript
{
  name: "My Example",
  path: "my-example-v1.0",
  icon: "🔧",
  description: "Brief description of what users will learn",
},
```

### Step 5 — Register in the TopBar

Open `ide/src/components/Layout/TopBar.tsx` and add the same entry to the examples dropdown list.

### Step 6 — Verify

1. Reload the IDE
2. Click "My Example" on the Welcome Screen
3. The project should load with the TCK dashboard showing your test(s)
4. Click a test to see it in the block editor
5. Verify the YAML preview matches your YAML files

---

## How to Add a New Template

Templates are reusable step sequences that users can insert as a single "Step Template" block. They abstract common multi-step patterns (like catalog negotiation + transfer).

### Step 1 — Create the template YAML

Create `ide/public/templates/my-template.yaml`:

```yaml
kind: template
name: my-template
version: "1.0"
description: Brief description of what this template does.

inputs:
  param_one:
    type: str
    description: First input parameter
  param_two:
    type: int
    description: Second input parameter
    default: 30

outputs:
  result_value:
    description: The main output of this template

steps:
  - type: http_call
    name: First Step
    params:
      url: "@param_one"
      method: GET
    store_in_memory:
      result_value: "$.data"
```

**Template structure:**

| Field | Description |
|-------|-------------|
| `kind` | Must be `"template"` |
| `name` | Template identifier (used in `step_template` blocks) |
| `inputs` | Parameters the user must provide when using the template |
| `outputs` | Variables the template produces (available to downstream steps) |
| `steps` | The step sequence that runs when the template is executed |

### Step 2 — Register in the template index

Open `ide/public/templates/index.json` and add your template:

```json
{
  "version": "1.0",
  "templates": [
    "catalog-negotiation.yaml",
    "transfer-dataplane-access.yaml",
    "dtr-shell-lookup.yaml",
    "my-template.yaml"
  ]
}
```

### Step 3 — Add template outputs to the variable collection

If your template produces outputs that downstream blocks should see as variables, open `ide/src/components/BlockEditor/blocks/variableCollection.ts` and add to the `TEMPLATE_OUTPUTS` map:

```typescript
const TEMPLATE_OUTPUTS: Record<string, string[]> = {
  "catalog-negotiation": ["contract_agreement_id", "data_address", "edr_token"],
  "transfer-dataplane-access": ["transfer_id", "data_address", "access_token"],
  "dtr-shell-lookup": ["shell_descriptors", "specific_asset_ids"],
  "my-template": ["result_value"],  // ← add this
};
```

This tells the variable collection system that when a `step_template` block references `my-template`, the variable `result_value` is available to downstream blocks.

### Step 4 — Verify

1. Reload the IDE
2. Drag a "Step Template" block from the "Template" toolbox category
3. Set its template field to `my-template`
4. Downstream blocks should show `result_value` in their variable dropdowns

---

## How to Modify the Sync Flow

The sync loop is the core mechanism that keeps blocks, YAML, and the dependency graph in sync. Modify with extreme care.

### Understanding the flow

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

### Key files

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

### Adding a new field to the sync

If you add a new field to the YAML schema (e.g., a `priority` field on steps):

1. **Add to TypeScript types** in `src/models/schema.ts`
2. **Read it in `workspaceToModel.ts`** — extract the field from the Blockly block
3. **Write it in `populateTest.ts`** — set the field on the Blockly block during model → workspace
4. **Serialize it in `modelToYaml.ts`** — ensure it appears in the YAML output
5. **Parse it in `yamlToModel.ts`** — extract it from the raw YAML object
6. **Validate it in `validator.ts`** — add validation rules if needed

### Loop prevention rules

Never modify the sync loop without understanding `lastEditSource`:

| Value | Blocks react? | YAML reacts? |
|-------|--------------|--------------|
| `"blocks"` | No | Yes |
| `"yaml"` | Yes | No |
| `"load"` | Yes | Yes |
| `"none"` | No | No |

!!! danger "Infinite loop risk"
    If you remove or bypass the `lastEditSource` guard, blocks and YAML will trigger each other indefinitely, freezing the browser. Always test sync changes with both editing surfaces.

---

## How to Add a New Validation Rule

Validation runs in real-time as the user edits, showing errors and warnings in the status bar and as Monaco editor squiggles.

### IDE validation (TypeScript)

Open `ide/src/models/validator.ts`:

```typescript
// Inside the validate() function, add your rule:

// Example: warn if step timeout is unreasonably high
if (step.timeout_s && step.timeout_s > 300) {
  errors.push({
    path: `steps[${i}].timeout_s`,
    message: `Timeout of ${step.timeout_s}s is very high. Consider a shorter value.`,
    severity: "warning",
  });
}
```

The `path` field is a JSON path that `yamlLineMap.ts` uses to highlight the correct line in Monaco.

### Python validation (compiler)

Open `src/tractusx_testlab/compiler/validator.py` and add to the `ScriptValidator.validate()` method:

```python
# Example: error if step type is unknown
if step.type not in self._known_types:
    result.add_error(
        path=f"steps[{i}].type",
        message=f"Unknown step type: {step.type}",
    )
```

---

## How to Add a New Component (IDE)

### Step 1 — Create the component folder

```bash
mkdir ide/src/components/MyComponent/
```

### Step 2 — Create the component file

Create `ide/src/components/MyComponent/MyComponent.tsx`:

```typescript
import { type FC } from "react";
import "./MyComponent.css";

export interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  const handleClick = () => {
    onAction?.();
  };

  return (
    <div className="my-component">
      <h3>{title}</h3>
      <button onClick={handleClick}>Do Thing</button>
    </div>
  );
};
```

### Step 3 — Create the CSS file

Create `ide/src/components/MyComponent/MyComponent.css`:

```css
.my-component {
  background: var(--surface, #2a2a2a);
  border: 1px solid var(--border, #404040);
  border-radius: 8px;
  padding: 16px;
}

.my-component h3 {
  color: var(--text, #e0e0e0);
  margin: 0 0 12px 0;
}
```

### Rules

- **Functional components only** — no class components (the sole exception is `BlockEditorErrorBoundary` which React requires to be a class)
- **Props interface co-located** — define and export `Props` in the same file
- **Plain CSS** — no CSS-in-JS, no MUI, no Ant Design
- **Event handlers**: `onXxx` for props, `handleXxx` for internal handlers
- **Max 300 lines per file** — split into sub-components if larger
- **No `any`** — use `unknown` + narrowing or proper generics
- **No `console.log`** — use structured error handling

---

## How to Run the Full Development Workflow

### IDE development

```bash
cd ide
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npx tsc --noEmit         # Type check (run before committing)
npx vite build           # Production build (run before PR)
```

### Python development

```bash
# Create a virtual environment (if not done)
python3.12 -m venv .venv
source .venv/bin/activate

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest -v

# Run the CLI
testlab validate examples/connector-ping-v1.0/tests/ping_test.yaml
testlab compile examples/connector-ping-v1.0/tests/ping_test.yaml
```

### Documentation

```bash
pip install mkdocs-material
mkdocs serve             # http://localhost:8000
mkdocs build             # Build static site
```

---

## How to Debug Common Issues

### Block doesn't appear in the toolbox

1. Check `ide/public/blocks/index.json` — is the block path listed?
2. Check the block JSON file — is it valid JSON? Open browser DevTools → Network tab → look for 404s
3. If the category has `service_type`, check if the corresponding service is configured in the Service Dialog
4. Open browser DevTools → Console — look for catalog loading errors

### YAML doesn't update when blocks change

1. Check `lastEditSource` in the store (React DevTools → Zustand store)
2. If stuck at `"yaml"`, the sync loop may be broken — check for errors in `workspaceToModel()`
3. Check the debounce timers haven't been set too high

### Variables don't appear in dropdowns

1. Variables come from multiple sources — see [Block System → collectWorkspaceVariables](block-system.md)
2. Check if the step block has `outputs` defined in its JSON — outputs auto-generate `store_in_memory`
3. For templates, check `TEMPLATE_OUTPUTS` in `variableCollection.ts`
4. Dropdowns refresh on a 300ms debounce after workspace changes — try waiting

### Block positions reset after file switch

1. Canvas state is saved per file in `useProjectStore.workspaceStates`
2. Check that `projectGeneration` hasn't changed (prevents stale saves)
3. Verify `setWorkspaceState()` is called before the file switch completes

### Python step not found at runtime

1. Check the `@step("type_name")` decorator — the type must match the block JSON's `type` field exactly
2. Check the module is imported in `steps/__init__.py`
3. For version-specific steps, check the `dataspace_version` parameter matches the runtime config

---

## Quick Reference: File Locations

| Task | IDE files to modify | Python files to modify |
|------|--------------------|-----------------------|
| New block | `public/blocks/{category}/{name}.json`, `public/blocks/index.json` | — |
| New category | Same as above + `blockColors.ts`, possibly `toolboxBuilder.ts` | — |
| New step executor | — | `steps/{module}.py`, `steps/__init__.py` |
| New service type | `useServiceStore.ts`, `toolboxBuilder.ts` | `models/enums.py`, `services/manager.py` |
| New assertion | `blocks/assertionBlocks.ts`, `serialization/helpers.ts`, `serialization/populateTest.ts` | `steps/assertions.py` |
| New template | `public/templates/{name}.yaml`, `public/templates/index.json`, `blocks/variableCollection.ts` | — |
| New example | `public/examples/{name}/`, `WelcomeScreen.tsx`, `TopBar.tsx` | — |
| New YAML field | `models/schema.ts`, `workspaceToModel.ts`, `populateTest.ts`, `modelToYaml.ts`, `yamlToModel.ts`, `validator.ts` | `models/definitions.py`, `compiler/validator.py` |
| New component | `components/{Name}/{Name}.tsx`, `components/{Name}/{Name}.css` | — |
