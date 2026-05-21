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

# TCK Manifest Configuration

The TCK manifest defines the test environment. It uses YAML but is not authored with blocks — it is configured via forms and editors in the IDE.

---

## env.services

Service definitions declare the participants and their connection details.

```yaml
env:
  services:
    provider:
      role: provider
      version: jupiter
      auth:
        type: oauth2
        token_url: "${{ env.PROVIDER_TOKEN_URL }}"
        client_id: "${{ env.PROVIDER_CLIENT_ID }}"
        client_secret: "${{ env.PROVIDER_CLIENT_SECRET }}"
    consumer:
      role: consumer
      version: jupiter
      auth:
        type: oauth2
        token_url: "${{ env.CONSUMER_TOKEN_URL }}"
        client_id: "${{ env.CONSUMER_CLIENT_ID }}"
        client_secret: "${{ env.CONSUMER_CLIENT_SECRET }}"
    dtr:
      role: dtr
      version: v3
      auth:
        type: api_key
        header: "X-Api-Key"
        value: "${{ env.DTR_API_KEY }}"
```

### Service Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | yes | Service role: `provider`, `consumer`, `dtr`, `discovery` |
| `version` | string | yes | Protocol version: `jupiter` (EDC 0.8–0.10), `saturn` (EDC 0.11+), `v3` (AAS) |
| `auth` | object | no | Authentication configuration |
| `auth.type` | string | yes (if auth) | Auth type: `oauth2`, `api_key`, `basic`, `none` |
| `auth.token_url` | string | oauth2 | Token endpoint URL |
| `auth.client_id` | string | oauth2 | Client ID |
| `auth.client_secret` | string | oauth2 | Client secret (use env var reference) |
| `auth.header` | string | api_key | Header name for API key |
| `auth.value` | string | api_key | API key value |

---

## env.variables

Environment variables provide configurable inputs to the test suite.

```yaml
env:
  variables:
    PROVIDER_BPN:
      type: input
      description: "BPN of the provider participant"
    CONSUMER_BPN:
      type: input
      description: "BPN of the consumer participant"
    TEST_UUID:
      type: function
      generator: uuid_v4
      description: "Auto-generated UUID for test isolation"
    MANUAL_TOKEN:
      type: manual
      secret: true
      description: "Manually entered auth token"
```

### Variable Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Variable type: `input` (user provides), `manual` (entered at runtime), `function` (auto-generated) |
| `description` | string | no | Human-readable description |
| `secret` | boolean | no | If true, value is masked in UI and logs |
| `generator` | string | function type | Generator function: `uuid_v4`, `bpn`, `timestamp` |
| `default` | any | no | Default value for input types |

Variables are referenced in test files as `${{ env.VARIABLE_NAME }}`.

---

## env.schemas

JSON Schema references for use in `validate/schema` blocks.

```yaml
env:
  schemas:
    certificate_response: "./schemas/certificate-response.schema.json"
    notification_header: "./schemas/notification-header.schema.json"
```

Each entry is a key-value pair:

- **Key**: schema identifier referenced in validation blocks as `${{ env.schemas.key }}`
- **Value**: relative path to the JSON Schema file

---

## Preconditions

Setup steps that run before tests. They create infrastructure (assets, policies, contracts) that tests depend on.

```yaml
preconditions:
  - name: "Create test asset"
    uses: connector/provider/create_asset
    with:
      service: provider
      name: "Test Asset"
      base_url: "${{ env.MOCK_URL }}/api/data"
    returns:
      asset_id: asset_id

  - name: "Create access policy"
    uses: connector/provider/create_policy
    with:
      service: provider
      permissions:
        - action: "use"
          constraint:
            leftOperand: "BusinessPartnerNumber"
            operator: "eq"
            rightOperand: "${{ env.CONSUMER_BPN }}"
    returns:
      policy_id: policy_id
```

### Precondition Behavior

- Run once before all tests in the TCK
- Use the same `uses:`/`with:`/`returns:` syntax as test steps
- Share the same block catalog as test steps
- Their `returns:` variables are available to all test files as `${{ vars.precondition_name.field }}`
- If any precondition fails, all tests are skipped

!!! warning "Order Matters"
    Preconditions execute in the order they are defined. Later preconditions can reference outputs from earlier ones.
