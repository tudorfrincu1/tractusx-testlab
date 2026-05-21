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

# Flow Blocks

Control flow blocks for retries, delays, and logging.

---

## flow/retry

Retry nested steps until all assertions pass or max attempts exceeded.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `max_attempts` | number | No | `3` | Maximum retry attempts |
| `delay_s` | number | No | `1` | Delay between retries in seconds |
| `steps` | steps | Yes | — | Nested steps to retry |

**Outputs (`returns:`)** — None (container block)

**Example**

```yaml
- name: retry_catalog
  uses: flow/retry
  with:
    max_attempts: 5
    delay_s: 2
    steps:
      - name: check
        uses: connector/consumer/query_catalog
        with:
          service: consumer
          counter_party_address: ${{ env.provider_dsp }}
        returns:
          datasets: datasets
        validate:
          - uses: validate/assert
            with:
              input: datasets
              operator: not_null
```

---

## flow/delay

Pause execution for a specified duration.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `seconds` | number | Yes | `1` | Duration to pause in seconds |

**Outputs (`returns:`)** — None

**Example**

```yaml
- name: wait_propagation
  uses: flow/delay
  with:
    seconds: 5
```

---

## flow/log

Log a message during test execution.

**Inputs (`with:`)**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `message` | string | Yes | — | Message to log |
| `level` | dropdown | No | `INFO` | Log level: INFO, WARN, DEBUG |

**Outputs (`returns:`)** — None

**Example**

```yaml
- name: log_start
  uses: flow/log
  with:
    message: "Starting certificate validation"
    level: INFO
```
