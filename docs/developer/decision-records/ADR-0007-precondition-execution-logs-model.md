<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# ADR-0007: Precondition Execution Logs Model

## Status

Superseded by [ADR-0021](ADR-0021-remove-precondition-concept.md)

## Date

2026-05-13

## Context

Precondition steps produce structured instructions, not API calls. The system needs a data model for two interaction patterns:

- **CONFIG** (TestLab → User): "Here is what you need to configure in your connector."
- **REQUEST** (User → TestLab): "Please provide this value so execution can continue."

The model must support category-based filtering for future frontend display and variable population from user-provided inputs.

## Decision

Define a `PreconditionLog` Pydantic model with:

- `PreconditionLogType` enum: `CONFIG`, `REQUEST`
- `PreconditionLogCategory` enum: `EDC_ASSET`, `EDC_POLICY`, `EDC_CONTRACT`
- Fields: `type`, `category`, `title`, `description`, `data` (structured payload)

Logs are stored on `StepResult.precondition_logs` as a list. Categories are extensible for future domains (`DTR_SHELL`, `DTR_SUBMODEL`, `DISCOVERY`).

## Consequences

### Positive

- Structured output enables rich frontend rendering (tables, forms, copy buttons).
- Category-based filtering allows grouped display by domain.
- `REQUEST` logs enable variable population from user inputs.
- Clear separation between "give data" and "ask for input" patterns.

### Negative

- Category enum must be extended for each new precondition domain.
- `data` field uses `dict[str, Any]` — schema validation per category is deferred.

### Neutral

- Logs are append-only during precondition execution.
- Serialization uses standard Pydantic JSON export.
