# YAML Specification

TestLab tests are defined in YAML format.

## Structure

```yaml
name: My Test                    # Required — test name
version: "1.0"                   # Semver string
dataspace: saturn                # Target dataspace
description: "..."               # Optional description

connectors:                      # Connector endpoints
  provider:
    url: http://localhost:8080
    api_key: my-key
  consumer:
    url: http://localhost:9090
    api_key: my-key

inputs:                          # Test input variables
  part_id:
    type: string
    default: "MPI-001"

mocks:                           # Mock service definitions
  - type: dtr                    # Template type
    name: mock_dtr
    overrides: []                # Override default endpoints

steps:                           # Sequential test steps
  - type: create_asset
    name: Create Test Asset
    inputs:
      name: "@part_id"           # @variable reference
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD

auto_cleanup: true               # Auto-delete created resources
```

## Variable References

Use `@variable_name` syntax to reference inputs or outputs from previous steps:

```yaml
inputs:
  asset_name:
    type: string
    default: "Test Part"

steps:
  - type: create_asset
    name: Create Asset
    inputs:
      name: "@asset_name"        # References the input variable
```

Step outputs are automatically available as variables for subsequent steps.

## Assertions

Each step can have an `expect` list with these assertion types:

| Type | Description | Fields |
|------|-------------|--------|
| `STATUS_CODE` | Check HTTP status code | `value` |
| `EQUALS` | Check field equals value | `path`, `value` |
| `CONTAINS` | Check field contains value | `path`, `value` |
| `REGEX` | Match field against regex | `path`, `pattern` |
| `EXISTS` | Check field path exists | `path` |
| `SCHEMA` | Validate against JSON Schema | `schema` |
| `CHECK_REQUEST` | Verify mock received request | `field`, `operator`, `value` |

Severity: `HARD` (default) fails the test, `SOFT` emits a warning.

## Mock Types

| Type | Service |
|------|---------|
| `bpn_discovery` | BPN Discovery Service |
| `connector_discovery` | Connector/EDC Discovery |
| `dtr` | Digital Twin Registry |
| `submodel_server` | AAS Submodel Server |
| `notification` | Notification endpoint |
| `custom` | User-defined endpoints |

## Step Types

| Category | Steps |
|----------|-------|
| Simulate | `mock_service`, `mock_endpoint`, `wait_for_call` |
| Prepare | `upload_data`, `create_asset`, `set_access_rules`, `publish_offer` |
| Discover | `query_catalog`, `find_connector` |
| Exchange | `negotiate_access`, `fetch_data`, `send_data` |
| Digital Twins | `register_twin`, `lookup_twin`, `add_submodel` |
| Notifications | `send_notification`, `register_notification_endpoint` |
| Utility | `http_request` |
