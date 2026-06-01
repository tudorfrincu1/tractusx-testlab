<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Catena-X Automotive Network e.V.
 Copyright (c) 2026 Contributors to the Eclipse Foundation

 Licensed under the Creative Commons Attribution 4.0 International License
 (the "License"); you may not use this file except in compliance with the
 License. You may obtain a copy of the License at

    https://creativecommons.org/licenses/by/4.0/

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: CC-BY-4.0
-->
---
name: fix-sonarqube-findings
description: "Systematically remediate SonarQube findings across the codebase without introducing new alerts. Use when fixing code smells, bugs, vulnerabilities, or security hotspots reported by SonarQube — collecting all findings into a tracking report, fixing them in safe batches grouped by rule or directory, and verifying each batch with a scan-after-edit anti-regression loop before committing. Keywords: sonarqube, sonar, findings, code smell, bug, vulnerability, security hotspot, quality gate, BLOCKER, CRITICAL, MAJOR, MINOR, batch fix, anti-regression, analyze_file_list, remediation, technical debt, lint."
---

# Fix SonarQube Findings

Use this skill to remediate SonarQube findings **at scale** without the classic failure mode: fixing one alert and silently spawning two more. The discipline is a per-batch **scan-after-edit loop** — you verify the file is cleaner *before* you commit, never after.

## Golden Rule

**A fix is only done when the file's issue count went DOWN and zero new rule IDs appeared.** Fixing 5 and adding 2 is a failure — keep working on that file until the net count drops and no new alert is introduced. The build and tests must stay green throughout.

**Fix by rule, not ad-hoc.** The same rule (e.g. `css:S7924`, `typescript:S6551`) appears across many files. Decide ONE correct fix pattern for a rule, then apply it consistently everywhere. Inconsistent, improvised fixes are what generate new alerts.

**Behavior- and appearance-preserving.** A SonarQube fix is a quality cleanup, not a redesign. Compiled YAML, block catalog, API responses, and the passing test suite must be identical before and after. The IDE must look and behave identically.

## Project Key Resolution

The SonarQube project key is `eclipse-tractusx_tractusx-testlab` (from `sonar-project.properties`). For PR analysis, pass the PR number as `pullRequestId` (e.g. `16`).

## Phase 0 — Disable automatic analysis (once)

At the start of a remediation session, disable IDE automatic analysis so scans are deterministic and on-demand:

```
mcp_sonarqube_toggle_automatic_analysis(enabled=false)
```

Re-enable it at the very end of the session:

```
mcp_sonarqube_toggle_automatic_analysis(enabled=true)
```

## Phase 1 — Collect ALL findings into the tracking report

Before fixing anything, build a complete, authoritative inventory so you know when you are done.

1. Pull every open finding from the server (paginate — `ps=500`, increment `p` until you have all of them):
   ```
   mcp_sonarqube_search_sonar_issues_in_projects(
     projects=["eclipse-tractusx_tractusx-testlab"],
     issueStatuses=["OPEN"],
     pullRequestId="<PR_NUMBER>",
     ps=500, p=1   # then p=2, p=3 ... until paging.total is covered
   )
   ```
2. Also pull security hotspots (separate API):
   ```
   mcp_sonarqube_search_security_hotspots(projectKey="eclipse-tractusx_tractusx-testlab", pullRequest="<PR_NUMBER>")
   ```
3. Aggregate into `docs/developer/sonarqube-findings-report.md` with:
   - **Summary table** — totals by severity (BLOCKER / CRITICAL / MAJOR / MINOR) and file count.
   - **Top rules by frequency** with a **Fix Strategy** column (the one agreed pattern per rule).
   - **File checklist** grouped by category (Python backend, IDE TypeScript, SCSS, tests, stubs, mockups) with a `Done` checkbox column and severity counts per file.
   - **Detailed findings** (line, severity, rule, message) for BLOCKER + CRITICAL files.

This report is the **single source of truth** for progress. A file is only checked off when it scans clean.

## Phase 2 — Order the work

Fix in this priority order:

1. **BLOCKER** — security/reliability risks. Must fix before merge.
2. **CRITICAL** — bugs and vulnerabilities. Must fix before merge.
3. **MAJOR** — significant code smells. Should fix.
4. **MINOR** — low-impact smells. Fix opportunistically, batched by rule.

Within a priority, batch by **rule** (one pattern, many files) or by **directory** (all SCSS together, all tests together). **Skip `ide/mockups/`** — HTML mockups are prototypes, not production code; lowest priority.

## Phase 3 — The Anti-Regression Loop (per batch)

This is the core of the skill. Run it for **every** batch.

```
1. SNAPSHOT  → scan the target files, record the BEFORE issue count + rule IDs
2. FIX       → apply the agreed fix pattern for this rule/directory
3. RESCAN    → scan the SAME files again (analyze_file_list)
4. COMPARE   → count must drop; NO new rule IDs may appear
                 ├─ new alert introduced? → fix it now, go to 3
                 └─ count didn't drop?     → fix incomplete, go to 2
5. GATES     → run build + tests (see below)
                 └─ red? → fix, go to 3
6. CHECK OFF → tick the file in the report, commit the batch
7. NEXT      → move to the next batch
```

### Snapshot & rescan command

```
mcp_sonarqube_analyze_file_list(file_absolute_paths=[<absolute paths of the batch>])
```

`analyze_file_list` returns the same findings the server would for those files — that is what makes the BEFORE/AFTER delta reliable **before** you commit.

### Build & behavior gates

| Codebase | Gate command |
|----------|--------------|
| IDE (TypeScript/React) | `cd ide && npx tsc --noEmit && npx vite build` |
| IDE (visual/UI changes, esp. SCSS) | use the `visual-regression-guard` skill — SCSS specificity fixes can silently change appearance |
| Python backend | `python -m pytest tests/ -x -q` |

A batch is **done** only when: net issue count dropped, zero new rule IDs, build green, tests green, file checked off.

## High-Risk Rules — verify extra carefully

These are the rules most likely to spawn new alerts when fixed:

- `typescript:S3776` (cognitive complexity) — extracting functions to reduce complexity often triggers `S6551` (unused), `S1082` (accessibility), or new complexity elsewhere. Rescan after **each** extraction, not at the end.
- `css:S7924` / `css:S4648` (CSS specificity / duplicate selectors) — merging or reordering selectors can change cascade and **silently alter appearance**. Always pair with `visual-regression-guard`.
- `typescript:S6848` / `Web:S6848` / `S1082` (non-interactive elements, a11y) — adding handlers/roles can introduce new a11y rules if done partially. Apply the full a11y pattern (role + keyboard handler) in one go.

## Safe-to-Batch Rules — low risk, fix freely

These are mechanical and rarely spawn new alerts (still rescan, but batch large):

- `typescript:S1128` — unused imports (delete).
- `typescript:S4325` — unnecessary type assertions (remove).
- `typescript:S6759` — props should be read-only (add `readonly`).
- `python:S125` — commented-out code (delete).

## False Positives & Won't-Fix

Some findings are legitimately not worth fixing (e.g. a rule that conflicts with a deliberate project pattern). Do **not** silently ignore them — mark status explicitly so the count is honest:

```
mcp_sonarqube_change_sonar_issue_status(...)        # ACCEPTED / FALSE_POSITIVE
mcp_sonarqube_change_security_hotspot_status(...)   # SAFE / ACKNOWLEDGED
```

Record the reason in the report's checklist row. A finding marked ACCEPTED with a documented reason counts as resolved.

## Orchestrator Delegation

When dispatching batches to specialist agents (`testlab-master` for Python, `testlab-ide-master` for IDE/SCSS, `testlab-test-master` for tests), each delegation MUST include:

- The **exact files** and the **specific rule(s)** to fix — never "fix everything in this file".
- The **agreed fix pattern** for that rule (from the report's Fix Strategy column).
- The mandate: **scan-after-edit, net count must drop, zero new rule IDs, build + tests green**.
- Instruction to **check off the file** in `docs/developer/sonarqube-findings-report.md` and report the BEFORE/AFTER counts.

Batch independent files to the same agent in one delegation. Serialize files that share a module.

## Definition of Done (whole session)

- Every BLOCKER and CRITICAL resolved (fixed or explicitly ACCEPTED with reason).
- MAJOR/MINOR resolved or triaged in the report.
- Every touched file scans clean (or has documented accepted findings).
- Build green, full test suite green.
- Report checklist fully ticked; automatic analysis re-enabled.
- Final confirmation: re-run the Phase 1 server search — `paging.total` for OPEN issues reflects the cleanup.
