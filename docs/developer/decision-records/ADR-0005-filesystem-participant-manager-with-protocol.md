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

# ADR-0005: Filesystem Participant Manager with Protocol

## Status

Accepted

## Date

2026-05-13

## Context

Test execution needs to manage dataspace participant identities (BPNLs). Future requirements include database storage, issuer service integration, and user identification. Current need is simple persistence across test runs.

Options: (1) hardcoded participants, (2) in-memory only, (3) protocol-based with filesystem implementation.

## Decision

Define a `ParticipantManager` Protocol/ABC with `get_or_create(name)` and `get(name)` methods. Implement `FileSystemParticipantManager` using JSON file storage. Generate deterministic BPNLs via SHA-256 hash of participant name (prefix `BPNL`, 12 hex characters, checksum suffix).

## Consequences

### Positive

- Protocol enables future backends (database, issuer service) without changing consumers.
- Deterministic BPNLs — same participant name produces the same BPNL across runs.
- Simple JSON persistence requires no external dependencies.
- Protocol enables easy dependency injection and mocking in tests.

### Negative

- Filesystem storage not suitable for concurrent multi-user access.
- SHA-256 determinism means BPNL collisions are theoretically possible (practically negligible).

### Neutral

- JSON file location configurable via test configuration.
- Participant data includes name, BPNL, and creation timestamp.
