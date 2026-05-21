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

# HTTP Blocks

Plain HTTP requests and Dataplane-authenticated requests.

---

## http/call

Send a plain HTTP request to any URL.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | — | Target URL |
| `method` | dropdown | Yes | — | HTTP method: GET, POST, PUT, PATCH, DELETE |
| `body` | json | No | — | Request body |
| `headers` | json | No | — | Request headers |
| `query_params` | json | No | — | URL query parameters |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `status_code` | number | status_code | HTTP response status code |
| `response_body` | object | response_body | Parsed response body |
| `response_headers` | object | response_headers | Response headers |

**Example**

```yaml
- name: check_health
  uses: http/call
  with:
    url: ${{ env.provider_url }}/health
    method: GET
  returns:
    status_code: status_code
    response_body: response_body
  validate:
    - uses: validate/assert
      with:
        input: status_code
        operator: equals
        value: 200
```

---

## http/call_dataplane

Send an HTTP request through the EDC Dataplane using an EDR token.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `dataplane_url` | string | Yes | — | Dataplane endpoint URL |
| `edr_token` | string | Yes | — | EDR authorization token |
| `method` | dropdown | No | `GET` | HTTP method: GET, POST, PUT, PATCH, DELETE |
| `path` | string | No | — | Additional path appended to dataplane URL |
| `body` | json | No | — | Request body |
| `headers` | json | No | — | Additional request headers |

**Outputs (`returns:`)**

| Field | Type | Class | Description |
|-------|------|-------|-------------|
| `status_code` | number | status_code | HTTP response status code |
| `response_body` | object | response_body | Parsed response body |
| `response_headers` | object | response_headers | Response headers |

**Example**

```yaml
- name: fetch_certificate
  uses: http/call_dataplane
  with:
    dataplane_url: ${{ vars.pull_data.dataplane_url }}
    edr_token: ${{ vars.pull_data.edr_token }}
    method: GET
    path: /api/certificates
  returns:
    status_code: status_code
    response_body: response_body
  validate:
    - uses: validate/assert
      with:
        input: status_code
        operator: equals
        value: 200
    - uses: validate/field
      with:
        input: response_body
        path: "certificates[0].type"
        operator: equals
        value: "ISO9001"
```
