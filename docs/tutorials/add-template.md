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

# How to Add a New Template

Templates are reusable step sequences that users can insert as a single "Step Template" block. They abstract common multi-step patterns (like catalog negotiation + transfer).

## Step 1 — Create the template YAML

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

## Step 2 — Register in the template index

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

## Step 3 — Add template outputs to the variable collection

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

## Step 4 — Verify

1. Reload the IDE
2. Drag a "Step Template" block from the "Template" toolbox category
3. Set its template field to `my-template`
4. Downstream blocks should show `result_value` in their variable dropdowns
