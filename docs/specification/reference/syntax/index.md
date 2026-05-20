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

# YAML Syntax Reference

TestLab tests are authored in YAML. This reference is organized into focused pages that cover each aspect of the syntax in detail.

## Document Types

Every YAML file starts with a `kind:` field that declares its type, following the [Kubernetes convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/):

| Type | `kind:` value | Purpose | Key field |
|------|--------------|---------|----------|
| **Test** | `test` | A single, self-contained test targeting one dataspace version. Contains variables, services, steps, assertions, and cleanup. | `steps:` |
| **TCK** | `tck` | A manifest that groups multiple tests under shared variables. References tests by file path or inline definition. | `tests:` |

!!! tip "Auto-detection"
    For backward compatibility, if `kind:` is omitted the Player auto-detects the type from the document structure: a `tests:` key means **TCK**, otherwise **test**.

---

## Reference Pages

<div class="grid cards" markdown>

-   :material-flask-outline:{ .lg .middle } **[Tests](tests.md)**

    ---

    Structure and fields of a `kind: test` document — variables, steps, cleanup, and the complete field reference.

-   :material-format-list-group:{ .lg .middle } **[TCKs](tcks.md)**

    ---

    How to compose multiple tests into a `kind: tck` manifest with shared variables, `"!include"` directives, and library imports.

-   :material-source-branch:{ .lg .middle } **[Dependencies & Outputs](dependencies-and-outputs.md)**

    ---

    Inter-test dependencies (`depends_on`), output variable references (`${!test:output}`), the `import` field, and file-based dependency resolution.

-   :material-server-network:{ .lg .middle } **[Services](services.md)**

    ---

    Managed service declarations, step–service binding (`params.service`), resolution priority, type validation, and mid-script lifecycle (`init_service` / `stop_service`).

-   :material-check-decagram:{ .lg .middle } **[Assertions](assertions.md)**

    ---

    Assertion value formats (inline, JSON, file, variable), field-level assertions with dot-notation, severity levels, and assertion types.

-   :material-source-branch-check:{ .lg .middle } **[Conditions](conditions.md)**

    ---

    GitHub Actions-style `if` conditions for steps — status functions (`success()`, `failure()`, `always()`), step outcome references, variable comparisons, and truthy checks.

-   :material-code-braces:{ .lg .middle } **[Advanced Steps](advanced-steps.md)**

    ---

    SDK function invocation (`sdk_call`), async callbacks and webhook endpoints (`listen` / `await_callback`).

</div>

---

## Quick Example

A minimal test and the TCK that runs it:

=== "Test (`kind: test`)"

    ```yaml
    kind: test
    name: my-first-test
    version: "1.0"
    dataspace_version: saturn

    steps:
      - type: create_asset
        name: "Create test asset"
        params:
          asset_id: "test-asset-001"
        validate:
          - type: STATUS_CODE
            value: 200
            severity: HARD
    ```

=== "TCK (`kind: tck`)"

    ```yaml
    kind: tck
    name: regression-suite
    version: "1.0"

    tests:
      - "!include tests/provision.yaml"
      - "!include tests/consume.yaml"
      - "!include tests/cleanup.yaml"
    ```

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)