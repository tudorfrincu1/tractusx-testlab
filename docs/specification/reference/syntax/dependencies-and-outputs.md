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

# Dependencies & Outputs

This page covers how tests exchange data through dependencies and outputs. These features enable complex multi-step workflows where later tests consume results from earlier ones.

---

## Choosing the Right Include Mechanism

TestLab provides three distinct ways to reference external YAML files. Each serves a different purpose:

| Mechanism | Scope | Syntax | Purpose |
|-----------|-------|--------|---------|
| `"!include"` | Test case `tests:` list | `- "!include tests/file.yaml"` | **Load** a test into the test case. No dependency relationship implied. |
| `import` | Individual test | `import: "negotiate_contract.yaml"` | **Inherit** steps, services, listeners, and other fields from a base test file, with inline overrides. |
| File-based `depends_on` | Individual test | `depends_on: [{file: "file.yaml", outputs: [...]}]` | **Load a dependency** from a file, establish execution ordering, and selectively import outputs. |

!!! tip "When to use which"
    - Use `"!include"` when you want to add a self-contained test to a test case.
    - Use `import` when you want to reuse and customize a test template.
    - Use file-based `depends_on` when a test needs outputs from another test defined in a separate file.

---

## Test Dependencies (`depends_on`)

Tests within a test case can declare dependencies on other tests. The Player resolves the dependency graph and executes tests in topological order. If a dependency fails, all downstream tests are automatically **skipped**.

```yaml
kind: test-case
name: "edr_flow"
version: "1.0"

tests:
  - kind: test
    name: "negotiate_contract"
    steps:
      - name: negotiate
        type: connector.negotiate
        # ...
    outputs:
      agreement_id: negotiation_agreement_id

  - kind: test
    name: "initiate_transfer"
    depends_on:
      - negotiate_contract
    steps:
      - name: transfer
        type: connector.transfer
        params:
          agreement_id: "${agreement_id}"
        # ...
    outputs:
      edr_token: transfer_edr_token

  - kind: test
    name: "call_dataplane"
    depends_on:
      - initiate_transfer
    steps:
      - name: dataplane_call
        type: http
        params:
          url: "${provider_dataplane_url}"
          headers:
            Authorization: "Bearer ${edr_token}"
```

If `negotiate_contract` fails, both `initiate_transfer` **and** `call_dataplane` are skipped with the message:

> `Skipped — unmet dependencies: negotiate_contract`

!!! warning "Circular dependencies"
    Circular dependencies (e.g. A depends on B and B depends on A) are detected at load time and raise a `ValueError`.

---

## Output Variable References (`${!test_name:output}`)

Instead of using `depends_on` explicitly, you can reference another test's output directly in variable defaults or step params using the `${!test_name:output_name}` syntax. This **automatically infers** the dependency — there is no need to declare `depends_on` separately.

```yaml
kind: test-case
name: "edr_flow"
version: "1.0"

tests:
  - kind: test
    name: "negotiate_contract"
    steps:
      - name: negotiate
        type: connector.negotiate
        # ...
    outputs:
      agreement_id: negotiation_agreement_id

  - kind: test
    name: "call_dataplane"
    variables:
      edr_token: "${!negotiate_contract:agreement_id}"
    steps:
      - name: dataplane_call
        type: http
        params:
          url: "${provider_dataplane_url}"
          headers:
            Authorization: "Bearer ${edr_token}"
```

The parser scans all variable defaults and step params for `${!...}` references and appends the referenced test names to the consumer's `depends_on` list. At runtime, the Player stores each test's outputs under both the plain export name (`agreement_id`) and the namespaced key (`!negotiate_contract:agreement_id`), so both `${agreement_id}` and `${!negotiate_contract:agreement_id}` resolve to the same value.

| Syntax | Meaning |
|--------|---------|
| `${var_name}` | Resolve from the shared context (any source) |
| `${!test_name:output_name}` | Resolve from a specific test's output (auto-infers dependency) |

---

## Importing Test Content (`import`)

A test entry in a test case can load its steps, services, listeners, and other content from an **external YAML file** using the `import` field. Any fields specified inline override the imported values.

```yaml
kind: test-case
name: "edr_flow"
version: "1.0"

tests:
  - kind: test
    name: "negotiate_contract"
    import: "negotiate_contract.yaml"
    outputs:
      agreement_id: negotiation_agreement_id

  - kind: test
    name: "call_backend"
    variables:
      edr_token: "${!negotiate_contract:agreement_id}"
    import: "call-backend-test.yaml"
```

### Import Merge Rules

| Field | Behavior |
|-------|----------|
| `name` | Inline overrides the imported name |
| `version`, `dataspace_version` | Inline overrides the imported value |
| `outputs` | Inline **replaces** the imported outputs entirely |
| `variables` | Inline **replaces** the imported variables (non-empty only) |
| `steps`, `cleanup`, `services`, `listen` | Inline **replaces** the imported list (non-empty only) |
| `depends_on` | Inline **replaces** (non-empty only), plus auto-inferred `${!...}` refs |
| `description` | Inline overrides (if specified) |

!!! info "File resolution"
    The path is resolved relative to the YAML file's directory, then falls back to the `tests/` subdirectory.

---

## File-Based Dependencies (via `depends_on`)

As an alternative to `import` + `${!...}`, a `depends_on` entry can reference a test defined in an **external file**. The parser loads the test from the file, adds it to the test case, and resolves the dependency by name. You can optionally select which `outputs` from the file to import.

```yaml
kind: test-case
name: "cross_file_flow"
version: "1.0"

tests:
  - kind: test
    name: "call_dataplane"
    depends_on:
      - file: "negotiate_contract.yaml"
        outputs:
          - agreement_id
    steps:
      - name: dataplane_call
        type: http
        params:
          url: "${provider_dataplane_url}"
          headers:
            Authorization: "Bearer ${agreement_id}"
```

### File-Based Dependency Rules

| Rule | Detail |
|------|--------|
| **File resolution** | Resolved relative to the YAML file's directory, then falls back to the `tests/` subdirectory |
| **Output selection** | If `outputs` is specified, only those outputs are promoted to the shared context. If omitted, **all** outputs from the file's test are promoted |
| **Validation** | The parser validates that every entry in `outputs` actually exists in the file's test `outputs` map. A `ValueError` is raised for unknown outputs |
| **Nested file deps** | A file-loaded test **cannot** itself have file-based `depends_on` entries. Only one level of file resolution is supported |
| **Deduplication** | If multiple tests depend on the same file, the test is loaded once. Output selections from all consumers are merged (union) |

---

## Test Outputs (`outputs`)

A test can export context variables so that downstream tests (via `depends_on` or `${!test_name:output}`) can consume them. The `outputs` field is a mapping from **export name** → **context variable name** produced during execution.

```yaml
kind: test
name: "retrieve_edr"
steps:
  - name: get_edr
    type: connector.get_edr
    params:
      transfer_id: "${transfer_id}"
    store_in_memory:
      edr_auth_token: "authToken"

outputs:
  # After this test completes, the variable "edr_token" is available
  # via ${edr_token} or ${!retrieve_edr:edr_token}
  edr_token: edr_auth_token
```

### How Output Promotion Works

1. During execution, `store_in_memory` saves step results into the test context (e.g. `edr_auth_token`).
2. After successful completion, the Player reads each `outputs` entry and promotes the referenced variable into the shared test-case context under the export name.
3. Downstream tests reference the exported value with `${edr_token}`.

!!! warning
    If a test fails, its outputs are **not** promoted — downstream tests that depend on it are skipped.

---

## See Also

- [Tests](tests.md) — structure of a single test, including `store_in_memory` and variables
- [Test Cases](test-cases.md) — grouping tests with shared variables
- [Services](services.md) — managed service declarations

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)