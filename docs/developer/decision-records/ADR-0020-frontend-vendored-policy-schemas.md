<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

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
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8). -->
<!-- It was reviewed and tested by a human committer. -->

# ADR-0020: Frontend Vendors Its Own Copy of the Policy JSON Schemas

## Status

Accepted

## Date

2026-06-08

## Context

The official Catena-X policy JSON Schemas (saturn: 30 files; jupiter: 1 file)
lived only in the backend at `src/tractusx_testlab/schemas/policies/`. The IDE
codegen `ide/scripts/generate-constraint-registry/` read them through a
cross-codebase relative climb (`../../../src/tractusx_testlab/schemas/policies`)
to emit `constraintRegistry.generated.ts`.

The frontend (`ide/`) and the backend (`src/tractusx_testlab/`) must be
independent: neither codebase may reach across the boundary into the other. The
cross-codebase read violates that rule. Both codebases genuinely need the
schemas — the IDE at build time (constraint enumeration), the Python player at
runtime (Phase 2 document validation) — so a single shared location is not an
option.

A second concern surfaced once the schemas were vendored: the codegen still
named versions imperatively (`saturn`, `jupiter`) in code, and every consumer
that needed the list of versions hardcoded it. Adding a third dataspace version
would mean editing the codegen and every consumer — the version set was not
data-driven.

## Decision

1. The frontend vendors its own copy at `ide/schemas/policies/{saturn,jupiter}/`
   — a top-level build-time data directory (not `public/`, not `src/`). The
   schemas are build-only input: the codegen reads them via `readFileSync`; the
   browser never imports or fetches them, so serving them from `public/` would
   only bloat `dist/`.
2. The codegen resolver reads only from inside `ide/`
   (`resolve(scriptDir, "../../schemas/policies")`). No path climbs to `../../src`.
3. The backend keeps its own copy at `src/tractusx_testlab/schemas/policies/`,
   untouched, as the Python player's runtime contract.
4. The two copies are deliberate, independent duplicates kept byte-identical by
   a CI diff guard (`diff -r ide/schemas/policies src/tractusx_testlab/schemas/policies`,
   blocking). No shared package couples the codebases — the check is CI-level only.

### Config-driven manifest model (refinement)

5. Versions are declared as **data**, not code. `ide/schemas/policies/manifest.json`
   lists each version (its `id`, schema folder, ref-resolution `strategy`, and an
   optional editorial overlay). The codegen **iterates** the manifest and never
   names a version literally.
6. Ref resolution is pluggable via registered **strategy** functions. Two exist:
   `catenax-atomic-buckets` (saturn-style external + per-constraint `$ref`s) and
   `selfcontained-defs` (jupiter-style internal `$defs`). A version is bound to a
   strategy by name in its manifest entry.
7. The generated registry is keyed by version: a `PolicyVersion` union derived
   from the manifest `id`s, plus `POLICY_VERSIONS`, `VERSION_SCHEMAS`,
   `VERSION_BUCKETING`, and `CONSTRAINTS_BY_VERSION`. `preconditionTypes.ts`
   re-exports the generated union; consumers read keyed / manifest-derived data
   and never hardcode a version list.
8. Per-version editorial overlay (labels, placeholders) is **optional** — sane
   defaults apply when an entry omits it.
9. **Zero-code new-version contract**: adding a dataspace version that fits an
   existing strategy = drop the schema folder (both vendored copies) + add one
   manifest entry + run `npm run generate:registry`. No code changes. The single
   documented exception: a genuinely new ref-resolution shape requires one new
   strategy function — nothing else.

### 1:1 upstream mirror principle (refinement)

10. Where an upstream folder exists for a version, the vendored copy mirrors it
    **byte-for-byte and folder-for-folder** — not just the files codegen consumes.
    The SATURN copy is a verbatim 1:1 mirror of upstream CX-0152 `assets/`
    (catenax-eV/catenax-ev.github.io, pinned ref
    `85f1ad8acdb6a835a40a3422119c3ecd2a1ec055`): root
    `atomic-constraint-schemas.json` + `context-schema.json` + `policy-schema.json`
    + `PROVENANCE.txt`; `constraint/` (27 schemas); `context/`
    (`context.jsonld`, `odrl.jsonld`); `samples/` (31). `context/` and `samples/`
    are carried even though codegen never reads them — a version bump becomes a
    re-download, not a reshuffle. Both the frontend copy
    (`ide/schemas/policies/saturn/`) and the backend copy
    (`src/tractusx_testlab/schemas/policies/saturn/`) are byte-identical, enforced
    by the recursive `verify:schemas` guard.
11. The codegen tolerates the upstream nesting via a new **optional** manifest
    field `constraintDir` (`"constraint"` for saturn; absent for jupiter). A
    version that nests its constraints sets `constraintDir`; a flat one omits it.
    The "new version = data only" contract is preserved.
12. Versions with no upstream folder (jupiter — our own schema) stay **flat and
    self-contained**; they get no upstream subtree.
13. Provenance is pinned to an upstream commit **SHA** recorded in
    `PROVENANCE.txt`, and an opt-in `sync:schemas` script
    (`ide/scripts/sync-schemas/`) re-downloads the upstream `assets/` tree at that
    pinned SHA into `saturn/`, prunes files no longer upstream, and rewrites
    `PROVENANCE.txt`. It is **not** wired into CI (codegen never needs network); a
    future spec bump is a one-command refresh.

## Consequences

- The codebases are fully independent at the code level; no import or path
  crosses the boundary. This independence is now an invariant guarded in CI, not
  just a convention.
- Two copies introduce drift risk, mitigated by the blocking CI diff guard.
- The 30 saturn JSON files stay flat in one folder. The "max 5 files per folder"
  rule applies to source-code files (`.py`, `.ts`, `.tsx`, `.scss`), not vendored
  JSON data; the flat layout also mirrors the backend copy for the diff guard.
- The generated registry's constraint data is unchanged; only the two source-path
  provenance strings (`saturnSource`, `jupiterSource`) in the emitted file change.
- The un-vendored dspace `contract-schema.json` `$ref`s are unaffected — the
  codegen never resolves them; backend full-document validation vendoring is a
  separate, future work item.
- Versions are now data: the common path to support a new dataspace version is
  configuration only (manifest entry + vendored schemas), with zero code change.
- The optional editorial overlay keeps the common case terse — a version that
  accepts the default labels/placeholders needs no overlay block.
- Two CI guards run in `.github/workflows/test.yml` job `frontend-checks`:
  `verify:registry` proves the generated artifact is regen-clean (no drift
  between committed and freshly generated output), and `verify:schemas` enforces
  per-version frontend↔backend `diff -r` parity plus manifest↔backend parity.
- The schema diff guard scales to N versions: it iterates the manifest rather
  than checking a fixed `{saturn,jupiter}` pair, so new versions are covered
  automatically without editing the workflow.
- **Deliberate divergence-drop policy**: the vendored copy carries nothing beyond
  upstream. Upstream CX-0152 ships 27 constraints, not our previous 29 — the two
  local-only constraints `managed-legal-entity-bpnl` and
  `managed-legal-entity-region` were **dropped** (not present upstream).
  Consequence: saturn `usage_permission` went 24 → 22. Rationale accepted by the
  human: "official schema = source of truth, clean, no backward compat." (Note:
  `cx.sharing.managedLegalEntity:1` still exists as an enum *value* of
  `confidential-information-sharing` — that is upstream and unrelated to the
  dropped left-operand constraints.)
- **`sync:schemas` opt-in refresh**: re-downloading the pinned upstream tree is a
  single command, kept out of CI so codegen never requires network access.
- The recursive `verify:schemas` parity guard now covers **nested** directories
  (`constraint/`, `context/`, `samples/`), keeping the two byte-identical copies
  honest across the full mirrored tree.
- The vendored upstream JSON files carry **no Apache/AI headers** — they are
  third-party data (verbatim upstream), even though hosted under the same org;
  provenance is recorded in `PROVENANCE.txt`, not per-file headers.
