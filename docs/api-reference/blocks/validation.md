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

# Validation Assertions

Assertions verify step outputs. They appear in the `validate:` block of any step.

!!! warning "Important"
    The `input` field **always** references a variable from the parent step's `returns:` block.
    At runtime it resolves to `${{ vars.step_name.field }}`.

## Operators

All assertion types share a common operator set:

| Operator | Description | Value Required |
|----------|-------------|----------------|
| `equals` | Exact equality | Yes |
| `not_equals` | Not equal | Yes |
| `not_null` | Value exists and is not null | No |
| `matches_regex` | Matches regular expression | Yes |
| `one_of` | Value is in the given array | Yes (array) |
| `contains` | String/array contains value | Yes |
| `gt` | Greater than | Yes |
| `gte` | Greater than or equal | Yes |
| `lt` | Less than | Yes |
| `lte` | Less than or equal | Yes |

---

## validate/assert

Compare a direct return variable against a scalar or array value.

**Fields (`with:`)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | Yes | Return variable name from the parent step |
| `operator` | string | Yes | Comparison operator (see table above) |
| `value` | any | Conditional | Expected value (not required for `not_null`) |

**Example**

```yaml
validate:
  - uses: validate/assert
    with:
      input: status_code
      operator: equals
      value: 200
  - uses: validate/assert
    with:
      input: datasets
      operator: not_null
```

---

## validate/field

Compare a nested field within a return variable using dot-notation path.

**Fields (`with:`)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | Yes | Return variable name from the parent step |
| `path` | string | Yes | Dot-notation path to the nested field |
| `operator` | string | Yes | Comparison operator (see table above) |
| `value` | any | Conditional | Expected value (not required for `not_null`) |

**Example**

```yaml
validate:
  - uses: validate/field
    with:
      input: response_body
      path: "header.messageId"
      operator: matches_regex
      value: "^urn:uuid:"
  - uses: validate/field
    with:
      input: callback_payload
      path: "content.status"
      operator: one_of
      value: ["COMPLETED", "APPROVED"]
```

---

## validate/object

Deep-compare a return variable against a JSON object.

**Fields (`with:`)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | Yes | Return variable name from the parent step |
| `operator` | string | Yes | `equals` (exact match) or `contains` (subset match) |
| `value` | object | Yes | Expected JSON object |

**Example**

```yaml
validate:
  - uses: validate/object
    with:
      input: response_body
      operator: contains
      value:
        status: "COMPLETED"
        type: "ISO9001"
```

---

## validate/schema

Validate a return variable against a JSON schema.

**Fields (`with:`)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | Yes | Return variable name from the parent step |
| `schema` | string | Yes | Schema reference (use `${{ env.schemas.x }}` for TCK schemas) |

**Example**

```yaml
validate:
  - uses: validate/schema
    with:
      input: response_body
      schema: "${{ env.schemas.certificate_response }}"
```
