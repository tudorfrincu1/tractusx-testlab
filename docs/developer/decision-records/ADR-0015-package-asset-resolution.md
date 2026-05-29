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

# ADR-0015: Package Asset Resolution and Override Model

## Status

Accepted

## Date

2026-05-28

## Based On

- [ADR-0012 — Compilation and Packaging](ADR-0012-compilation-and-packaging.md)
- [ADR-0014 — Flat Compilation Intermediate Representation](ADR-0014-flat-compilation-intermediate-representation.md)

## Context

ADR-0012 defines the `.tckpkg` package format and ADR-0014 defines the Flat Compilation IR. However, neither specifies clearly:

1. **What goes inside the compiled JSON vs. what remains as separate files** in the package archive.
2. **How assets (schemas, testdata) are referenced** from the compiled IR.
3. **Whether assets can be overridden** at execution time without recompilation.

### Forces

- **Reusability**: The same TCK package should be executable against different SUT implementations with different testdata payloads or schema versions — without recompilation.
- **Certification flexibility**: A certification body distributes the TCK, but SUT vendors may need to override testdata to match their specific implementation details.
- **Package portability**: The `.tckpkg` must remain self-contained — it must work without network access or external file dependencies.
- **Debuggability**: The compiled IR (`tck-execution.json`) should remain human-inspectable. Embedding 50MB PDFs as base64 inside JSON kills readability and tooling.
- **Security**: In encrypted mode, the TCK author must control whether asset overrides are permitted.
- **Simplicity**: The Player should resolve assets with a single, predictable mechanism — no special-casing per asset type.

## Decision

### 1. Package Structure

A `.tckpkg` is a ZIP archive containing three components:

#### 1.1 Plain Mode

```
my-tck.tckpkg (ZIP)
├── manifest.yaml          # Package metadata (always unencrypted)
├── tck-execution.json     # Full execution payload (env, preconditions, compiled_tests)
└── assets/
    ├── schemas/
    │   ├── business_partner_certificate.json
    │   └── notification_header.json
    └── testdata/
        ├── available_notification.json
        └── sample_certificate.pdf
```

#### 1.2 Encrypted Mode

```
my-tck.tckpkg (ZIP)
├── manifest.yaml          # Unencrypted metadata + security block (NO tests: section)
├── payload.enc            # AES-256-GCM encrypted tar (tck-execution.json + assets/)
└── signature.sig          # Hybrid Ed25519 + ML-DSA-65 signature
```

!!! note "Encrypted mode omits `tests:` from manifest"
    In encrypted mode, the `tests:` section is NOT present in `manifest.yaml` — it is inside the encrypted payload. This prevents leaking test IDs and source paths to unauthorized parties.

### 2. Asset References in `tck-execution.json`

The compiled IR does **NOT** inline asset content. Instead, it stores **asset keys** that the Player resolves at boot time.

#### 2.1 Schema References

```json
"env": {
  "schemas": {
    "certificate_schema": {
      "asset_key": "business_partner_certificate_schema.json",
      "type": "application/json"
    }
  }
}
```

#### 2.2 Testdata References

```json
"env": {
  "testdata": {
    "available_notification_body": {
      "asset_key": "available_notification_body.json",
      "type": "application/json"
    },
    "sample_certificate": {
      "asset_key": "sample_certificate.pdf",
      "type": "application/pdf"
    }
  }
}
```

#### 2.3 Asset Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset_key` | string | Yes | Filename or relative path within the `assets/` folder inside the ZIP. Used for resolution and decompilation. |
| `type` | string | Yes | MIME type of the asset content. |

### 3. What is Inlined vs. What is an Asset

| Data | Location | Reason |
|------|----------|--------|
| Variables | Inlined in `tck-execution.json` → `env.variables` | Small strings, overridable via `--env` flag |
| Services (factory recipes) | Inlined in `tck-execution.json` → `env.services` | Config objects, not bulk data |
| Preconditions | Inlined in `tck-execution.json` → `preconditions` (root level) | Metadata, not files |
| Precondition `seed` mappings | Inlined in `tck-execution.json` → `preconditions[].seed` | Env variable seeding metadata (see ADR-0013 §10) |
| Instructions + symbol tables | Inlined in `tck-execution.json` → `compiled_tests[]` | Core IR — never swapped |
| **Schemas** | **Asset reference** → `assets/schemas/` | May be versioned/overridden per SUT |
| **Testdata (JSON/XML/text)** | **Asset reference** → `assets/testdata/` | Primary override target |
| **Testdata (binary)** | **Asset reference** → `assets/testdata/` | Never belongs in JSON |

**Rule:** Anything that a SUT vendor or test operator might legitimately need to swap without recompilation is stored as a separate asset file.

### 4. Player Asset Resolution (Layered Override Model)

The Player resolves assets using a priority chain:

```
Priority: override folder > package assets > error
```

#### 4.1 Player Boot Sequence

The Player executes this sequence at startup before running tests:

```
1. Load global_symbols → apply defaults + --env overrides
2. Load assets (schemas, testdata) + overrides
3. Execute preconditions IN ORDER:
   a. Run precondition step → get output dict
   b. Validate output matches `returns` contract
   c. For each `seed` entry: if env var NOT already set by --env → write output value
4. Re-resolve services that depend on seeded variables (lazy init)
5. Run tests
```

**Seeding priority:**

```
--env explicit override  >  seed from precondition  >  default value
```

#### 4.2 CLI Interface

```bash
# Run with package assets (default — no overrides)
testlab run my-tck.tckpkg

# Override specific assets
testlab run my-tck.tckpkg --override-assets ./my-overrides/

# Override environment variables + assets
testlab run my-tck.tckpkg \
  --env provider_url=https://my-sut.com \
  --override-assets ./my-custom-data/
```

**Override folder structure mirrors the `assets/` layout:**

```
my-overrides/
├── schemas/
│   └── business_partner_certificate.json   ← custom schema version
└── testdata/
    └── available_notification.json          ← custom payload
```

Only files present in the override folder are overridden — missing files fall through to the package default.

### 5. Override Control (Security)

The TCK author controls whether their package allows asset overrides via the `manifest.yaml`:

```yaml
compilation:
  compiled_at: "2026-05-28T14:00:00Z"
  compiler_version: "0.5.0"
  fingerprint:
    nonce: "blake2b:..."
    public_key: "ed25519:..."
    checksum: "blake2b:..."
  allow_asset_override: true    # or false
```

#### 5.1 Override Policies

| `allow_asset_override` | Plain mode | Encrypted mode |
|------------------------|-----------|----------------|
| `true` | Overrides permitted | Overrides permitted (after decryption) |
| `false` | Overrides permitted (warning logged) | **Overrides rejected** — `AssetOverrideProhibitedError` |
| *(not set)* | Overrides permitted | Overrides rejected (secure default) |

**Rationale:**
- Plain mode is for development — always allow overrides (with a warning if explicitly disallowed).
- Encrypted mode is for distribution/certification — respect the author's intent.

### 6. Compiler Changes

The compiler's packaging phase (ADR-0012 §2, phase 8) is updated:

| Previous behavior | New behavior |
|-------------------|--------------|
| Inline schema content into IR | Copy schema file to `assets/schemas/`, store `asset_key` in IR |
| Inline JSON testdata into IR | Copy testdata file to `assets/testdata/`, store `asset_key` in IR |
| Inline binary testdata as base64 | Copy binary file to `assets/testdata/`, store `asset_key` in IR |

The compiler still **validates** schemas and testdata at compile time (parsing, type checking). It just doesn't embed the content in the IR.

### 7. Symbol Table Impact

The symbol table entries for schemas and testdata remain unchanged:

```json
"env.schemas.certificate_schema": {
  "source": "env.schemas",
  "produced_by": -1,
  "type": "object"
},
"env.testdata.request_certificate_body": {
  "source": "env.testdata",
  "produced_by": -1,
  "type": "object"
}
```

The Player seeds these symbols from the resolved asset content at boot time — the instructions don't know (or care) whether the value came from the package or an override folder.

### 8. Concrete Example

See `docs/examples/certificate-management-v2/plain/` for a full working example with:
- `manifest.yaml` — grouped sections (package/tck/compilation) with fingerprint block
- `tck-execution.json` — env, tests, preconditions at root, compiled_tests array

---

## Consequences

### Positive

1. **Reusable packages**: Same TCK runs against different SUTs with different payloads — no recompilation.
2. **Readable IR**: `tck-execution.json` contains only references, not bulk data — stays human-inspectable.
3. **Binary-safe**: PDFs, certificates, and other binaries are proper files, not base64 blobs in JSON.
4. **Schema evolution**: Test against different schema versions by overriding the schema file.
5. **Secure by default**: Encrypted packages reject overrides unless explicitly allowed by the author.
6. **Simple resolution**: One algorithm, one priority chain, one CLI flag.

### Negative

1. **ZIP-internal file reads**: The Player must read files from within the ZIP archive.
2. **Override validation gap**: Overridden assets are not compile-time validated — a malformed JSON override causes a runtime error.
3. **Partial overrides**: Overriding testdata without updating assertions could cause false test failures (user responsibility).

### Risks

| Risk | Mitigation |
|------|------------|
| Override breaks test assumptions | Player validates overridden JSON schemas at boot time. Logs all overrides at startup. |
| Override used to bypass certification | `allow_asset_override: false` in encrypted mode blocks all overrides. |
| Asset path traversal attack | Player rejects `asset_key` containing `..` or absolute paths. Resolution confined to `assets/` prefix. |
| Missing asset in package | Compiler validates all `asset_key` entries exist in the ZIP before finalizing. |

---

## Supersedes

This ADR **amends** ADR-0012 §3 (package structure) and ADR-0014 §3.4.3–3.4.4 (inlined schemas/testdata):

- ADR-0012: `.tckpkg` now contains `tck-execution.json` + `assets/` instead of raw YAML `tests/` + `assets/`.
- ADR-0014: `env.schemas` and `env.testdata` use `asset_key` references instead of inlined `content`/`content_base64`.

All other aspects of ADR-0012 (encryption, signing, integrity, CLI) and ADR-0014 (instructions, symbol table, $ref resolution) remain unchanged.
