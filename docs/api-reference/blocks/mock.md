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

# Mock Blocks

Expose HTTP endpoints, wait for callbacks, and provide protocol-aware mocks that the System Under Test (SUT) can call during execution.

---

## mock/endpoint

Expose an HTTP endpoint that the SUT can call.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique endpoint ID |
| `method` | dropdown | Yes | — | HTTP method: GET, POST, PUT, PATCH, DELETE |
| `path` | api_path | Yes | — | URL path pattern |
| `response_status` | number | No | `200` | HTTP status code to return |
| `response_body` | json | No | — | Response body payload |
| `response_headers` | json | No | — | Response headers |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `endpoint_id` | string | endpoint_id | The endpoint ID for downstream reference |

**Example**

```yaml
- name: expose_callback
  uses: mock/endpoint
  with:
    id: certificate_callback
    method: POST
    path: /api/certificates/callback
    response_status: 200
    response_body: { "status": "received" }
  returns:
    endpoint_id: endpoint_id
```

---

## mock/wait/http_request

Block execution until the SUT sends a request to the specified mock endpoint. Times out if no call arrives.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `endpoint_id` | endpoint_ref | Yes | — | Reference to a mock endpoint defined by `mock/endpoint` |
| `timeout_s` | number | No | `30` | Maximum seconds to wait |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `callback_payload` | object | callback_payload | Full JSON payload received from the callback request |

**Example**

```yaml
- name: wait_for_certificate
  uses: mock/wait/http_request
  with:
    endpoint_id: ${{ vars.expose_callback.endpoint_id }}
    timeout_s: 60
  returns:
    callback_payload: callback_payload
  validate:
    - uses: validate/field
      with:
        input: callback_payload
        path: "header.messageId"
        operator: not_null
```

---

## mock/dtr

Expose a protocol-aware Digital Twin Registry mock.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique mock ID |
| `shells` | json | No | — | Pre-configured shell descriptors |

**Outputs (`returns:`)** — None (template block)

**Example**

```yaml
- name: dtr_mock
  uses: mock/dtr
  with:
    id: provider_dtr
    shells:
      - idShort: "CertShell"
        globalAssetId: "urn:uuid:abc-123"
```

---

## mock/discovery

Expose a discovery service mock.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique mock ID |
| `mappings` | json | Yes | — | BPN → EDC endpoint mappings |

**Outputs (`returns:`)** — None (template block)

**Example**

```yaml
- name: discovery_mock
  uses: mock/discovery
  with:
    id: discovery_finder
    mappings:
      BPNL000000000001: "https://edc.provider.local/api/dsp"
```
