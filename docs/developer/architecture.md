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

# Architecture

## Overview

The TestLab IDE is a single-page React application that lets users visually author dataspace integration tests using a block-based editor (Blockly). The application has three synchronized representations of the same test data:

1. **Block workspace** — Drag-and-drop visual editor (primary editing surface)
2. **YAML editor** — Text-based editing with Monaco Editor
3. **Dependency graph** — Read-only React Flow visualization

All three derive from a shared in-memory model (`TestLabDocument`) managed via Zustand.

## Module organization — deep modularity

Both codebases — the frontend (`ide/src/`) and the backend
(`src/tractusx_testlab/`) — follow the **same organizing principle: deep
modularity**. The architecture is not "files split when they exceed 300 lines"; it
is a tree in which **every concern is a module in its own right**.

A module — a folder in TypeScript, a package in Python — has exactly three
properties:

1. **A single nameable responsibility.** If you cannot name what it does without
   the word "and", it is more than one module.
2. **Its own barrel** as the public surface — `index.ts` for TypeScript,
   `__init__.py` for Python. The barrel re-exports the module's public API and
   contains no logic.
3. **A minimal public surface.** Private helpers (`_*.py`, un-exported `.ts`) stay
   internal and are never imported across module boundaries.

Modules **nest as deep as real responsibility seams require** — sub-modules within
sub-modules. Parent barrels re-export through their child barrels, so external
consumers import the **parent only** and never reach into a deep path. Inside the
same area, mutually-referencing modules use **direct relative paths** (not the
sibling barrel) to avoid barrel-evaluation cycles.

### When a module is needed

The 300-line limit is **one trigger among several** — the loudest, but the last to
rely on. Any one of these signals a missing module:

| Trigger | Meaning |
|---------|---------|
| Bundled responsibilities | One file does loading *and* transforming *and* validating — three modules wearing one filename, even under 300 lines. |
| Flat folder of mixed concerns | A folder is a dump of siblings that cluster into distinct sub-concerns. |
| Duplication | The same logic appears twice — extract it into one importable module. |
| Size > 300 lines | The loudest trigger; by the time a file is oversized the seams are already obvious. |

### Guardrail — no over-engineering

Nest **only** where a real, nameable seam exists. Never create a single-function
"module" just to add depth, never split a cohesive unit, and never invent a folder
holding one stray file with no sibling concern. The boring, readable structure a
human can navigate always wins over artificial depth.

This is a **behavior-preserving** discipline: modularization changes structure
only — never runtime behavior, generated output (YAML / `.stck`), styling, or any
observable contract.

### Frontend layers (`ide/src/`)

The frontend is feature-based. Each top-level layer exposes a barrel; imports flow
**one way only** — `app → layout/features → store → services → models`, and any
layer may import `shared`/`models`. Feature → feature imports are forbidden;
features mediate through `store`.

```
ide/src/
  app/        composition root: bootstrap + <App> only — no feature logic
  layout/     app chrome (topbar, panels, status, bottom-panel, welcome)
  features/   self-contained domain features; each owns its UI/hooks/local logic
  store/      Zustand state slices — the only mutable app state; may import services/, models/
  services/   pure, framework-free logic (transforms, I/O, validation) — no React, no store
  models/     TypeScript schema types + factories — leaf layer, imports nothing internal
  shared/     cross-cutting reusable UI, hooks, theme, ambient types — no domain knowledge
  assets/     static assets + the single SCSS source tree (assets/styles/)
```

Features nest the same way down to the seam. The reference pattern is
`features/block-editor/serialization/`, whose `serialize/` module splits into
`reader/` (read a block chain into steps), `writer/` (write blocks → steps /
policies), and `validation/` (flatten validate blocks) — each a nested module with
its own barrel. For the complete nested end-state tree see
[refactor-plan/ide-refactor-plan.md](refactor-plan/ide-refactor-plan.md) §2.

### Backend layers (`src/tractusx_testlab/`)

The backend is layered. Inner layers never import outer ones:

```
syntax  ──▶  (leaf: pure constants, no testlab imports)
models  ──▶  syntax
config  ──▶  models, syntax
security ─▶  models
services ─▶  models, config, security        (SDK service wiring)
steps   ──▶  models, services, syntax, config (never imports player/server/cli)
compiler ─▶  models, syntax, steps (registry only)
player  ──▶  steps, services, models, config, compiler
server  ──▶  player, compiler, services, models
cli     ──▶  compiler, player, server, config   (thinnest layer, top of stack)
```

`steps/` is the keystone: it depends downward on `models`/`services`/`syntax` and
is imported upward by `compiler` (for `@step` registry validation) and `player`
(for execution).

```
src/tractusx_testlab/
  cli/        Typer command groups — thin; delegate, never compute
  compiler/   compile-time: YAML → IR (ir/) → validation (validation/) → package
  config/     configuration loading & settings (data + I/O only)
  logging/    structured logging — cross-cutting, depends on nothing
  models/     Pydantic data only — no behavior, no I/O
  player/     run-time: load (loading/) → execute (execution/) → track jobs
  scripting/  script object model + builder DSL (author-facing)
  security/   crypto (crypto/) + identity & trust (trust/)
  server/     FastAPI mock server: routes (routes/) + SSE streaming (streaming/)
  services/   SDK service wiring + lifecycle (no protocol reimplementation)
  steps/      step executors — one domain per sub-package (connector/, industry/, …)
  syntax/     leaf: default syntax constants — no testlab imports
  schemas/    packaged JSON-schema assets (data, no code)
```

Each layer nests further along its seams — e.g. `steps/connector/` holds the
EDC/DSP domain steps and nests a `dsp/` sub-package (one protocol verb per file);
`compiler/` nests `ir/` and `validation/` sub-packages. For the complete nested
end-state tree see
[refactor-plan/backend-refactor-plan.md](refactor-plan/backend-refactor-plan.md) §2.

## System diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser Window                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Project   │  │ Block Workspace  │  │ YAML Editor (Monaco) │  │
│  │ Explorer  │  │ (Blockly)        │  │                      │  │
│  │           │  │                  │  │  or                  │  │
│  │ File tree │  │  drag/connect    │  │  Dependency Graph    │  │
│  │ + context │  │  blocks          │  │  (React Flow)        │  │
│  │   menus   │  │                  │  │                      │  │
│  └─────┬─────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│        │                 │                        │              │
│        │        workspaceToModel()        yamlToModel()          │
│        │                 │                        │              │
│        │                 ▼                        ▼              │
│        │    ┌────────────────────────────────┐                   │
│        │    │   useTestLabStore (Zustand)     │                  │
│        │    │                                │                   │
│        │    │   model: TestLabDocument        │                  │
│        │    │   yaml: string                 │                   │
│        │    │   errors: ValidationError[]     │                  │
│        │    │   lastEditSource: "blocks"      │                  │
│        │    │         | "yaml" | "load"       │                  │
│        │    └────────────┬───────────────────┘                   │
│        │                 │                                       │
│        │          onModelChange()                                │
│        │                 │                                       │
│        │                 ▼                                       │
│        │    ┌────────────────────────────────┐                   │
│        ├───▶│   useProjectStore (Zustand)    │                   │
│             │                                │                   │
│             │   tests: Map<name, Script>     │                   │
│             │   tck: TckDefinition  │                  │
│             │   schemas: Map<name, Schema>    │                  │
│             │   activeFile: ActiveFile        │                  │
│             │   workspaceStates: per-file     │                  │
│             └────────────┬───────────────────┘                   │
│                          │                                       │
│                   localStorage                                   │
│                  (auto-save 1s)                                  │
└──────────────────────────────────────────────────────────────────┘
```

## The sync loop

The most important mechanism to understand is the **bidirectional sync loop** between Blockly and YAML. Without proper guarding, changes from one side would trigger the other side to update, creating an infinite loop. The `lastEditSource` field prevents this.

### Blocks → Model → YAML

```
User drags block
  → Blockly fires change event
  → debounced 150ms
  → workspaceToModel(Blockly, ws, catalog) → TestLabDocument
  → useTestLabStore.setModelFromBlocks(model)
    → sets lastEditSource = "blocks"
    → validate(model)
    → modelToYaml(model) → yaml string
    → onModelChange callback → useProjectStore.updateTest()
```

### YAML → Model → Blocks

```
User types in Monaco
  → debounced 500ms
  → useTestLabStore.setModelFromYaml(yaml)
    → yamlToModel(yaml) → TestLabDocument
    → sets lastEditSource = "yaml"
    → validate(model)
    → onModelChange callback → useProjectStore.updateTest()
  → BlocklyWorkspace model-sync effect fires (because lastEditSource === "yaml")
    → disposes existing block chains (SETUP, STEPS, TEARDOWN)
    → populateWorkspaceFromModel(ws, root, model, catalog)
    → refreshes dropdown fields
```

### File switch (click in ProjectExplorer)

```
User clicks different file in explorer
  → useProjectStore.setActiveFile(file)
  → BlocklyWorkspace file-switch effect:
    → saves current workspace state under old file name
    → updates activeFileKeyRef
  → App.tsx loads new model via useTestLabStore.loadModel()
    → sets lastEditSource = "load"
  → BlocklyWorkspace model-sync effect fires (because lastEditSource === "load")
    → disposes all chains (SETUP, STEPS, TEARDOWN)
    → populateWorkspaceFromModel() rebuilds blocks from new model
    → refreshDropdownFields() ensures variable dropdowns show correct values
```

### Loop prevention

The `lastEditSource` field is the key guard:

| `lastEditSource` | Blocks react? | YAML reacts? |
|---|---|---|
| `"blocks"` | No (it was the source) | Yes, updates YAML text |
| `"yaml"` | Yes, rebuilds blocks | No (it was the source) |
| `"load"` | Yes, rebuilds blocks | Yes, updates YAML text |
| `"none"` | No | No |

Additionally, `isUpdatingFromStore` ref in BlocklyWorkspace suppresses change events while programmatically modifying blocks, preventing spurious model updates during population.

## Panel layout

```
┌──────────────────────────────────────────────────────┐
│  TopBar (44px fixed)                                 │
│  Logo | Project Name | Import | Export | Examples    │
├────────┬─────────────────────────┬───────────────────┤
│Explorer│  Center Panel           │  Right Panel      │
│(resize │  (BlocklyWorkspace      │  (YamlEditor      │
│ 160-   │   or SchemaEditor       │   or Graph        │
│ 500px) │   or TckDashboard) │   or hidden)      │
│        │                         │                   │
├────────┴─────────────────────────┴───────────────────┤
│  StatusBar (24px fixed)                              │
│  Errors: 0 | Warnings: 0 | Steps: 5 | File: test.y  │
└──────────────────────────────────────────────────────┘
```

The center panel content depends on the active file type:

| Active file type | Center panel | Right panel options |
|---|---|---|
| `test` | BlocklyWorkspace | YAML Editor, Dependency Graph |
| `tck` | TckDashboard | YAML Editor |
| `schema` | SchemaEditor (read-only JSON) | Hidden |
| None | WelcomeScreen | Hidden |

## Canvas state persistence

Each file gets its own Blockly canvas state (block positions, detached blocks, zoom level). When switching files:

1. The current canvas is serialized via `Blockly.serialization.workspaces.save()` and stored in `useProjectStore.workspaceStates[fileName]`.
2. On return to that file, the saved state is restored via `Blockly.serialization.workspaces.load()`, preserving exact block positions.
3. After restore, `refreshDropdownFields()` runs to ensure all dynamic dropdowns (variables, services, schemas) show current values.

If no saved state exists (first time opening a file), the workspace is built from the model via `populateWorkspaceFromModel()`.

## Project persistence

The entire project (TCK, all tests, schemas, test order) is serialized to `localStorage` under the key `"testlab-project"`. Auto-save runs on a 1-second debounce after any model change.

The project can also be exported as a ZIP file with this structure:

```
{projectName}/
├── index.yaml              ← Test case definition
├── tests/
│   ├── test_one.yaml
│   └── test_two.yaml
└── schemas/
    └── my-schema.json
```
