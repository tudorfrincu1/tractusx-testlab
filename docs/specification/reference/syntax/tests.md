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

# Tests (`kind: test`)

A **test** defines a single, self-contained test flow targeting a specific dataspace version. It declares variables, managed services, an ordered sequence of steps, and optional cleanup steps.

---

## Header Fields

Every test starts with a set of header fields that identify and configure it:

```yaml
kind: test
name: "e2e_submodel_validation"
version: "1.0"
dataspace_version: "saturn"
description: "Provision, consume via connector, call dataplane, validate submodel"
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `string` | Recommended | auto-detected | Must be `test`. Declares this file as a single test. |
| `name` | `string` | **Yes** | — | Unique identifier for this test within its TCK. Used in dependency references and log output. |
| `version` | `string` | No | `"1.0"` | Semantic version of the test script. |
| `dataspace_version` | `string` | No | `"saturn"` | Target protocol version: `jupiter` (EDC 0.8–0.10.x) or `saturn` (EDC 0.11.x+). |
| `description` | `string` | No | — | Human-readable description shown in logs and reports. |
| `allow_sdk_calls` | `string` | No | `"ALLOWLIST"` | Controls `sdk_call` step access: `ALLOWLIST` (default, restricted) or `OPEN` (any `tractusx_sdk` function). |

---

## Variables

Variables are declared under the `variables:` block and resolved at runtime. They support default values, type hints, and runtime-only flags.

```yaml
variables:
  provider_url:
    type: str
    default: "https://provider.local/management"
  consumer_url:
    type: str
    default: "https://consumer.local/management"
  provider_api_key:
    type: str
    runtime: true
    description: "Provider management API key"
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | `"str"` | Type hint (informational). |
| `default` | `any` | `null` | Default value. Overridden by shared variables, then CLI `--var` flags. |
| `runtime` | `bool` | `false` | If `true`, the variable must be supplied at runtime via `--var`. |
| `description` | `string` | — | Documentation for the variable. |

Variables are referenced in step params using `${variable_name}` syntax:

```yaml
params:
  base_url: "${provider_url}"
  api_key: "${provider_api_key}"
```

!!! info "Resolution priority"
    Script defaults → shared variables (from TCK) → runtime `--var` flags (highest priority). During execution, `store_in_memory` values are written into the same context and can override earlier values. Cross-test references use `${!test_name:output_name}` syntax.

---

## Steps

Steps are the core of a test — an ordered sequence of operations executed by the Player.

```yaml
steps:
  - type: provision_asset
    name: "Provision test asset"
    params:
      base_url: "${provider_url}"
      api_key: "${provider_api_key}"
      bpn: "${provider_bpn}"
    on_failure: abort

  - type: catalog_search
    name: "Search provider catalog"
    params:
      consumer_url: "${consumer_url}"
      consumer_api_key: "${consumer_api_key}"
      provider_bpn: "${provider_bpn}"
    on_failure: abort
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | `string` | **Yes** | — | Step type identifier (e.g., `provision_asset`, `http_request`, `sdk_call`). |
| `name` | `string` | No | value of `type` | Human-readable label for logs and reports. |
| `if` | `string` | No | — | [Condition expression](conditions.md). Step is skipped when it evaluates to `false`. |
| `params` | `dict` | No | `{}` | Key-value parameters passed to the step handler. Supports `${var}` interpolation. |
| `on_failure` | `string` | No | `"ABORT"` | Failure policy: `ABORT` (stop the test), `CONTINUE` (warn and proceed), `SKIP_REST` (skip remaining steps). |
| `timeout_s` | `float` | No | — | Per-step timeout in seconds. |
| `expect` | `list` | No | `[]` | [Assertions](assertions.md) to evaluate against the step result. |
| `store_in_memory` | `dict` | No | — | Save values from the step result into the execution context. Keys are variable names; values are JSONPath expressions. |

### Storing Step Results

The `store_in_memory` field extracts values from a step's response and saves them as context variables for use in later steps. Values are **dot-separated paths** into the step output (not JSONPath). Use `"."` to store the entire output.

```yaml
- type: negotiate_contract
  name: "Negotiate"
  params:
    offer_id: "${catalog_offer_id}"
  store_in_memory:
    contract_agreement_id: "agreementId"
    negotiation_id: "id"

- type: initiate_transfer
  name: "Transfer"
  params:
    contract_agreement_id: "${contract_agreement_id}"
```

---

## Cleanup

Cleanup steps run **after** all regular steps, regardless of whether the test passed or failed. They use the same syntax as regular steps:

```yaml
cleanup:
  - type: cleanup_resources
    params:
      base_url: "${provider_url}"
      api_key: "${provider_api_key}"
      resource_ids:
        asset_id: "${asset_id}"
        access_policy_id: "${access_policy_id}"
        usage_policy_id: "${usage_policy_id}"
        contract_def_id: "${contract_def_id}"
```

!!! warning
    Cleanup steps always execute, even if a previous step failed with `on_failure: abort`. This ensures resources are properly released.

---

## Full Example

A complete test demonstrating all sections — variables, steps with assertions, and cleanup:

```yaml
kind: test
name: "e2e_submodel_validation"
version: "1.0"
dataspace_version: "saturn"
description: "Provision, consume via connector, call dataplane, validate submodel"

variables:
  provider_url:
    type: str
    default: "https://provider.local/management"
  consumer_url:
    type: str
    default: "https://consumer.local/management"
  provider_api_key:
    type: str
    runtime: true
  consumer_api_key:
    type: str
    runtime: true
  provider_bpn:
    type: str
    default: "BPNL000000001"

steps:
  - type: provision_asset
    name: "Provision test asset"
    params:
      base_url: "${provider_url}"
      api_key: "${provider_api_key}"
      bpn: "${provider_bpn}"
    on_failure: abort

  - type: catalog_search
    name: "Search provider catalog"
    params:
      consumer_url: "${consumer_url}"
      consumer_api_key: "${consumer_api_key}"
      provider_bpn: "${provider_bpn}"
    on_failure: abort

  - type: negotiate_contract
    name: "Negotiate contract"
    params:
      offer_id: "${catalog_offer_id}"
    on_failure: abort

  - type: initiate_transfer
    name: "Start data transfer"
    params:
      contract_agreement_id: "${contract_agreement_id}"
    on_failure: abort

  - type: retrieve_edr
    name: "Get EDR token"
    params:
      transfer_id: "${transfer_id}"
    on_failure: abort

  - type: dataplane_call
    name: "Fetch submodel from dataplane"
    params:
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
      - type: CONTAINS
        value:
          catenaXId: "*"
        severity: SOFT
        description: "Response should contain catenaXId"

  - type: validate_aspect_model
    name: "Validate payload"
    params:
      payload: "${response_body}"
    expect:
      - type: EXACT
        path: "manufacturerPartId"
        value: "MPN-001"
        severity: HARD
      - type: REGEX
        path: "catenaXId"
        value: "^urn:uuid:[0-9a-f-]+$"
        severity: HARD

cleanup:
  - type: cleanup_resources
    params:
      base_url: "${provider_url}"
      api_key: "${provider_api_key}"
      resource_ids:
        asset_id: "${asset_id}"
        access_policy_id: "${access_policy_id}"
        usage_policy_id: "${usage_policy_id}"
        contract_def_id: "${contract_def_id}"
```

---

## See Also

- [TCKs](tcks.md) — grouping multiple tests into a manifest
- [Dependencies & Outputs](dependencies-and-outputs.md) — inter-test data flow
- [Services](services.md) — managed service declarations
- [Assertions](assertions.md) — assertion types and formats

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)