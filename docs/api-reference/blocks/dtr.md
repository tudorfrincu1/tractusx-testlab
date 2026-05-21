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

# Digital Twin Registry Blocks

AAS shell and submodel registration and lookup operations.

---

## dtr/register_shell

Register an Asset Administration Shell descriptor.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | DTR service reference |
| `id_short` | string | Yes | — | Shell short identifier |
| `global_asset_id` | string | No | — | Global asset ID (URN) |
| `specific_asset_ids` | json | No | — | Key-value specific asset IDs |
| `submodel_descriptors` | json | No | — | Initial submodel descriptors |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `shell_id` | string | shell_id | Created shell ID |
| `shell_descriptor` | object | shell_descriptor | Full shell descriptor object |

**Example**

```yaml
- name: register_cert_shell
  uses: dtr/register_shell
  with:
    service: provider_dtr
    id_short: "CertificateShell"
    global_asset_id: ${{ vars.gen_id.uuid }}
    specific_asset_ids:
      manufacturerPartId: "CERT-001"
      bpn: ${{ vars.gen_bpn.bpn }}
  returns:
    shell_id: shell_id
    shell_descriptor: shell_descriptor
```

---

## dtr/lookup_shell

Look up shells by specific asset IDs.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | DTR service reference |
| `asset_ids` | json | Yes | — | Key-value pairs to search by |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `shell_ids` | array | shell_ids | Matching shell IDs |
| `shell_descriptors` | array | shell_descriptor | Full shell descriptor objects |

**Example**

```yaml
- name: lookup_cert
  uses: dtr/lookup_shell
  with:
    service: consumer_dtr
    asset_ids:
      manufacturerPartId: "CERT-001"
  returns:
    shell_ids: shell_ids
    shell_descriptors: shell_descriptor
  validate:
    - uses: validate/assert
      with:
        input: shell_ids
        operator: not_null
```

---

## dtr/add_submodel

Attach a submodel descriptor to an existing shell.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `service` | service_ref | Yes | — | DTR service reference |
| `shell_id` | string | Yes | — | Target shell ID |
| `id_short` | string | Yes | — | Submodel short identifier |
| `semantic_id` | string | Yes | — | Semantic ID (e.g., CX standard URN) |
| `endpoint_url` | string | Yes | — | Submodel endpoint URL |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `submodel_id` | string | submodel_id | Created submodel descriptor ID |

**Example**

```yaml
- name: add_cert_submodel
  uses: dtr/add_submodel
  with:
    service: provider_dtr
    shell_id: ${{ vars.register_cert_shell.shell_id }}
    id_short: "CertificateSubmodel"
    semantic_id: "urn:samm:io.catenax.certificate_management:2.0.0#CertificateManagement"
    endpoint_url: ${{ env.provider_submodel_url }}
  returns:
    submodel_id: submodel_id
```
