---
name: visual-regression-guard
description: "Prove an IDE refactor changed nothing the user can see or do, by running the live app in a browser and comparing before/after screenshots — the way a human programmer verifies. Use for every frontend refactor phase: capture a baseline screenshot set of the running app, exercise the real interactions, refactor, recapture the same views, and compare pixel-for-pixel. Keywords: visual regression, screenshot, before after, baseline, live browser, dev server, vite, playwright, smoke test, look identical, behave identically, refactor verification, no visual diff."
---

# Visual Regression Guard

Use this skill on **every IDE (frontend) refactor phase** to guarantee the running app looks and behaves identically before and after. This is the discipline a human programmer follows: run the real app in a browser, click through it, refactor, run it again, and confirm nothing the user sees or does has changed.

## Why this exists

Refactors that are only checked with `tsc --noEmit` and `vite build` pass the compiler yet silently move a panel, drop a style, break a drag interaction, or kill the Blockly theme. The build is green and the product is broken. The only reliable proof is the **same eyes-on-screen check a human does** — captured as screenshots so before and after can be compared objectively.

**A green build is necessary but NOT sufficient. No IDE phase is "done" until the live app has been seen, exercised, and compared before vs after.**

## The Golden Loop (per feature, not per phase-end)

Do this for each feature/area the phase touches — verify it works, refactor it, verify it still works, then move to the next. Never refactor several areas and check them all only at the very end.

```
1. RUN it      → start the dev server, open the app in a browser
2. SEE it       → capture the BEFORE screenshot set of the affected views
3. USE it       → exercise the real interactions; confirm they work; note zero console errors
4. REFACTOR it  → execute the phase change for that one area
5. SEE it again → capture the AFTER screenshot set of the same views, same states
6. COMPARE      → before vs after must be visually identical; interactions still work
7. NEXT         → only when 6 passes, move to the next area
```

## Setup — run the live app (start once, reuse, tear down)

The dev server is a **long-lived shared resource for the whole phase** — start it once, keep the connection open across every before/after capture, and shut it down only when the phase is finished. Do NOT start and stop a server per screenshot.

The browser automation tools are deferred. Load them first with `tool_search` (query: "browser screenshot navigate click playwright"), then:

1. **Check for an already-running server first.** If a Vite dev server is already serving the app (a previous step in this phase started it), reuse it — do not start a second one. Only start one if none is running.
2. **Start the dev server once, in the background** (async terminal so it keeps running while you work):
   ```bash
   cd ide && npm run dev
   ```
   Keep the returned terminal id — you will reuse this same server for every capture and kill it at the end.
3. **Open the app** at the served URL: `http://localhost:5173/tractusx-testlab/ide/`
   (port `5173` and base `/tractusx-testlab/ide/` come from `ide/vite.config.ts` — read it, do not assume).
4. Wait for first paint, then confirm the browser console shows **no errors** (a baseline error means fix the baseline first — never refactor on a broken app).
5. **Reuse Vite HMR for the AFTER capture.** After you refactor, Vite hot-reloads automatically — you do NOT need to restart the server. Reload the page to reset state, then recapture. The same running server serves both before and after.
6. **Tear down at the end of the phase.** Once the phase's before/after comparison passes, kill the dev-server terminal so no orphan process or held port is left behind. The server must not outlive the phase.

## The Baseline Screenshot Set

Capture a **small, representative, repeatable** set — enough to catch regressions, not so many it wastes time. For a given phase, capture only the views the phase can plausibly affect, plus the always-on shell. Suggested canonical set:

| View / state | What it proves |
|--------------|----------------|
| Initial app load (full window) | Overall layout, header, panels, theme |
| Toolbox open on each affected category | Block list, icons, colors, ordering |
| One block dragged onto the canvas | Blockly rendering, block shape/color/fields |
| Two blocks connected | Connections, auto-link, variable chips |
| YAML preview panel populated | Serialization output, Monaco styling |
| Any panel/dialog the phase touches | The specific surface under refactor |

**Use the same window size, same URL, same interaction order before and after** — otherwise the comparison is meaningless. Reset the app to a clean state between before and after (reload), and reproduce the exact same steps.

## Storage convention

Store screenshots under a gitignored working folder so they never pollute the repo:

```
ide/.refactor-visuals/<phase-id>/
  before/   ← captured at step 2, before any change
  after/    ← captured at step 5, after the change
```

- `<phase-id>` = the phase being executed (e.g. `ide-phase-7-naming`).
- Name each file by the view it captures: `01-initial-load.png`, `02-toolbox-mock.png`, `03-block-on-canvas.png`, … so before/after pairs line up by name.
- Add `ide/.refactor-visuals/` to `ide/.gitignore` (these are throwaway verification artifacts, never committed).

## Comparing before vs after

For each before/after pair with the same filename:

1. **View both images** and compare them directly. They must be visually identical — same layout, spacing, colors, fonts, icons, Blockly theme, panel sizes.
2. **Any visible difference is a regression** unless the phase explicitly intended it (a pure structural refactor intends NONE). If you see a diff: revert the last step, find the cause, fix it, recapture. Do not rationalize a diff away.
3. **Re-exercise the interactions** from step 3 on the after-app: same clicks, same drags, same YAML output. If an interaction that worked before now fails or behaves differently → regression → fix before proceeding.
4. **Console must still be error-free.** A new console error or failed `/blocks/*.json` fetch is a regression.

## Functional checklist (the "USE it" step)

Looking is not enough — the human also clicks. For the affected area, confirm at minimum:

- [ ] Blocks load (no 404s for `public/blocks/*.json` in the Network tab)
- [ ] A block can be dragged from the toolbox onto the canvas
- [ ] Blocks connect and auto-link as before
- [ ] The YAML preview updates and matches the expected output
- [ ] Any panel/dialog the phase touches opens, renders, and closes correctly
- [ ] No new errors or warnings in the browser console

## Completion criteria (gates the phase, alongside the build)

- [ ] Dev server ran and the live app was opened in a browser
- [ ] BEFORE screenshot set captured for every affected view
- [ ] Interactions exercised and confirmed working BEFORE the change
- [ ] AFTER screenshot set captured for the same views, same states, same window size
- [ ] Every before/after pair compared and confirmed visually identical
- [ ] Interactions re-exercised AFTER the change and confirmed unchanged
- [ ] Browser console error-free before and after
- [ ] Any difference found was fixed (not explained away) and recaptured

## Efficiency notes (the user values time)

- **Right-size the set.** Capture only what the phase can affect plus the shell — not every screen every time.
- **Keep the server running** across the whole phase; don't restart it per area.
- **Reuse the same steps** so comparison is fast and mechanical.
- **Stop early on the first regression** — a small reverted step is cheap; a fully-refactored-then-broken module is the exact waste this skill prevents.

## Concurrency — avoiding conflicts between parallel subagents

Visual verification runs against **shared singletons**: one dev server, one port, one browser, one live app state, one `.refactor-visuals/` folder. If two subagents do visual debug at the same time against the same server, they corrupt each other's results — agent B's edit hot-reloads into the app while agent A is mid-capture, screenshots interleave, and neither can trust its before/after pair. So the default rule is strict:

**Within the IDE, visual verification is single-owner and serialized.** At any moment, exactly one agent owns the live app. Frontend and backend still parallelize freely (the backend has no browser), but two IDE agents must not run the visual loop concurrently.

How the orchestrator keeps parallel IDE work safe:

1. **Disjoint files is mandatory (from `execute-refactor-phase`).** Parallel IDE phases must touch non-overlapping files. If two agents edit files that share one HMR-served app, their changes blend in the running app and visual results are meaningless — never allow this.
2. **Serialize the verify step, even when edits are disjoint.** Agents may refactor their disjoint files in parallel, but the *run-app-and-screenshot* step is a critical section: one agent at a time takes the live app, captures before/after for its area, releases it, then the next agent takes it. Coordinate this hand-off through the shared note / phase-status table.
3. **If you truly must verify in parallel, fully isolate — never share.** Each agent gets its own server on its own port (`npm run dev -- --port <n>`), its own browser context, and its own `.refactor-visuals/<phase-id>/` subfolder. Even then, the disjoint-files rule still holds, because all servers build from the same source tree.
4. **One writer per visuals subfolder.** `.refactor-visuals/<phase-id>/` is owned by exactly one agent. Never let two agents write screenshots into the same `<phase-id>` folder.
5. **Release the resource.** When an agent finishes its visual loop, it records "live app free" in the shared note and tears down its server (see Setup step 6) so the next agent starts clean. No orphan servers, no held ports.

**Rule of thumb:** parallelize the *refactoring* of disjoint files; serialize the *looking*. The eyes-on-screen step is cheap to serialize and catastrophic to share.

## Relationship to other skills

- `execute-refactor-phase` defines *what* a phase does and the build/contract gates. This skill is the **mandatory visual+functional gate** for the IDE side of Phase 1 (baseline) and Phase 5 (prove green after).
- `debug-ide` is for diagnosing a regression once this skill surfaces one.

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
