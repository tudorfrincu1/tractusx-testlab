---
name: execute-refactor-phase
description: "Safely execute one phase of a structural refactor plan in either codebase. Use when implementing a phase from docs/developer/refactor-plan/ — moving or splitting files along responsibility seams, renaming to descriptive self-documenting names, consolidating SCSS into assets/styles, rewiring barrels and imports, and verifying behavior is unchanged. Keywords: refactor, execute phase, restructure, split file, move module, rename, barrel, imports, SCSS migration, nested architecture, behavior-preserving, quality gates, phase status."
---

# Execute Refactor Phase

Use this skill to execute **one phase** of an approved refactor plan without changing behavior. The plans live in `docs/developer/refactor-plan/` and are the authoritative source of truth for *what* to do; this skill defines *how* to do it safely.

## Golden Rule

A structural refactor must be **behavior- and appearance-preserving**. Output (compiled YAML, block catalog, API responses) and the passing test suite must be byte-for-byte / green before and after. The IDE must **look identical and behave identically** (same layout, styling, interactions, Blockly theme); the backend must expose the **same API contracts and runtime behavior**. If a change alters how the product looks or works, it is NOT this phase — stop and escalate.

**This is a refactor, not a redesign.** No new features, no visual changes, no behavioral changes. The goal is **production-ready code: clean, concise, modular** — same product, better internal structure.

**Write like a human, for a human.** The refactored code must read as if a thoughtful human engineer wrote it: descriptive names, simple and linear logic, small units that do one obvious thing. A human will maintain this code — if a split or rename makes it cleverer or more abstract than a human can easily follow, it is wrong. Favor the boring, readable structure over the clever one.

**Legacy removal is allowed and encouraged.** Dead code, unused functions, orphaned files, and superseded implementations that no longer affect the product's behavior or appearance may be deleted. Removing a code path that nothing reaches is behavior-preserving by definition — confirm zero importers/callers first, then delete.

## Scope & Exclusions

- **The refactor touches code only** — `ide/src/` and `src/tractusx_testlab/`. Do NOT modify, and do NOT use as guidance, anything under `docs/` (except the `docs/developer/refactor-plan/` files you are explicitly told to update, e.g. the phase-status table).
- **Ignore the existing `docs/` content while refactoring.** The legacy documentation may describe the OLD structure and would bias the work. The refactor plan in `docs/developer/refactor-plan/` is the only documentation that defines the target — trust it, not the old docs.
- Do not rewrite or "sync" old docs as part of a phase. Documentation updates are a separate, later task owned by the docs specialist.

## Efficiency — No Over-Engineering, Be Time-Effective

- **Do the simplest change that satisfies the phase.** No speculative abstractions, no "while I'm here" extras, no factories-of-factories, no config layers nobody asked for. The plan defines the scope — execute exactly that.
- **Right-size the work.** A rename is a rename; a split is a split. Don't turn a 1-file split into a 10-file architecture astronaut exercise.
- **Be fast and focused.** Read only the files the phase touches. One read pass. Don't re-explore areas already understood. Prefer rename/refactor tooling over hand-editing every call site.
- If a phase looks like it needs heavy new abstraction to "do it right", that is a signal to stop and escalate — the plan, not improvisation, decides architecture.

## Inputs (collect before touching code)

- The specific phase to execute (e.g. "IDE Phase 0", "Backend Phase 1") from the relevant plan.
- The plan file: `docs/developer/refactor-plan/ide-refactor-plan.md` or `backend-refactor-plan.md`.
- The end-state nested tree (Section 2) the phase converges to.
- The naming convention (IDE §2.0) and SCSS architecture (IDE §2.1) where applicable.
- The acceptance criteria and risk notes for that phase.

## Workflow

### Phase 1 — Baseline (prove green BEFORE)
Run the relevant gates first and confirm they pass. Never refactor on a red baseline.
- IDE: `cd ide && npx tsc --noEmit && npx vite build`
- Backend: `python -m pytest tests/ -x -q`
- Capture file-size baseline: `find <dir> -name '<glob>' | xargs wc -l | sort -rn | head`
- **IDE — capture the visual baseline (MANDATORY).** A green build is NOT proof the app looks or works the same. Before changing anything, run the live app and capture the BEFORE screenshot set and confirm interactions work, using the `visual-regression-guard` skill. Refactoring an IDE phase without a live-browser baseline is forbidden.

### Phase 2 — Read the phase contract
- Read ONLY the target phase section + the end-state tree nodes it touches. Do not re-read the whole plan.
- List the exact files to create, split, move, rename, or delete.
- Confirm the phase does **not** cross a frozen shared contract (YAML v2 syntax, block catalog/`classes.json` schema, TCK manifest model, `.stck` format). If it does, it must ship in lockstep with the other codebase — escalate to the orchestrator before proceeding.

### Phase 3 — Execute the structural change (one seam at a time)
- **Move in small, safe steps.** Change one seam, re-check it compiles, then move to the next. Never do a big-bang multi-file rewrite that you can only verify at the end — small reversible steps keep the product stable throughout.
- **Split along responsibility seams**, never arbitrary line cuts. Each new file = one nameable purpose.
- **Extract shared logic** into an importable unit; never duplicate.
- **Apply descriptive naming** (IDE §2.0): name = domain noun + role suffix (`blockToStepSerializer.ts`, `paramPopulatorRegistry.ts`, `projectFilePersistence.ts`). Banned: `helpers.ts`, `utils.ts`, `misc.ts`, `common.ts`, `*2.ts`, generic `types.ts`/`constants.ts`. Barrels stay `index.ts`; co-located types `<feature>.types.ts`.
- **SCSS phases** (IDE): move all styling into `ide/src/assets/styles/{abstracts,base,layout,features,components,themes}/`, single `main.scss` entry, `@use`/`@forward` only — never `@import`, no scattered component CSS.
- **Backend**: one class/concern per file; `__init__.py` is a barrel re-export only; private helpers `_prefixed`; keep layer direction (steps → models/services, not vice versa).

### Phase 4 — Rewire barrels & imports
- Update the folder's `index.ts` / `__init__.py` to re-export the new public surface.
- Update all importers. Prefer importing through the barrel, not deep paths (no barrel-bypass).
- Use rename/refactor tooling to update references precisely rather than hand-editing every call site.

### Phase 5 — Prove green AFTER (same gates + conformance)
Re-run the Phase 1 gates — they must pass identically. Then run the conformance checks:
- File size: `find <dir> -name '<glob>' | xargs wc -l | awk '$1 > 300 && !/total/'` → must be empty
- IDE banned-name sweep: `find ide/src -name 'helpers.ts' -o -name 'utils.ts' -o -name 'misc.ts' -o -name 'common.ts'` → must be empty
- IDE SCSS: no `.css` and no `.scss` outside `ide/src/assets/styles/`; `main.tsx` imports exactly one stylesheet
- Backend: `grep -rn "except Exception:" src/ --include="*.py"` and `grep -rn "print(" src/ --include="*.py"` → empty (excluding allowed fingerprint)
- Diff the build/compile output where feasible to confirm byte-identical behavior.
- **Visual/behavioral stability (IDE):** the running app must look and behave the same — same layout, styling, Blockly theme, panels, and interactions. **This is proven, not assumed:** recapture the AFTER screenshot set in the live browser, compare every before/after pair pixel-for-pixel, and re-exercise the same interactions, using the `visual-regression-guard` skill. Any visual difference or broken interaction is a regression — fix it (do not explain it away) before the phase is done. A passing build alone never satisfies this gate.
- **Contract stability (backend):** same CLI commands, same API responses, same compiled `.stck` output. The existing test suite passing is the proof.

### Phase 6 — Update phase status & report
- Flip the phase row in `docs/developer/refactor-plan/README.md` status table (e.g. `Pending → Done`).
- Report: files created/split/moved/deleted/renamed, gate results (before vs after), and confirmation behavior is unchanged. Diffs only — no full file dumps.

## Stop Conditions (escalate to the orchestrator)

- A gate that was green at baseline is now red and the cause is not a trivial import fix.
- The phase requires touching a frozen shared contract without the paired codebase change.
- A "structural" change turns out to require a behavior change to compile.
- The split would create a circular dependency — document it, do not rewire blindly.

## Ordering Discipline

Execute phases **leaf-first** in the order the plan defines. Never start a phase whose prerequisite phase is not `Done`. Deletions of dead code (e.g. IDE Phase 0) come first — they are the safest and shrink the surface for later phases.

## One Phase = One Reviewable Unit

Keep each phase as its own focused change so it can be reviewed and reverted independently. Do not bundle multiple phases into one pass unless they are trivial and touch disjoint files.

## Parallelization (when running multiple specialists)

Parallel execution is encouraged when it is safe. It is safe only when:
- **No file conflicts** — parallel phases must touch disjoint files/folders. Frontend (`ide/src/`) and backend (`src/tractusx_testlab/`) never conflict and are always safe to run together. Within one codebase, two phases may run in parallel only if their file sets do not overlap.
- **No dependency** — a phase whose prerequisite is not `Done` must wait; never parallelize dependent phases.
- **No shared frozen contract** — phases touching the serialization↔YAML↔compiler boundary ship in lockstep, not in uncoordinated parallel.

**Share knowledge as you go.** Parallel agents must not rediscover the same facts or re-make the same decisions. Record findings, conventions, and decisions in session memory (or the agreed shared note) as soon as they are made, and read it before starting — so each agent builds on the others' work instead of duplicating or contradicting it. Update the phase-status table promptly so everyone sees current state.

**The IDE visual-verify step is a serialized critical section.** Refactoring disjoint files may run in parallel, but the run-the-live-app-and-screenshot step (the `visual-regression-guard` loop) must be owned by one agent at a time — the dev server, port, browser, and live app are shared singletons. Two IDE agents hot-reloading into the same running app make every before/after comparison meaningless. Parallelize the *refactoring*; serialize the *looking*. See `visual-regression-guard` → "Concurrency" for the hand-off rules and full-isolation fallback.
