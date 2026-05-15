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

# ADR-0002: Single Policy Config Block with Version Mutator

## Status

Accepted

## Date

2026-05-13

## Context

EDC dataspace versions have incompatible ODRL policy structures:

- **Jupiter** (v0.8–v0.10): `odrl:use` action only, `tx:`/`cx-policy:` prefixed operands, permission-only policies.
- **Saturn** (v0.11+): `use`/`access` actions, no prefixes, supports prohibition and obligation.

Options considered: (1) two separate blocks per version, (2) one block with conditional inputs, (3) abstract policy block ignoring versions.

## Decision

Use a single `precondition_policy_config` block with a version dropdown (Jupiter/Saturn). A Blockly mutator dynamically shows or hides inputs based on the selected version. A separate `odrl_constraint_jupiter` block handles prefixed operand selection for Jupiter policies.

The version tag is visible on the block header so users always know which ODRL dialect they are configuring.

## Consequences

### Positive

- Single source of truth for policy configuration.
- Version tag visible on the block prevents accidental misconfiguration.
- No toolbox duplication — one block serves both versions.

### Negative

- Requires custom block registration with mutator logic (not purely catalog-driven).
- Serialization must handle version-conditional YAML output.
- Mutator complexity increases maintenance burden.

### Neutral

- Jupiter-specific constraint block is a separate toolbox entry.
- Future versions can be added as new dropdown options with new mutator branches.
