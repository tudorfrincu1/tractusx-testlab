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
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8). -->
<!-- It was reviewed and tested by a human committer. -->

# Refactor Plan — Index

This effort is a **structural-only** refactor of the TestLab codebases. It changes
*where code lives and how modules are organized* — never *what the code does*. No
behavior, output, or contract changes ship as part of this work.

The refactor is split by codebase ownership. Each codebase has its own detailed
plan; this page is the shared contract and status tracker that binds them together.

## Objectives & Guiding Principles

1. **Modularity by design.** Code is organized into small, single-responsibility
   units with clear, typed boundaries. We design for modularity up front — we do
   not bolt it on after the fact.
2. **The 300-line limit is a trigger, not a goal.** When a source file exceeds 300
   lines it signals that more than one responsibility lives in it. Splitting is the
   *symptom fix*; the *cause fix* is single responsibility. We split along
   responsibility seams — never by arbitrarily cutting a file in half.
3. **Single responsibility.** Every module, function, hook, and class does one
   thing. One concern per file; one nameable purpose per module.
4. **Data-driven, no hardcoding.** Anything that enumerates options, types, or
   configuration comes from data (catalog JSON, config, lookups), never inline
   string literals or hardcoded lists.
5. **Concern-based folders + barrels.** Folders group by *concern*, not by file
   type. Each organized folder exposes a barrel `index.ts`/`__init__.py` as its
   public surface; consumers import the barrel, never deep internals.
6. **Reuse over duplication.** If the same logic appears twice, it is extracted
   into one importable module. Splitting an oversized file must *produce reusable
   units*, not two coupled halves.
7. **NO behavior change.** Every phase is verified green against the existing test
   suite and type checker before and after. A phase that changes a test assertion
   or a generated artifact is out of scope and must be rejected.

## Boundary Table — Who Owns What

| Codebase | Owner agent | Root | Detailed plan |
|----------|-------------|------|---------------|
| Frontend IDE | `testlab-ide-master` | `ide/src/` | [ide-refactor-plan.md](ide-refactor-plan.md) |
| Python library | `testlab-master` | `src/tractusx_testlab/` | [backend-refactor-plan.md](backend-refactor-plan.md) |

Neither owner may modify the other codebase. Work that touches both is coordinated
through the shared contracts below.

## Shared Cross-Codebase Contracts

These are the boundaries the two codebases meet at. **Neither side may change them
unilaterally.** A change to any of these is a *contract change*, not a structural
refactor, and is therefore out of scope for this effort — unless it ships in
lockstep across both codebases with coordinated review.

| Contract | Frontend touch point | Backend touch point | Rule |
|----------|----------------------|---------------------|------|
| **YAML v2 syntax** (`@variable`, step shape, phases) | `services/yaml/` (`modelToYaml`, `yamlToModel`) | `scripting/`, `compiler/` parser | Field names, ordering semantics, and variable syntax are frozen. Refactors may relocate the mapping code but must emit byte-identical YAML. |
| **Block catalog schema + `classes.json` taxonomy** | `public/blocks/**`, `blocks/registration/`, `toolbox/` | catalog consumed during compile validation | Block JSON shape, category taxonomy, and param-type names are frozen. Reorganizing loaders/registration must not alter the manifest contract. |
| **TCK env / services manifest model** | `features/environment-editor/`, `store/environment/`, `models/environment.ts` | env/services manifest reader | The manifest field model is frozen. Both sides serialize/deserialize the same shape. |
| **Compiled `.stck` package format** | export feature / compile API client | `compiler/` packager | The package layout and contents are frozen. The frontend only triggers and consumes it. |

**Lockstep rule:** changes to the **serialization ↔ YAML ↔ compiler** boundary
(the chain that turns blocks into YAML into a compiled package) ship together in a
single coordinated change set, reviewed by both `testlab-ide-master` and
`testlab-master`. No partial landing on one side.

## Phase Status

Legend: ⬜ not started · 🟡 in progress · ✅ done

### Frontend — see [ide-refactor-plan.md](ide-refactor-plan.md)

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Remove dead legacy `components/BlockEditor/` tree | ⬜ |
| 1 | Split `serialization/serialize/workspaceToModel.ts` (303) | ⬜ |
| 2 | Split `hooks/useBlocklyWorkspace.ts` (301) into init/sync/resize | ⬜ |
| 3 | Dissolve kitchen-sink `serialization/helpers.ts` into `helpers/` | ⬜ |
| 4 | Decompose `populate/populateTest.ts` switch into per-param populators | ⬜ |
| 5 | Move pure project I/O from `store/project/` to `services/project/` | ⬜ |
| 6 | Centralize model↔YAML field mapping (de-dup `modelToYaml`/`yamlToModel`) | ⬜ |
| 7 | Enforce barrel + feature→store mediation (lint guard) | ⬜ |

### Backend — see [backend-refactor-plan.md](backend-refactor-plan.md)

| Phase | Scope | Status |
|-------|-------|--------|
| — | Authored separately by `testlab-master` | ⬜ |

> The backend plan is owned by `testlab-master`. This index links to it; the
> frontend owner does not author backend phases.
