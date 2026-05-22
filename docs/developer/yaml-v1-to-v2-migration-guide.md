<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

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

# YAML Syntax v1 → v2 Migration Guide

Internal reference for the development team. Based on ADR-0009, ADR-0010, ADR-0011, and ADR-0013.

---

## 1. Keyword Mapping (v1 → v2)

| v1 Keyword | v2 Keyword | Notes |
|------------|------------|-------|
| `type:` (step) | `uses:` | Namespaced: `connector/query_catalog`, `validate/assert` |
| `params:` | `with:` | Same semantics, new name |
| `store_in_memory:` / `store_in_variable:` | `returns:` | Now typed with `type` + `class` |
| `@variable_name` | `${{ steps.id.field }}` | Local step output reference |
| `@variable_name` (global) | `${{ env.variable }}` | Environment variable reference |
| `variables:` (TCK root) | `env.variables:` | Under `env:` block |
| `services:` (per-test) | `env.services:` (TCK-level) | No per-test declarations |
| `preconditions:` (flat list) | `preconditions:` (typed categories) | Uses `precondition/generate`, `/input`, `/provide`, `/check` |
| `validate:` (inline assertions) | `validate:` (inline) + standalone `validate/assert` steps | Both patterns supported |
| `mock/create_endpoint` | `mock/api` | Explicit method, path, response fields |
| `http/call` (generic) | `http/call_dataplane` | Accepts `dataplane_url` + `edr_token` directly |
| N/A | `metadata:` | Structured TCK metadata block |
| N/A | `${{ execution.x }}` | Runtime-injected context |
| N/A | `${{ preconditions.id.field }}` | Precondition namespace |
| N/A | `${{ env.services.<name>.<field> }}` | Service returns reference |
| N/A | `${{ setup.id.field }}` | Setup step output reference |
| N/A | `setup:` / `teardown:` | First-class lifecycle phases |

### Step namespace consolidation (v1 → v2)

| v1 Step Type | v2 Step `uses:` |
|--------------|-----------------|
| `edc_create_asset` | `connector/create_asset` |
| `edc_negotiate` | `connector/negotiate` |
| `query_catalog_with_filters` | `connector/query_catalog` |
| N/A (manual multi-step) | `connector/pull_data_filtered` (composite) |
| `mock_create_endpoint` | `mock/api` |
| `http_call` | `http/call_dataplane` |
| `generate_uuid` | Removed — assertions are standalone steps now |

## 2. Variable Interpolation Syntax

| Scope | Syntax | Example |
|-------|--------|---------|
| Step output (local) | `${{ steps.<id>.<field> }}` | `${{ steps.query_catalog.datasets }}` |
| Environment (global) | `${{ env.<name> }}` | `${{ env.provider_url }}` |
| Service returns | `${{ env.services.<name>.<field> }}` | `${{ env.services.testlab_connector.connector_service }}` |
| Metadata | `${{ metadata.<field> }}` | `${{ metadata.dataspace_version }}` |
| Execution (runtime) | `${{ execution.<field> }}` | `${{ execution.run_id }}` |
| Preconditions | `${{ preconditions.<id>.<field> }}` | `${{ preconditions.sut_connector.counter_party_address }}` |
| Setup outputs | `${{ setup.<id>.<field> }}` | `${{ setup.create_asset.asset_id }}` |
| Inline validate (self) | bare field name | `input: datasets` (inside own `validate:` block) |

**Rule**: Two user-facing concepts only — step outputs (local) and environment variables (public).

**Important**: Services are referenced through their returns namespace (`${{ env.services.<name>.<return_key> }}`), not by name alone. The service declaration's `returns:` block defines what fields are available.

## 3. Configuration Changes

### Services are TCK-level with typed returns

v1 declared services per-test, causing redundancy:

```yaml
# v1 — repeated in every test file
services:
  - name: provider_connector
    type: connector_connector_saturn
    config:
      base_url: "@provider_address"
```

v2 declares once at TCK level under `env.services`. The service name now reflects what it IS (e.g., `testlab_connector`), not a generic role:

```yaml
# v2 — declared once in TCK manifest
env:
  services:
    - name: testlab_connector
      uses: service/connector_service
      with:
        base_url: ${{ env.testlab_connector_url }}
        dataspace_version: ${{ metadata.dataspace_version }}
        auth:
          type: api_key
          api_key: "test-api-key"
          api_key_header: "X-Api-Key"
      returns:
        connector_service:
          type: class
          class: ConnectorService
```

Steps reference the service via its returns: `${{ env.services.testlab_connector.connector_service }}`. This produces a class-typed handle that the runtime uses to instantiate the actual service client.

### Preconditions use service returns for health checks

```yaml
preconditions:
  - id: health_testlab_connector
    uses: connector/health_check
    with:
      connector_service: ${{ env.services.testlab_connector.connector_service }}
      dataspace_version: ${{ metadata.dataspace_version }}
```

### Typed variable class system

Every `returns:` field declares `type` (primitive) and optionally `class` (domain type):

```yaml
returns:
  datasets:
    type: object
    class: Datasets
```

Primitive types: `string`, `integer`, `boolean`, `object`, `array`, `class`.
Class taxonomy: flat PascalCase (`AssetId`, `PolicyId`, `ConnectorService`, `Url`, `Bpn`).

Input params declare `accepts:` for type filtering — enables autocomplete and validation.

### Preconditions as configuration contracts

Four categories replace ad-hoc setup:

| Category | Direction | Purpose |
|----------|-----------|---------|
| `precondition/generate` | TestLab → User | Auto-generated values (URLs, BPNs) |
| `precondition/provide` | TestLab → User | Templates and documentation |
| `precondition/input` | User → TestLab | Required user-provided values |
| `precondition/check` | Executable | Validates prerequisites at runtime |

Preconditions are immutable after TCK start. Referenced via `${{ preconditions.id.field }}`.

**Policy as precondition output**: In v1, policies were defined with custom DSL. In v2, `precondition/provide` returns a policy object that steps reference directly — no reformatting needed:

```yaml
- id: ccm_policy
  uses: precondition/provide
  name: "CCM membership policy"
  returns:
    policy: { type: object, class: Policy }
```

Referenced as: `policy: ${{ preconditions.ccm_policy.policy }}`

### Setup and teardown phases

v2 introduces first-class lifecycle phases. `setup:` steps create infrastructure, `teardown:` steps clean up:

```yaml
setup:
  - id: create_asset
    uses: connector/create_asset
    with:
      connector_service: ${{ env.services.testlab_connector.connector_service }}
      asset_id: ${{ preconditions.asset_config.asset_id }}
    returns:
      asset_id: { type: string, class: AssetId }

teardown:
  - id: delete_asset
    uses: connector/delete_asset
    with:
      connector_service: ${{ env.services.testlab_connector.connector_service }}
      asset_id: ${{ setup.create_asset.asset_id }}
```

Setup outputs are available to main steps via `${{ setup.<step_id>.<field> }}`. Teardown can reference both setup and step outputs.

## 4. Improvement Potentials for IDE

### Core v2 capabilities

| Area | What v2 Enables |
|------|-----------------|
| **Typed autocomplete** | `class` on outputs + `accepts` on inputs enables filtered variable suggestions |
| **Schema validation** | `env.schemas` + `validate/schema` step makes JSON Schema validation a first-class compile-time check |
| **Unified step pattern** | Services, preconditions, steps, assertions all follow `uses:` + `with:` — one editor pattern |
| **Execution context** | `${{ execution.x }}` replaces manual runtime variable workarounds |
| **Metadata** | Structured `metadata:` block (standards, authors, license) replaces flat top-level fields |

### Improvement potentials from Certificate Management v2 examples

#### IP-1: Test data centralization

The `expose_testlab_asset.yaml` embeds full BusinessPartnerCertificate payloads inline in `mock/api`. If multiple tests need similar payloads, these should be declared in `env.testdata` and referenced. The IDE should have a "Test Data" tab to manage these fixtures — import JSON, browse, and reference by ID.

#### IP-2: Composite step patterns

`connector/pull_data_filtered` encapsulates catalog → negotiate → transfer → EDR in one step. This pattern should be extended: any sequence of >3 steps that always runs together could become a composite. TCK authors shouldn't need to implement the dataspace handshake manually. The IDE block palette should distinguish composite blocks visually (e.g., stacked icon).

#### IP-3: Assertions as standalone steps

In v2, assertions can appear BOTH as inline `validate:` blocks AND as standalone steps with their own `id`:

```yaml
# Standalone assertion — visible in flow, gets its own ID
- id: assert_edr_token_1
  uses: validate/assert
  name: EDR token must be returned
  with:
    input: "${{ steps.pull_data_1.edr_token }}"
    operator: not_null
```

Benefits: visible as discrete nodes in the graph view, better for debugging (you see exactly which assertion failed), supports conditional logic, eliminates the need for `generate_uuid` placeholder steps.

#### IP-4: Setup/teardown variable scoping

Setup step outputs are available to main steps via `${{ setup.step_id.field }}`. Teardown can reference both setup and step outputs. The IDE should display setup/teardown as distinct phases in the visual editor — collapsible panels above and below the main flow.

#### IP-5: Service returns as typed handles

`${{ env.services.testlab_connector.connector_service }}` produces a class-typed handle (`ConnectorService`) that the runtime uses to instantiate the actual service client. This eliminates magic string lookups and enables the IDE to validate that a step's `connector_service` input actually receives a `ConnectorService`-typed value.

#### IP-6: Mock lifecycle management

`mock/api` returns a `MockInstance` class that can be passed to `mock/wait/http_request` to wait for callbacks:

```yaml
- id: mock_ccm_api
  uses: mock/api
  with:
    method: GET
    path: "/api/catena/certificate-management/v1/certificates"
    response_status: 200
    response_body: ${{ env.testdata.certificate_payload }}
  returns:
    mock_instance: { type: class, class: MockInstance }

- id: wait_for_callback
  uses: mock/wait/http_request
  with:
    mock_instance: ${{ steps.mock_ccm_api.mock_instance }}
    timeout: 30
```

This creates a typed link between mock setup and mock assertion — no more correlating by path strings.

#### IP-7: Inline validate shorthand

Inside a step's own `validate:` block, input can be the bare return field name without `${{ }}` wrapping:

```yaml
validate:
  - uses: validate/assert
    with: { input: datasets, operator: not_null }
```

vs external reference needing full path: `input: "${{ steps.pull_data_1.datasets }}"`. Reduces noise for the common case where you validate a step's own output immediately.

#### IP-8: `connector/` namespace consolidation

v1 had scattered step names: `edc_create_asset`, `edc_negotiate`, `query_catalog_with_filters`. v2 groups under `connector/`: `connector/create_asset`, `connector/query_catalog`, `connector/pull_data_filtered`, `connector/negotiate`. The namespace groups related operations and makes IDE block palette discovery easier.

#### IP-9: Policy as precondition output

In v1, policies were defined with custom DSL inline. In v2, `precondition/provide` returns a policy object that steps can reference directly: `policy: ${{ preconditions.ccm_policy.policy }}`. No reformatting needed — the runtime handles serialization.

#### IP-10: No `generate_uuid` placeholder steps

v1 needed dummy `generate_uuid` steps to separate validation blocks (because assertions couldn't exist without a preceding step). v2 eliminates this entirely — assertions are standalone steps with their own `id` and can be placed anywhere in the flow.

## 5. TCK Configuration Pattern (v2)

Minimal v2 TCK structure:

```yaml
kind: tck
testlab: v1-alpha
id: <tck-id>
namespace: <namespace>
metadata:
  name: "<Human-readable name>"
  dataspace_version: saturn
env:
  variables:
    testlab_connector_url: ""
    sut_connector_url: ""
  services:
    - name: testlab_connector
      uses: service/connector_service
      with:
        base_url: ${{ env.testlab_connector_url }}
        dataspace_version: ${{ metadata.dataspace_version }}
      returns:
        connector_service: { type: class, class: ConnectorService }
  schemas:
    <schema_id>:
      file: <filename>.json
  testdata:
    <testdata_id>:
      file: <filename>.json
preconditions:
  - id: health_testlab_connector
    uses: connector/health_check
    with:
      connector_service: ${{ env.services.testlab_connector.connector_service }}
      dataspace_version: ${{ metadata.dataspace_version }}
  - id: <id>
    uses: precondition/<category>
    name: "<Label>"
    returns: { ... }
tests:
  - <test_file>.yaml
```

Resolution order at TCK load: variables → metadata → services → schemas/testdata → preconditions.

## 6. Migration Checklist

When converting a v1 TCK to v2:

- [ ] Add `testlab: v1-alpha`, `id:`, `namespace:` to TCK manifest
- [ ] Add `metadata:` block with `name` and `dataspace_version`
- [ ] Move `variables:` under `env.variables:`
- [ ] Move per-test `services:` to TCK-level `env.services:` (deduplicate)
- [ ] Rename service names to reflect identity (`provider` → `testlab_connector`)
- [ ] Convert service `type:` to `uses: service/<type>`, `config:` to `with:`
- [ ] Add `returns:` with typed class to each service (e.g., `connector_service: { type: class, class: ConnectorService }`)
- [ ] Update all service references to use `${{ env.services.<name>.<return_key> }}` pattern
- [ ] Convert `preconditions:` to categorized format (`precondition/generate`, `/input`, etc.)
- [ ] Add health check preconditions using service returns
- [ ] Add `returns:` with typed fields to each precondition
- [ ] In test files: add `testlab: v1-alpha`, `id:`, `namespace:`
- [ ] In test files: remove `services:` block entirely
- [ ] Replace all `type:` on steps with `uses:` (namespace the step type)
- [ ] Replace all `params:` with `with:`
- [ ] Replace all `store_in_memory:` / `store_in_variable:` with `returns:` (add type + class)
- [ ] Replace `@variable` references with appropriate `${{ }}` syntax
- [ ] Replace `mock/create_endpoint` with `mock/api` (add `method`, `path`, `response_status`, `response_body`)
- [ ] Replace generic `http/call` with `http/call_dataplane` where applicable
- [ ] Convert inline `validate:` blocks to `uses: validate/<type>` + `with:` pattern
- [ ] Consider extracting repeated assertion sequences into standalone `validate/assert` steps
- [ ] Remove `generate_uuid` placeholder steps — use standalone assertions instead
- [ ] Extract setup steps into `setup:` phase, cleanup into `teardown:`
- [ ] Replace multi-step boilerplate (catalog→negotiate→transfer→EDR) with `connector/pull_data_filtered`
- [ ] Move inline test data payloads to `env.testdata` where reuse is expected
- [ ] Ensure step field ordering: `id` → `uses` → `name` → `with` → `returns` → `validate`
- [ ] Validate no test file declares its own `env:` block
- [ ] Run compiler validation on converted files

## 7. Step Field Ordering (Mandatory)

```yaml
- id: <step_id>           # required
  uses: <namespace/type>  # required
  name: "<label>"         # optional, human-readable
  with:                   # optional, step inputs
    key: value
  returns:                # optional, typed outputs
    field: { type: ..., class: ... }
  validate:               # optional, inline assertions
    - uses: validate/<type>
      with: { ... }
```

This ordering applies to steps, services, and preconditions uniformly.

## 8. Key Syntax Patterns (from Certificate Management v2)

### Pattern 1: Service reference via returns

```yaml
# Declaration (TCK manifest)
env:
  services:
    - name: testlab_connector
      uses: service/connector_service
      with:
        base_url: ${{ env.testlab_connector_url }}
        dataspace_version: ${{ metadata.dataspace_version }}
      returns:
        connector_service: { type: class, class: ConnectorService }

# Usage (in any step)
with:
  connector_service: ${{ env.services.testlab_connector.connector_service }}
```

### Pattern 2: Composite step with rich returns

```yaml
- id: pull_data_1
  uses: connector/pull_data_filtered
  name: Discover offers, negotiate, and obtain EDR
  with:
    connector_service: ${{ env.services.testlab_connector.connector_service }}
    counter_party_address: ${{ preconditions.sut_connector.counter_party_address }}
    policy: ${{ preconditions.ccm_policy.policy }}
    filters:
      - operandLeft: "'dcterms:type'.'@id'"
        operator: "="
        operandRight: "cx-taxo:ReadAccessPoolForCatenaXMember"
  returns:
    catalog: { type: object, class: Catalog }
    datasets: { type: array, class: Datasets }
    asset_id: { type: string, class: AssetId }
    negotiation_id: { type: string, class: NegotiationId }
    transfer_process_id: { type: string, class: TransferId }
    edr_token: { type: string, class: AuthToken }
    dataplane_url: { type: string, class: DataplaneUrl }
```

### Pattern 3: Standalone assertion step

```yaml
- id: assert_edr_token_1
  uses: validate/assert
  name: EDR token must be returned
  with:
    input: "${{ steps.pull_data_1.edr_token }}"
    operator: not_null
```

### Pattern 4: Mock API with typed lifecycle

```yaml
- id: mock_ccm_api
  uses: mock/api
  name: Mock CCM certificates endpoint
  with:
    method: GET
    path: "/api/catena/certificate-management/v1/certificates"
    response_status: 200
    response_body: ${{ env.testdata.certificate_payload }}
  returns:
    mock_instance: { type: class, class: MockInstance }

# Later — wait for the SUT to call our mock
- id: wait_callback
  uses: mock/wait/http_request
  name: Wait for SUT to call certificates endpoint
  with:
    mock_instance: ${{ steps.mock_ccm_api.mock_instance }}
    timeout: 30
  returns:
    request: { type: object, class: HttpRequest }
```

### Pattern 5: Dataplane call with EDR

```yaml
- id: call_dataplane
  uses: http/call_dataplane
  name: Call dataplane with EDR token
  with:
    dataplane_url: ${{ steps.pull_data_1.dataplane_url }}
    edr_token: ${{ steps.pull_data_1.edr_token }}
  returns:
    response_body: { type: object, class: HttpResponse }
    status_code: { type: integer, class: HttpStatus }
```

### Pattern 6: Inline validate shorthand (self-reference)

```yaml
- id: pull_data_1
  uses: connector/pull_data_filtered
  with: { ... }
  returns:
    datasets: { type: array, class: Datasets }
    edr_token: { type: string, class: AuthToken }
  validate:
    - uses: validate/assert
      with: { input: datasets, operator: not_null }
    - uses: validate/assert
      with: { input: edr_token, operator: not_null }
```

Inside the step's own `validate:` block, bare field names resolve to the step's own returns. No `${{ }}` needed.

### Pattern 7: Setup/teardown with cross-phase references

```yaml
setup:
  - id: create_mock
    uses: mock/api
    with:
      method: GET
      path: "/api/v1/data"
      response_status: 200
      response_body: '{"result": "ok"}'
    returns:
      mock_instance: { type: class, class: MockInstance }

steps:
  - id: trigger_sut
    uses: http/call
    with:
      url: ${{ preconditions.sut.trigger_url }}
  - id: verify_callback
    uses: mock/wait/http_request
    with:
      mock_instance: ${{ setup.create_mock.mock_instance }}
      timeout: 30

teardown:
  - id: cleanup_mock
    uses: mock/cleanup
    with:
      mock_instance: ${{ setup.create_mock.mock_instance }}
```
