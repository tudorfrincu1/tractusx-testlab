<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This work is made available under the terms of the
 Creative Commons Attribution 4.0 International (CC-BY-4.0) license,
 which is available at
 https://creativecommons.org/licenses/by/4.0/legalcode.

 SPDX-License-Identifier: CC-BY-4.0
-->

<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->


## Context

ADR-0012 defines a compilation pipeline that validates YAML sources and packages them into a `.tckpkg` archive. However, the current `payload.tar` inside the package contains **raw YAML test files**. At runtime the Player must re-parse YAML, resolve variable dependencies, topologically sort steps, and validate step types — duplicating work the Compiler already performed at build time.

This duplication has concrete costs:

- **Startup latency**: YAML parsing + validation adds 200–500 ms per script on cold start.
- **Redundant logic**: The Player carries a full YAML parser, schema validator, and topological sorter — code that belongs exclusively in the Compiler.
- **Fragile coupling**: Any change to YAML syntax requires coordinated updates in both Compiler and Player.
- **No optimization opportunity**: The Compiler cannot pre-compute execution order or variable graphs if the output format is human-readable YAML.

The solution is a **compiled intermediate representation** — a machine-readable binary format produced by the Compiler and consumed directly by the Player. YAML remains the authoring and declaration format; after compilation, the output is a structured binary IR called a ".tck binary".

**Based on:**

- [ADR-0012 — Compilation and Packaging](ADR-0012-compilation-and-packaging.md)
- [ADR-0010 — YAML Syntax v2](ADR-0010-yaml-syntax-v2.md)
- [ADR-0013 — Preconditions Specification](ADR-0013-preconditions-specification.md)

## Status

Declined

## Date

2026-05-21

## Decision

### 1. Separation of Authoring and Execution Formats

YAML is the **declaration/authoring format** — what the IDE generates and humans write. It is never the Player's runtime input. The Compiler "lowers" validated YAML into a `.tck` binary that encodes all information the Player needs to execute tests without further interpretation.

### 2. Compiler Pipeline Extension

The pipeline from ADR-0012 gains a **Lower** stage between Validate and Package:

```
YAML → Parse → Validate → Lower → Serialize (.tck) → Package (.tckpkg)
```

| Stage | Responsibility |
|-------|---------------|
| Parse | YAML → in-memory model |
| Validate | Type checking, schema validation, reference resolution |
| **Lower** | Topological sort, variable graph extraction, step flattening |
| **Serialize** | Pydantic `model_dump()` → MessagePack binary |
| Package | Wrap into `.tckpkg` (encrypted if configured) |

### 3. Serialization Technology: MessagePack

The `.tck` binary uses [MessagePack](https://msgpack.org/) as the wire format:

- 5–10× smaller than equivalent YAML, 3–5× faster to deserialize.
- Native Python support (`msgpack` library, zero-copy reads).
- Compatible with Pydantic's `model_dump(mode="python")` output.
- Schema-less — the format version field enables forward evolution.
- Deterministic serialization for reproducible builds.

### 4. .tck Binary Structure (`payload.tck`)

The `.tck` binary is a **single self-contained file** — everything the Player needs is compiled into one flat structure. The Compiler flattens ALL steps from ALL scripts into ONE ordered list. The Player iterates this list sequentially — like executing a script line by line.

The `.tck` binary contains: `format_version`, `tck_id`, `dataspace_version`, `env` (required env vars), `variables` (declarations), `services` (definitions), `steps` (flat ordered list), and `assets` (embedded schemas + testdata).

The `steps` list is the **entire execution plan** in order. The Compiler sorts tests by dependency, interleaves setup/execution/teardown phases correctly, and produces this single flat sequence. The Player iterates `steps[0]`, `steps[1]`, `steps[2]`... — like streaming a script.

See [Section 12](#12-compilation-example-before-and-after) for a complete end-to-end compilation example showing the transformation from YAML source to `.tck` binary.

### 5. Compiled Step Schema

Each step in the binary is a flat, pre-resolved object:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Resolved step registry key (e.g., `edc/create_asset`) |
| `name` | string | Human-readable label |
| `origin` | object | Provenance: `{test, phase, index}` — where this step came from |
| `params` | dict | With `@var` refs for variables, `@auto_uuid` for generated UUIDs |
| `outputs` | dict | What this step produces: `{key: type}` |
| `store_as` | dict | Maps output keys to variable names: `{output_key: var_name}` |
| `assertions` | list[dict] | Pre-validated assertion objects |
| `on_failure` | enum | `abort` or `continue` |
| `timeout_s` | float | Execution timeout in seconds |

### 6. Compile-Time vs. Runtime Boundary

| Compile-Time (Compiler) | Runtime (Player) |
|--------------------------|-----------------|
| Step ordering (topological sort) | Variable **values** from execution |
| Variable dependency graph | Environment variable injection |
| Step type validation | UUID generation (`$UUID$` → actual UUID) |
| Schema validation | OAuth2 token acquisition |
| Namespace resolution | Network connectivity |
| Assertion structure validation | Assertion evaluation |

The Player becomes a **pure executor**: deserialize → inject runtime values → run steps in order → collect results.

### 7. Player Simplification

**Before (.tckpkg with YAML payload):**
```
unpack → parse YAML → validate → topological sort → resolve vars → execute
```

**After (.tckpkg with .tck binary):**
```
unpack → deserialize .tck binary → execute
```

The Player no longer requires: YAML parser, schema validator, topological sorter, or step registry validator.

### 8. Package Format Change

The `.tckpkg` internal structure (from ADR-0012) simplifies to two files:

```
my-tck.tckpkg (ZIP archive)
├── manifest.yaml               # Package metadata (unencrypted, per ADR-0012)
└── payload.tck                  # Single self-contained binary (all tests + assets)
    (or payload.tck.enc)         # Encrypted variant
```

The `payload.tck` IS the entire payload — schemas, testdata, compiled scripts, and variable graphs are all embedded inside. No `assets/` folder, no `payload.tar`.

The `manifest.yaml` gains a `payload_format` field:
- `"yaml"` — legacy raw YAML (backward compat)
- `"tck_binary_v1"` — compiled IR

`manifest.yaml` remains outside the binary for unencrypted inspection (per ADR-0012 requirement).

### 9. Migration Path

| Phase | Change | Compatibility |
|-------|--------|---------------|
| 1 | Compiler outputs `.tck` binary alongside YAML in payload | Additive, non-breaking |
| 2 | Player auto-detects format via `manifest.json` | Backward compatible |
| 3 | Default output switches to `.tck` binary only; `--legacy-yaml` flag preserves old behavior | Minor version bump |
| 4 | Remove YAML payload support from Player | Major version bump |

### 10. Inspection and Debugging

Since `.tck` binaries are not human-readable, a CLI inspection command is provided:

```bash
testlab inspect my-package.tckpkg
```

This deserializes `payload.tck` and dumps it as formatted JSON to stdout, enabling debugging without specialized tooling.

### 11. Variable Resolution

The Compiler extracts all variables during compilation and declares them in the binary header. At runtime, the Player maintains a simple `variables: dict[str, Any]` context.

**How it works:**

1. Compiler scans ALL steps across ALL tests
2. Extracts which env vars are needed → populates `env` list
3. Extracts which steps produce outputs → builds the `variables` manifest
4. Flattens everything into the ordered `steps` list
5. Each step's `params` use `@var_name` — the Player resolves these from its context dict

**Variable lifecycle:**

- **Before execution**: env vars seeded from runtime config into context
- **During execution**: each step's `store_as` adds new variables to context
- **Resolution**: `@var_name` in params → `context["var_name"]` (O(1) lookup)

**No wire IDs, no wire graph, no $wire sentinels** — the Compiler validates dependencies at build time and produces a correctly-ordered flat list. The Player trusts the order and resolves by name.

**Dead variable elimination**: The Compiler strips outputs that no subsequent step references, reducing binary size.

### 12. Compilation Example: Before and After

A complete end-to-end example showing how YAML source (TCK manifest + test file) compiles into the flat `.tck` binary is available in the companion page:

**→ [ADR-0013 Compilation Example](ADR-0013-compilation-example.md)**

The example demonstrates all key transformations:

| Transformation | Before (YAML) | After (.tck binary) |
|---|---|---|
| Variable references | `${{ vars.asset_id }}` | `@asset_id` |
| Service references | `${{ env.services.provider }}` | `@service:provider` |
| UUID generation | `$UUID$` | `@auto_uuid` |
| Step ordering | Separate `setup:`, `steps:`, `teardown:` sections | One flat list in correct execution order |
| Assertions | Nested `validate:` blocks with `uses:`/`with:` | Flat assertion objects inline |
| Env extraction | Spread across manifest | Consolidated `env` + `variables` at top |
| Schema embedding | External file reference | Inlined JSON content |
| Provenance | Implicit (file + section) | Explicit `origin` field |
| Returns/outputs | `returns:` with `type`+`class` | Simplified `outputs` + `store_as` |

## Consequences

### Positive

- **Player complexity reduction**: ~40% less code (no parser, validator, sorter).
- **Faster startup**: Deserialization is 5–10× faster than YAML parsing + validation.
- **Single source of truth**: Compilation logic lives exclusively in the Compiler.
- **Optimization surface**: The Compiler can apply future optimizations (step fusion, dead-variable elimination) without Player changes.
- **Deterministic execution**: Pre-sorted steps eliminate non-determinism from concurrent dependency resolution.
- **Smaller packages**: MessagePack is 5–10× more compact than YAML.
- **Docker-like compilation model**: Human-readable declaration in, optimized binary out, pure runtime executor — users never see the compiled artifact.
- **Dead variable elimination**: Unused outputs are stripped, reducing binary size.

### Negative

- **New dependency**: `msgpack` library added to both Compiler and Player.
- **Debugging friction**: Raw `.tck` files are not human-readable; `testlab inspect` mitigates this.
- **Format versioning**: Breaking changes to the IR require version bumps and migration logic.
- **Dual-format transition period**: During Phases 1–3, both formats must be supported.
- **Build step required**: YAML can no longer be hand-fed to the Player for quick iteration (mitigated by `testlab run` wrapping compile + execute).

## Source: TCK Manifest (`index.yaml`)

```yaml
kind: tck
testlab: v1-alpha

id: certificate-management-tck
namespace: ccm-v0.0.1

metadata:
  name: "Certificate Management TCK"
  version: "0.0.1"
  dataspace_version: saturn

env:
  variables:
    provider_url: "https://provider.local/management"
    consumer_url: "https://consumer.local/management"
  services:
    provider:
      type: edc_connector
      url: ${{ env.provider_url }}
      auth:
        type: oauth2
        token_url: "https://auth.local/token"
  schemas:
    certificate_schema:
      file: business_partner_certificate.json

tests:
  - request-certificate.yaml
```

## Source: Test File (`tests/request-certificate.yaml`)

```yaml
kind: test
testlab: v1-alpha
namespace: ccm-v0.0.1

metadata:
  name: "Request Certificate via DSP"

setup:
  - id: create_asset_1
    uses: edc/create_asset
    name: Create the test asset
    with:
      service: ${{ env.services.provider }}
      asset_id: $UUID$
      properties:
        dct:type:
          "@id": "cx-taxo:CertificateManagement"
    returns:
      asset_id:
        type: string
        class: asset_id

  - id: create_policy_1
    uses: edc/create_policy
    name: Create access policy
    with:
      service: ${{ env.services.provider }}
      asset_id: ${{ vars.asset_id }}
      policy:
        permissions:
          - action: use
    returns:
      policy_id:
        type: string
        class: policy_id

steps:
  - id: get_catalog_1
    uses: connector/get_catalog
    name: Get catalog from provider
    with:
      service: ${{ env.services.provider }}
      filter:
        operand_left: "https://w3id.org/edc/v0.0.1/ns/type"
        operator: "="
        operand_right: "cx-taxo:CertificateManagement"
    returns:
      catalog_response:
        type: object
        class: catalog
    validate:
      - uses: validate/assert
        with:
          input: status_code
          operator: equals
          value: 200
      - uses: validate/field
        with:
          input: catalog_response
          path: "dcat:dataset"
          operator: not_null

teardown:
  - id: delete_asset_1
    uses: edc/delete_asset
    name: Clean up test asset
    with:
      service: ${{ env.services.provider }}
      asset_id: ${{ vars.asset_id }}
```

## Compiled Output: `.tck` Binary (format_version 2)

```json
{
  "format_version": 2,
  "tck_id": "certificate-management-tck",
  "dataspace_version": "saturn",

  "env": [
    "PROVIDER_DSP_URL", "PROVIDER_MANAGEMENT_URL",
    "CONSUMER_DSP_URL", "CONSUMER_MANAGEMENT_URL",
    "PROVIDER_BPN", "CONSUMER_BPN"
  ],

  "variables": {
    "provider_dsp_url": {"source": "env", "env_key": "PROVIDER_DSP_URL"},
    "provider_mgmt_url": {"source": "env", "env_key": "PROVIDER_MANAGEMENT_URL"},
    "consumer_dsp_url": {"source": "env", "env_key": "CONSUMER_DSP_URL"},
    "consumer_mgmt_url": {"source": "env", "env_key": "CONSUMER_MANAGEMENT_URL"},
    "provider_bpn": {"source": "env", "env_key": "PROVIDER_BPN"},
    "consumer_bpn": {"source": "env", "env_key": "CONSUMER_BPN"}
  },

  "services": {
    "provider": {"type": "edc_connector", "dsp_url": "@var:provider_dsp_url", "management_url": "@var:provider_mgmt_url", "bpn": "@var:provider_bpn"},
    "consumer": {"type": "edc_connector", "dsp_url": "@var:consumer_dsp_url", "management_url": "@var:consumer_mgmt_url", "bpn": "@var:consumer_bpn"}
  },

  "memory": {
    "preconditions": {"scope": "frozen", "_comment": "Written during precondition phase, immutable after"},
    "test": {"scope": "ephemeral", "_comment": "Cleared between tests"},
    "exports": {"scope": "append_only", "_comment": "Cross-test data, never overwritten"}
  },

  "tests": [
    {"id": "request-certificate", "phases": ["setup", "execution", "teardown"]},
    {"id": "reuse-agreement", "phases": ["execution"]}
  ],

  "steps": [
    {
      "index": 0, "type": "http/health_check", "name": "Verify provider is reachable",
      "origin": {"test_id": "_preconditions", "phase": "precondition", "index": 0},
      "params": {"url": "@var:provider_mgmt_url", "method": "GET", "path": "/api/check/health"},
      "outputs": ["status_code"],
      "store_as": {"status_code": {"scope": "preconditions", "key": "provider_health"}},
      "assertions": [{"type": "equals", "input": "@out:status_code", "expected": 200}],
      "store_meta": null, "on_failure": "abort", "timeout_s": 10
    },
    {
      "_comment": "── Test 1: request-certificate / setup ──",
      "index": 1, "type": "edc/create_asset", "name": "Create certificate asset",
      "origin": {"test_id": "request-certificate", "phase": "setup", "index": 0},
      "params": {"service": "@service:provider", "asset_id": "{{uuid}}", "properties": {"dct:type": {"@id": "cx-taxo:CertificateManagement"}}},
      "outputs": ["asset_id"],
      "store_as": {"asset_id": {"scope": "test", "key": "asset_id"}},
      "assertions": [], "store_meta": null, "on_failure": "abort", "timeout_s": 30
    },
    {
      "index": 2, "type": "edc/create_policy", "name": "Create access policy",
      "origin": {"test_id": "request-certificate", "phase": "setup", "index": 1},
      "params": {"service": "@service:provider", "policy": {"permissions": [{"action": "use", "constraints": []}]}},
      "outputs": ["policy_id"],
      "store_as": {"policy_id": {"scope": "test", "key": "policy_id"}},
      "assertions": [], "store_meta": null, "on_failure": "abort", "timeout_s": 30
    },
    {
      "index": 3, "type": "edc/create_contract_definition", "name": "Create contract definition",
      "origin": {"test_id": "request-certificate", "phase": "setup", "index": 2},
      "params": {"service": "@service:provider", "asset_id": "@mem:test.asset_id", "policy_id": "@mem:test.policy_id"},
      "outputs": ["contract_def_id"],
      "store_as": {"contract_def_id": {"scope": "test", "key": "contract_def_id"}},
      "assertions": [], "store_meta": null, "on_failure": "abort", "timeout_s": 30
    },
    {
      "_comment": "── Test 1: request-certificate / execution ──",
      "index": 4, "type": "dsp/negotiate_contract", "name": "Negotiate contract with consumer",
      "origin": {"test_id": "request-certificate", "phase": "execution", "index": 0},
      "params": {"consumer": "@service:consumer", "provider": "@service:provider", "asset_id": "@mem:test.asset_id", "policy_id": "@mem:test.policy_id"},
      "outputs": ["agreement_id", "negotiation_id"],
      "store_as": {"agreement_id": {"scope": "test", "key": "agreement_id"}, "negotiation_id": {"scope": "test", "key": "negotiation_id"}},
      "assertions": [{"type": "not_null", "input": "@out:agreement_id"}],
      "store_meta": null, "on_failure": "abort", "timeout_s": 60
    },
    {
      "index": 5, "type": "dsp/transfer_and_call", "name": "Transfer and call certificate endpoint",
      "origin": {"test_id": "request-certificate", "phase": "execution", "index": 1},
      "params": {"consumer": "@service:consumer", "agreement_id": "@mem:test.agreement_id", "method": "GET", "path": "/certificates"},
      "outputs": ["status_code", "response_body"],
      "store_as": {"response_body": {"scope": "test", "key": "certificate_response"}},
      "assertions": [{"type": "equals", "input": "@out:status_code", "expected": 200}],
      "store_meta": {"last_read": 5, "large": true}, "on_failure": "abort", "timeout_s": 60
    },
    {
      "_comment": "── Test 1: request-certificate / teardown ──",
      "index": 6, "type": "memory/export", "name": "Export agreement for reuse",
      "origin": {"test_id": "request-certificate", "phase": "teardown", "index": 0},
      "params": {"source": "@mem:test.agreement_id"},
      "outputs": [],
      "store_as": {"source": {"scope": "exports", "key": "agreement_id"}},
      "assertions": [], "store_meta": null, "on_failure": "continue", "timeout_s": 5
    },
    {
      "index": 7, "type": "edc/delete_asset", "name": "Clean up test asset",
      "origin": {"test_id": "request-certificate", "phase": "teardown", "index": 1},
      "params": {"service": "@service:provider", "asset_id": "@mem:test.asset_id"},
      "outputs": [],
      "store_as": {},
      "assertions": [], "store_meta": null, "on_failure": "continue", "timeout_s": 30
    },
    {
      "_comment": "── Test 2: reuse-agreement / execution (test memory cleared) ──",
      "index": 8, "type": "dsp/transfer_and_call", "name": "Reuse agreement to fetch certificates",
      "origin": {"test_id": "reuse-agreement", "phase": "execution", "index": 0},
      "params": {"consumer": "@service:consumer", "agreement_id": "@mem:exports.agreement_id", "method": "GET", "path": "/certificates"},
      "outputs": ["status_code", "response_body"],
      "store_as": {"response_body": {"scope": "test", "key": "certificate_response"}},
      "assertions": [{"type": "equals", "input": "@out:status_code", "expected": 200}],
      "store_meta": {"last_read": 8, "large": true}, "on_failure": "abort", "timeout_s": 60
    },
    {
      "index": 9, "type": "validate/json_schema", "name": "Validate response against certificate schema",
      "origin": {"test_id": "reuse-agreement", "phase": "execution", "index": 1},
      "params": {"input": "@mem:test.certificate_response", "schema": "assets://business_partner_certificate.schema.json"},
      "outputs": ["is_valid", "errors"],
      "store_as": {},
      "assertions": [{"type": "equals", "input": "@out:is_valid", "expected": true}],
      "store_meta": null, "on_failure": "abort", "timeout_s": 10
    }
  ],

  "assets": {
    "business_partner_certificate.schema.json": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "$id": "urn:samm:io.catenax.business_partner_certificate:3.1.0#BusinessPartnerCertificate",
      "title": "BusinessPartnerCertificate",
      "description": "CX-0135 BusinessPartnerCertificate semantic model v3.1.0",
      "type": "object",
      "required": ["businessPartnerNumber", "certificateType"],
      "properties": {
        "businessPartnerNumber": {"type": "string", "pattern": "^BPN[LSA][0-9A-Z]{12}$"},
        "certificateType": {"type": "string"},
        "registrationNumber": {"type": "string"},
        "areaOfApplication": {"type": "string"},
        "validFrom": {"type": "string", "format": "date"},
        "validTo": {"type": "string", "format": "date"},
        "issuer": {"type": "string"},
        "trustLevel": {"type": "string", "enum": ["None", "Low", "Medium", "High"]},
        "validator": {
          "type": "object",
          "properties": {
            "validatorName": {"type": "string"},
            "validatorBpn": {"type": "string", "pattern": "^BPN[LSA][0-9A-Z]{12}$"}
          }
        },
        "uploader": {"type": "string"},
        "documentId": {"type": "string"}
      }
    }
  }
}
```

### Reference Prefix System

| Prefix | Resolves to | Example |
|--------|-------------|---------|
| `@out:` | Current step's output buffer | `@out:status_code` |
| `@mem:test.` | Test-scoped memory (ephemeral) | `@mem:test.asset_id` |
| `@mem:preconditions.` | Frozen precondition values | `@mem:preconditions.provider_health` |
| `@mem:exports.` | Cross-test exports (append-only) | `@mem:exports.agreement_id` |
| `@var:` | Environment variable | `@var:provider_bpn` |
| `@service:` | Service definition | `@service:provider` |
| `assets://` | Embedded asset | `assets://business_partner_certificate.schema.json` |
| `{{uuid}}` | Auto-generated UUID at runtime | — |

### Memory Lifecycle

```
Step 0 (precondition)     → writes preconditions.provider_health
                            ┌─ preconditions: FROZEN ─┐
── Test 1 boundary ──       │  test: CLEARED (empty)  │
Steps 1-3 (setup)        → writes test.asset_id, test.policy_id, test.contract_def_id
Steps 4-5 (execution)    → writes test.agreement_id, test.certificate_response
Step 6 (teardown)         → copies test.agreement_id → exports.agreement_id
Step 7 (teardown)         → fire-and-forget cleanup
                            │  exports: {agreement_id} │
── Test 2 boundary ──       │  test: CLEARED (empty)  │
Steps 8-9 (execution)    → reads exports.agreement_id, writes test.certificate_response
                            └──────────────────────────┘
```

## What the Compiler Did

| Transformation | Before (YAML) | After (.tck binary v2) |
|---|---|---|
| Variable references | `@provider_dsp_url` | `@var:provider_dsp_url` |
| Service references | `service: provider` | `@service:provider` |
| UUID generation | `{{uuid}}` in YAML | `{{uuid}}` preserved (runtime resolves) |
| Memory writes | `store: asset_id` | `store_as: {asset_id: {scope, key}}` |
| Memory reads | `@asset_id` | `@mem:test.asset_id` (scope-qualified) |
| Cross-test sharing | `export: agreement_id` | `store_as` with `scope: "exports"` |
| Step ordering | Separate `setup:`, `steps:`, `teardown:` per test | Flat list, correct execution order |
| Assertions | `validate:` blocks with `uses:`/`with:` | Flat assertion objects with `@out:` refs |
| Env extraction | Spread across manifest | Consolidated `env` + `variables` at top |
| Schema embedding | External file reference | Inlined in `assets` dict |
| Provenance | Implicit (file + section) | Explicit `origin: {test_id, phase, index}` |
| Large outputs | Implicit | `store_meta: {last_read, large}` for GC hints |
