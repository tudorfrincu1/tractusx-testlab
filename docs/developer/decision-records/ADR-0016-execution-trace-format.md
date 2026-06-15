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

# ADR-0016: Execution Trace Format — CloudEvents Hybrid Envelope

## Status

Proposed

## Date

2026-05-28

## Context

The TestLab player emits execution traces for:

- **Observability**: streaming progress to the IDE via SSE
- **Debugging**: inspecting step-level inputs, outputs, and validation results
- **Audit**: immutable record of what ran, what passed, and what failed
- **Tooling**: log aggregator ingestion (ELK, Loki, Datadog) without custom transformers

Traces are delivered to the IDE frontend over Server-Sent Events (SSE) and persisted as JSONL files. The format must be self-contained, streamable, and interoperable with existing observability infrastructure.

The previous v2 format (flat JSONL with a header line) coupled trace identity to file-level context, making it unsuitable for single-stream TCK runs where multiple tests and lifecycle phases interleave. A CloudEvents-based envelope provides per-event identity, standard typing, and ecosystem compatibility.

## Decision

Every trace line is a **CloudEvents v1.0** JSON object with domain-specific extensions (`sequence`, nested `data`). The format is a hybrid: CloudEvents envelope for interoperability, domain `data` for TestLab semantics.

### Envelope Fields

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `specversion` | `"1.0"` | Fixed | CloudEvents spec version |
| `id` | `string` | Computed | Structured path ID (see below) |
| `source` | `string` | Step `uses` | Emitting component (step type or lifecycle source) |
| `type` | `string` | Event verb | Lifecycle event type from the taxonomy |
| `time` | `string (ISO 8601)` | Clock | Event emission timestamp |
| `sequence` | `integer` | Counter | Global monotonic counter (1-based across the entire TCK run) |
| `data` | `object` | Domain | Event-specific payload |

### The `id` Convention

Event IDs encode structural context as path segments:

| Scope | Format | Example |
|-------|--------|---------|
| TCK lifecycle | `<tckid>/<type>/<hash>` | `cert-mgmt-tck/tck.start/a3f8c1d27e4b` |
| Precondition | `<tckid>/<stepid>/<type>/<hash>` | `cert-mgmt-tck/sut_connector/tck.precondition.passed/6f3ad5c128e4` |
| Test lifecycle | `<tckid>/<testid>/<type>/<hash>` | `cert-mgmt-tck/catalog-policy-validation/tck.test.passed/c59034276e4a` |
| Test step | `<tckid>/<testid>/<stepid>/<type>/<hash>` | `cert-mgmt-tck/catalog-policy-validation/pull_data_1/tck.test.step.passed/b48f2a165d39` |

The trailing `<hash>` is a 12-character hex string (blake2b of `data`) that disambiguates emissions with otherwise identical paths.

### The `source` Convention

| Context | Source value | Example |
|---------|-------------|---------|
| Step execution | Step's `uses` value | `connector/pull_data_filtered`, `validate/assert` |
| Precondition | Precondition's `uses` value | `precondition/input`, `precondition/provide` |
| TCK lifecycle | `testlab/player/lifecycle` | — |
| Boot phase | `testlab/player/boot` | — |

### Type Taxonomy

#### TCK Lifecycle Events

| `type` | `data` shape | Description |
|--------|-------------|-------------|
| `tck.start` | `{tck_id, namespace, metadata, environment, service, run_id}` | TCK run begins |
| `tck.boot.start` | `{manifest, compiler_version}` | Boot phase begins |
| `tck.boot.passed` | `{duration_ms, assets_resolved, services}` | Boot succeeded |
| `tck.boot.failed` | `{duration_ms, errors}` | Boot failed |
| `tck.tests.planned` | `{tests: [<test_id>, ...]}` | Ordered test execution plan |
| `tck.end` | `{status, total, passed, failed, skipped, duration_ms, labels}` | TCK run complete |

#### Precondition Lifecycle Events

| `type` | `data` shape | Description |
|--------|-------------|-------------|
| `tck.precondition.start` | `{name, uses}` | Precondition begins |
| `tck.precondition.update` | `{name, state, ...context}` | Progress (long-running) |
| `tck.precondition.passed` | `{outputs, duration_ms}` | Precondition succeeded |
| `tck.precondition.failed` | `{errors, duration_ms}` | Precondition failed |
| `tck.precondition.skipped` | `{name, reason}` | Precondition not needed |
| `tck.precondition.input.required` | `{name, schema, prompt, correlation_id, input_prompts}` | Blocked on user input |
| `tck.precondition.input.received` | `{name, correlation_id, outputs}` | User input received |

#### Test Lifecycle Events

| `type` | `data` shape | Description |
|--------|-------------|-------------|
| `tck.test.start` | `{test_id}` | Test begins |
| `tck.test.passed` | `{test_id, duration_ms, passed, failed, assertions}` | Test passed |
| `tck.test.failed` | `{test_id, duration_ms, passed, failed, assertions}` | Test failed |
| `tck.test.skipped` | `{test_id, reason}` | Test skipped |

#### Test Setup Events

| `type` | `data` shape | Description |
|--------|-------------|-------------|
| `tck.test.setup.start` | `{attempt}` | Start new setup like mock for example |

#### Test Step Events

| `type` | `data` shape | Description |
|--------|-------------|-------------|
| `tck.test.step.start` | `{attempt}` | Step execution begins |
| `tck.test.step.update` | `{attempt, state, ...context}` | Progress (long-running) |
| `tck.test.step.passed` | `{attempt, duration_ms, outputs, validations}` | Step succeeded (terminal) |
| `tck.test.step.failed` | `{attempt, duration_ms, outputs?, validations, errors}` | Step failed (terminal) |
| `tck.test.step.skipped` | `{attempt, reason}` | Step skipped |
| `tck.test.step.timeout` | `{attempt, duration_ms, timeout_ms}` | Step timed out |
| `tck.test.step.retry` | `{attempt, previous_attempt, reason}` | Retry initiated |

### Nested Validations

Validations are **nested inside the terminal step event** in `data.validations[]`. They are NOT separate CloudEvents. Each validation element:

```json
{
  "source": "validate/assert",
  "field": "edr_token",
  "inputs": {"assertion": "not_null", "expected": null},
  "outputs": {"actual": "...", "passed": true},
  "errors": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `source` | `string` | Validation step's `uses` value |
| `field` | `string` | Output field being validated from specific step |
| `inputs` | `object` | Assertion type + expected value |
| `outputs` | `object` | Actual value + `passed` boolean |
| `errors` | `array` | Present only on validation failure (with recommendations) |

**Rationale**: Validations are semantically part of the step result, not independent events. Nesting reduces event count and keeps the step result self-contained for IDE rendering.

### Retry Handling

When a step is retried:

1. A `tck.test.step.retry` event fires with `{attempt: N, previous_attempt: N-1, reason: "..."}`
2. A new `tck.test.step.start` fires with `{attempt: N}`
3. The terminal event carries `{attempt: N, ...}` indicating which attempt produced the result

All attempts share the same `<tckid>/<testid>/<stepid>/` prefix — the trailing hash disambiguates.

### Secret Protection

All sensitive fields are encrypted using **standard JWE compact serialization** (RFC 7516) with `alg: "dir"` and `enc: "A256GCM"`. This is the single way secrets are protected — there is no redaction fallback.

Encryption applies to any output field marked sensitive (e.g. tokens, credentials) **and** any input field with `class: "secret"` (see [ADR-0017](ADR-0017-input-callback-endpoint.md)).

An encrypted field carries a JWE compact serialization string under a `$jwe` key. A JWE compact token is a 5-part base64url dotted string (`header.encrypted_key.iv.ciphertext.tag`; the `encrypted_key` segment is empty for `dir`):

```json
{
  "edr_token": {
    "$jwe": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoibG9jYWwtMjAyNi0wNS0yOCJ9..<iv>.<ciphertext>.<tag>"
  }
}
```

The `$jwe` field holds the JWE compact serialization string. Its protected header carries `alg`, `enc`, and `kid` (key id) — the `kid` enables rotation.

**Key management**: Keys are stored as a standard **JWKS** file (`~/.testlab/keys.jwks`, chmod 600) for local dev; CI provides the key via `TESTLAB_ENCRYPTION_KEY` (registered as a masked secret). The JWK `kid` enables rotation — old keys decrypt old traces.

**Library**: Python `jwcrypto` (built on `cryptography`; full JWE/JWK support).

> AES-GCM nonce uniqueness is handled by the JWE library per-encryption.

### Error Structure with Recommendations

Errors appear in two places:
- `data.errors[]` on the step event (step-level failures)
- `data.validations[].errors[]` on individual validation failures

Each error object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Machine-readable code (e.g. `NEGOTIATION_TIMEOUT`) |
| `message` | `string` | Yes | Human-readable: what failed, expected vs actual |
| `retryable` | `bool` | Yes | Whether the step can be retried |
| `context` | `object` | No | Diagnostic data (IDs, states, durations) |
| `recommendations` | `array` | No | Actionable suggestions from `recommendations.yaml` |

#### Recommendation Resolution Order

On failure, the player resolves recommendations by merging (deduplicated by `id`):

1. `<error.code>` — most specific (e.g. `NEGOTIATION_TIMEOUT`)
2. `validation:<type>` — validation assertion type (e.g. `validation:equals`)
3. `step:<uses>` — step type (e.g. `step:connector/pull_data_filtered`)

#### `recommendations.yaml` Configuration

```yaml
# By error code
NEGOTIATION_TIMEOUT:
  - id: check-policy-match
    message: "Verify the SUT's access policy accepts your BPN and usage purpose"
    docs: "https://eclipse-tractusx.github.io/docs/tutorials/policy-troubleshooting"
  - id: increase-timeout
    message: "Increase negotiation timeout via 'negotiation_timeout_ms' in test config"
    config: negotiation_timeout_ms

# By step type
step:connector/pull_data_filtered:
  - id: verify-dct-type
    message: "Confirm the catalog filter dct:type matches the SUT asset registration"

# By validation type
validation:equals:
  - id: inspect-actual-vs-expected
    message: "Compare outputs.actual against inputs.expected in the trace"
```

### Precondition Input Flow

When a precondition requires user input:

1. Player emits `tck.precondition.input.required` with `correlation_id`, `schema`, `prompt`, and `input_prompts`
2. SSE stream **pauses server-side** — no further events until input arrives
3. IDE renders a form from `input_prompts`; user submits via REST endpoint (out of scope — see ADR-0017)
4. Player emits `tck.precondition.input.received` echoing `correlation_id` + `outputs`
5. Player emits `tck.precondition.passed` and streaming resumes

The `correlation_id` links the request to the response, enabling the backend to match submissions to pending preconditions.

### SSE Transport Mapping

Each JSONL line maps to one SSE frame:

| SSE field | Source | Purpose |
|-----------|--------|---------|
| `event:` | `type` value | Routes to IDE event handler |
| `id:` | `sequence` (string) | Enables `Last-Event-ID` reconnection |
| `data:` | Full CE JSON (one line) | Self-contained event payload |

**Reconnection**: IDE sends `Last-Event-ID: <sequence>` on reconnect. Backend resumes from `sequence + 1`. The `tck.start` event is re-sent on every new connection so late joiners have run context.

## Concrete Example

See [`docs/examples/certificate-management-v2/plain/execution-trace.jsonl`](../../examples/certificate-management-v2/plain/execution-trace.jsonl) for a full 36-event TCK trace.

**TCK start** (sequence 1):
```json
{"specversion":"1.0","id":"certificate-management-tck/tck.start/a3f8c1d27e4b",
 "source":"testlab/player/lifecycle","type":"tck.start",
 "time":"2026-05-28T18:30:00.000Z","sequence":1,
 "data":{"tck_id":"certificate-management-tck","namespace":"ccm-v0.0.1",
  "metadata":{"name":"Certificate Management TCK","version":"v0.0.1",
   "standard":"CX-0135","dataspace_version":"saturn"},
  "environment":"local","service":"tractusx-testlab",
  "run_id":"a3f8c1d2-7e4b-4a9f-b5c6-2d1e8f9a0b3c"}}
```

**Input-required pause** (sequences 11–12, ~45s gap):
```json
{"specversion":"1.0","id":"...tck.precondition.input.required/4d18b3af06c2",
 "source":"precondition/input","type":"tck.precondition.input.required",
 "time":"2026-05-28T18:30:00.530Z","sequence":11,
 "data":{"name":"sut_connector","correlation_id":"inp-sut-conn-01",
  "prompt":"Provide SUT connector details","input_prompts":[...]}}

{"specversion":"1.0","id":"...tck.precondition.input.received/5e29c4b017d3",
 "source":"precondition/input","type":"tck.precondition.input.received",
 "time":"2026-05-28T18:30:45.090Z","sequence":12,
 "data":{"name":"sut_connector","correlation_id":"inp-sut-conn-01",
  "outputs":{"counter_party_address":"https://sut-connector.example.com/api/v1/dsp",
   "counter_party_id":"BPNL000000000SUT"}}}
```

**Step passed with nested validations** (sequence 18):
```json
{"specversion":"1.0","id":"...pull_data_1/tck.test.step.passed/b48f2a165d39",
 "source":"connector/pull_data_filtered","type":"tck.test.step.passed",
 "time":"2026-05-28T18:30:47.738Z","sequence":18,
 "data":{"attempt":1,"duration_ms":2538,
  "outputs":{"asset_id":"urn:asset:ccm-api-3.0",
   "edr_token":{"$jwe":"eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoibG9jYWwtMjAyNi0wNS0yOCJ9..<iv>.<ct>.<tag>"}},
  "validations":[
   {"source":"validate/assert","field":"edr_token",
    "inputs":{"assertion":"not_null"},"outputs":{"passed":true}},
   {"source":"validate/assert","field":"dataplane_url",
    "inputs":{"assertion":"not_null"},"outputs":{"passed":true}}]}}
```

**Failed step with recommendations** (sequence 22):
```json
{"specversion":"1.0","id":"...send_request_1/tck.test.step.failed/f8c367508a7d",
 "source":"connector/pull_data_filtered","type":"tck.test.step.failed",
 "time":"2026-05-28T18:31:17.801Z","sequence":22,
 "data":{"attempt":1,"duration_ms":30000,
  "validations":[{"source":"validate/assert","field":"status_code",
   "inputs":{"assertion":"equals","expected":200},
   "outputs":{"actual":null,"passed":false},
   "errors":[{"code":"NEGOTIATION_TIMEOUT",
    "message":"Contract negotiation did not reach AGREED state within 30s",
    "retryable":true,
    "recommendations":[
     {"id":"check-policy-match","message":"Verify the SUT's access policy..."},
     {"id":"increase-timeout","message":"Increase timeout...","config":"negotiation_timeout_ms"},
     {"id":"verify-dct-type","message":"Confirm catalog filter dct:type..."}]}]}],
  "errors":[{"code":"NEGOTIATION_TIMEOUT","retryable":true,
   "message":"Contract negotiation did not reach AGREED state within 30s"}]}}
```

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| Flat JSONL with header line (v2) | Header couples identity to file; doesn't support single-stream TCK runs |
| Separate validation events | Inflates event count; validations are semantically part of the step result |
| UUID v4 for `id` field | Opaque — no structural context; harder to filter/grep |
| Full-line encryption | Breaks log aggregator indexing — non-sensitive fields become unsearchable |
| Custom `$encrypted` wrapper | Reinvents JWE (RFC 7516); standard JWE compact gives library support, JWK key rotation, and interoperability |
| `[REDACTED]` redaction strategy | Irreversibly discards debug-valuable data; JWE encryption protects secrets while remaining recoverable with the key |
| OpenTelemetry spans | Requires OTel collector infrastructure; overkill for file-based traces |
| Protobuf encoding | Not human-readable; cannot `cat` or `jq` the trace |
| Two-file split (TCK + per-test) | Adds complexity; single-stream is simpler for IDE consumption and SSE delivery |

## Consequences

### Positive

- Standard CloudEvents envelope enables integration with any CE-compatible tooling
- Structured `id` enables filtering by TCK, test, step, or event type via simple string prefix
- Self-contained events — no header dependency; any line is independently meaningful
- Nested validations keep step results atomic for IDE rendering
- `sequence` provides total ordering and SSE reconnection support
- Standard JWE (RFC 7516) encryption is the single mechanism for secret protection; `kid`-based JWK rotation keeps old traces decryptable
- Recommendation resolution order provides increasingly specific fix suggestions

### Negative

- Larger per-event overhead (~100 bytes envelope) vs flat format
- Consumers must parse CloudEvents envelope before accessing domain data
- `id` path convention requires understanding the format — not standard CE

### Neutral

- No backward compatibility with v2 format — clean break (no v2 consumers exist in production)
- Performance impact negligible (~1μs envelope construction vs ms-scale step execution)
