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

# Advanced Step Types

This page covers specialized step types that go beyond standard HTTP requests: direct SDK function invocation and asynchronous callback handling.

---

## SDK Function Invocation (`sdk_call`)

The `sdk_call` step type enables direct invocation of SDK module functions from YAML. By default, only allowlisted functions are permitted.

```yaml
name: "sdk_call_example"
version: "1.0"
dataspace_version: "saturn"
# allow_sdk_calls: open  # Uncomment to allow any tractusx_sdk function

variables:
  provider_url:
    type: str
    runtime: true
  api_key:
    type: str
    runtime: true

steps:
  # Call a ServiceFactory method to get a consumer service
  - type: sdk_call
    name: "Get consumer service"
    params:
      function: "dataspace.services.connector.service_factory.get_connector_consumer_service"
      args:
        dataspace_version: "saturn"
        base_url: "${provider_url}"
        api_key: "${api_key}"
    store_in_memory:
      consumer_service: "."
    on_failure: ABORT

  # Call an instance method on the returned service
  - type: sdk_call
    name: "Fetch catalog"
    params:
      function: "get_catalog"
      instance: "${consumer_service}"
      kwargs:
        provider_bpn: "BPNL000000001"
    store_in_memory:
      catalog_response: "."
    on_failure: ABORT
    validate:
      - type: CONTAINS
        value:
          "@type": "dcat:Catalog"
        severity: HARD
```

### `sdk_call` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `params.function` | `string` | **Yes** | Fully qualified function path (module functions) or method name (instance methods). |
| `params.args` | `dict` | No | Positional arguments passed as keyword arguments to the function. |
| `params.kwargs` | `dict` | No | Explicit keyword arguments. |
| `params.instance` | `string` | No | Variable reference to an object instance. When present, `function` is called as a method on that instance. |

### Security: Allowlisting

By default, only pre-approved SDK functions can be invoked. To allow any `tractusx_sdk` function, set `allow_sdk_calls: open` at the script level.

!!! warning
    Setting `allow_sdk_calls: open` should only be used in controlled testing environments. In production test packages, use the default allowlist.

---

## Async Callbacks / Webhook Endpoints

For operations requiring asynchronous responses, scripts can declare a `listen` block and use `await_callback` steps.

### The `listen` Block

Declared at the script level, `listen` defines callback endpoints that the Player starts before step execution:

```yaml
listen:
  - name: notification_ack
    path: "/callbacks/notification/{notification_id}"
    method: POST
    timeout_s: 30
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | **Yes** | — | Identifier used by `await_callback` steps. |
| `path` | `string` | **Yes** | — | URL path pattern. Supports `{param}` placeholders. |
| `method` | `string` | No | `POST` | HTTP method to listen for. |
| `timeout_s` | `int` | No | `30` | Seconds to wait before timing out. |

### The `await_callback` Step

This step pauses execution until the matching listener receives a request:

```yaml
steps:
  # Send a notification that expects an async acknowledgment
  - type: dataplane_call
    name: "Send notification"
    params:
      method: POST
      endpoint: "${edr_endpoint}"
      edr_token: "${edr_token}"
      path: "/api/v1/notification/receive"
      body:
        header:
          notificationId: "notify-001"
          senderBPN: "${consumer_bpn}"
          recipientBPN: "${provider_bpn}"
          replyTo: "${callback_base_url}/callbacks/notification/notify-001"
        content:
          quality-alert: true
    on_failure: ABORT

  # Wait for the external system to POST back to our callback endpoint
  - type: await_callback
    name: "Wait for notification acknowledgment"
    params:
      listener: notification_ack
    store_in_memory:
      ack_response: "."
    on_failure: ABORT
    timeout_s: 30
    validate:
      - type: CONTAINS
        value:
          status: "ACKNOWLEDGED"
        severity: HARD
      - type: EXACT
        path: "header.notificationId"
        value: "notify-001"
        severity: HARD
```

### `await_callback` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `params.listener` | `string` | **Yes** | Name of the listener (from the `listen` block). |
| `store_in_memory` | `dict` | No | Save values from the received payload. Use `"."` to store the entire body. |
| `timeout_s` | `int` | No | Override the listener's default timeout. |
| `validate` | `list` | No | [Assertions](assertions.md) applied to the received payload. |

### Full Callback Example

```yaml
name: "notification_with_callback"
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

listen:
  - name: notification_ack
    path: "/callbacks/notification/{notification_id}"
    method: POST
    timeout_s: 30

variables:
  consumer_url:
    type: str
    runtime: true
  token_url:
    type: str
    runtime: true
  client_id:
    type: str
    runtime: true
  client_secret:
    type: str
    runtime: true
  callback_base_url:
    type: str
    default: "http://localhost:8100"

steps:
  - type: dataplane_call
    name: "Send notification"
    params:
      method: POST
      endpoint: "${edr_endpoint}"
      edr_token: "${edr_token}"
      path: "/api/v1/notification/receive"
      body:
        header:
          notificationId: "notify-001"
          senderBPN: "${consumer_bpn}"
          recipientBPN: "${provider_bpn}"
          replyTo: "${callback_base_url}/callbacks/notification/notify-001"
        content:
          quality-alert: true
    on_failure: ABORT

  - type: await_callback
    name: "Wait for notification acknowledgment"
    params:
      listener: notification_ack
    store_in_memory:
      ack_response: "."
    on_failure: ABORT
    timeout_s: 30
    validate:
      - type: CONTAINS
        value:
          status: "ACKNOWLEDGED"
        severity: HARD
      - type: EXACT
        path: "header.notificationId"
        value: "notify-001"
        severity: HARD
```

---

## See Also

- [Tests](tests.md) — standard step types and structure
- [Services](services.md) — managed service lifecycle, including `init_service` and `stop_service`
- [Assertions](assertions.md) — assertion types and value formats

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)