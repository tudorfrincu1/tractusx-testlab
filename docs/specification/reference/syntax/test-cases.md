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

# Test Cases (`kind: test-case`)

A **test case** is a manifest that groups multiple [tests](tests.md) under shared variables. Tests are referenced by file path via `"!include"` directives, inline definition, or library import.

---

## Structure

```yaml
kind: test-case
name: "connector_regression"
version: "2.0"
description: "Full regression for saturn connectors"

shared_variables:
  provider_url:
    type: str
    runtime: true
  consumer_url:
    type: str
    runtime: true

tests:
  - "!include tests/provision_and_consume.yaml"
  - "!include tests/submodel_validation.yaml"
  - "!include tests/notification_test.yaml"
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `string` | Recommended | auto-detected | Must be `test-case`. |
| `name` | `string` | **Yes** | — | Identifier for the test case. Used in logs and package manifests. |
| `version` | `string` | No | `"1.0"` | Semantic version of the test case. |
| `description` | `string` | No | — | Human-readable description. |
| `shared_variables` | `dict` | No | — | Variables shared across all tests in this case. Override individual test defaults. |
| `tests` | `list` | **Yes** | — | Ordered list of tests to execute. Entries can be `"!include"` file references, inline definitions, or `import` directives. |
| `imports` | `list` | No | `[]` | Library imports (see [below](#importing-from-a-library)). |

---

## Referencing Tests

Tests can be included in three ways:

### 1. `"!include"` Directive (string)

A string starting with `"!include "` followed by a relative file path. The parser resolves the file relative to the test case YAML and loads it as a test definition.

```yaml
tests:
  - "!include tests/provision_and_consume.yaml"
  - "!include tests/submodel_validation.yaml"
```

### 2. Inline Definition

A test can be defined directly inside the test case:

```yaml
tests:
  - kind: test
    name: "quick_smoke_test"
    dataspace_version: saturn
    steps:
      - type: http_request
        name: "Health check"
        params:
          method: GET
          url: "${provider_url}/api/check/health"
        expect:
          - type: STATUS_CODE
            value: 200
            severity: HARD
```

### Mixed Usage

All styles can be combined freely:

```yaml
tests:
  - "!include tests/smoke.yaml"        # file include directive
  - kind: test                          # inline definition
    name: "inline_check"
    steps:
      - type: http_request
        name: "Ping"
        params:
          method: GET
          url: "${base_url}/health"
```

---

## Shared Variables

Shared variables are declared at the test case level and are available to all tests within the case. They override individual test defaults but are themselves overridden by runtime `--var` flags.

```yaml
shared_variables:
  provider_url:
    type: str
    runtime: true
  consumer_url:
    type: str
    runtime: true
  provider_api_key:
    type: str
    runtime: true
  consumer_api_key:
    type: str
    runtime: true
```

!!! info "Resolution priority"
    Test defaults → shared variables → runtime `--var` flags (highest priority).

---

## Execution Order

Tests execute in **declaration order** by default. When tests declare [dependencies](dependencies-and-outputs.md), the Player reorders them using topological sort while preserving the relative order of independent tests.

```yaml
tests:
  # These run in order unless depends_on changes the ordering
  - "!include tests/provision.yaml"       # runs 1st
  - "!include tests/negotiate.yaml"       # runs 2nd
  - "!include tests/transfer.yaml"        # runs 3rd
  - "!include tests/cleanup.yaml"         # runs 4th
```

---

## Importing from a Library

Tests can be imported from a shared test library and optionally overridden:

```yaml
tests:
  # Import a predefined test and override a variable
  - import: "tractusx/connector/provision_and_consume@1.0"
    override:
      variables:
        provider_bpn:
          default: "BPNL000000099"

  # Import a predefined test as-is
  - import: "tractusx/connector/submodel_validation@1.0"

  # Include a local test
  - "!include tests/custom_check.yaml"
```

The `import` syntax references tests by `<library>/<test-name>@<version>`. The Compiler resolves imports from the library path (`--library-path` or `TESTLAB_LIBRARY_PATH`).

---

## See Also

- [Tests](tests.md) — structure of a single test
- [Dependencies & Outputs](dependencies-and-outputs.md) — inter-test data flow and the `import` field
- [Services](services.md) — managed service declarations

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)