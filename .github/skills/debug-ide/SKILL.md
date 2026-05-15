---
name: debug-ide
description: "Systematic debugging workflow for the IDE frontend codebase. Use when diagnosing UI bugs, Blockly workspace issues, React rendering problems, TypeScript type errors, state management bugs, or visual regressions. Provides a structured approach to isolate, reproduce, and fix frontend issues. Keywords: debug, frontend, IDE, React, Blockly, TypeScript, UI bug, state, rendering, visual regression, error, fix, diagnose, troubleshoot."
---

# Debug IDE

## What This Skill Produces

A systematic diagnosis and fix for a frontend bug, delivered as:
1. **Root cause analysis** — what is broken and why
2. **Reproduction steps** — minimal steps to trigger the bug
3. **Fix** — code changes that resolve the issue
4. **Verification** — proof the fix works (build passes, no regressions)

## When to Use

- UI element not rendering or rendering incorrectly
- Blockly workspace behaving unexpectedly (blocks not connecting, toolbox missing items, etc.)
- React state not updating or updating incorrectly
- TypeScript type errors or runtime type mismatches
- CSS/styling issues (layout broken, elements overlapping, theme inconsistencies)
- Monaco editor integration problems
- Zustand store state corruption or stale state
- YAML preview not reflecting workspace changes
- Performance issues (excessive re-renders, slow interactions)
- Build failures (`tsc --noEmit` or `vite build` errors)

## Workflow

### Phase 1: Reproduce & Isolate

1. **Understand the symptom** — what does the user see vs. what should they see?
2. **Identify the affected area** — which component/module is responsible?
3. **Trace the data flow**:
   - For UI bugs: Component → Props → Store → Source of truth
   - For Blockly bugs: Workspace event → `workspaceToModel()` → Model → YAML
   - For state bugs: Action → Zustand slice → Selector → Component re-render
4. **Check the sync pipeline** — workspace change → `workspaceToModel()` → `modelToYaml()` → Zustand → YAML preview

### Phase 2: Diagnose

1. **Check the browser console FIRST** — ask the user to share browser console errors (DevTools → Console tab), or if browser tools are available, inspect directly. JavaScript errors, failed network requests (404s for block JSON files), and React error boundaries all show here. This is the fastest path to root cause.
2. **Check the Network tab** — if blocks aren't loading, look for failed fetches to `/blocks/*.json` files (404 = missing block definition file)
3. **Read the relevant source files** — start from the component showing the bug, trace inward
4. **Check recent changes** — did something in the same module change recently?
5. **Verify types** — run `npx tsc --noEmit` and check for type errors in the affected area
6. **Check block definitions** — if Blockly-related, verify `public/blocks/{category}/{block}.json` files exist and match the manifest (`public/blocks/index.json`)
7. **Check the store** — if state-related, verify the Zustand slice logic and selectors
8. **Look for common failure modes**:
   - Stale closures in event handlers
   - Missing dependency in `useEffect` / `useCallback` / `useMemo`
   - Incorrect key props causing React reconciliation issues
   - Blockly event listener not cleaned up
   - CSS specificity conflicts
   - Race conditions in async operations

### Phase 3: Fix

1. **Make the minimal change** — fix only what is broken, do not refactor
2. **Preserve existing patterns** — match the style of surrounding code
3. **Verify type safety** — ensure no `any` types introduced
4. **Check file size** — if the fix pushes a file over 300 lines, split immediately

### Phase 4: Verify

1. **Type check**: `cd ide && npx tsc --noEmit` — must pass
2. **Build**: `cd ide && npx vite build` — must succeed
3. **File size**: `find ide/src -name '*.ts' -o -name '*.tsx' | xargs wc -l | awk '$1 > 300 && !/total/'` — must be empty
4. **Manual check** — describe what the user should see after the fix

## Debugging Cheat Sheet

| Symptom | Start Here |
|---------|-----------|
| Block not appearing in toolbox | `public/blocks/index.json` → category manifest → block JSON file exists? |
| Blocks not rendering at all | Browser console errors → Network tab 404s → `blockDefinitions.ts` fetch logic |
| Block outputs not available as variables | `workspaceToModel()` → check output extraction logic |
| YAML preview stale | `modelToYaml()` → Zustand store subscription → Monaco update |
| Component not re-rendering | Zustand selector → check reference equality |
| TypeScript error in block handling | Block JSON schema → `blockDefinitions.ts` → type narrowing |
| Style broken | CSS file → check specificity, inspect computed styles |
| Workspace events firing incorrectly | Blockly event listener registration → cleanup in useEffect |

## Common IDE Failure Patterns

- **Missing block JSON file**: `index.json` manifest references a block file that doesn't exist in `public/blocks/` → fetch returns 404 → block type never registered → workspace can't create it
- **Blockly XML/JSON mismatch**: Block definition JSON doesn't match what `workspaceToModel()` expects
- **Zustand shallow compare miss**: Object reference changed but selector returns "same" value
- **Vite HMR desync**: Hot reload doesn't pick up changes to JSON files in `public/`
- **React key reuse**: Same key used for different block instances causes ghost state
- **CSS cascade leak**: Global styles bleeding into Blockly's shadow DOM

## Completion Criteria

- [ ] Root cause identified and documented in the response
- [ ] Fix implemented with minimal code changes
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vite build` succeeds
- [ ] No file exceeds 300 lines
- [ ] No `any` types introduced
- [ ] Existing patterns preserved

<!--
 Eclipse Tractus-X - Tractus-X TestLab

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
