<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# Block & Assertion Reference

This page documents all available step blocks and validation assertions in TestLab. Every block follows the `uses:` / `with:` / `returns:` pattern.

For architecture overview, design rationale, and the three-tier model, see the [API Reference Overview](index.md).

---

## How to Read This Reference

| Keyword | Purpose |
|---------|---------|
| `uses:` | The block's namespace identifier (e.g., `connector/consumer/negotiate`) |
| `with:` | Input parameters passed to the block |
| `returns:` | Output variables available to subsequent steps via `${{ vars.step_name.field }}` |
| `validate:` | Assertions that check returned values — `input` always references a `returns:` field |

---

## Main Blocks

Domain-specific action steps that execute operations against Tractus-X services. Each block performs one discrete action and produces typed outputs.

| Category | Blocks | Description |
|----------|--------|-------------|
| [EDC Connector](blocks/edc-connector.md) | 11 | Consumer/provider operations on Eclipse Dataspace Connectors |
| [Digital Twin Registry](blocks/dtr.md) | 3 | AAS shell and submodel registration and lookup |
| [Mock](blocks/mock.md) | 4 | Expose HTTP endpoints, wait for callbacks, and protocol mocks for SUT interactions |

---

## Operator Blocks

Generic utility blocks that support main blocks. They are protocol-agnostic — they handle HTTP, JSON processing, flow control, and filtering.

| Category | Blocks | Description |
|----------|--------|-------------|
| [Function (util/)](blocks/function.md) | 4 | UUID generation, BPN generation, JSON path extraction, path validation |
| [HTTP](blocks/http.md) | 2 | Plain HTTP and Dataplane-authenticated requests |
| [Flow](blocks/flow.md) | 3 | Control flow: retry, delay, logging |
| [`filter_expression`](blocks/edc-connector.md#connectorconsumerfilter_expression) | 1 | Defines filter criteria for catalog queries |

Operator blocks are composable helpers. They produce outputs consumed by main blocks or assemble into lists (e.g., `filters:`) for catalog queries.

---

## Validation Blocks

Assertions evaluated after step execution. Attached via the `validate:` key on any step.

| Block | Description |
|-------|-------------|
| `validate/assert` | Compare a value using operators (not_null, equals, contains, etc.) |
| `validate/field` | Assert a specific field exists or matches a value in an object |
| `validate/object` | Assert structural properties of an object (keys, size) |
| `validate/schema` | Validate a value against a JSON Schema reference |

Full reference: [Validation Blocks](blocks/validation.md)

---

## TCK Manifest Configuration

The TCK manifest defines the test environment without blocks. Services, variables, schemas, and preconditions are configured via forms in the IDE.

| Section | Purpose |
|---------|---------|
| `env.services` | Participant connections and authentication |
| `env.variables` | Inputs, secrets, and generator functions |
| `env.schemas` | JSON Schema references for validation blocks |
| Preconditions | Infrastructure setup steps run before tests |

Full reference: [TCK Manifest](blocks/manifest.md)

---

## Quick Example

```yaml
steps:
  - name: query_catalog
    uses: connector/consumer/query_catalog
    with:
      service: consumer
      counter_party_address: ${{ env.provider_dsp }}
      filter_by: "dct:type"
      filter_value: "cx-taxo:CertificateManagement"
    returns:
      catalog: catalog
      datasets: datasets
    validate:
      - uses: validate/assert
        with:
          input: datasets
          operator: not_null
```
