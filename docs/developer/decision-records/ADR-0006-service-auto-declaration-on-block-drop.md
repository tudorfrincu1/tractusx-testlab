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

# ADR-0006: Service Auto-Declaration on Block Drop

## Status

Discontinued

## Date

2026-05-13

## Context

Users had to manually create services via the ServiceDialog before using service-category blocks (EDC Connector, DTR, Discovery Finder). This violated the "defaults everywhere" design principle — blocks should work with minimal input. New users were confused when dropping a connector block that immediately showed errors because no service existed.

## Decision

Auto-declare a service on Blockly `BLOCK_CREATE` event. Logic:

1. Block is dropped that requires a service (determined by block category).
2. If a matching service already exists in the store → auto-select it on the block.
3. If no matching service exists → auto-create one with defaults (empty URL, type inferred from category) and select it.

The ServiceDialog remains available for manual override and advanced configuration.

## Consequences

### Positive

- Zero-config experience for first block drop — no prerequisite dialog required.
- Follows "defaults everywhere" principle.
- Reduces onboarding friction for new users.

### Negative

- Auto-created services have empty URLs — user must configure before execution.
- Multiple blocks of the same category share the auto-created service (may not always be desired).

### Neutral

- ServiceDialog remains the mechanism for renaming, deleting, or duplicating services.
- No duplicate services are created — matching uses service type as the key.
