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

# Decision Records

Architecture Decision Records (ADRs) document significant technical decisions made during the development of Tractus-X TestLab.

## Format

Each ADR follows the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

| Section | Purpose |
|---------|---------|
| Status | Proposed, Accepted, Deprecated, or Superseded |
| Date | When the decision was made |
| Context | Forces at play and constraints |
| Decision | What was decided |
| Consequences | Trade-offs accepted |

## Records

| ADR | Title | Status |
|-----|-------|--------|
| [0000](ADR-0000-template.md) | Template | — |
| [0001](ADR-0001-phase-based-toolbox-grouping.md) | Phase-Based Toolbox Grouping | Accepted |
| [0002](ADR-0002-single-policy-config-block-with-version-mutator.md) | Single Policy Config Block with Version Mutator | Accepted |
| [0003](ADR-0003-sse-for-live-ide-execution.md) | SSE for Live IDE Execution | Accepted |
| [0004](ADR-0004-precondition-as-distinct-step-phase.md) | Precondition as Distinct Step Phase | Accepted |
| [0005](ADR-0005-filesystem-participant-manager-with-protocol.md) | Filesystem Participant Manager with Protocol | Accepted |
| [0006](ADR-0006-service-auto-declaration-on-block-drop.md) | Service Auto-Declaration on Block Drop | Accepted |
| [0007](ADR-0007-precondition-execution-logs-model.md) | Precondition Execution Logs Model | Accepted |
| [0008](ADR-0008-test-case-to-tck-rename.md) | Test-Case to TCK Rename | Accepted |
| [0009](ADR-0009-typed-variable-class-system.md) | Typed Variable Class System | Proposed |

## Creating a New ADR

1. Copy `ADR-0000-template.md` to `ADR-NNNN-short-title.md` (next available number).
2. Fill in all sections.
3. Add the entry to this index table.
4. Add the file to `mkdocs.yml` under the Decision Records nav section.
