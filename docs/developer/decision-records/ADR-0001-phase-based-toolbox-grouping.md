<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

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

# ADR-0001: Phase-Based Toolbox Grouping

## Status

Accepted

## Date

2026-05-13

## Context

The Blockly toolbox was organized by flat categories (EDC Connector, HTTP, Validation, etc.). Blocks from any category could be placed anywhere in the workspace. There was no visual indication of which blocks belonged to which test execution phase. Users had to memorize which blocks were appropriate for setup vs. execution vs. teardown.

## Decision

Restructure the toolbox into phase groups: Setup, Steps, and Teardown. Each block category is mapped to one or more phases. Phase enforcement prevents blocks from being placed in the wrong phase container.

Structural blocks (Variables, Values, Flow) remain unrestricted and appear in all phases. HTTP blocks appear in multiple phases since HTTP calls are valid in setup, execution, and teardown.

## Consequences

### Positive

- Users immediately see which blocks belong to which phase.
- Blocks are physically restricted to valid phases, preventing invalid test structures.
- Toolbox reflects the mental model of test execution order.

### Negative

- HTTP blocks appear in multiple phase sections, creating minor duplication in the toolbox.
- Adding a new phase requires updating the toolbox grouping logic.

### Neutral

- Structural blocks (Variables, Values) remain phase-agnostic.
- Block catalog JSON gains a `phases` field per block definition.
