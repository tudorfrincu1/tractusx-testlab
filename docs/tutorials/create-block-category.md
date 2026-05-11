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

# How to Create a New Block Category (IDE)

If your blocks don't fit any existing category, create a new one.

## Step 1 — Create the category folder

```bash
mkdir ide/public/blocks/my-category/
```

## Step 2 — Create block JSON files in the folder

Follow the same format as [How to Create a New Block](create-block.md). Place your `.json` files in the new folder.

## Step 3 — Add the category to `index.json`

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

## Step 4 — Add a color for the category

Open `ide/src/components/BlockEditor/blockColors.ts` and add an entry:

```typescript
"My Category": "#2563EB",   // Pick a distinct hex color
```

This color is used for:

- Block fill color in the Blockly workspace
- Node border color in the dependency graph
- Category indicator in the toolbox

## Step 5 — Service type resolution (if service-gated)

If your category uses `service_type`, open `ide/src/components/BlockEditor/toolbox/toolboxBuilder.ts` and add the mapping to `SERVICE_TYPE_RESOLUTION`:

```typescript
const SERVICE_TYPE_RESOLUTION: Record<string, string[]> = {
  "edc-connector": ["edc-connector"],
  "digital-twin-registry": ["digital-twin-registry"],
  "discovery-finder": ["discovery-finder"],
  "my-category": ["my_service"],  // ← add this
};
```

## Step 6 — Verify

Reload the IDE. Your new category should appear in the toolbox (or after configuring the required service, if service-gated).
