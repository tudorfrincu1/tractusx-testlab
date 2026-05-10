<!--

Eclipse Tractus-X - Software Development KIT

Copyright (c) 2026 Catena-X Automotive Network e.V.
Copyright (c) 2026 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This work is made available under the terms of the
Creative Commons Attribution 4.0 International (CC-BY-4.0) license,
which is available at
https://creativecommons.org/licenses/by/4.0/legalcode.

SPDX-License-Identifier: CC-BY-4.0

-->

# Writing Test Scripts

This section walks through creating YAML tests from scratch, organizing them into a test case, and bundling supporting assets.

## Project Structure

Start by creating a project directory with the following layout:

```
my-connector-tests/
├── tests/
│   ├── provision_and_consume.yaml     # Test 1: E2E data exchange
│   └── submodel_validation.yaml       # Test 2: Submodel schema check
├── assets/
│   └── schemas/
│       └── serial-part-3.0.json       # JSON Schema for validation
└── test-case.yaml                     # Test case definition (ties tests together)
```

## Step 1 — Write the First Test Script

Create `tests/provision_and_consume.yaml` — an end-to-end test that provisions an asset on a provider connector, negotiates a contract from the consumer side, transfers data, and validates the response via the dataplane.

```yaml
# tests/provision_and_consume.yaml
name: "provision_and_consume"
version: "1.0"
dataspace_version: "saturn"
description: "E2E: Provision asset → Catalog search → Negotiate → Transfer → Dataplane GET"

# ─── Managed Services ───────────────────────────────────────────────
# These SDK service instances are initialized once before steps run.
# Steps reference them by name via params.service (no per-step auth).
services:
  - name: provider
    type: CONNECTOR_PROVIDER
    base_url: "${provider_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${provider_client_id}"
      client_secret: "${provider_client_secret}"

  - name: consumer
    type: CONNECTOR_CONSUMER
    base_url: "${consumer_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${consumer_client_id}"
      client_secret: "${consumer_client_secret}"

# ─── Variables ──────────────────────────────────────────────────────
# runtime: true → must be provided at execution time (no default)
variables:
  provider_url:
    type: str
    runtime: true
    description: "Provider connector management API URL"
  consumer_url:
    type: str
    runtime: true
    description: "Consumer connector management API URL"
  token_url:
    type: str
    runtime: true
    description: "OAuth2 token endpoint"
  provider_client_id:
    type: str
    runtime: true
  provider_client_secret:
    type: str
    runtime: true
  consumer_client_id:
    type: str
    runtime: true
  consumer_client_secret:
    type: str
    runtime: true
  provider_bpn:
    type: str
    default: "BPNL000000001"
    description: "Provider Business Partner Number"
  asset_id:
    type: str
    default: "test-asset-001"

# ─── Steps ──────────────────────────────────────────────────────────
steps:
  # 1. Provision a test asset on the provider connector
  - type: provision_asset
    name: "Provision test asset"
    params:
      service: provider                # ← Managed service binding
      asset_id: "${asset_id}"
      bpn: "${provider_bpn}"
      properties:
        "asset:prop:name": "Walkthrough Test Asset"
        "asset:prop:contenttype": "application/json"
    on_failure: abort
    expect:
      - type: CONTAINS
        value:
          asset_id: "${asset_id}"
        severity: HARD
        description: "Asset should be created with the requested ID"

  # 2. Search the provider's catalog from the consumer
  - type: catalog_search
    name: "Search provider catalog"
    params:
      service: consumer                # ← Different managed service
      provider_bpn: "${provider_bpn}"
    on_failure: abort
    expect:
      - type: CONTAINS
        value:
          "@type": "dcat:Catalog"
        severity: HARD
        description: "Response must be a DCAT Catalog"
      - type: CONTAINS
        path: "dcat:dataset"
        value:
          "edc:id": "${asset_id}"
        severity: HARD
        description: "Catalog must contain our provisioned asset"

  # 3. Negotiate a contract for the asset
  - type: negotiate_contract
    name: "Negotiate contract"
    params:
      service: consumer
      offer_id: "${catalog_offer_id}"  # ← Output from previous step
    on_failure: abort
    timeout_s: 60
    expect:
      - type: REGEX
        path: "contract_agreement_id"
        value: "^[a-zA-Z0-9-]+$"
        severity: HARD

  # 4. Initiate a data transfer
  - type: initiate_transfer
    name: "Start data transfer"
    params:
      service: consumer
      contract_agreement_id: "${contract_agreement_id}"
    on_failure: abort
    timeout_s: 120

  # 5. Retrieve the EDR (Endpoint Data Reference)
  - type: retrieve_edr
    name: "Get EDR token"
    params:
      service: consumer
      transfer_id: "${transfer_id}"
    on_failure: abort

  # 6. Call the dataplane to fetch actual data
  - type: dataplane_call
    name: "Fetch asset data from dataplane"
    params:
      service: consumer
      method: GET
      endpoint: "${edr_endpoint}"
      edr_token: "${edr_token}"
      path: "/api/v3.0/submodel"
      query_params:
        content: value
        extent: withBlobValue
      headers:
        Accept: "application/json"
    on_failure: abort
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD
      - type: SCHEMA
        source: FILE
        path: "schemas/serial-part-3.0.json"
        severity: HARD
        description: "Response must conform to SerialPart 3.0 schema"
      - type: CONTAINS
        value:
          catenaXId: "*"
        severity: SOFT
        description: "Response should contain a catenaXId field"

# ─── Cleanup ────────────────────────────────────────────────────────
# Always runs, even if steps above fail
cleanup:
  - type: cleanup_resources
    params:
      service: provider
      resource_ids:
        asset_id: "${asset_id}"
        access_policy_id: "${access_policy_id}"
        usage_policy_id: "${usage_policy_id}"
        contract_def_id: "${contract_def_id}"
```

### What's Happening Here

1. **Services block** — Two managed SDK services (`provider` and `consumer`) are declared with OAuth2 credentials. They're initialized once before step execution.
2. **Variables** — Runtime variables (no default) must be supplied when executing. Variables with defaults can be overridden.
3. **Steps** — Each step references a managed service by name (`service: provider`). Steps produce output variables (e.g., `${catalog_offer_id}`, `${contract_agreement_id}`) that subsequent steps consume.
4. **Assertions** — Each step has `expect` blocks with `hard` severity (failure = step failure) or `soft` severity (failure = warning only).
5. **Cleanup** — Deletes provisioned resources regardless of test outcome.

---

## Step 2 — Write the Second Test Script

Create `tests/submodel_validation.yaml` — a focused test that fetches a submodel via the full connector pipeline and validates it against a JSON schema.

```yaml
# tests/submodel_validation.yaml
name: "submodel_validation"
version: "1.0"
dataspace_version: "saturn"
description: "Consume a submodel through the full connector pipeline and validate its schema"

services:
  - name: consumer
    type: CONNECTOR_CONSUMER
    base_url: "${consumer_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${consumer_client_id}"
      client_secret: "${consumer_client_secret}"

variables:
  consumer_url:
    type: str
    runtime: true
  token_url:
    type: str
    runtime: true
  consumer_client_id:
    type: str
    runtime: true
  consumer_client_secret:
    type: str
    runtime: true
  provider_bpn:
    type: str
    default: "BPNL000000001"

steps:
  # Single high-level step that does catalog → negotiate → transfer → EDR → GET
  - type: consume_submodel
    name: "Consume submodel via connector pipeline"
    params:
      service: consumer
      provider_bpn: "${provider_bpn}"
    on_failure: abort
    timeout_s: 180
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD

  # Validate the submodel payload against the aspect model schema
  - type: validate_aspect_model
    name: "Validate SerialPart 3.0 schema"
    params:
      payload: "${submodel_payload}"    # ← Output from consume_submodel
    on_failure: abort
    expect:
      - type: EXACT
        path: "valid"
        value: true
        severity: HARD
        description: "Payload must conform to the aspect model schema"

  # Field-level assertions on the submodel content
  - type: validate_aspect_model
    name: "Check submodel fields"
    params:
      payload: "${submodel_payload}"
    on_failure: continue
    expect:
      - type: REGEX
        path: "catenaXId"
        value: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        severity: HARD
        description: "catenaXId must be a valid URN UUID"
      - type: CONTAINS
        path: "partTypeInformation"
        value:
          classification: "component"
        severity: SOFT
        description: "Part should be classified as 'component'"
```

---

## Step 3 — Add Supporting Assets

Create the JSON Schema file that the assertions reference:

```
assets/schemas/serial-part-3.0.json
```

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:samm:io.catenax.serial_part:3.0.0#SerialPart",
  "type": "object",
  "required": ["catenaXId", "localIdentifiers", "partTypeInformation"],
  "properties": {
    "catenaXId": {
      "type": "string",
      "pattern": "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "localIdentifiers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "value"],
        "properties": {
          "type": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    },
    "partTypeInformation": {
      "type": "object",
      "required": ["manufacturerPartId", "classification", "nameAtManufacturer"],
      "properties": {
        "manufacturerPartId": { "type": "string" },
        "classification": { "type": "string", "enum": ["product", "raw material", "software", "assembly", "component"] },
        "nameAtManufacturer": { "type": "string" }
      }
    }
  }
}
```

This file will be bundled into the `.testpkg` under `assets/schemas/` and referenced by assertions via `source: file` + `path: "schemas/serial-part-3.0.json"`.

---

## Step 4 — Create the Test Case Definition

Create `test-case.yaml` at the project root — this ties tests together and defines shared variables that are inherited by all tests.

```yaml
# test-case.yaml
name: "connector_e2e"
version: "1.0"
description: "End-to-end connector test case: provisioning, consumption, and submodel validation"

# ─── Shared Variables ───────────────────────────────────────────────
# Available to ALL tests in this test case.
# Tests can also declare their own variables (test-local).
shared_variables:
  provider_url:
    type: str
    runtime: true
    description: "Provider connector management API URL"
  consumer_url:
    type: str
    runtime: true
    description: "Consumer connector management API URL"
  token_url:
    type: str
    runtime: true
    description: "OAuth2 token endpoint"
  provider_client_id:
    type: str
    runtime: true
  provider_client_secret:
    type: str
    runtime: true
  consumer_client_id:
    type: str
    runtime: true
  consumer_client_secret:
    type: str
    runtime: true
  provider_bpn:
    type: str
    default: "BPNL000000001"

# ─── Tests ──────────────────────────────────────────────────────────
# Executed sequentially, in order. Each gets an isolated context
# seeded with the shared variables above.
tests:
  - "!include tests/provision_and_consume.yaml"
  - "!include tests/submodel_validation.yaml"
```

### Importing Predefined Tests

Tests often repeat across test cases — only some parameters change. Instead of duplicating YAML files, you can **import** predefined tests from a test library and **override** specific values:

```yaml
# test-case.yaml — reusing predefined tests
name: "connector_staging"
version: "1.0"
description: "Staging environment connector tests with custom BPN"

shared_variables:
  provider_url:
    type: str
    runtime: true
  consumer_url:
    type: str
    runtime: true
  token_url:
    type: str
    runtime: true
  provider_client_id:
    type: str
    runtime: true
  provider_client_secret:
    type: str
    runtime: true
  consumer_client_id:
    type: str
    runtime: true
  consumer_client_secret:
    type: str
    runtime: true

tests:
  # Import a predefined test and override a variable default
  - import: "tractusx/connector/provision_and_consume@1.0"
    override:
      variables:
        provider_bpn:
          default: "BPNL000000099"

  # Import another predefined test as-is
  - import: "tractusx/connector/submodel_validation@1.0"

  # Mix with local tests
  - "!include tests/my_custom_check.yaml"
```

| Syntax | Purpose |
|--------|---------|
| `import: "<library>/<test>@<version>"` | Import a predefined test from a registered test library |
| `override.variables` | Override specific variable declarations (defaults, types, descriptions) |
| `override.steps` | Override individual step parameters by step name |
| `"!include tests/<file>.yaml"` | Include a local test file (relative to test case file) |

The Compiler resolves imports at compile-time. Predefined tests are fetched from the test library path (configurable via `--library-path` or the `TESTLAB_LIBRARY_PATH` environment variable).

### What the Test Case Does

- **`shared_variables`** — Defined once, available to all tests. Avoids duplicating OAuth2 credentials and URLs across tests.
- **`"!include"`** — String directive that loads external test files into the test case. Tests are still validated individually.
- **`import`** — References a predefined test from a shared library. Supports `override` to customize variables or steps without modifying the original.
- **Execution order** — Tests run sequentially. Each test gets an isolated `StepContext` seeded with the shared variables (no variable leakage between tests).

---

## Final Project Layout

```
my-connector-tests/
├── tests/
│   ├── provision_and_consume.yaml     # 6 steps + cleanup
│   └── submodel_validation.yaml       # 3 steps
├── assets/
│   └── schemas/
│       └── serial-part-3.0.json       # Assertion schema
└── test-case.yaml                     # Test case definition
```

You're ready to compile. Continue to [Compiling Packages](compiling-packages.md).

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)