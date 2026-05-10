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

# Assertions

Assertions validate step responses against expected values. Each step can declare one or more assertions in its `expect` list.

---

## Assertion Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | `string` | **Yes** | — | Assertion type: `EXACT`, `CONTAINS`, `SCHEMA`, `REGEX`, `STATUS_CODE`. |
| `value` | `any` | Conditional | — | The expected value. Required unless `source: file`. |
| `source` | `string` | No | — | Where the expected value comes from: `FILE` or `VARIABLE`. |
| `path` | `string` | Conditional | — | File path (relative to `.testpkg` assets) when `source: FILE`. Dot-path to a specific field in the response when used for field-level assertions. |
| `severity` | `string` | No | `HARD` | `HARD` (fail immediately) or `SOFT` (log and continue). |

---

## Value Formats

Expected values can be expressed in four equivalent ways:

### 1. Inline YAML (structured, native)

```yaml
expect:
  - type: EXACT
    value:
      catenaXId: "urn:uuid:123"
      status: "active"
```

### 2. Inline JSON (pasted from an API response or spec document)

```yaml
expect:
  - type: EXACT
    value: >
      {"catenaXId": "urn:uuid:123", "status": "active"}
```

### 3. From File (bundled in `.testpkg` assets)

```yaml
expect:
  - type: SCHEMA
    source: FILE
    path: "schemas/serial-part-3.0.json"
```

### 4. From Variable (output of a previous step)

```yaml
expect:
  - type: EXACT
    source: VARIABLE
    value: "${expected_response}"
```

---

## Field-Level Assertions

Assertions can target specific fields using the `path` property with dot-notation and bracket indexing:

```yaml
expect:
  # Assert on a specific top-level field
  - type: EXACT
    path: "catenaXId"
    value: "urn:uuid:123-456"
    severity: HARD

  # Assert on a nested field
  - type: REGEX
    path: "partTypeInformation.manufacturerPartId"
    value: "^MPN-.*"
    severity: HARD

  # Assert on an array element
  - type: CONTAINS
    path: "submodels[0].payload"
    value:
      partTypeInformation:
        manufacturerPartId: "MPN-001"
    severity: SOFT

  # Assert on the entire output (path omitted)
  - type: SCHEMA
    source: FILE
    path: "schemas/serial-part-3.0.json"
    severity: HARD
```

### Dot-Path Syntax

| Pattern | Meaning | Example |
|---------|---------|---------|
| `field` | Top-level key | `"catenaXId"` |
| `a.b` | Nested key | `"partTypeInformation.manufacturerPartId"` |
| `a[0]` | Array index | `"submodels[0]"` |
| `a[0].b` | Nested under array | `"submodels[0].payload"` |
| `a[key='value']` | Predicate filter (string) — first element where `key` equals the quoted string | `"componentResults[component='Vault'].isHealthy"` |
| `a[key=value]` | Predicate filter (type-coerced) — booleans case-insensitive, numbers by `str()` | `"items[isHealthy=true]"` |

#### Predicate-Based Array Filtering

When an array contains objects and the element order is **not guaranteed**,
use a predicate filter instead of a numeric index.  The predicate acts as
an "if" condition: _"find the first element where field X equals Y, then
continue into that element"_.

##### Syntax

```
arrayName[fieldName='stringValue']        # match a string field
arrayName[fieldName=boolOrNumber]          # match a boolean or number
```

**Quoting rules:**

| Syntax | Matching | Use for |
|--------|----------|---------|
| `[key='value']` | Exact string — `str(actual) == value` | String fields |
| `[key=value]` | Type-coerced — booleans case-insensitive, numbers by `str()` | Booleans, numbers |

> **Tip:** Always quote string values to make intent explicit and avoid
> ambiguity with boolean or numeric literals.

##### How It Works

Given this response payload:

```json
{
  "componentResults": [
    { "component": "Hashicorp Vault Health", "isHealthy": true,  "failure": null },
    { "component": "BaseRuntime",            "isHealthy": true,  "failure": null },
    { "component": "IdentityService",        "isHealthy": false, "failure": "timeout" }
  ],
  "isSystemHealthy": false
}
```

The path `componentResults[component='BaseRuntime'].isHealthy` resolves as:

| Step | Expression | Resolves to |
|------|-----------|-------------|
| 1 | `componentResults` | The full array (3 elements) |
| 2 | `[component='BaseRuntime']` | **Predicate filter** — scans the array and selects the first element where `component == "BaseRuntime"` → `{"component": "BaseRuntime", "isHealthy": true, ...}` |
| 3 | `.isHealthy` | Reads the `isHealthy` key from that element → `true` |

If no element matches the predicate, the path returns `null` and the
assertion fails.

##### Example 1 — Health-Check Endpoint

```yaml
steps:
  - type: http_request
    name: "Provider health check"
    params:
      method: GET
      url: "${provider_base_url}/api/check/health"

    # Response payload:
    # {
    #   "componentResults": [
    #     { "component": "Hashicorp Vault Health", "isHealthy": true,  "failure": null },
    #     { "component": "BaseRuntime",            "isHealthy": true,  "failure": null }
    #   ],
    #   "isSystemHealthy": true
    # }

    expect:
      # 1. Check HTTP status code
      - type: STATUS_CODE
        value: 200

      # 2. Check top-level field (no predicate needed)
      - type: EXACT
        path: "isSystemHealthy"
        value: true
        severity: HARD
        description: "Overall system health must be true"

      # 3. Find the Vault component by name → check its health
      #    IF component == 'Hashicorp Vault Health' THEN assert isHealthy == true
      - type: EXACT
        path: "componentResults[component='Hashicorp Vault Health'].isHealthy"
        value: true
        severity: HARD
        description: "Vault component must be healthy"

      # 4. Find the BaseRuntime component by name → check its health
      #    IF component == 'BaseRuntime' THEN assert isHealthy == true
      - type: EXACT
        path: "componentResults[component='BaseRuntime'].isHealthy"
        value: true
        severity: HARD
        description: "BaseRuntime component must be healthy"
```

##### Example 2 — Catalog Response with Nested Arrays

```yaml
steps:
  - type: sdk_call
    name: "Query catalog"
    params:
      method: query_catalog
      # ...

    # Response payload:
    # {
    #   "datasets": [
    #     {
    #       "assetId": "asset-serial-part",
    #       "offers": [
    #         { "policyId": "policy-1", "permission": "USE" },
    #         { "policyId": "policy-2", "permission": "TRANSFER" }
    #       ]
    #     },
    #     {
    #       "assetId": "asset-batch",
    #       "offers": [
    #         { "policyId": "policy-3", "permission": "USE" }
    #       ]
    #     }
    #   ]
    # }

    expect:
      # Find the dataset for 'asset-serial-part', then find its 'USE' offer
      - type: EXACT
        path: "datasets[assetId='asset-serial-part'].offers[permission='USE'].policyId"
        value: "policy-1"
        severity: HARD

      # Find the dataset for 'asset-batch' → check it exists
      - type: EXACT
        path: "datasets[assetId='asset-batch'].assetId"
        value: "asset-batch"
        severity: HARD
```

##### Example 3 — Mixing Predicates with Index and Boolean Filters

```yaml
    # Response payload:
    # {
    #   "results": [
    #     { "id": 101, "status": "completed", "tags": ["urgent", "reviewed"] },
    #     { "id": 102, "status": "pending",   "tags": ["draft"] },
    #     { "id": 103, "status": "completed", "tags": ["reviewed"] }
    #   ]
    # }

    expect:
      # By numeric ID (unquoted — type-coerced)
      - type: EXACT
        path: "results[id=101].status"
        value: "completed"

      # By string status (quoted)
      - type: EXACT
        path: "results[status='pending'].id"
        value: 102

      # First element by index (classic numeric path)
      - type: EXACT
        path: "results.0.id"
        value: 101
```

---

## Assertion Types

| Type | Behavior |
|------|----------|
| `EXACT` | Full equality check — the response field must match `value` exactly. |
| `CONTAINS` | The response must contain the expected structure/values as a subset. |
| `SCHEMA` | Validates the response against a JSON Schema (typically loaded from `source: FILE`). |
| `REGEX` | The response field (as a string) must match the regular expression in `value`. |
| `STATUS_CODE` | Checks the HTTP status code of the response. `value` is an integer. |

---

## Severity Levels

| Severity | Effect on Failure |
|----------|-------------------|
| `HARD` | The step is marked as **failed**. Depending on `on_failure`, execution may abort. |
| `SOFT` | The mismatch is **logged** as a warning, but the step is still considered passed. |

```yaml
expect:
  - type: EXACT
    path: "status"
    value: "active"
    severity: HARD        # Fail the step if status != "active"

  - type: CONTAINS
    path: "metadata"
    value:
      source: "automated"
    severity: SOFT        # Log warning if missing, but continue
```

---

## See Also

- [Tests](tests.md) — step definitions and `expect` within steps
- [Advanced Steps](advanced-steps.md) — assertions on `sdk_call` and async callbacks

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)