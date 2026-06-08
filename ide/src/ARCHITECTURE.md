<!-- Eclipse Tractus-X - Tractus-X TestLab -->
<!-- Copyright (c) 2026 Contributors to the Eclipse Foundation -->
<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# IDE Source Architecture

> **Authoritative target:** the exhaustive, depth-by-depth folder tree, deltas, and
> migration phases live in
> [docs/developer/refactor-plan/ide-refactor-plan.md](../../docs/developer/refactor-plan/ide-refactor-plan.md)
> (see **§0** for the objective and **§2** for the complete annotated module tree).
> This file is the quick-reference summary. When in doubt, the refactor plan wins;
> keep this doc consistent with it.

## Objective — a Deeply Modular Frontend

**The goal is a deeply modular frontend, not merely "split files over 300 lines."**
Every concern — hooks, helpers, stores, sync, serialization, block definitions,
catalog loading, field classes, transforms, and views — is a **module in its own
right**: a folder with a single nameable responsibility, its own barrel (`index.ts`)
as public surface, and freedom to nest into **sub-modules within sub-modules**
wherever a real responsibility seam exists.

**File size is only one of several triggers** that reveal where modularity is
missing — never the goal. Any one of these signals a module is needed:

1. **A file bundles more than one nameable responsibility** — even well under 300
   lines (loading *and* transforming *and* validating = three modules in one file).
2. **A folder is a flat dump of siblings** that obviously cluster by concern.
3. **A file exceeds 300 lines** — the loudest trigger, but the *last* to rely on.
4. **The same logic appears twice** — extract it into one importable module.

### Guardrail — no over-engineering (non-negotiable)

Nest **only** at real, nameable responsibility seams. Each module has a single
nameable purpose and a minimal public surface. **Do not** create a single-function
"module" just to add depth, do not split a cohesive unit, and do not invent a folder
holding one stray file with no sibling concern (unless the plan §2 tree defines that
seam, e.g. a one-directional `reader/`). The boring, readable structure a human can
navigate always wins over artificial depth.

### Doctrine — behavior + appearance preserving

Modularization is **purely structural**: no change to behavior, generated output,
styling, or any observable contract. Every change must stay green on `tsc --noEmit`,
`vite build`, and the test suite, and be pixel-identical in the live browser.

## Top-Level Layers

| Folder | Purpose | May import from |
|--------|---------|-----------------|
| `app/` | Composition root: `main.tsx`, `App.tsx`. Wires the tree; no domain logic, no state | Everything |
| `layout/` | App chrome (topbar, panels, bottom-panel, status, welcome) | `shared/`, `store/`, `features/` (lazy) |
| `features/` | Self-contained domain features (block-editor, yaml-editor, …) | `shared/`, `store/`, `models/`, `services/` |
| `store/` | Zustand state slices — the ONLY mutable app state | `models/`, `services/` |
| `services/` | Pure, framework-free logic (transforms, I/O, validation) — no React, no store | `models/` only |
| `models/` | TypeScript schema types + factories — leaf layer | Nothing internal |
| `shared/` | Cross-cutting reusable UI, hooks, theme, ambient types — no domain knowledge | `models/` only |
| `assets/` | Static assets + the **single** SCSS source tree (`assets/styles/`, see below) | — |

## Import Rules

```
models/      ← leaf, no internal imports
services/    ← imports models/ only (never React, never store/)
shared/      ← imports models/ only
store/       ← imports models/, services/
features/    ← imports shared/, store/, models/, services/
layout/      ← imports shared/, store/, features/ (via lazy/barrel)
app/         ← imports everything (wires the app together)
```

**Allowed direction:** `app → layout/features → store → services → models`, and any
layer → `shared`/`models`. Arrows never reverse.

**Hard rules:**
- Features must NOT import from other features. Mediate through `store/`.
- `shared/`, `models/`, `services/` must NOT import from `features/`, `layout/`, or `store/`.
- `services/` must NOT import React or `store/`.
- Never reach past a layer's barrel into its internal files. Import `@/store`, not
  `@/store/project/useProjectStore`.

## Deep, Nested Module Structure

Layers are not flat — each is organized into **concern-based subfolders** (module →
sub-module → sub-sub-module), every level exposing a barrel `index.ts`. The reference
seam is `features/block-editor/`. Key nested seams:

```
features/block-editor/
  config/                        # static workspace + catalog config
  blocks/                        # everything that DEFINES/REGISTERS blocks
    common/{catalog, contextMenu, fields}/   # shared block primitives
    registration/{steps, values, assertions, policy, structure, utility}/  # one folder per block family
    api-path/{core, modal}/      # API-path picker block
    path/{core, modal, schema}/  # JSON-path picker block
    json/{core, modal}/          # inline JSON editor block
  fields/templateString/         # custom Blockly Field classes
  hooks/                         # Blockly ↔ React/store hooks (init, store-sync, resize)
  serialization/
    serialize/                   # workspace → model (one direction)
    populate/paramPopulators/    # model → workspace; one populator file per ParamType (data-driven registry, NO switch)
    serializationParts/          # the ONLY home for serialization helpers (descriptive names)
  sync/                          # live workspace event wiring
  toolbox/                       # dynamic toolbox built from the catalog
  ui/                            # block-editor-local panels

# other features are nested by concern too (see plan §2d for full trees):
features/
  environment-editor/            # services/ + variables/ + preview/ + shared/ (FieldWithToggle)
  tck-dashboard/                 # forms/ + pipeline/ + dataflow/{graph, panels, builder}
  yaml-editor/                   # editors/{Monaco, Schema, Testdata} + VariablePicker/
  project-explorer/              # tree/ + contextMenu/ + actions/

models/
  schema/                        # testSchema, phaseSchema, assertionSchema (split by concern)

store/
  project/ editor/ environment/ execution/ compile/ notifications/ ui/
  selectors/                     # derived read models, split per domain (no mutation)

services/
  yaml/{yamlFieldMap, modelToYaml, yamlToModel, yamlLineMap}   # frozen v2 contract; single field-map source
  project/                       # pure project I/O moved out of store/
  graph/ sequence/ validation/
```

This is a **summary**. See refactor plan §2 for the complete, annotated tree
(`← NEW` / `← SPLIT` / `← MOVE` / `← RENAME` / `← DELETE` deltas).

## File Naming Convention (self-documenting names)

Every file name must answer **what it contains, why it exists, and what it holds** on
sight — no decoding required.

**Banned anywhere in `ide/src/`:** `helpers.ts`, `utils.ts`, `misc.ts`, `common.ts`,
`index2.ts` / any `*2.ts`, bare generic `types.ts` / `constants.ts` (at a depth where
they hold more than one concern), and any `*Helpers.ts` / `*Utils.ts` suffix that does
not name the domain it serves.

**Rules:**
1. **Domain noun + role suffix** — name by *what it operates on* plus *what role it
   plays*: `blockToStepSerializer.ts`, `paramPopulatorRegistry.ts`,
   `projectFilePersistence.ts`, `validateBlockFlattener.ts`.
2. **Role suffixes:** `*Serializer` / `*Parser`, `*Builder` / `*Factory`, `*Registry`,
   `*Accessors`, `*Init` / `*Bootstrap`, `*Persistence` / `*Loader`, `*Normalizers`,
   `*Resolver`.
3. **Barrels stay `index.ts`** — re-exports only, never logic.
4. **Co-located types → `<feature>.types.ts`** (e.g. `blocklyWorkspace.types.ts`).
5. **Hooks** keep the `useXxx` convention but name the concern precisely
   (`useBlocklyInit.ts`, not `useBlockly2.ts`).
6. **One file = one nameable responsibility.** If you cannot name a file without "and"
   or "helpers", split it first.

## Styling — One SCSS Source Tree

**All styles are centralized under `ide/src/assets/styles/`. SCSS only — no plain
`.css`, no per-component co-located stylesheets.** Files are wired with `@use` /
`@forward` only (never `@import`). Requires the `sass` dev dependency.

```
assets/styles/
  main.scss          # the ONE stylesheet app/main.tsx imports; forwards the rest in
                     # cascade order: abstracts → base → themes → layout → components → features
  abstracts/         # tokens, mixins, functions, placeholders — ZERO CSS output
  base/              # resets, typography, global element defaults — emitted once
  layout/            # app-shell chrome styling (mirrors layout/)
  features/          # one _<feature>.scss per feature (mirrors features/<name>)
  components/        # shared/ui component styles
  themes/            # Blockly workspace theme + Tractus-X --tx-* color tokens
```

**Rules:**
- Shared tokens/mixins **always** come from `assets/styles/abstracts/` via `@use` —
  never copied. If a color/spacing/radius/shadow appears twice, promote it to
  `abstracts/`.
- Runtime theming stays as CSS custom properties (`--tx-*`); build-time reuse stays
  SCSS (mixins, functions, `@extend %placeholder`, nesting).
- Component styling references shared classes/tokens — there are **no** co-located
  `*.module.scss` or `.css` files next to components.
- `shared/theme/` holds the MUI TS theme object only — it is **not** SCSS and **not**
  the styling source.

## File Limits

- Max **300 lines** per file — split into focused sub-modules if exceeded.
- Max **30 lines** per function — extract helpers.
- One component per `.tsx` file.

**Modularity is the objective; the 300-line limit is the *loudest* trigger, but the
*last* one to rely on — not the goal** (see [Objective](#objective--a-deeply-modular-frontend)).
A module is also needed when a file bundles more than one nameable responsibility
(even under 300 lines), a folder is a flat dump of siblings that cluster by concern,
or the same logic appears twice. Write small, single-responsibility units from the
start. When splitting, extract **reusable** units along responsibility seams (one
concern per module) into importable modules — never cut a file arbitrarily in half,
never duplicate logic, and never nest where no real seam exists.

## Adding a New Feature

1. Create `src/features/{feature-name}/` with concern-based subfolders, each with its
   own `index.ts` barrel. Use descriptive, self-documenting file names (see above).
2. Export the root component from `src/features/{feature-name}/index.ts` — the single
   import surface for external code.
3. Add the feature's stylesheet as `assets/styles/features/_{featureName}.scss` and
   `@forward` it from `assets/styles/features/_index.scss`. Reuse tokens/mixins from
   `abstracts/` via `@use "abstracts" as *` — do not co-locate a `.css`/`.scss`.
4. Wire it into `layout/` or `app/` via lazy import.
5. Communicate with other features through `store/` slices — never direct imports.

## Adding a New Shared Component

1. Create `src/shared/ui/{ComponentName}/{ComponentName}.tsx` with an `index.ts` barrel
   (`export { ComponentName } from "./ComponentName"`). **No co-located stylesheet.**
2. Add its styles as `assets/styles/components/_{componentName}.scss` and `@forward`
   from `assets/styles/components/_index.scss`, reusing `abstracts/` tokens via `@use`.
3. Re-export from `src/shared/ui/index.ts`.
4. Import in features as: `import { ComponentName } from "@/shared/ui"`.
