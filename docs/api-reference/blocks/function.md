<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# Function Blocks

Utility operations for generating values and extracting data from JSON structures.

---

## util/generate_uuid

Generate a UUID v4 value.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `store_in_variable` | string | No | — | Optional variable name to store the result |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `uuid` | string | uuid | Generated UUID v4 |

**Example**

```yaml
- name: gen_id
  uses: util/generate_uuid
  returns:
    uuid: uuid
```

---

## util/generate_bpn

Generate a valid Business Partner Number.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prefix` | dropdown | No | `BPNL` | BPN prefix: BPNL, BPNS, or BPNA |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `bpn` | string | bpn | Generated BPN |

**Example**

```yaml
- name: gen_bpn
  uses: util/generate_bpn
  with:
    prefix: BPNL
  returns:
    bpn: bpn
```

---

## util/json_path_extract

Extract a value from a JSON object using dot-notation path.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `variable` | variable | Yes | — | Source variable to extract from |
| `path` | json_path | Yes | — | Dot-notation path (e.g., `data.items[0].id`) |
| `store_in_variable` | string | No | — | Optional variable name to store the result |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `value` | unknown | extracted_value | Extracted value |

**Example**

```yaml
- name: extract_asset
  uses: util/json_path_extract
  with:
    variable: ${{ vars.query_catalog.catalog }}
    path: "dcat:dataset[0].@id"
  returns:
    value: extracted_value
```

---

## util/validate_path

Extract and validate a value exists at the given path.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `variable` | variable | Yes | — | Source variable to validate |
| `path` | json_path | Yes | — | Dot-notation path |
| `store_in_variable` | string | No | — | Optional variable name to store the result |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `value` | unknown | extracted_value | Extracted value (fails if path does not exist) |

**Example**

```yaml
- name: check_path
  uses: util/validate_path
  with:
    variable: ${{ vars.wait_callback.callback_payload }}
    path: "content.certificationId"
  returns:
    value: extracted_value
```
