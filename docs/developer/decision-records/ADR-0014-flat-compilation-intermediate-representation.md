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

# ADR-0014: Flat Compilation Intermediate Representation (IR)

## Status

Proposed

## Date

2026-05-21

## Based On

- [ADR-0010 — YAML Syntax v2](ADR-0010-yaml-syntax-v2.md)
- [ADR-0011 — Environment and Services](ADR-0011-environment-and-services.md)
- [ADR-0012 — Compilation and Packaging](ADR-0012-compilation-and-packaging.md)
- [ADR-0013 — Preconditions Specification](ADR-0013-preconditions-specification.md)

## Context

The TestLab compilation pipeline (ADR-0012) transforms YAML v2 source files into a portable package. However, the internal representation between the compiler output and the Player input has not been formally specified. Without a well-defined Intermediate Representation (IR), the compiler and Player are tightly coupled — changes to one break the other, and tooling (debuggers, trace viewers, decompilers) cannot interoperate.

### Forces

- The **compiler** must perform ALL intelligence: variable resolution, type checking, reference validation, phase flattening, and assertion wiring. It emits a fully-resolved, self-describing output.
- The **Player** must be dumb: iterate instructions sequentially, resolve `$ref` values from a flat dictionary, dispatch step executors, store outputs, and run inline assertions. Zero parsing, zero graph traversal, zero ambiguity resolution at runtime.
- The IR must be **decompilable** back to source YAML without data loss (supporting round-trip editing).
- The IR must support **O(1) variable lookup** at runtime — no tree walking or scope chain resolution.
- The IR must be **self-describing** — every instruction carries enough metadata to be understood in isolation (phase, position, type, expected inputs/outputs).
- The IR must support **structured tracing** — every instruction has a stable `index` that correlates compiled IR to execution trace logs.
- The format must be **JSON-serializable** for embedding in `.tckpkg` archives, streaming over SSE, and storage in databases.

### Design Constraints

| Constraint | Rationale |
|------------|-----------|
| Flat instruction array | No recursion, no nesting, no conditional branches at IR level |
| All references pre-resolved | `${{ }}` syntax does not exist in the IR — only `$ref` objects |
| Phase metadata preserved | Each instruction knows its origin phase for decompilation |
| Inline assertions | Validation blocks are properties of their parent instruction, not separate instructions |
| Deterministic ordering | Same source YAML always produces the same IR (byte-identical with same compiler version) |
| Forward-reference prohibition | `produced_by` index must always be less than the consumer's index |

## Decision

### 1. Design Philosophy

The Flat Compilation IR follows three core principles:

**1.1 Compiler Does All Thinking**

The compiler is the intelligent component. It resolves all variable references, validates type compatibility, checks temporal ordering (no forward references), inlines testdata, resolves service configurations, and flattens the three-phase structure (setup → steps → teardown) into a single ordered instruction array. The compiled output is a **fully-resolved execution plan** — the Player performs zero interpretation.

**1.2 Flat Structures Only**

The IR uses two primary data structures:

- **Symbol table**: A flat dictionary mapping canonical keys to symbol metadata. O(1) lookup by key.
- **Instructions**: A flat ordered array. The Player iterates index 0 to N-1, no branching, no recursion.

There are no nested scopes, no scope chains, no tree structures that require traversal at runtime.

**1.3 Self-Describing Instructions**

Every instruction carries all metadata needed to:
- Execute it (type, parameters, timeout)
- Trace it (index, id, phase)
- Decompile it (phase, phase_index)
- Handle failures (on_failure strategy)
- Validate its results (inline assertions)

An instruction can be extracted from the array and understood in isolation — no external context is required beyond the symbol table values.

---

### 2. Compiled Test Unit (`CompiledTest`)

A `CompiledTest` is the output of compiling a single `kind: test` file against its parent TCK manifest. It is the atomic unit of execution — the Player executes one `CompiledTest` at a time.

#### 2.1 Schema

```json
{
  "format_version": "1.0.0",
  "compiled_at": "2026-05-21T14:30:00Z",
  "compiler_version": "0.5.0",
  "test_id": "<string>",
  "namespace": "<string>",
  "testlab": "<string>",
  "metadata": {
    "name": "<string>",
    "version": "<string>",
    "description": "<string>"
  },
  "symbol_table": { "<canonical_key>": { ... } },
  "instructions": [ { ... }, { ... }, ... ]
}
```

#### 2.2 Field Specification

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `format_version` | string | Yes | Semver of the IR format (e.g., `"1.0.0"`). Player rejects incompatible versions. |
| `compiled_at` | string | Yes | ISO 8601 UTC timestamp of compilation. |
| `compiler_version` | string | Yes | Semver of the compiler that produced this IR. |
| `test_id` | string | Yes | The `id` field from the source YAML test file. Lowercase kebab-case. |
| `namespace` | string | Yes | The `namespace` from the source YAML. Links this test to its parent TCK. |
| `testlab` | string | Yes | Syntax version (e.g., `"v1-alpha"`). |
| `metadata` | object | Yes | Human-readable metadata from the source YAML `metadata:` block. |
| `metadata.name` | string | Yes | Display name of the test. |
| `metadata.version` | string | Yes | Test version. |
| `metadata.description` | string | No | Multi-line description. |
| `symbol_table` | object | Yes | Flat dictionary of all symbols (see §5). |
| `instructions` | array | Yes | Ordered array of instruction objects (see §4). |

#### 2.3 Concrete Example: `available-notification` Test

Based on the test file from ADR-0010 §7.2:

```json
{
  "format_version": "1.0.0",
  "compiled_at": "2026-05-21T14:30:00Z",
  "compiler_version": "0.5.0",
  "test_id": "available-notification",
  "namespace": "ccm-v0.0.1",
  "testlab": "v1-alpha",
  "metadata": {
    "name": "Available Notification",
    "version": "1.0",
    "description": "Test CX-0135 AVAILABLE notification: send availability notification to SUT and verify SUT subsequently pulls the certificate from TestLab."
  },
  "symbol_table": {
    "env.provider_url": {
      "source": "env.variables",
      "produced_by": -1,
      "type": "string"
    },
    "env.consumer_url": {
      "source": "env.variables",
      "produced_by": -1,
      "type": "string"
    },
    "env.provider_bpn": {
      "source": "env.variables",
      "produced_by": -1,
      "type": "string"
    },
    "env.consumer_bpn": {
      "source": "env.variables",
      "produced_by": -1,
      "type": "string"
    },
    "env.services.provider": {
      "source": "env.services",
      "produced_by": -1,
      "type": "class",
      "class": "ConnectorService"
    },
    "env.services.consumer": {
      "source": "env.services",
      "produced_by": -1,
      "type": "class",
      "class": "ConnectorService"
    },
    "env.preconditions.testlab_connector.dsp_url": {
      "source": "env.preconditions",
      "produced_by": -1,
      "type": "string"
    },
    "env.preconditions.testlab_connector.bpn": {
      "source": "env.preconditions",
      "produced_by": -1,
      "type": "string"
    },
    "env.preconditions.testlab_connector.did": {
      "source": "env.preconditions",
      "produced_by": -1,
      "type": "string"
    },
    "env.preconditions.testlab_connector.dataspace_version": {
      "source": "env.preconditions",
      "produced_by": -1,
      "type": "string"
    },
    "setup.gen_id.generated_id": {
      "source": "step_output",
      "produced_by": 0,
      "type": "string"
    },
    "setup.certificate_callback.mock": {
      "source": "step_output",
      "produced_by": 1,
      "type": "class",
      "class": "MockInstance"
    },
    "setup.certificate_callback.base_mock_url": {
      "source": "step_output",
      "produced_by": 1,
      "type": "string"
    },
    "setup.certificate_callback.full_mock_url": {
      "source": "step_output",
      "produced_by": 1,
      "type": "string"
    },
    "steps.create_asset_1.asset_id": {
      "source": "step_output",
      "produced_by": 2,
      "type": "string"
    },
    "steps.wait_for_call.request_method": {
      "source": "step_output",
      "produced_by": 4,
      "type": "string"
    },
    "steps.wait_for_call.request_headers": {
      "source": "step_output",
      "produced_by": 4,
      "type": "object"
    },
    "steps.wait_for_call.request_body": {
      "source": "step_output",
      "produced_by": 4,
      "type": "object"
    },
    "steps.wait_for_call.query_params": {
      "source": "step_output",
      "produced_by": 4,
      "type": "object"
    },
    "steps.wait_for_call.elapsed_ms": {
      "source": "step_output",
      "produced_by": 4,
      "type": "integer"
    }
  },
  "instructions": [
    {
      "index": 0,
      "id": "gen_id",
      "uses": "util/generate_uuid",
      "name": "Generate asset ID",
      "with": {},
      "returns": {
        "generated_id": { "type": "string", "class": "Uuid" }
      },
      "phase": "setup",
      "phase_index": 0,
      "on_failure": "abort"
    },
    {
      "index": 1,
      "id": "certificate_callback",
      "uses": "mock/api",
      "name": "Expose Certificate Management API",
      "with": {
        "method": "GET",
        "path": "/api/v1/companycertificate/available",
        "response_status": 200,
        "response_body": {
          "businessPartnerNumber": "@provider_bpn",
          "certificateType": "@certificate_type",
          "registrationNumber": "CERT-AVAIL-001",
          "enclosedSites": [
            { "enclosedSiteBpn": "@location_bpns" }
          ],
          "validFrom": "2026-01-01",
          "validUntil": "2028-12-31",
          "trustLevel": "none",
          "document": {
            "documentID": "cert-asset-001",
            "creationDate": "2026-01-01T00:00:00Z",
            "contentType": "application/pdf",
            "contentBase64": "iVBORw0KGgoAAAANSUhEUgA="
          },
          "validator": {
            "validatorName": "TÜV SÜD",
            "validatorBpn": "BPNL133631123120"
          },
          "type": {
            "certificateVersion": "2015",
            "certificateType": "@certificate_type"
          },
          "areaOfApplication": "Quality Management",
          "issuer": {
            "issuerName": "TÜV SÜD",
            "issuerBpn": "BPNL133631123120"
          }
        }
      },
      "returns": {
        "mock": { "type": "class", "class": "MockInstance" },
        "base_mock_url": { "type": "string" },
        "full_mock_url": { "type": "string" }
      },
      "phase": "setup",
      "phase_index": 1,
      "on_failure": "abort"
    },
    {
      "index": 2,
      "id": "create_asset_1",
      "uses": "connector/create_asset",
      "name": "Create the test asset",
      "with": {
        "asset_id": { "$ref": "setup.gen_id.generated_id" },
        "description": "Test asset",
        "service": "provider"
      },
      "returns": {
        "asset_id": { "type": "string", "class": "AssetId" }
      },
      "validate": [
        {
          "uses": "validate/assert",
          "with": {
            "input": "status_code",
            "operator": "equals",
            "value": 200
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "response_body",
            "path": "id",
            "operator": "equals",
            "value": { "$ref": "setup.gen_id.generated_id" }
          }
        }
      ],
      "phase": "steps",
      "phase_index": 0,
      "on_failure": "abort"
    },
    {
      "index": 3,
      "id": "get_asset_1",
      "uses": "connector/get_asset",
      "name": "Retrieve the created asset",
      "with": {
        "asset_id": { "$ref": "steps.create_asset_1.asset_id" },
        "service": "provider"
      },
      "returns": {},
      "validate": [
        {
          "uses": "validate/assert",
          "with": {
            "input": "status_code",
            "operator": "equals",
            "value": 200
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "response_body",
            "path": "id",
            "operator": "equals",
            "value": { "$ref": "steps.create_asset_1.asset_id" }
          }
        }
      ],
      "phase": "steps",
      "phase_index": 1,
      "on_failure": "abort"
    },
    {
      "index": 4,
      "id": "wait_for_call",
      "uses": "mock/wait/http_request",
      "name": "Wait for provider RECEIVE acknowledgment",
      "with": {
        "mock": { "$ref": "setup.certificate_callback.mock" },
        "timeout_s": 60
      },
      "returns": {
        "request_method": { "type": "string" },
        "request_headers": { "type": "object" },
        "request_body": { "type": "object" },
        "query_params": { "type": "object" },
        "elapsed_ms": { "type": "integer" }
      },
      "validate": [
        {
          "uses": "validate/assert",
          "with": {
            "input": "request_method",
            "operator": "equals",
            "value": "POST"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.messageId",
            "operator": "matches_regex",
            "value": "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.context",
            "operator": "equals",
            "value": "CompanyCertificateManagement-CCMAPI-Status:1.0.0"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.sentDateTime",
            "operator": "not_null"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.senderBpn",
            "operator": "matches_regex",
            "value": "^BPNL[0-9A-Z]{12}$"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.receiverBpn",
            "operator": "equals",
            "value": { "$ref": "env.consumer_bpn" }
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "header.version",
            "operator": "equals",
            "value": "3.1.0"
          }
        },
        {
          "uses": "validate/field",
          "with": {
            "input": "request_body",
            "path": "content.certificateStatus",
            "operator": "one_of",
            "value": ["RECEIVED", "ACCEPTED", "REJECTED"]
          }
        }
      ],
      "phase": "steps",
      "phase_index": 2,
      "on_failure": "abort",
      "timeout_s": 60
    },
    {
      "index": 5,
      "id": "export_asset_id",
      "uses": "util/export_env",
      "name": "Export asset ID to TCK environment",
      "with": {
        "variable": "last_asset_id",
        "value": { "$ref": "steps.create_asset_1.asset_id" }
      },
      "returns": {},
      "phase": "teardown",
      "phase_index": 0,
      "on_failure": "continue"
    },
    {
      "index": 6,
      "id": "delete_asset_1",
      "uses": "connector/delete_asset",
      "name": "Clean up test asset",
      "with": {
        "asset_id": { "$ref": "steps.create_asset_1.asset_id" },
        "service": { "$ref": "env.services.provider" }
      },
      "returns": {},
      "phase": "teardown",
      "phase_index": 1,
      "on_failure": "continue"
    }
  ]
}
```

---

### 3. Compiled TCK Unit (`CompiledTck`)

A `CompiledTck` is the output of compiling a `kind: tck` manifest together with all its referenced test files. It is the top-level compilation artifact — the unit of distribution, versioning, and packaging.

#### 3.1 Schema

```json
{
  "format_version": "1.0.0",
  "compiled_at": "<ISO 8601>",
  "compiler_version": "<semver>",
  "tck_id": "<string>",
  "namespace": "<string>",
  "testlab": "<string>",
  "metadata": { ... },
  "env": {
    "variables": [ ... ],
    "services": [ ... ],
    "schemas": { ... },
    "testdata": { ... },
    "preconditions": [ ... ]
  },
  "tests": [ ... ],
  "compiled_tests": [ ... ]
}
```

#### 3.2 Field Specification

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `format_version` | string | Yes | Semver of the IR format. |
| `compiled_at` | string | Yes | ISO 8601 UTC compilation timestamp. |
| `compiler_version` | string | Yes | Compiler version that produced this artifact. |
| `tck_id` | string | Yes | The `id` field from the TCK manifest. |
| `namespace` | string | Yes | The `namespace` from the TCK manifest. |
| `testlab` | string | Yes | Syntax version (e.g., `"v1-alpha"`). |
| `metadata` | object | Yes | Full TCK metadata block (see §3.3). |
| `env` | object | Yes | Resolved environment block (see §3.4). |
| `tests` | array | Yes | Ordered list of test references with integrity hashes (see §3.5). |
| `compiled_tests` | array | Yes | Array of `CompiledTest` objects, one per test file, in execution order. |

#### 3.3 Metadata Block

The `metadata` object preserves all fields from the TCK manifest's `metadata:` block:

```json
{
  "name": "Certificate Management TCK",
  "version": "v0.0.1",
  "description": "Validate CCMAPI certificate management workflow per CX-0135 v3.1.0...",
  "authors": [
    {
      "name": "Mathias Moser",
      "email": "mathias.moser@catena-x.net",
      "company": "Catena-X Automotive Network e.V."
    }
  ],
  "copyright_holders": ["2026 Catena-X Automotive Network e.V."],
  "license": "LicenseRef-Proprietary",
  "standards": [
    {
      "id": "CX-0135",
      "organization": "Catena-X Automotive Network e.V.",
      "version": "v3.1.0"
    }
  ],
  "tags": ["CCM"],
  "dataspace_version": "saturn"
}
```

#### 3.4 Environment Block (`env`)

The `env` block contains the fully resolved environment that all compiled tests share. Resources referenced by path in the source YAML are inlined at compile time.

##### 3.4.1 Variables

```json
"variables": [
  { "name": "provider_url", "value": "https://provider.local", "type": "string" },
  { "name": "consumer_url", "value": "https://consumer.local", "type": "string" },
  { "name": "provider_bpn", "value": "BPNL000000000001", "type": "string" },
  { "name": "consumer_bpn", "value": "BPNL000000000002", "type": "string" }
]
```

Each variable entry:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Variable name (becomes `env.<name>` in symbol table). |
| `value` | any | Yes | Default value from the TCK manifest. May be overridden at runtime. |
| `type` | string | Yes | Data type: `string`, `integer`, `boolean`, `object`, `array`. |

##### 3.4.2 Services

```json
"services": [
  {
    "name": "provider",
    "uses": "service/connector_service",
    "with": {
      "base_url": { "$ref": "env.provider_url" },
      "management_path": "/management/v3",
      "dsp_path": "/api/v1/dsp",
      "auth": {
        "type": "oauth2",
        "token_url": "https://auth.local/token"
      }
    }
  },
  {
    "name": "consumer",
    "uses": "service/connector_service",
    "with": {
      "base_url": { "$ref": "env.consumer_url" },
      "management_path": "/management/v3",
      "dsp_path": "/api/v1/dsp",
      "auth": {
        "type": "oauth2",
        "token_url": "https://auth.local/token"
      }
    }
  }
]
```

Service entries are **factory recipes**. Each entry describes how to instantiate a live service object at Player boot time:

- `uses` — the factory registry key (e.g., `"service/connector_service"`). The Player looks up the corresponding factory in its service factory registry.
- `with` — the configuration payload passed to the factory. May contain `$ref` values that reference environment variables.

At Player boot time, the instantiation sequence is:

1. Read the `services` array from the compiled environment.
2. Resolve all `$ref` values in each service's `with` block from the already-seeded environment variables.
3. Look up the factory in the Player's registry by the `uses` key.
4. Call `factory.create(resolved_config)` to produce a live service object.
5. Store the live object in the runtime value store under key `env.services.<name>`.

The IR stores only the recipe — the Player creates the live instance. Variable references within service `with` blocks are preserved as `$ref` objects because environment variables may be overridden at runtime (they cannot be inlined at compile time).

##### 3.4.6 Service Instantiation Lifecycle

The `$ref` resolution mechanism is polymorphic — it works identically regardless of whether the resolved value is a string, number, object, or live class instance. The Player does not differentiate. This enables a unified three-phase lifecycle:

| Phase | What happens | Example |
|-------|-------------|--------|
| **Compile time** | `${{ env.services.provider }}` → `{"$ref": "env.services.provider"}` | Compiler replaces expression syntax with `$ref` object |
| **Boot time** | Player reads service recipes → `factory.create(resolved_config)` → live object stored in `value_store["env.services.provider"]` | `ConnectorService` instance created and stored |
| **Runtime** | Instruction with `{"$ref": "env.services.provider"}` → Player returns live object from value store | Step executor receives a live `ConnectorService` |

This design means that `{"$ref": "env.provider_url"}` (resolves to a string) and `{"$ref": "env.services.provider"}` (resolves to a live object) use the exact same resolution code path. The type system is enforced at compile time via the symbol table; at runtime, the value store is an untyped `dict[str, Any]`.

##### 3.4.3 Schemas

```json
"schemas": {
  "certificate_schema": {
    "source_file": "business_partner_certificate_schema.json",
    "content": { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": { "..." } }
  },
  "notification_header_schema": {
    "source_file": "notification_header.json",
    "content": { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": { "..." } }
  }
}
```

Schema content is **inlined** at compile time. The `source_file` field is preserved for decompilation and traceability.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_file` | string | Yes | Original filename from `env.schemas`. |
| `content` | object | Yes | Full JSON Schema content, parsed and validated. |

##### 3.4.4 Testdata

```json
"testdata": {
  "available_notification": {
    "source_file": "available_notification.json",
    "type": "application/json",
    "content": { "header": { "..." }, "content": { "..." } }
  },
  "sample_certificate": {
    "source_file": "sample_certificate.pdf",
    "type": "application/pdf",
    "content_base64": "JVBERi0xLjQKJeLjz9MKMSAw..."
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_file` | string | Yes | Original filename from `env.testdata`. |
| `type` | string | Yes | MIME type of the content. |
| `content` | any | Conditional | Parsed content for JSON/XML/text types. Present when `type` is text-based. |
| `content_base64` | string | Conditional | Base64-encoded content for binary types. Present when `type` is binary (e.g., `application/pdf`). |

**Rule:** Exactly one of `content` or `content_base64` is present, determined by MIME type.

##### 3.4.5 Preconditions

```json
"preconditions": [
  {
    "id": "testlab_connector",
    "uses": "precondition/generate",
    "name": "TestLab Connector Configuration",
    "returns": {
      "dsp_url": { "type": "string", "class": "Url", "generator": "testlab_dsp_endpoint" },
      "bpn": { "type": "string", "class": "Bpn", "generator": "testlab_bpn" },
      "did": { "type": "string", "class": "Did", "generator": "testlab_did" },
      "dataspace_version": { "type": "string", "class": "Enum", "generator": "dataspace_version" }
    }
  },
  {
    "id": "usage_policy",
    "uses": "precondition/provide",
    "name": "Required Usage Policy",
    "with": {
      "value": {
        "permissions": [
          {
            "action": "use",
            "constraints": {
              "and": [
                { "left_operand": "UsagePurpose", "operator": "isAnyOf", "right_operand": "cx.ccm.base:1" },
                { "left_operand": "FrameworkAgreement", "operator": "eq", "right_operand": "DataExchangeAgreement:1" }
              ]
            }
          }
        ]
      }
    },
    "returns": {
      "policy": { "type": "object", "class": "Policy" }
    }
  }
]
```

Precondition entries preserve the full source structure from ADR-0013. Their `returns` fields are registered in the symbol table as `env.preconditions.<id>.<field>` with `produced_by: -1` (pre-seeded before execution).

#### 3.5 Test References

```json
"tests": [
  {
    "test_id": "request-certificate",
    "file": "tests/request-certificate.yaml",
    "source_hash": "sha256:a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
  },
  {
    "test_id": "validate-payload",
    "file": "tests/validate-payload.yaml",
    "source_hash": "sha256:b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3"
  },
  {
    "test_id": "available-notification",
    "file": "tests/available-notification.yaml",
    "source_hash": "sha256:c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4"
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `test_id` | string | Yes | The `id` from the test file's root. Matches `compiled_tests[].test_id`. |
| `file` | string | Yes | Relative path to the source file within the TCK project. |
| `source_hash` | string | Yes | SHA-256 hash of the source file content. Enables change detection and integrity verification. |

The `tests` array preserves the execution order declared in the TCK manifest's `tests:` list.

#### 3.6 Concrete Example: Compiled TCK

```json
{
  "format_version": "1.0.0",
  "compiled_at": "2026-05-21T14:30:00Z",
  "compiler_version": "0.5.0",
  "tck_id": "certificate-management-tck",
  "namespace": "ccm-v0.0.1",
  "testlab": "v1-alpha",
  "metadata": {
    "name": "Certificate Management TCK",
    "version": "v0.0.1",
    "description": "Validate CCMAPI certificate management workflow per CX-0135 v3.1.0: (1) Request certificate from provider (2) Validate certificate payload against schema (3) Await provider feedback callback (4) Send feedback notification and await acknowledgment (5) Expose TestLab as provider and verify SUT consumer behavior",
    "authors": [
      {
        "name": "Mathias Moser",
        "email": "mathias.moser@catena-x.net",
        "company": "Catena-X Automotive Network e.V."
      }
    ],
    "copyright_holders": ["2026 Catena-X Automotive Network e.V."],
    "license": "LicenseRef-Proprietary",
    "standards": [
      { "id": "CX-0135", "organization": "Catena-X Automotive Network e.V.", "version": "v3.1.0" }
    ],
    "tags": ["CCM"],
    "dataspace_version": "saturn"
  },
  "env": {
    "variables": [
      { "name": "provider_url", "value": "https://provider.local", "type": "string" },
      { "name": "consumer_url", "value": "https://consumer.local", "type": "string" },
      { "name": "provider_bpn", "value": "BPNL000000000001", "type": "string" },
      { "name": "consumer_bpn", "value": "BPNL000000000002", "type": "string" }
    ],
    "services": [
      {
        "name": "provider",
        "uses": "service/connector_service",
        "with": {
          "base_url": { "$ref": "env.provider_url" },
          "management_path": "/management/v3",
          "dsp_path": "/api/v1/dsp",
          "auth": { "type": "oauth2", "token_url": "https://auth.local/token" }
        }
      },
      {
        "name": "consumer",
        "uses": "service/connector_service",
        "with": {
          "base_url": { "$ref": "env.consumer_url" },
          "management_path": "/management/v3",
          "dsp_path": "/api/v1/dsp",
          "auth": { "type": "oauth2", "token_url": "https://auth.local/token" }
        }
      }
    ],
    "schemas": {
      "certificate_schema": {
        "source_file": "business_partner_certificate_schema.json",
        "content": { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object" }
      },
      "notification_header_schema": {
        "source_file": "notification_header.json",
        "content": { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object" }
      }
    },
    "testdata": {
      "available_notification": {
        "source_file": "available_notification.json",
        "type": "application/json",
        "content": { "header": { "messageId": "...", "context": "..." }, "content": { "..." } }
      },
      "sample_certificate": {
        "source_file": "sample_certificate.pdf",
        "type": "application/pdf",
        "content_base64": "JVBERi0xLjQKJeLjz9MK..."
      }
    },
    "preconditions": [
      {
        "id": "testlab_connector",
        "uses": "precondition/generate",
        "name": "TestLab Connector Configuration",
        "returns": {
          "dsp_url": { "type": "string", "class": "Url", "generator": "testlab_dsp_endpoint" },
          "bpn": { "type": "string", "class": "Bpn", "generator": "testlab_bpn" },
          "did": { "type": "string", "class": "Did", "generator": "testlab_did" },
          "dataspace_version": { "type": "string", "class": "Enum", "generator": "dataspace_version" }
        }
      },
      {
        "id": "usage_policy",
        "uses": "precondition/provide",
        "name": "Required Usage Policy",
        "with": {
          "value": {
            "permissions": [
              {
                "action": "use",
                "constraints": {
                  "and": [
                    { "left_operand": "UsagePurpose", "operator": "isAnyOf", "right_operand": "cx.ccm.base:1" },
                    { "left_operand": "FrameworkAgreement", "operator": "eq", "right_operand": "DataExchangeAgreement:1" }
                  ]
                }
              }
            ]
          }
        },
        "returns": {
          "policy": { "type": "object", "class": "Policy" }
        }
      }
    ]
  },
  "tests": [
    {
      "test_id": "request-certificate",
      "file": "tests/request-certificate.yaml",
      "source_hash": "sha256:a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
    },
    {
      "test_id": "validate-payload",
      "file": "tests/validate-payload.yaml",
      "source_hash": "sha256:b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3"
    },
    {
      "test_id": "available-notification",
      "file": "tests/available-notification.yaml",
      "source_hash": "sha256:c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4"
    }
  ],
  "compiled_tests": [
    { "format_version": "1.0.0", "test_id": "request-certificate", "..." : "..." },
    { "format_version": "1.0.0", "test_id": "validate-payload", "..." : "..." },
    { "format_version": "1.0.0", "test_id": "available-notification", "..." : "(full CompiledTest as shown in §2.3)" }
  ]
}
```

> **Note:** The `compiled_tests` array contains full `CompiledTest` objects (as specified in §2). They are abbreviated here for readability — the actual compiled output includes the complete instruction arrays and symbol tables for each test.

---

### 4. Instruction Schema

Every element in the `instructions` array conforms to the following schema.

#### 4.1 Field Specification

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `index` | integer | Yes | — | Zero-based global position in the flat array. Unique, sequential, no gaps. |
| `id` | string | Yes | — | Step ID from the source YAML. Matches `[a-z][a-z0-9_]{0,49}`. |
| `uses` | string | Yes | — | Step type identifier (e.g., `"connector/create_asset"`, `"mock/api"`, `"util/generate_uuid"`). |
| `name` | string | Yes | — | Human-readable label from the source YAML `name:` field. |
| `with` | object | Yes | `{}` | Input parameters. Values may be literals or `$ref` objects. Empty object if no inputs. |
| `returns` | object | Yes | `{}` | Declared output variables with type and class metadata. Empty object if no outputs. |
| `validate` | array | No | *(omitted)* | Inline assertion array. Omitted when no assertions. Present only when the step has validation rules. See §7. |
| `phase` | string | Yes | — | Origin phase: `"setup"`, `"steps"`, or `"teardown"`. |
| `phase_index` | integer | Yes | — | Zero-based position within the original phase. Used for decompilation. |
| `on_failure` | string | Yes | `"abort"` | Failure strategy: `"abort"`, `"continue"`, or `"skip_test"`. |
| `timeout_s` | float | No | *(omitted)* | Execution timeout in seconds. Omitted when no timeout. Present only when the step has an explicit timeout. The Player uses its default timeout when this field is absent. |
| `condition` | string | No | *(omitted)* | Compiled conditional expression. Omitted when unconditional. Present only when the step has an execution condition. The Player always executes the instruction when this field is absent. |

**Omission rule:** Optional fields with no value are **omitted entirely** from the compiled output — never set to `null`. This minimizes payload size. The Player treats a missing field identically to its documented default value.

#### 4.2 `on_failure` Strategies

| Value | Behavior |
|-------|----------|
| `"abort"` | Stop execution immediately. Jump to teardown phase. This is the default for `setup` and `steps` phases. |
| `"continue"` | Log the failure and continue to the next instruction. This is the default for `teardown` phase. |
| `"skip_test"` | Mark the entire test as skipped (not failed). Used for optional prerequisites that indicate the test is not applicable. |

#### 4.3 `condition` Field

The `condition` field contains a pre-compiled boolean expression that the Player evaluates before executing the instruction. If the condition evaluates to `false`, the instruction is skipped (its outputs are set to `null` in the values dictionary).

```json
{
  "index": 5,
  "id": "optional_cleanup",
  "uses": "connector/delete_asset",
  "condition": "steps.create_asset_1.asset_id != null",
  "..."
}
```

**Condition expression syntax:**

| Expression | Meaning |
|------------|---------|
| `"<key> != null"` | Symbol exists and is not null |
| `"<key> == <literal>"` | Symbol equals a literal value |
| `"<key> != <literal>"` | Symbol does not equal a literal value |

Conditions are intentionally limited to simple null-checks and equality comparisons. Complex logic belongs in the test design (separate steps), not in runtime conditionals.

#### 4.4 Instruction Array Ordering

The flat instruction array is constructed by concatenating phases in fixed order:

```
instructions = setup[0..S-1] + steps[0..T-1] + teardown[0..D-1]
```

Where:
- `setup[i].index = i`
- `steps[j].index = S + j`
- `teardown[k].index = S + T + k`

The `phase` and `phase_index` fields allow reconstruction of the original phase boundaries without storing explicit boundary markers.

---

### 5. Symbol Table

The symbol table is a flat dictionary that maps canonical variable keys to their metadata. It serves two purposes:

1. **Compile-time validation**: The compiler verifies that every `$ref` in the instructions has a corresponding entry, and that temporal ordering is respected (no forward references).
2. **Runtime documentation**: The Player uses the symbol table to pre-allocate the values dictionary and validate output types.

#### 5.1 Structure

```json
{
  "<canonical_key>": {
    "source": "<source_category>",
    "produced_by": <integer>,
    "type": "<data_type>",
    "class": "<class_name>"          // omitted when no semantic type applies
  }
}
```

#### 5.2 Field Specification

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Category of the symbol's origin. One of: `"env.variables"`, `"env.services"`, `"env.preconditions"`, `"env.schemas"`, `"env.testdata"`, `"execution"`, `"step_output"`. |
| `produced_by` | integer | Index of the instruction that produces this value. `-1` for pre-seeded values (env, preconditions, execution context). |
| `type` | string | Data type: `"string"`, `"integer"`, `"boolean"`, `"object"`, `"array"`, `"class"`. |
| `class` | string | Semantic class from the class registry (ADR-0009). The `class` field is omitted when no semantic type constraint applies. |

**Class-typed symbols and the Factory Recipe Pattern:**

When a symbol has `type: "object"` and `class` is a known factory type (e.g., `"ConnectorService"`), it represents a **runtime-instantiated object** — not a JSON-serializable value. The `class` field doubles as the factory registry key. The IR stores only the recipe; the Player creates the live instance at boot time (see §3.4.6).

Similarly, when a step output declares `type: "class"` with a `class` like `"MockInstance"`, the live object is created by the step executor at runtime (not at boot). The symbol table entry tells the Player what type to expect, but the actual object is produced by the step executor and stored in the value store after execution. The distinction:

| Symbol source | Created when | Created by |
|---------------|-------------|------------|
| `env.services.*` with `class: "ConnectorService"` | Boot time | Service factory |
| `step_output` with `class: "MockInstance"` | Runtime (after step executes) | Step executor |

#### 5.3 Canonical Key Format

| Source | Key Pattern | Example |
|--------|-------------|---------|
| Environment variable | `env.<name>` | `env.provider_url` |
| Service | `env.services.<name>` | `env.services.provider` |
| Schema | `env.schemas.<name>` | `env.schemas.certificate_schema` |
| Testdata | `env.testdata.<name>` | `env.testdata.available_notification` |
| Precondition output | `env.preconditions.<id>.<field>` | `env.preconditions.testlab_connector.dsp_url` |
| Execution context | `execution.<key>` | `execution.id` |
| Setup step output | `setup.<step_id>.<field>` | `setup.gen_id.generated_id` |
| Main step output | `steps.<step_id>.<field>` | `steps.create_asset_1.asset_id` |
| Teardown step output | `teardown.<step_id>.<field>` | `teardown.cleanup.deleted` |

#### 5.4 Compiler Validation Rules

The compiler enforces these invariants on the symbol table:

1. **Completeness**: Every `{"$ref": "key"}` in the instructions array has a matching entry in the symbol table.
2. **Temporal ordering**: For every instruction at index `i` that contains `{"$ref": "key"}`, the symbol `key` must have `produced_by < i` (or `produced_by == -1` for pre-seeded values).
3. **Uniqueness**: No two symbols share the same canonical key.
4. **Type consistency**: If a step's `returns` declares `type: string`, the symbol table entry must also declare `type: string`.
5. **No orphans**: Every symbol with `produced_by >= 0` must correspond to an instruction that actually declares that output in its `returns` block.

#### 5.5 Pre-Seeded Symbols (`produced_by: -1`)

These symbols are available before any instruction executes:

| Source | Seeded from |
|--------|-------------|
| `env.variables` | TCK manifest `env.variables` block — values are the defaults |
| `env.services` | TCK manifest `env.services` — values are instantiated service objects |
| `env.preconditions` | Precondition resolution (generate/provide/input) — values from pre-execution phase |
| `env.schemas` | Inlined JSON Schema content |
| `env.testdata` | Inlined testdata content |
| `execution` | Player-injected execution context (id, tck_id, timestamp, runner) |

---

### 6. Variable Reference Resolution (`$ref`)

#### 6.1 Compilation Transform

The compiler transforms YAML `${{ }}` expressions into IR `$ref` objects:

| Source YAML | Compiled IR |
|-------------|-------------|
| `${{ setup.gen_id.generated_id }}` | `{"$ref": "setup.gen_id.generated_id"}` |
| `${{ env.provider_url }}` | `{"$ref": "env.provider_url"}` |
| `${{ env.services.provider }}` | `{"$ref": "env.services.provider"}` |
| `${{ env.preconditions.testlab_connector.dsp_url }}` | `{"$ref": "env.preconditions.testlab_connector.dsp_url"}` |
| `${{ execution.id }}` | `{"$ref": "execution.id"}` |

#### 6.2 Deep Reference Resolution

The compiler walks the `with` dictionary recursively. Any string value containing `${{ }}` is replaced with a `$ref` object. This applies at any nesting depth:

**Source YAML:**
```yaml
with:
  body:
    header:
      receiverBpn: ${{ env.consumer_bpn }}
    content:
      assetId: ${{ steps.create_asset_1.asset_id }}
```

**Compiled IR:**
```json
"with": {
  "body": {
    "header": {
      "receiverBpn": { "$ref": "env.consumer_bpn" }
    },
    "content": {
      "assetId": { "$ref": "steps.create_asset_1.asset_id" }
    }
  }
}
```

#### 6.3 String Interpolation (`$concat`)

When a `${{ }}` expression appears as part of a larger string (not the entire value), the compiler emits a `$concat` array:

**Source YAML:**
```yaml
with:
  url: "https://${{ env.provider_url }}/api/v1/assets/${{ steps.gen_id.generated_id }}"
```

**Compiled IR:**
```json
"with": {
  "url": { "$concat": ["https://", { "$ref": "env.provider_url" }, "/api/v1/assets/", { "$ref": "steps.gen_id.generated_id" }] }
}
```

**`$concat` semantics:**
- Array elements are either literal strings or `$ref` objects.
- At runtime, the Player resolves all `$ref` objects, converts to string, and concatenates.
- Empty strings are permitted but redundant (optimizer may strip them).

#### 6.4 Runtime Resolution

At execution time, the Player resolves references using a flat values dictionary:

```python
def resolve_value(value: Any, values: dict[str, Any]) -> Any:
    if isinstance(value, dict):
        if "$ref" in value:
            return values[value["$ref"]]
        if "$concat" in value:
            parts = [resolve_value(part, values) for part in value["$concat"]]
            return "".join(str(p) for p in parts)
        return {k: resolve_value(v, values) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve_value(item, values) for item in value]
    return value
```

**Complexity:** O(n) where n is the number of nodes in the `with` tree. The dictionary lookup itself is O(1).

---

### 7. Validation Assertions

#### 7.1 Structure

Assertions are inlined on their parent instruction in the `validate` array. They are NOT separate instructions — they do not have their own `index`, do not produce symbols, and do not appear in the flat instruction array independently.

```json
"validate": [
  {
    "uses": "<assertion_type>",
    "with": { ... }
  }
]
```

#### 7.2 Assertion Types

| `uses` | Purpose | Required `with` fields |
|--------|---------|------------------------|
| `validate/assert` | Assert a value equals/matches an expectation | `input`, `operator`, `value` |
| `validate/field` | Assert a field within a nested object | `input`, `path`, `operator`, `value` (optional for `not_null`) |
| `validate/schema` | Validate response against a JSON Schema | `input`, `schema` |

#### 7.3 `input` Field Resolution

The `input` field in assertions refers to the parent step's **implicit outputs** — the ephemeral values produced by step execution that are available only within the assertion context:

| `input` value | Resolves to |
|---------------|-------------|
| `"status_code"` | HTTP status code returned by the step (integer) |
| `"response_body"` | Parsed response body (object) |
| `"response_headers"` | Response headers (object) |
| `"request_method"` | For mock/wait steps: the received request method (string) |
| `"request_body"` | For mock/wait steps: the received request body (object) |
| `"request_headers"` | For mock/wait steps: the received request headers (object) |
| `"query_params"` | For mock/wait steps: the received query parameters (object) |

These are resolved locally — no `$ref` is needed for `input`. The Player passes the step result directly to the assertion evaluator.

#### 7.4 `value` Field with `$ref`

The `value` field in assertions MAY contain `$ref` objects when comparing against a previous step's output or an environment variable:

```json
{
  "uses": "validate/field",
  "with": {
    "input": "response_body",
    "path": "header.receiverBpn",
    "operator": "equals",
    "value": { "$ref": "env.consumer_bpn" }
  }
}
```

#### 7.5 `validate/schema` Assertions

Schema assertions validate the step's output against a JSON Schema from the TCK's `env.schemas`:

```json
{
  "uses": "validate/schema",
  "with": {
    "input": "response_body",
    "schema": { "$ref": "env.schemas.certificate_schema" }
  }
}
```

At runtime, the Player:
1. Resolves `schema` → the inlined JSON Schema content from the environment
2. Resolves `input` → the step's response body
3. Validates the response body against the schema
4. Reports pass/fail with detailed validation errors

#### 7.6 Assertion Results

Assertions produce results but do NOT produce symbols. They only pass or fail:

```json
{
  "assertion_index": 0,
  "uses": "validate/assert",
  "status": "passed",
  "expected": 200,
  "actual": 200
}
```

Failed assertions trigger the parent instruction's `on_failure` strategy.

---

### 8. Implicit Step Outputs

Every step that performs an HTTP call implicitly produces ephemeral outputs available within its `validate` block:

| Output | Type | Description |
|--------|------|-------------|
| `status_code` | integer | HTTP response status code |
| `response_body` | object | Parsed response body (JSON) |
| `response_headers` | object | Response headers as key-value pairs |

For `mock/wait/*` steps, additional implicit outputs are available:

| Output | Type | Description |
|--------|------|-------------|
| `request_method` | string | HTTP method of the received request |
| `request_body` | object | Parsed body of the received request |
| `request_headers` | object | Headers of the received request |
| `query_params` | object | Query parameters of the received request |
| `elapsed_ms` | integer | Milliseconds waited before receiving the request |

**Important distinction:**

- **Implicit outputs** are ephemeral — scoped to the validate block of the step that produced them. They are NOT registered in the symbol table.
- **Declared outputs** (in `returns`) are persistent — stored in the values dictionary and registered in the symbol table. They ARE referenceable by later steps via `$ref`.

If a step needs to make an implicit output available to later steps, it must declare it in `returns`. The step executor copies the implicit output into the declared return value.

---

### 9. TCK Environment Resolution

When the compiler processes a `kind: test` file, it resolves the full environment from the parent TCK manifest. This process produces the pre-seeded symbols that all instructions can reference.

#### 9.1 Resolution Order

```
1. Load TCK manifest (matched by test's `namespace` field)
2. Parse env.variables → register in symbol table as env.<name>, produced_by: -1
3. Parse env.services → register as env.services.<name>, produced_by: -1
4. Parse env.schemas → inline file content, register as env.schemas.<name>, produced_by: -1
5. Parse env.testdata → inline content (JSON) or base64-encode (binary), register as env.testdata.<name>, produced_by: -1
6. Parse preconditions → register each returns field as env.preconditions.<id>.<field>, produced_by: -1
7. Register execution context → execution.id, execution.tck_id, execution.timestamp, execution.runner, produced_by: -1
8. Process test phases → register step outputs with produced_by: <instruction_index>
```

#### 9.2 Variable Reference Validation

After building the symbol table, the compiler performs a single pass over all instructions:

```
for each instruction at index i:
    for each $ref in instruction.with (recursive walk):
        assert $ref.key exists in symbol_table
        assert symbol_table[$ref.key].produced_by < i  OR  produced_by == -1
    for each $ref in instruction.validate (recursive walk):
        assert $ref.key exists in symbol_table
        assert symbol_table[$ref.key].produced_by <= i  OR  produced_by == -1
```

Note: Assertions within `validate` may reference the parent instruction's own outputs (produced_by == i), since assertions execute after the step completes.

#### 9.3 Service Variable References

Service `with` blocks may contain `$ref` objects that reference environment variables. These are resolved at Player startup (not compile time) because environment variables may be overridden at runtime:

```json
{
  "name": "provider",
  "uses": "service/connector_service",
  "with": {
    "base_url": { "$ref": "env.provider_url" }
  }
}
```

At startup: `base_url = values["env.provider_url"]` → resolved from the seeded environment.

---

### 10. Execution Model (Player)

The Player consumes a `CompiledTest` and executes it sequentially. Its logic is minimal by design.

#### 10.1 Pseudocode

```python
def execute_test(compiled_test: CompiledTest, tck_env: CompiledEnv) -> TestResult:
    # Phase 1: Seed the values dictionary
    values: dict[str, Any] = {}
    seed_environment(values, tck_env)
    seed_execution_context(values)
    seed_preconditions(values, tck_env.preconditions)

    # Phase 2: Initialize services
    services = instantiate_services(tck_env.services, values)

    # Phase 3: Execute instructions
    results: list[InstructionResult] = []
    teardown_start = find_teardown_start(compiled_test.instructions)
    failed = False

    for instr in compiled_test.instructions:
        # Skip if we failed and this is not teardown
        if failed and instr.phase != "teardown":
            if instr.phase == "steps":
                results.append(skipped_result(instr))
                continue

        # Evaluate condition
        if instr.condition and not evaluate_condition(instr.condition, values):
            results.append(skipped_result(instr))
            continue

        # Resolve parameters
        params = resolve_refs(instr.with_, values)

        # Dispatch execution
        try:
            step_result = dispatch(instr.uses, params, services, timeout=instr.timeout_s)
        except StepExecutionError as exc:
            results.append(failed_result(instr, exc))
            failed = handle_failure(instr.on_failure, failed)
            continue

        # Store declared outputs
        store_outputs(instr, step_result, values)

        # Run inline validations
        validation_results = run_validations(instr.validate, step_result, values)

        # Check assertion failures
        if any(v.status == "failed" for v in validation_results):
            results.append(assertion_failed_result(instr, step_result, validation_results))
            failed = handle_failure(instr.on_failure, failed)
            continue

        results.append(success_result(instr, step_result, validation_results))

    return TestResult(
        test_id=compiled_test.test_id,
        status="passed" if not failed else "failed",
        results=results
    )


def handle_failure(strategy: str, current_failed: bool) -> bool:
    match strategy:
        case "abort":
            return True  # Signal to skip to teardown
        case "continue":
            return current_failed  # Don't change failure state
        case "skip_test":
            return True  # Mark as skipped, jump to teardown
```

#### 10.2 `seed_environment`

```python
def seed_environment(values: dict[str, Any], env: CompiledEnv) -> None:
    for var in env.variables:
        values[f"env.{var.name}"] = var.value
    for svc in env.services:
        values[f"env.services.{svc.name}"] = svc  # Service object reference
    for name, schema in env.schemas.items():
        values[f"env.schemas.{name}"] = schema.content
    for name, data in env.testdata.items():
        values[f"env.testdata.{name}"] = data.content or data.content_base64
```

#### 10.3 `store_outputs`

```python
def store_outputs(instr: Instruction, result: StepResult, values: dict[str, Any]) -> None:
    for field_name in instr.returns:
        canonical_key = f"{instr.phase}.{instr.id}.{field_name}"
        values[canonical_key] = result.outputs.get(field_name)
```

#### 10.4 `resolve_refs`

```python
def resolve_refs(params: Any, values: dict[str, Any]) -> Any:
    if isinstance(params, dict):
        if "$ref" in params:
            key = params["$ref"]
            if key not in values:
                raise ExecutionError(f"Unresolved reference: {key}")
            return values[key]
        if "$concat" in params:
            parts = [resolve_refs(part, values) for part in params["$concat"]]
            return "".join(str(p) for p in parts)
        return {k: resolve_refs(v, values) for k, v in params.items()}
    if isinstance(params, list):
        return [resolve_refs(item, values) for item in params]
    return params
```

#### 10.5 `run_validations`

```python
def run_validations(
    assertions: list[dict] | None,
    step_result: StepResult,
    values: dict[str, Any]
) -> list[AssertionResult]:
    if not assertions:
        return []

    results = []
    for i, assertion in enumerate(assertions):
        # Resolve the input from step's implicit outputs
        input_value = step_result.implicit_outputs[assertion["with"]["input"]]

        # Resolve any $ref in the assertion's with block
        resolved_with = resolve_refs(assertion["with"], values)
        resolved_with["_resolved_input"] = input_value

        # Dispatch assertion
        result = dispatch_assertion(assertion["uses"], resolved_with)
        results.append(AssertionResult(
            assertion_index=i,
            uses=assertion["uses"],
            status=result.status,
            expected=result.expected,
            actual=result.actual,
            message=result.message
        ))

    return results
```

---

### 11. Teardown Guarantees

The IR and Player together enforce that teardown always runs, regardless of failures in setup or steps.

#### 11.1 Phase Boundary Detection

The Player identifies teardown start by scanning the instructions array:

```python
def find_teardown_start(instructions: list[Instruction]) -> int | None:
    for instr in instructions:
        if instr.phase == "teardown":
            return instr.index
    return None
```

#### 11.2 Failure Handling Rules

| Failure in | Behavior |
|------------|----------|
| Setup (any instruction with `on_failure: "abort"`) | Skip ALL remaining setup + steps. Jump to first teardown instruction. |
| Steps (any instruction with `on_failure: "abort"`) | Skip remaining steps. Jump to first teardown instruction. |
| Steps (instruction with `on_failure: "continue"`) | Log failure, continue to next instruction. |
| Teardown (any instruction) | Always `on_failure: "continue"`. Log failure, continue to next teardown instruction. |

#### 11.3 Teardown Default `on_failure`

The compiler sets `on_failure: "continue"` on ALL teardown instructions by default. This ensures that even if one cleanup step fails (e.g., deleting an asset that was never created), subsequent cleanup steps still execute.

TCK authors can override this in YAML, but the compiler emits a warning:

```
WARNING: teardown step 'delete_asset_1' has on_failure: abort — teardown steps should use 'continue' to ensure all cleanup runs.
```

#### 11.4 Null Safety in Teardown

Teardown steps may reference outputs from steps that never executed (because setup or steps failed). The Player must handle `null` values gracefully:

- If `resolve_refs` returns `null` for a `$ref`, the step executor receives `null` as the parameter value.
- Step executors for teardown-appropriate steps (delete, cleanup) SHOULD treat `null` inputs as no-ops.
- The `condition` field can be used to guard teardown steps: `"condition": "steps.create_asset_1.asset_id != null"`.

---

### 12. Decompilation

The IR is designed to be losslessly decompiled back to source YAML. This enables round-trip editing: YAML → compile → IR → decompile → YAML (identical output).

#### 12.1 Algorithm

```python
def decompile(compiled_test: CompiledTest) -> str:
    # 1. Reconstruct phase arrays
    setup = [i for i in compiled_test.instructions if i.phase == "setup"]
    steps = [i for i in compiled_test.instructions if i.phase == "steps"]
    teardown = [i for i in compiled_test.instructions if i.phase == "teardown"]

    # Sort by phase_index (should already be sorted, but defensive)
    setup.sort(key=lambda i: i.phase_index)
    steps.sort(key=lambda i: i.phase_index)
    teardown.sort(key=lambda i: i.phase_index)

    # 2. Build YAML structure
    doc = {
        "kind": "test",
        "testlab": compiled_test.testlab,
        "id": compiled_test.test_id,
        "namespace": compiled_test.namespace,
        "metadata": compiled_test.metadata,
    }

    if setup:
        doc["setup"] = [decompile_instruction(i) for i in setup]
    doc["steps"] = [decompile_instruction(i) for i in steps]
    if teardown:
        doc["teardown"] = [decompile_instruction(i) for i in teardown]

    return yaml_dump(doc)


def decompile_instruction(instr: Instruction) -> dict:
    step = {"id": instr.id, "uses": instr.uses, "name": instr.name}

    if instr.with_:
        step["with"] = decompile_refs(instr.with_)

    if instr.returns:
        step["returns"] = instr.returns

    if instr.validate:
        step["validate"] = [decompile_assertion(a) for a in instr.validate]

    return step


def decompile_refs(value: Any) -> Any:
    if isinstance(value, dict):
        if "$ref" in value:
            return f"${{{{ {value['$ref']} }}}}"
        if "$concat" in value:
            parts = []
            for part in value["$concat"]:
                if isinstance(part, dict) and "$ref" in part:
                    parts.append(f"${{{{ {part['$ref']} }}}}")
                else:
                    parts.append(str(part))
            return "".join(parts)
        return {k: decompile_refs(v) for k, v in value.items()}
    if isinstance(value, list):
        return [decompile_refs(item) for item in value]
    return value
```

#### 12.2 Round-Trip Guarantee

The decompiler produces byte-identical YAML to the original source when:

1. The source was serialized by the IDE (canonical field ordering: id → uses → name → with → returns → validate)
2. No semantic-only transformations were applied (e.g., the compiler did not rewrite flat `${{ steps.x }}` into qualified `${{ steps.step_id.x }}`)

In cases where the compiler qualifies an ambiguous reference, the decompiled output uses the qualified form — this is a one-way normalization that improves clarity.

#### 12.3 Metadata Preservation

All fields in `metadata`, `testlab`, `namespace`, and `id` are preserved verbatim in the IR. No transformation is applied. This ensures decompilation reproduces them exactly.

---

### 13. Logging & Tracing

Every instruction execution produces a structured trace entry. The trace log is the primary observability mechanism for test execution.

#### 13.1 Trace Entry Schema

```json
{
  "index": 2,
  "id": "create_asset_1",
  "uses": "connector/create_asset",
  "phase": "steps",
  "status": "passed",
  "started_at": "2026-05-21T14:30:01.234Z",
  "finished_at": "2026-05-21T14:30:01.567Z",
  "duration_ms": 333,
  "outputs": {
    "asset_id": "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "validation_results": [
    { "assertion_index": 0, "uses": "validate/assert", "status": "passed", "expected": 200, "actual": 200 },
    { "assertion_index": 1, "uses": "validate/field", "status": "passed", "expected": "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890", "actual": "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
  ],
  "error": null
}
```

#### 13.2 Field Specification

| Field | Type | Description |
|-------|------|-------------|
| `index` | integer | Instruction index — the correlation key between IR and trace. |
| `id` | string | Step ID for human readability. |
| `uses` | string | Step type for categorization. |
| `phase` | string | Phase for grouping in reports. |
| `status` | string | `"passed"`, `"failed"`, `"skipped"`, `"error"`. |
| `started_at` | string | ISO 8601 UTC timestamp when execution started. |
| `finished_at` | string | ISO 8601 UTC timestamp when execution completed. |
| `duration_ms` | integer | Elapsed milliseconds. |
| `outputs` | object\|null | Values stored in the values dictionary (declared returns). `null` if step produced no outputs or failed. |
| `validation_results` | array | Array of assertion results (empty if no validate block). |
| `error` | object\|null | Error details if status is `"failed"` or `"error"`. |

#### 13.3 Error Object

```json
{
  "type": "StepExecutionError",
  "message": "HTTP 404: Asset not found",
  "context": {
    "step_id": "get_asset_1",
    "uses": "connector/get_asset",
    "params": { "asset_id": "urn:uuid:..." }
  }
}
```

#### 13.4 Trace Format

Trace entries are emitted as **JSON Lines** (one JSON object per line, newline-delimited). This enables:

- Streaming over SSE (ADR-0003)
- Appending to log files without buffering
- Parsing individual entries without loading the full trace
- Correlation with the compiled IR via the `index` field

#### 13.5 Correlation

The `index` field is the stable correlation key between:

- **Compiled IR**: `instructions[index]` — the instruction definition
- **Trace log**: `trace_entry.index` — the execution result
- **IDE debugger**: highlights instruction at `index` during step-through

This enables the IDE to show compiled IR side-by-side with execution results, linked by `index`.

---

### 14. Complexity Guarantees

| Operation | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| **Compilation** | O(n × m) | O(n + s) | n = instructions, m = max depth of `with` tree, s = symbols |
| **Symbol table lookup** | O(1) | O(s) | Python dict / hashmap |
| **Reference resolution** (per instruction) | O(m) | O(m) | m = nodes in `with` tree |
| **Full test execution** | O(n × m) | O(n + s) | Linear scan, no backtracking |
| **Assertion evaluation** | O(a × p) | O(1) | a = assertions per step, p = JSON path depth |
| **Decompilation** | O(n × m) | O(n) | Single pass, same as compilation |
| **Teardown start detection** | O(n) | O(1) | Linear scan (cacheable to O(1)) |
| **Condition evaluation** | O(1) | O(1) | Simple null-check or equality |

**Key guarantees:**

- No O(n²) operations anywhere in the pipeline
- No recursive data structures that could cause stack overflow
- No unbounded memory growth during execution (values dict grows linearly with n)
- No graph traversal, no backtracking, no retry loops in the Player core

---

### 15. Format Versioning

The `format_version` field follows semantic versioning:

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| New optional field on instruction | Minor | `1.0.0` → `1.1.0` |
| New assertion type | Minor | `1.1.0` → `1.2.0` |
| Removing a field | Major | `1.2.0` → `2.0.0` |
| Changing `$ref` semantics | Major | — |
| Adding a new `$` operator (e.g., `$if`) | Major | — |
| Bug fix in compilation output | Patch | `1.0.0` → `1.0.1` |

**Compatibility rules:**

- Player MUST reject IR with a higher major version than it supports.
- Player SHOULD accept IR with the same major version and any minor/patch (forward compatible within major).
- Compiler MUST include its own version in `compiler_version` for debugging compatibility issues.

---

### 16. Security Considerations

#### 16.1 No Code Execution in IR

The IR contains only data — no executable code, no eval expressions, no template engines. The `$ref` and `$concat` operators are pure data lookups and string concatenation. This prevents injection attacks through YAML source files.

#### 16.2 Secret Handling

Secrets (API keys, OAuth2 tokens) in service `with` blocks are:

1. **Encrypted** in `.tckpkg` archives (see ADR-0012)
2. **Never logged** — the Player's trace log masks values whose symbol has a `class` of `secret`, `api_key`, or `token`
3. **Not inlined** — secrets remain as `$ref` objects in the IR; their values are resolved from the runtime environment, not embedded in the compiled output

#### 16.3 Hash Integrity

The `source_hash` field in test references enables:

- Detecting tampering of source files after compilation
- Verifying that the compiled output matches the expected source
- Cache invalidation when source files change

---

## Consequences

### Positive

1. **O(1) variable lookup at runtime** — flat dictionary eliminates scope chain traversal.
2. **Linear execution** — no branching, no graph traversal, no recursion. The Player is trivially correct.
3. **Decompilable** — the IR preserves all information needed to reconstruct the source YAML.
4. **Self-describing** — every instruction carries its full context (phase, type, parameters, assertions). Tooling can process individual instructions without the full IR.
5. **No runtime parsing** — the Player never touches YAML, never resolves `${{ }}` expressions, never validates types. All intelligence is front-loaded into the compiler.
6. **Deterministic** — same source always produces the same IR. Enables caching, diffing, and regression testing of the compiler itself.
7. **Streamable** — instructions can be streamed over SSE one-by-one for live IDE execution feedback.
8. **Debuggable** — the `index` field provides stable correlation between IR, trace logs, and IDE debugger state.

### Negative

1. **Larger output** — the compiled IR is significantly larger than the source YAML due to inlined testdata, schemas, the symbol table, and per-instruction metadata overhead.
2. **Recompilation required** — any change to a YAML source file requires full recompilation. There is no incremental compilation (a single test change recompiles the entire TCK).
3. **Duplication** — environment data (variables, services, preconditions) is duplicated across every `CompiledTest`'s symbol table within the same `CompiledTck`. This is intentional (each test must be independently executable) but increases package size.
4. **Version coupling** — Player and compiler must agree on `format_version`. Upgrading the format requires coordinated releases.

### Risks

| Risk | Mitigation |
|------|------------|
| Symbol table out of sync with instructions | Compiler validation rules (§5.4) catch all mismatches at compile time. The IR is never manually edited. |
| Forward references slip through | Single-pass validation in §9.2 with `produced_by < i` invariant makes forward references structurally impossible. |
| Compiled output too large for network transfer | `.tckpkg` compression (ADR-0012) reduces size. Individual `CompiledTest` objects can be streamed separately. |
| `$ref` key typo produces runtime error | Compiler completeness check (§5.4 rule 1) catches ALL missing references at compile time. Runtime `$ref` resolution failure is a compiler bug. |
| Condition expressions become complex | Intentionally limited to null-checks and equality (§4.3). Complex logic must be expressed as separate steps. |

---

## Appendix A: JSON Schema for `CompiledTest`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CompiledTest",
  "type": "object",
  "required": ["format_version", "compiled_at", "compiler_version", "test_id", "namespace", "testlab", "metadata", "symbol_table", "instructions"],
  "properties": {
    "format_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "compiled_at": { "type": "string", "format": "date-time" },
    "compiler_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "test_id": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "namespace": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "testlab": { "type": "string" },
    "metadata": {
      "type": "object",
      "required": ["name", "version"],
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "symbol_table": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["source", "produced_by", "type"],
        "properties": {
          "source": { "type": "string", "enum": ["env.variables", "env.services", "env.preconditions", "env.schemas", "env.testdata", "execution", "step_output"] },
          "produced_by": { "type": "integer", "minimum": -1 },
          "type": { "type": "string", "enum": ["string", "integer", "boolean", "object", "array", "class"] },
          "class": { "type": "string" }
        }
      }
    },
    "instructions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["index", "id", "uses", "name", "with", "returns", "phase", "phase_index", "on_failure"],
        "properties": {
          "index": { "type": "integer", "minimum": 0 },
          "id": { "type": "string", "pattern": "^[a-z][a-z0-9_]{0,49}$" },
          "uses": { "type": "string" },
          "name": { "type": "string" },
          "with": { "type": "object" },
          "returns": { "type": "object" },
          "validate": {
            "oneOf": [
              { "type": "null" },
              {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["uses", "with"],
                  "properties": {
                    "uses": { "type": "string", "pattern": "^validate/" },
                    "with": { "type": "object" }
                  }
                }
              }
            ]
          },
          "phase": { "type": "string", "enum": ["setup", "steps", "teardown"] },
          "phase_index": { "type": "integer", "minimum": 0 },
          "on_failure": { "type": "string", "enum": ["abort", "continue", "skip_test"] },
          "timeout_s": { "oneOf": [{ "type": "number", "minimum": 0 }, { "type": "null" }] },
          "condition": { "oneOf": [{ "type": "string" }, { "type": "null" }] }
        }
      }
    }
  }
}
```

---

## Appendix B: JSON Schema for `CompiledTck`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CompiledTck",
  "type": "object",
  "required": ["format_version", "compiled_at", "compiler_version", "tck_id", "namespace", "testlab", "metadata", "env", "tests", "compiled_tests"],
  "properties": {
    "format_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "compiled_at": { "type": "string", "format": "date-time" },
    "compiler_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "tck_id": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "namespace": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "testlab": { "type": "string" },
    "metadata": { "type": "object" },
    "env": {
      "type": "object",
      "required": ["variables", "services", "schemas", "testdata", "preconditions"],
      "properties": {
        "variables": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "value", "type"],
            "properties": {
              "name": { "type": "string" },
              "value": {},
              "type": { "type": "string" }
            }
          }
        },
        "services": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "uses", "with"],
            "properties": {
              "name": { "type": "string" },
              "uses": { "type": "string", "pattern": "^service/" },
              "with": { "type": "object" }
            }
          }
        },
        "schemas": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["source_file", "content"],
            "properties": {
              "source_file": { "type": "string" },
              "content": { "type": "object" }
            }
          }
        },
        "testdata": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["source_file", "type"],
            "properties": {
              "source_file": { "type": "string" },
              "type": { "type": "string" },
              "content": {},
              "content_base64": { "type": "string" }
            }
          }
        },
        "preconditions": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "uses", "name", "returns"],
            "properties": {
              "id": { "type": "string" },
              "uses": { "type": "string", "pattern": "^precondition/" },
              "name": { "type": "string" },
              "with": { "type": "object" },
              "returns": { "type": "object" }
            }
          }
        }
      }
    },
    "tests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["test_id", "file", "source_hash"],
        "properties": {
          "test_id": { "type": "string" },
          "file": { "type": "string" },
          "source_hash": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" }
        }
      }
    },
    "compiled_tests": {
      "type": "array",
      "items": { "$ref": "#/definitions/CompiledTest" }
    }
  }
}
```
