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

# Managed Services

This page covers how tests declare, reference, and manage SDK services throughout their lifecycle.

---

## Services Block

Scripts can declare SDK services that are initialized once and reused across all steps. The `services` block is processed **before** step execution begins.

```yaml
name: "e2e_with_managed_services"
version: "1.0"
dataspace_version: "saturn"

services:
  - name: consumer
    type: CONNECTOR_CONSUMER
    base_url: "${consumer_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${client_id}"
      client_secret: "${client_secret}"

  - name: provider
    type: CONNECTOR_PROVIDER
    base_url: "${provider_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${provider_client_id}"
      client_secret: "${provider_client_secret}"

  - name: dtr
    type: DTR
    base_url: "${dtr_url}"
    auth:
      token_url: "${token_url}"
      client_id: "${dtr_client_id}"
      client_secret: "${dtr_client_secret}"
```

Each service entry has the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | **Yes** | Unique name used to reference this service in step `params.service`. |
| `type` | `string` | **Yes** | Service type identifier. See the [Step-Service Type Matrix](#step-service-type-matrix). |
| `base_url` | `string` | **Yes** | Base URL for the service endpoint. Supports variable substitution. |
| `auth` | `dict` | No | Authentication configuration. Structure depends on the auth method. |

### Auth Configuration

=== "OAuth2 Client Credentials"

    ```yaml
    auth:
      token_url: "${token_url}"
      client_id: "${client_id}"
      client_secret: "${client_secret}"
    ```

=== "API Key"

    ```yaml
    auth:
      api_key: "${api_key}"
    ```

---

## Step Binding via `params.service`

When a `services` block is declared, steps reference services by name instead of providing per-step connection parameters:

```yaml
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

steps:
  - type: provision_asset
    name: "Provision test asset"
    params:
      service: provider     # ← Resolves to the managed "provider" service
      bpn: "${provider_bpn}"
    on_failure: abort

  - type: catalog_search
    name: "Search catalog"
    params:
      service: consumer     # ← Resolves to the managed "consumer" service
      provider_bpn: "${provider_bpn}"
    on_failure: abort
```

---

## Resolution Priority

The Player resolves service dependencies in this order:

| Priority | Condition | Behavior |
|----------|-----------|----------|
| **1. Managed service** | `params.service` is present | Calls `ServiceManager.get(name)`, validates type, injects instance |
| **2. Direct params** | `params.service` absent, `base_url` + auth present | Creates a one-off SDK service from inline parameters |
| **3. Error** | Neither managed nor direct params | Raises `StepConfigError` with a clear message |

```yaml
steps:
  # PRIORITY 1: Managed service (preferred)
  - type: provision_asset
    name: "Using managed service"
    params:
      service: provider

  # PRIORITY 2: Direct params (legacy / standalone mode)
  - type: provision_asset
    name: "Using direct params"
    params:
      base_url: "${provider_url}"
      api_key: "${provider_api_key}"
```

---

## Type Validation

Each step declares which `ServiceType` it expects. Mismatches produce clear errors:

```yaml
services:
  - name: my_consumer
    type: CONNECTOR_CONSUMER
    base_url: "${consumer_url}"
    auth:
      api_key: "${consumer_api_key}"

steps:
  # TYPE MISMATCH — provision_asset expects CONNECTOR_PROVIDER,
  # but "my_consumer" is CONNECTOR_CONSUMER.
  # Raises ServiceTypeMismatchError:
  #   "Step 'provision_asset' expects service type 'CONNECTOR_PROVIDER',
  #    but service 'my_consumer' is of type 'CONNECTOR_CONSUMER'"
  - type: provision_asset
    name: "This will fail type validation"
    params:
      service: my_consumer
      bpn: "${provider_bpn}"
```

---

## Step-Service Type Matrix

| Step Type | Expected `ServiceType` | Binding Example |
|-----------|----------------------|-----------------|
| `provision_asset` | `CONNECTOR_PROVIDER` | `service: provider` |
| `create_access_policy` | `CONNECTOR_PROVIDER` | `service: provider` |
| `create_usage_policy` | `CONNECTOR_PROVIDER` | `service: provider` |
| `create_asset` | `CONNECTOR_PROVIDER` | `service: provider` |
| `create_contract_definition` | `CONNECTOR_PROVIDER` | `service: provider` |
| `catalog_search` | `CONNECTOR_CONSUMER` | `service: consumer` |
| `negotiate_contract` | `CONNECTOR_CONSUMER` | `service: consumer` |
| `initiate_transfer` | `CONNECTOR_CONSUMER` | `service: consumer` |
| `retrieve_edr` | `CONNECTOR_CONSUMER` | `service: consumer` |
| `dataplane_call` | `CONNECTOR_CONSUMER` | `service: consumer` |
| `http_request` | *(none — standalone)* | N/A |
| `consume_submodel` | `DTR` | `service: dtr_registry` |
| `init_service` | *(any — creates new)* | `name: new_svc` |
| `stop_service` | *(any — stops existing)* | `name: provider` |

---

## Mid-Script Service Lifecycle

The `init_service` and `stop_service` step types allow starting or stopping services during execution.

### `init_service`

Creates and registers a new service (or replaces an existing one) in the `ServiceManager`:

```yaml
steps:
  - type: provision_asset
    name: "Asset on provider-1"
    params:
      service: provider           # ← Points to provider_1_url

  # Replace the "provider" service with a new endpoint
  - type: init_service
    name: "Switch to provider-2"
    params:
      name: provider              # ← Same name, new backing service
      type: CONNECTOR_PROVIDER
      base_url: "${provider_2_url}"
      auth:
        api_key: "${provider_2_api_key}"

  - type: provision_asset
    name: "Asset on provider-2"
    params:
      service: provider           # ← Now points to provider_2_url
```

When `init_service` replaces an existing service, the `ServiceManager`:

1. Stops the existing service (closes connections)
2. Creates a new SDK service from the new params
3. Updates the cache: `"provider"` → new instance

### `stop_service`

Shuts down a previously initialized service:

```yaml
steps:
  - type: stop_service
    name: "Shutdown provider"
    params:
      name: provider
```

---

## Cleanup with Managed Services

Services are available during the `cleanup` phase, enabling resource teardown through the same binding mechanism:

```yaml
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

---

## See Also

- [Tests](tests.md) — test structure and step definitions
- [Advanced Steps](advanced-steps.md) — `sdk_call` and async callbacks
- [Dependencies & Outputs](dependencies-and-outputs.md) — inter-test data flow

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)