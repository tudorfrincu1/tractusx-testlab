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

# Conditions (`if`)

Steps can declare an `if` condition that controls whether the step executes.
The syntax is inspired by [GitHub Actions expressions](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/evaluate-expressions-in-workflows),
making it familiar to anyone who has worked with CI/CD pipelines.

When a step's `if` condition evaluates to `false`, the step is **skipped** (status `SKIPPED`) and execution continues with the next step.

---

## Quick Reference

```yaml
steps:
  # Run only when all previous steps passed (default behavior)
  - type: create_asset
    name: "Create asset"
    if: "${{ success() }}"

  # Run only when a previous step failed
  - type: http_request
    name: "Send failure notification"
    if: "${{ failure() }}"

  # Always run, regardless of previous results
  - type: http_request
    name: "Report status"
    if: "${{ always() }}"

  # Run only when a specific step succeeded
  - type: negotiate_contract
    name: "Negotiate"
    if: "${{ steps.create-asset.outcome == 'success' }}"

  # Run only when a variable has a specific value
  - type: provision_asset
    name: "Provision for prod"
    if: "${{ vars.env == 'production' }}"

  # Run only when a variable exists and is truthy
  - type: sdk_call
    name: "Optional enrichment"
    if: "${{ vars.enable_enrichment }}"
```

---

## Expression Syntax

Expressions are wrapped in `${{ }}`:

```yaml
if: "${{ <expression> }}"
```

!!! info "The `${{ }}` wrapper is optional"
    For brevity, you can write `if: "success()"` instead of `if: "${{ success() }}"`.
    Both forms are equivalent.

---

## Status Functions

Status functions check the aggregate outcome of **all previous steps** in the current test.

| Function | Returns `true` when... |
|----------|----------------------|
| `success()` | All previous steps passed. This is the implicit behavior when no `if` is specified. |
| `failure()` | At least one previous step failed. |
| `always()` | Always — the step runs regardless of previous outcomes. |

### Example: Conditional Notification on Failure

```yaml
steps:
  - type: http_request
    name: "Health check"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"
    expect:
      - type: STATUS_CODE
        value: 200

  - type: http_request
    name: "Create asset"
    if: "${{ success() }}"
    params:
      method: POST
      url: "${provider_base_url}/management/v3/assets"
      body:
        "@id": "asset-1"

  - type: http_request
    name: "Send failure alert"
    if: "${{ failure() }}"
    params:
      method: POST
      url: "${alert_webhook_url}"
      body:
        message: "Test failed — a previous step did not pass"
        test: "${test_name}"

  - type: http_request
    name: "Report final status"
    if: "${{ always() }}"
    params:
      method: POST
      url: "${status_report_url}"
      body:
        test: "${test_name}"
        timestamp: "${timestamp}"
```

In this example:

1. **Health check** runs unconditionally (no `if`).
2. **Create asset** runs only if the health check passed.
3. **Send failure alert** runs only if something failed.
4. **Report final status** always runs — it reports regardless of outcome.

---

## Step Outcome References

You can check the outcome of a **specific previous step** by its `name`:

```yaml
if: "${{ steps.<step-name>.outcome == '<value>' }}"
```

| Outcome value | Meaning |
|---------------|---------|
| `'success'` | The step passed (status `PASSED`). |
| `'failure'` | The step failed (status `FAILED`). |
| `'skipped'` | The step was skipped (status `SKIPPED`) or was not found. |

Supports both `==` and `!=` operators.

### Example: Branching Based on a Specific Step

```yaml
steps:
  - type: http_request
    name: "health-check"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"
    expect:
      - type: STATUS_CODE
        value: 200
        severity: SOFT

  # Only proceed if health-check passed
  - type: create_asset
    name: "create-asset"
    if: "${{ steps.health-check.outcome == 'success' }}"
    params:
      base_url: "${provider_base_url}"

  # Alternative path: if health-check failed, try a different provider
  - type: create_asset
    name: "create-asset-fallback"
    if: "${{ steps.health-check.outcome == 'failure' }}"
    params:
      base_url: "${fallback_provider_url}"
```

!!! tip "Step name matching"
    The `<step-name>` in `steps.<step-name>.outcome` is matched against
    the `name:` field of each step. The Player also supports qualified names
    (e.g., `my-test[0]:http_request`) and substring matches.

---

## Variable Comparisons

Compare a runtime variable against an expected value:

```yaml
if: "${{ vars.<variable-name> == '<value>' }}"
if: "${{ vars.<variable-name> != '<value>' }}"
```

### Quoting Rules

| Syntax | Matching |
|--------|----------|
| `vars.env == 'production'` | Exact string comparison (recommended for strings). |
| `vars.mode == fast` | Unquoted — compared as-is. |

### Type Coercion

Values are coerced to strings before comparison:

| Runtime type | Coerced to |
|-------------|-----------|
| `str` | As-is |
| `bool` (`True`/`False`) | `"true"` / `"false"` (lowercased) |
| `int`, `float` | String representation (`"42"`, `"3.14"`) |
| `None` (missing variable) | `""` (empty string) |

### Example: Environment-Specific Steps

```yaml
variables:
  env:
    type: str
    default: "staging"
  enable_cleanup:
    type: str
    default: "true"

steps:
  # Only run in production
  - type: create_asset
    name: "Production asset"
    if: "${{ vars.env == 'production' }}"
    params:
      base_url: "${production_url}"

  # Skip in staging
  - type: http_request
    name: "Staging-only validation"
    if: "${{ vars.env != 'production' }}"
    params:
      method: GET
      url: "${staging_validation_url}"

  # Conditional cleanup
  - type: cleanup_resources
    name: "Cleanup"
    if: "${{ vars.enable_cleanup == 'true' }}"
    params:
      resource_ids: "${created_resources}"
```

---

## Variable Truthy Checks

Check whether a variable exists and has a truthy value:

```yaml
if: "${{ vars.<variable-name> }}"
```

A variable is **truthy** when it exists and is not `None`, `""`, `False`, or `0`.

### Example: Optional Steps

```yaml
variables:
  extra_validation_url:
    type: str
    description: "Optional URL for extra validation. Omit to skip."
  debug:
    type: str
    default: ""

steps:
  - type: http_request
    name: "Core validation"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"

  # Runs only if extra_validation_url was provided at runtime
  - type: http_request
    name: "Extra validation"
    if: "${{ vars.extra_validation_url }}"
    params:
      method: GET
      url: "${extra_validation_url}"

  # Debug logging — only when debug flag is set
  - type: http_request
    name: "Debug dump"
    if: "${{ vars.debug }}"
    params:
      method: POST
      url: "${debug_endpoint}"
      body:
        context: "${debug_context}"
```

---

## Combining with Other Step Fields

The `if` condition works alongside all other step fields — `on_failure`, `expect`, `store_in_memory`, `timeout_s`:

```yaml
steps:
  - type: http_request
    name: "health-check"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"
    store_in_memory:
      health_status: "isSystemHealthy"

  - type: create_asset
    name: "Provision"
    if: "${{ steps.health-check.outcome == 'success' }}"
    on_failure: continue
    timeout_s: 30
    params:
      base_url: "${provider_base_url}"
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD
    store_in_memory:
      asset_id: "id"
```

---

## Full End-to-End Example

A complete test demonstrating conditions for health checking, branching, and always-run reporting:

```yaml
kind: test
name: "conditional-e2e"
version: "1.0"
dataspace_version: saturn
description: "E2E test with conditional steps"

variables:
  provider_base_url:
    type: str
    default: "https://provider.local"
  fallback_url:
    type: str
    default: "https://fallback.local"
  report_url:
    type: str
    default: "https://reports.local/api/results"
  env:
    type: str
    default: "staging"

steps:
  # Step 1: Health check (always runs)
  - type: http_request
    name: "health-check"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"
    expect:
      - type: STATUS_CODE
        value: 200
        severity: SOFT
      - type: EXACT
        path: "isSystemHealthy"
        value: true
        severity: SOFT

  # Step 2: Primary flow — only if healthy
  - type: create_asset
    name: "create-asset"
    if: "${{ steps.health-check.outcome == 'success' }}"
    params:
      base_url: "${provider_base_url}"
    store_in_memory:
      asset_id: "id"

  # Step 3: Fallback — only if health check failed
  - type: create_asset
    name: "create-asset-fallback"
    if: "${{ steps.health-check.outcome == 'failure' }}"
    params:
      base_url: "${fallback_url}"
    store_in_memory:
      asset_id: "id"

  # Step 4: Production-only step
  - type: http_request
    name: "production-audit"
    if: "${{ vars.env == 'production' }}"
    params:
      method: POST
      url: "${provider_base_url}/api/audit"
      body:
        asset_id: "${asset_id}"

  # Step 5: Always report — even if everything failed
  - type: http_request
    name: "report-status"
    if: "${{ always() }}"
    params:
      method: POST
      url: "${report_url}"
      body:
        test: "conditional-e2e"
        environment: "${env}"

cleanup:
  - type: cleanup_resources
    params:
      base_url: "${provider_base_url}"
      resource_ids:
        asset_id: "${asset_id}"
```

---

## Step Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `if` | `string` | — | Condition expression. Step is skipped when it evaluates to `false`. |

For the complete list of step fields, see [Tests — Steps](tests.md#steps).

---

## Expression Reference

| Expression | Description |
|-----------|-------------|
| `success()` | True when all previous steps passed. |
| `failure()` | True when at least one previous step failed. |
| `always()` | Always true. |
| `steps.<name>.outcome == 'success'` | True when the named step passed. |
| `steps.<name>.outcome == 'failure'` | True when the named step failed. |
| `steps.<name>.outcome == 'skipped'` | True when the named step was skipped or not found. |
| `steps.<name>.outcome != '<value>'` | Negated outcome check. |
| `vars.<name> == '<value>'` | True when the variable equals the value. |
| `vars.<name> != '<value>'` | True when the variable does not equal the value. |
| `vars.<name>` | True when the variable exists and is truthy. |

---

## See Also

- [Tests](tests.md) — step definitions, variables, and cleanup
- [Assertions](assertions.md) — validating step results with `expect`
- [Dependencies & Outputs](dependencies-and-outputs.md) — inter-test dependencies and output sharing

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)
