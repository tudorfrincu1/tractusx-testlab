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

# EDC Connector Blocks

Consumer and provider operations on Eclipse Dataspace Connectors.

---

## connector/consumer/query_catalog

Query the catalog from the consumer side.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `counter_party_address` | string | Yes | — | Provider DSP endpoint URL |
| `filter_by` | string | No | — | Filter property name |
| `filter_value` | string | No | — | Filter property value |
| `operator` | string | No | `=` | Filter operator |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `catalog` | object | catalog | Full catalog response |
| `datasets` | array | datasets | Filtered dataset entries |

---

## connector/consumer/query_catalog_with_filters

Query catalog with multiple filter expressions.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `counter_party_address` | string | Yes | — | Provider DSP endpoint URL |
| `filters` | filter_expression_list | No | — | List of filter expressions |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `catalog` | object | catalog | Full catalog response |
| `datasets` | array | datasets | Filtered dataset entries |

---

## connector/consumer/filter_expression

!!! info "Operator Block"
    This is an **operator block** — it does not execute independently. It configures the `filters` input of main blocks like `query_catalog_with_filters` and `pull_data_filtered`.

A single filter criterion (used inside `filters` lists).

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `operand_left` | dropdown | Yes | — | Property: dct:type, edc:type, edc:id, dct:subject, cx-common:version |
| `operand_left_custom` | string | No | — | Custom property name (overrides dropdown) |
| `operator` | dropdown | Yes | — | Operator: =, !=, like, in |
| `operand_right` | value | Yes | — | Value to compare against |

**Outputs (`returns:`)** — None (configuration block)

---

## connector/consumer/negotiate

Initiate contract negotiation.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `counter_party_address` | string | Yes | — | Provider DSP endpoint URL |
| `offer_id` | string | Yes | — | Offer ID from catalog |
| `asset_id` | string | Yes | — | Asset ID to negotiate for |
| `store_in_variable` | string | No | — | Optional variable name |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `negotiation_id` | string | negotiation_id | Negotiation process ID |
| `agreement_id` | string | agreement_id | Resulting contract agreement ID |
| `state` | string | state | Final negotiation state |

---

## connector/consumer/initiate_transfer

Start a data transfer process.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `agreement_id` | string | Yes | — | Contract agreement ID |
| `asset_id` | string | Yes | — | Asset ID to transfer |
| `transfer_type` | dropdown | No | `HttpData-PULL` | Transfer type: HttpData-PULL, HttpData-PUSH, AmazonS3-PUSH |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `transfer_id` | string | transfer_id | Transfer process ID |
| `state` | string | state | Final transfer state |
| `data_address` | object | response_body | Data address for accessing transferred data |

---

## connector/provider/create_asset

Register an asset in the provider connector.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `asset_id` | string | No | Auto-generated UUID | Asset identifier |
| `name` | string | Yes | — | Human-readable asset name |
| `description` | string | No | — | Asset description |
| `base_url` | string | Yes | — | Backend data source URL |
| `content_type` | string | No | — | MIME type of the data |
| `properties` | json | No | — | Additional asset properties |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `asset_id` | string | asset_id | Created asset ID |

---

## connector/provider/create_policy

Create an access or usage policy.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `policy_id` | string | No | Auto-generated UUID | Policy identifier |
| `permissions` | array | Yes | — | ODRL permission rules |
| `prohibitions` | array | No | — | ODRL prohibition rules |
| `obligations` | array | No | — | ODRL obligation rules |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `policy_id` | string | policy_id | Created policy ID |

---

## connector/provider/create_contract_def

Create a contract definition linking policies to assets.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `contract_def_id` | string | No | Auto-generated UUID | Contract definition ID |
| `access_policy_id` | string | Yes | — | Access policy ID |
| `contract_policy_id` | string | Yes | — | Contract policy ID |
| `asset_selector` | array | Yes | — | Asset selection criteria |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `contract_def_id` | string | contract_def_id | Created contract definition ID |

---

## connector/consumer/pull_data_filtered

!!! tip "Shortcut Block"
    Combines catalog query → negotiate → transfer → EDR in a single step.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | EDC connector service reference |
| `counter_party_id` | string | Yes | — | Provider BPN |
| `counter_party_address` | string | Yes | — | Provider DSP endpoint URL |
| `filters` | filter_expression_list | Yes | — | Filter expressions for catalog query |
| `max_wait` | number | No | `60` | Max seconds to wait for transfer |
| `poll_interval` | number | No | `1` | Seconds between status polls |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `edr_token` | string | auth_token | EDR authorization token |
| `dataplane_url` | string | dataplane_url | Dataplane endpoint URL |
| `agreement_id` | string | agreement_id | Contract agreement ID |
| `negotiation_id` | string | negotiation_id | Negotiation process ID |
| `transfer_id` | string | transfer_id | Transfer process ID |
| `asset_id` | string | asset_id | Resolved asset ID |

---

## connector/consumer/pull_data_filtered_by_policy

!!! tip "Shortcut Block"
    Same as `pull_data_filtered` but with policy matching.

**Inputs (`with:`)** — Same as `pull_data_filtered` plus:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `policies` | array | Yes | — | ODRL policies to match in the catalog |

**Outputs (`returns:`)** — Same as `pull_data_filtered`

---

## connector/consumer/pull_data_from_precondition

!!! tip "Shortcut Block"
    Same as `pull_data_filtered` but using precondition-defined policies.

**Inputs (`with:`)** — Same as `pull_data_filtered` plus:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `precondition_policy_var` | string | Yes | — | Variable referencing precondition policy |

**Outputs (`returns:`)** — Same as `pull_data_filtered`
