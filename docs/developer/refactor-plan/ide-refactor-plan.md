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

# IDE Refactor Plan (`ide/src/`)

> All phases obey the **Refactor Charter** in [README.md](README.md) — structural-only, look/behave identical, legacy removal allowed.

> **Scope:** structural-only. No behavior, no contract, no generated-output
> changes. Every phase ends green on `tsc --noEmit`, `vite build`, and the test
> suite. See [README.md](README.md) for shared contracts and the lockstep rule.

The IDE has **already migrated** to the feature-based architecture documented in
`ide/src/ARCHITECTURE.md` (`app/ · features/ · layout/ · shared/ · store/ ·
models/ · services/`). The import rules and feature→store mediation are documented
and — verified during this audit — already honored: there are **zero
feature→feature imports**. This plan now drives that architecture all the way down:
**every concern becomes a module in its own right, nested as deep as real
responsibility seams require.**

---

## 0. Objective — a deeply modular frontend

**The goal is a deeply modular frontend, not merely "split files over 300 lines."**

Every concern — hooks, helpers, stores, sync, serialization, block definitions,
catalog loading, field classes, transforms, and views — becomes a **module in its
own right**: a folder with a single nameable responsibility, its own barrel
(`index.ts`) as public surface, and freedom to nest into **sub-modules within
sub-modules** wherever a real seam exists. Modularity is the objective; file size
is only one of several triggers that reveal where modularity is missing.

**Triggers that signal a module is needed** (any one is sufficient):

1. **A file bundles more than one nameable responsibility** — even well under 300
   lines. A 120-line file that does loading *and* transforming *and* validating is
   three modules wearing one filename.
2. **A folder is a flat dump of siblings** that obviously cluster by concern (e.g.
   18 components in one `dataflow/` folder that are really *graph rendering* +
   *detail panels* + *data builders*).
3. **A file exceeds 300 lines** — the loudest trigger, but the *last* one to rely
   on. By the time a file is oversized, the missing seams are already obvious.
4. **The same logic appears twice** — extract it into one importable module instead
   of duplicating it.

**This plan therefore covers the whole frontend**, not only today's oversized
files. Sub-300 files and flat feature folders that bundle responsibilities are
modularized too.

### Guardrail — no over-engineering (non-negotiable)

Nest **only** where a real, nameable responsibility seam exists. Each module must
have a single nameable purpose and a minimal public surface. **Do not** create a
single-function "module" just to add depth, do not split a cohesive unit, and do
not invent a folder that holds one stray file with no sibling concern (unless the
§2 tree defines that seam, e.g. a one-directional `reader/`). The boring, readable
structure a human can navigate always wins over artificial depth.

### Doctrine — behavior + appearance unchanged

Modularization is **purely structural**. No phase changes behavior, generated
output, styling, or any observable contract. Every phase ships green on
`tsc --noEmit`, `vite build`, and the test suite, and (per the README Execution
Discipline) is proven pixel-identical in the live browser before it is "done." The
300-line acceptance check in §6 remains, but it is a **floor**, not the target —
passing it does not mean a folder is modular.

---

## 1. Current-State Pain Points

All line counts below were measured during this audit (May 2026), not estimated.

### 1a. Dead duplicate tree — `components/BlockEditor/`

A legacy `src/components/BlockEditor/` tree co-exists with the live
`src/features/block-editor/`. **It is imported nowhere outside itself** (verified:
no external references to `components/BlockEditor`). It contains the two *largest*
files in the repo, which is why the oversized scan looks worse than reality:

| File | Lines | Status |
|------|------:|--------|
| `components/BlockEditor/serialization/helpers.ts` | 340 | dead duplicate of feature helpers |
| `components/BlockEditor/blocks/registration/values/valueBlocks.ts` | 320 | dead duplicate |
| `components/BlockEditor/blocks/catalogBlocks.ts` | — | dead |
| `components/BlockEditor/blocks/valueBlocks.ts` | — | dead |
| `components/BlockEditor/config/blockColors.ts` | — | dead |
| `components/BlockEditor/toolbox/{phaseConfig,toolboxBuilder}.ts` | — | dead |

`src/components/` also holds a `YamlEditor/` sibling — confirm before deletion
whether it is live or also superseded by `features/yaml-editor/`.

### 1b. Over-limit live files (> 300 lines)

| File | Lines | Problem |
|------|------:|---------|
| `features/block-editor/serialization/serialize/workspaceToModel.ts` | 303 | Mixes chain reading, validate-flattening, and block→step conversion in one module (`workspaceToModel`, `readStepChain`, `flattenValidateToSteps`, `blockToStep`). |
| `features/block-editor/hooks/useBlocklyWorkspace.ts` | 301 | One hook owning three concerns across three `useEffect`s: init/catalog load, store↔workspace sync (debounced), and resize/toolbox refresh. |

### 1c. Kitchen-sink / tangled modules (under 300 but mixed responsibility)

| File | Lines | Problem |
|------|------:|---------|
| `serialization/helpers.ts` | 259 | Co-exists with a `serialization/helpers/` folder (`assertions.ts`, `blockUtils.ts`, `structuralBlocks.ts`, `valueBlocks.ts`). A leftover flat file holding grab-bag helpers that should live inside the folder. Splits the public surface in two places. |
| `serialization/populate/populateTest.ts` | 288 | A single `switch (p.type)` over 13 param types (`dropdown`, `variable`, `text`, `number`, `json`, `array`, `steps`, `filter_expression_list`, `json_path`, `api_path`, …). Adding a param type means editing this giant switch. Stringly-dispatched, not data-driven. |

### 1d. Store mixing state with pure I/O — `store/project/`

`store/project/` (1,537 lines across 10 files) blends Zustand state with **pure,
side-effecting I/O** that has no business in a store:

| File | Lines | Nature |
|------|------:|--------|
| `persistence.ts` | 267 | pure localStorage I/O + serialization |
| `projectIO.ts` | 207 | pure import/export I/O |
| `importExample.ts` | 176 | pure example loading/fetch |
| `importHelpers.ts` | 170 | pure transform |
| `projectIOHelpers.ts` | 131 | pure transform |
| `documentLoader.ts` | 122 | pure document parsing/loading |
| `useProjectStore.ts` | 160 | the actual store (state + actions) |
| `projectAssetActions.ts` / `projectTestActions.ts` | 130 / 130 | store action slices |

Per `ARCHITECTURE.md`, `store/` may import `services/`. Pure I/O belongs in
`services/project/`, leaving `store/project/` holding only state and thin actions
that delegate to the service.

### 1e. Barrel-bypass: deep store imports from features

Features deep-import store internals instead of the `@/store` barrel:

| Imported path | Occurrences |
|---------------|------------:|
| `@/store/project/useProjectStore` | 26 |
| `@/store/editor/useEditorStore` | 10 |
| `@/store/environment/useServiceStore` | 8 |
| other deep `@/store/*` | 3 |

This is consistent and not a layering *violation* (still feature→store), but it
couples features to the store's internal file layout, defeating the barrel. Note:
this is low-priority hygiene, **not** a correctness bug.

### 1f. Model↔YAML field-mapping duplication

`services/yaml/modelToYaml.ts` (119) and `services/yaml/yamlToModel.ts` (246)
encode the *same field mapping* twice — once forward, once reverse. A field added
to one side can silently drift from the other. This is the **frozen YAML v2
contract** (see README lockstep rule): the mapping logic may be centralized, but
the emitted YAML must stay byte-identical.

### 1g. Scattered styling — 66 per-component `.css` files, no SCSS

Styling is **66 plain `.css` files co-located next to components** (verified by
inventory, May 2026) with **no SCSS, no `assets/` tree, and no shared token
source**. Colors, spacing, radii, panel surfaces, and scrollbar rules are
copy-pasted across files, so a token change means editing dozens of files and look
drifts between components. There is no single place to find or change a style.

| Symptom | Count / detail |
|---------|----------------|
| Per-component `.css` files under `src/` | 66 (layout, features, shared/ui, app) |
| SCSS files | 0 |
| Shared token / mixin source | none — values duplicated inline |
| `assets/` directory | does not exist |

This is the largest source of duplication in the IDE and the reason Directive 2
mandates a single SCSS source tree (see §2.1 and Phase 19).

### 1h. Flat feature folders bundling multiple sections (under 300, still un-modular)

Several feature folders are **flat dumps of siblings that obviously cluster by
concern** — no file is oversized, yet the folder is not modular. These are prime
deep-modularization targets driven by trigger §0.2, not by line count:

| Folder | Files (flat) | Distinct concerns bundled |
|--------|------------:|---------------------------|
| `features/tck-dashboard/dataflow/` | 18 | graph rendering (canvas/nodes/edges) + detail panels + data builders + layout |
| `features/environment-editor/` | 11 | services section + variables section + YAML preview + shared field |
| `features/project-explorer/` | 9 | tree rendering + context menu (3 files) + actions + drag hook |
| `features/preconditions/` | 8 | modal + list + rule sections + editor + template policies |
| `features/yaml-editor/` | 9 | three distinct editors (Monaco/Schema/Testdata) + variable picker + setup |
| `block-editor/serialization/populate/` | 8 | model→workspace orchestration + assertions + filter expressions + tracking |
| `block-editor/blocks/common/catalog/` | 3 | catalog loading vs. variable collection (two responsibilities) |
| `block-editor/fields/` | 7 | wrapped-text field + template-string field + dialog/patch helpers |

Each becomes a set of nested per-responsibility modules (§2d, §2g) with their own
barrels — exactly the layout already proven in `serialization/serialize/`.

### 1i. Dead root-level block duplicates

`blocks/catalogBlocks.ts` (246) and `blocks/valueBlocks.ts` (277) sit at the
`blocks/` root alongside the live `blocks/registration/steps/catalogBlocks.ts` and
`blocks/registration/values/valueBlocks.ts`. They appear to be superseded
duplicates from the registration migration. **Verify zero importers, then delete**
(legacy removal is permitted by the Charter).

---

## 2. Target Architecture

Concern-based folders, each with a barrel, following the reference patterns already
in this codebase: `features/block-editor/serialization/` (nested modules `helpers/`,
`populate/`, `serialize/`, each with its own `index.ts` barrel) and the feature-folder model in
`ARCHITECTURE.md`. No new top-level layers are introduced — the existing
`app/features/layout/shared/store/models/services` taxonomy is the target; this
plan only *completes* it.

This section is the **END STATE** the migration phases (Section 4) converge to.
Every folder — at every depth — is listed with a one-line responsibility (what
lives there and, where useful, what does NOT). Items marked `← NEW`, `← SPLIT`,
`← DELETE`, `← MOVE`, or `← RENAME` are the deltas this plan introduces; everything
else already exists and is shown so the tree is complete and unambiguous.

### 2.0. File Naming Convention (self-documenting names)

Every file name must answer **what it contains, why it exists, and what it holds**
on sight — no decoding required. Generic dumping-ground names are banned because
they hide responsibility and invite grab-bag growth.

**Banned names** (anywhere in `ide/src/`): `helpers.ts`, `utils.ts`, `misc.ts`,
`common.ts`, `index2.ts`/`*2.ts`, bare generic `types.ts`/`constants.ts` at a depth
where they hold more than one feature's concern, and any `*Helpers.ts`/`*Utils.ts`
suffix that does not name the domain it serves.

**Naming rules:**

1. **Domain noun + role suffix.** Name by *what it operates on* plus *what role it
   plays*: `blockToStepSerializer.ts`, `paramPopulatorRegistry.ts`,
   `blocklyWorkspaceInit.ts`, `projectFilePersistence.ts`,
   `validateBlockFlattener.ts`. The reader knows the subject and the verb.
2. **Role suffixes** (pick the one that matches the file's job):
   `*Serializer` / `*Parser` (encode/decode), `*Builder` / `*Factory` (construct
   objects), `*Registry` (data-driven dispatch table), `*Accessors` (low-level
   read/write of a structure), `*Init` / `*Bootstrap` (setup effects),
   `*Persistence` / `*Loader` (I/O), `*Normalizers` (shape transforms),
   `*Resolver` (lookup/resolution).
3. **Barrels stay `index.ts`.** Only barrels re-exporting a folder's public surface
   use `index.ts`. They contain re-exports only — never logic.
4. **Co-located types → `<feature>.types.ts`.** Type-only modules name their owner:
   `blocklyWorkspace.types.ts`, `bottomPanel.types.ts`, `explorerContextMenu.types.ts`.
5. **Co-located styles → `<Component>.module.scss`** (see §2.1 SCSS architecture).
6. **Hooks** keep the `useXxx` React convention but name the concern precisely:
   `useBlocklyInit.ts`, not `useBlockly2.ts`.
7. **One file = one nameable responsibility.** If you cannot name a file without
   "and" or "helpers", the file is doing too much — split it first.

This plan's NEW/SPLIT/MOVE files (Sections 2d–2f) already follow these rules; any
pre-existing file whose name violates them is shown with `← RENAME` and a
descriptive target.

### 2.0.1. Split outputs become nested modules (no flat dumps)

Every folder is a **module in its own right** — it has its own barrel (`index.ts`),
its own public surface, and a single responsibility. Nesting therefore means
**modules within modules (sub-modules)**, never "subfolders".

When a file is split, its outputs **must be organized into nested per-responsibility
modules matching the §2 end-state tree** — one module per responsibility, each a
folder with its own barrel and public surface — **never dropped as a flat dump of
sibling files in one folder**. A split that leaves five new modules side-by-side in
the parent folder is incomplete: finish it by placing each module under the
responsibility module the §2 tree defines.

**Rules:**

1. **One module per responsibility.** Each output lands in the module that names its
   job — e.g. for the `serialize/` module: `reader/` (read a chain into steps),
   `writer/` (write blocks → steps/policies), `validation/` (flatten validate
   blocks + guards). The §2 tree is authoritative for which modules exist.
2. **Each nested module owns a barrel `index.ts`.** The parent module's barrel
   re-exports through the nested-module barrels (`export … from "./reader"`), so
   external consumers import the parent barrel only — never a deep path.
3. **Cross-module references inside the same area** use direct relative file paths
   (e.g. `../writer/blockToStepSerializer`), not the sibling barrel, to keep
   mutually-recursive modules free of barrel-evaluation cycles.
4. **No over-engineering.** One module per *real* responsibility that the §2 tree
   defines. Do **not** create a single-file module with no siblings unless §2
   defines that seam (a genuine one-direction seam such as `reader/` is allowed even
   with one file; an arbitrary `foo/` holding one stray module is not).

This rule applies **retroactively** (already-split outputs are reorganized into the
nested-module layout) and **going forward** (every future split lands nested from
the start).

### 2a. Top-level layers (`ide/src/`)

```
ide/src/
  app/         # composition root: bootstrap + top-level <App> only — NO feature logic
  layout/      # app chrome (topbar, panels, status, bottom-panel, welcome) — NO domain logic
  features/    # self-contained domain features; each owns its UI/hooks/local logic
  store/       # Zustand state slices; the ONLY mutable app state. May import services/, models/
  services/    # pure, framework-free logic (transforms, I/O, validation) — NO React, NO store
  models/      # TypeScript schema types + factories — leaf layer, imports nothing internal
  shared/      # cross-cutting reusable UI, hooks, theme, ambient types — NO domain knowledge
  assets/      # ← NEW: static assets + the SINGLE SCSS source tree (assets/styles/, see §2.1)
  __tests__/   # cross-cutting unit tests (models, store, utils) co-located by target layer
  # components/ ← DELETE (dead duplicate tree, see Phase 0)
```

Barrel + import rules between layers:
- Each top-level layer exposes a barrel `index.ts` (`@/store`, `@/services`,
  `@/models`, `@/shared`, plus each feature's `@/features/<name>`).
- **Allowed import direction:** `app → layout/features → store → services → models`,
  and any layer → `shared`/`models`. Arrows never reverse.
- **Forbidden:** `feature → feature` (mediate through `store`), `services → store`,
  `services → React`, `models → anything internal`, and reaching past a barrel
  into another layer's internal files.

### 2b. `app/` — composition root

```
app/
  main.tsx     # Vite entry: mounts React root, providers, error boundary
  App.tsx      # top-level layout composition — delegates everything to layout/ + features/
```
Responsibility: wire the tree together. Holds no domain logic and no state.

### 2c. `layout/` — application chrome

```
layout/
  index.ts                 # barrel
  topbar/                  # the top action bar; orchestration buttons live in controls/
    TopBar.tsx ContextBar.tsx ContextBarIcons.tsx TopBarButtons.tsx
    TopBarExampleMenu.tsx TopBarHamburgerMenu.tsx
    controls/              # action buttons that trigger store/services (compile, execute, settings)
      CompileButton.tsx ExecuteButton.tsx BackendSettings.tsx
  panels/                  # the editor panel grid + file-name editing — layout only, no editor logic
    EditorPanels.tsx PanelControls.tsx EditableFileName.tsx
  bottom-panel/            # collapsible bottom dock shell
    BottomPanel.tsx NetworkDetailOverlay.tsx
    bottomPanel.types.ts     # ← RENAME (was types.ts): dock tab + panel-state types
    tabs/                  # one component per dock tab (console, network, performance)
      ConsoleTab.tsx NetworkTab.tsx PerformanceTab.tsx
  status/                  # status bar + transient notifications + save indicator hook
    StatusBar.tsx NotificationBar.tsx useSaveIndicator.ts
  WelcomeScreen/           # first-run / empty-state screen
    WelcomeScreen.tsx WelcomeCards.tsx
```
Responsibility: visual frame around the features. Reads store, renders chrome;
contains no serialization, no block, and no YAML logic.

### 2d. `features/` — domain features (each a self-contained folder)

```
features/
  block-editor/            # the Blockly authoring surface — the largest feature
    index.ts               # feature barrel — the ONLY entry external code may import
    BlocklyWorkspace.tsx BlockEditorErrorBoundary.tsx
    blocklyWorkspace.types.ts   # ← RENAME (was workspaceTypes.ts): workspace prop/state types
    config/                # static workspace + catalog config (colors, defs, workspace opts)
      blockColors.ts blockDefinitions.ts workspaceConfig.ts
    blocks/                # everything that DEFINES/REGISTERS blocks — split by concern below
      index.ts
      common/              # shared block primitives reused by all block kinds
        catalog/           # ← SPLIT (Phase 7): two responsibilities become two modules
          loader/          #   catalog fetch/parse (was catalogLoader.ts)
          variables/       #   variable collection (was variableCollection + typedVariableCollection)
        contextMenu/       # right-click "spawn outputs" menu
        fields/            # custom field providers (dropdowns, icons, info-icon)
        outputDispenser.ts stepIdGenerator.ts
      registration/        # registers each block family with Blockly — one folder per family
        steps/             # catalog-driven step blocks + param-field registration
        values/            # value/literal/variable-ref/path value blocks
        assertions/        # assertion blocks + helpers
        policy/            # policy blocks + constants
        structure/         # root/auth/precondition/filter/structural container blocks
        utility/           # utility blocks (wait, function, etc.)
      api-path/            # API-path picker block (core builder + modal UI)
        core/ modal/
      path/                # JSON-path picker block (builder + schema tree UI + resolver)
        core/ modal/ schema/
      json/                # inline JSON editor block (editor core + modal + var-refs)
        core/ modal/
    fields/                # custom Blockly Field classes (not block defs) — one module per field (Phase 6)
      index.ts
      wrappedText/         # ← SPLIT: FieldWrappedText + bubblePatch + wrappedTextDialog
      templateString/      # template-string field: parser, modal, bridge, types
    hooks/                 # React hooks bridging Blockly ↔ React/store
      index.ts
      useBlocklyWorkspace.ts   # ← SPLIT: thin composition of the focused hooks below
      useBlocklyInit.ts        # ← NEW: workspace + catalog bootstrap (init effect)
      useBlocklyStoreSync.ts   # ← NEW: debounced store↔workspace sync effect
      useBlocklyResize.ts      # ← NEW: resize + toolbox refresh effect
      # existing focused hooks kept as-is, composed by useBlocklyWorkspace:
      useWorkspaceInit.ts useModelSync.ts useToolboxRefresh.ts
      useCanvasState.ts useWorkspaceFileSwitch.ts
    serialization/         # workspace ↔ model conversion — the round-trip core
      index.ts             # public surface (signatures unchanged by refactor)
      serialize/           # workspace → model — orchestrator + per-responsibility nested modules
        index.ts                       # barrel: re-exports each nested module below
        workspaceToModel.ts            # orchestrator only (stays at the serialize/ root)
        reader/                        # READ a Blockly statement chain into model steps
          index.ts
          stepChainReader.ts           # (was readStepChain): walk a statement chain into steps
        writer/                        # WRITE blocks → steps / policies / preconditions
          index.ts
          blockToStepSerializer.ts     # (was blockToStep): one block + catalog → step
          policySerializers.ts         # policy + constraint-chain serialization
          preconditionSerializers.ts   # precondition policy block serialization
          utilityStepSerializers.ts    # utility step serialization (export/wait/function)
        validation/                    # FLATTEN validate blocks + pre-serialize guards
          index.ts
          validateBlockFlattener.ts    # (was flattenValidate): flatten validate blocks → steps
          validationHelpers.ts         # inline-validation + filter-expression read guards
      populate/            # model → workspace (other direction) — nested sub-modules (Phase 5)
        index.ts
        modelToWorkspace.ts          # top-level orchestrator (stays at populate/ root)
        populateTest.ts              # ← SPLIT (Phase 4): loops params, dispatches to registry
        paramPopulators/             # ← NEW: one populator per param type (data-driven, no switch)
          index.ts                   #   re-exports the registry below
          paramPopulatorRegistry.ts  #   ← NEW: Record<ParamType, ParamPopulator>
          dropdownParamPopulator.ts variableParamPopulator.ts textParamPopulator.ts
          numberParamPopulator.ts jsonParamPopulator.ts arrayParamPopulator.ts
          stepsParamPopulator.ts filterExpressionParamPopulator.ts
          jsonPathParamPopulator.ts apiPathParamPopulator.ts   # one file per ParamType
        assertions/                  # ← SPLIT (Phase 5): assertion population, grouping, normalization
          index.ts
          assertionPopulators.ts     #   ← RENAME (was populateAssertions.ts)
          assertionGrouping.ts assertionNormalization.ts
        populateFilterExpressions.ts # filter-expression population (single-responsibility leaf — NOT a folder-module per §2.4 guardrail)
        stepOutputTracker.ts         # step-output identity tracking (shared leaf — NOT a folder-module per §2.4 guardrail)
      helpers/             # ← RENAME folder → serializationParts/ ; the ONLY serialization-helpers home
        index.ts
        assertionChainBuilders.ts    # ← RENAME (was assertions.ts): assertion-chain builders
        blockFieldAccessors.ts       # ← RENAME (was blockUtils.ts): low-level field/connection access
        structuralBlockBuilders.ts   # ← RENAME (was structuralBlocks.ts): flow/container builders
        valueBlockBuilders.ts        # ← RENAME (was valueBlocks.ts): value/literal block builders
        workspaceBlockFactory.ts     # ← NEW: block-instance creation (absorbs flat helpers.ts)
      paramNormalizers.ts varSyntax.ts assertionChain.ts
      deferredDropdowns.ts unsupportedStepPayload.ts
      # serialization/helpers.ts ← DELETE (flat grab-bag dissolved into serializationParts/)
    sync/                  # live workspace event wiring (selection, phase rules, listeners)
      blockSelection.ts phaseEnforcement.ts workspaceListeners.ts
    toolbox/               # builds the Blockly toolbox dynamically from the catalog
      toolboxBuilder.ts toolboxConfig.ts phaseConfig.ts connectorCategory.ts
    ui/                    # block-editor-local panels (validation, warnings)
      ValidationPanel.tsx WarningTooltip.tsx

  environment-editor/      # SUT environment + variables editor (form-driven)
    EnvironmentEditor.tsx index.ts yamlPreview.ts
    services/              # ← SPLIT: ServicesSection + Internal/External/ServiceCard
    variables/             # ← SPLIT: VariablesSection + VariableRow
    preview/               # ← SPLIT: YamlPreviewSection + yamlPreview wiring
    shared/                # ← SPLIT: FieldWithToggle (reused by both sections)

  tck-dashboard/           # TCK overview: metadata, pipeline, data-flow graph
    TckDashboard.tsx MetadataSection.tsx index.ts
    forms/                 # metadata + chip form fields
    pipeline/              # pipeline table + summary widgets
    dataflow/              # React-Flow data-flow graph (nodes, edges, layout, panels)
      graph/               # ← SPLIT: canvas, nodes, edges, layout, react-flow adapter
      panels/              # ← SPLIT: node-detail, graph-info, metadata, variables panels
      builder/             # ← SPLIT: dataFlowBuilder + flowDataToReactFlow + types/constants

  yaml-editor/             # Monaco-based YAML/schema/testdata editors — split by concern (Phase 13)
    index.ts monacoSetup.ts
    editors/               # ← SPLIT: one module per editor surface
      MonacoEditor.tsx SchemaEditor.tsx TestdataEditor.tsx
      testdataEditorTransforms.ts   # ← RENAME (was TestdataEditorHelpers.ts): testdata shape transforms
    VariablePicker/        # @variable insertion popover + scope resolution hook

  preconditions/           # precondition rule editor — split by concern (Phase 11)
    PreconditionsPanel.tsx index.ts
    modal/                 # ← SPLIT: AddPreconditionModal + modal-local pieces
    list/                  # ← SPLIT: PreconditionsList + PreconditionEditor
    rules/                 # ← SPLIT: RuleSection + ConstraintRow + templatePolicies

  project-explorer/        # left-hand file/test tree — split by concern (Phase 12)
    ProjectExplorer.tsx index.ts
    tree/                  # ← SPLIT: TreeRow + ExplorerHeader + useTestDragReorder
    contextMenu/           # ← SPLIT: ExplorerContextMenu + ExplorerContextMenuParts
      explorerContextMenu.types.ts   # ← RENAME (was explorerContextMenuTypes.ts)
    actions/               # ← SPLIT: ExplorerActions (create/rename/delete triggers)

  execution/               # live run view (steps + flow) driven by execution store
    ExecutionPanel.tsx StepCard.tsx StepFlowView.tsx index.ts
  graph-view/              # dependency graph view (nodes + layout engine)
    DependencyGraph.tsx nodeTypes.tsx layoutEngine.ts index.ts
  sequence-view/           # sequence diagram view
    SequenceDiagram.tsx index.ts
  export/                  # export-to-file dialog
    ExportDialog.tsx ExportDialogParts.tsx index.ts
```
Responsibility: each feature folder owns its components, local hooks, and local
helpers. Features talk to each other **only** through `store/`. The feature barrel
`index.ts` is the single import surface; deep nested modules (`blocks/registration/…`,
`serialization/serialize/…`) expose themselves to the rest of the feature via
their own module barrel, never to other features.

### 2e. `store/` — Zustand state slices

```
store/
  index.ts                 # barrel — the ONLY path features may import (@/store)
  store.types.ts           # ← RENAME (was types.ts): shared cross-slice store types
  project/                 # project/test document state + thin actions (I/O ← MOVE to services)
    useProjectStore.ts     #   state + actions; delegates persistence/import to services/project
    projectAssetActions.ts projectTestActions.ts   # action slices
    # projectFilePersistence/projectImportExport/exampleProjectLoader/
    # projectImportTransforms/projectExportTransforms/projectDocumentParser
    #   ← MOVE to services/project (pure I/O has no place in a store)
  editor/                  # active-editor/tab state
  environment/             # SUT environment + service registry state
  execution/               # live-run state + SSE transport (api, stream, event handlers, conn mgr)
  compile/                 # compile request state + compile API client
  notifications/           # transient notification queue
  ui/                      # misc UI flags (panel sizes, toggles)
  selectors/               # derived/aggregated read models over the slices (no mutation) — split by concern (Phase 15)
    index.ts               #   barrel
    # selectors.ts ← SPLIT into per-domain selector modules (tck/test/variable read models)
    # helpers.ts   ← RENAME to a descriptive selector-builder module (banned generic name)
```
Responsibility: hold mutable state and expose actions. May import `services/` and
`models/`. After Phase 16, contains **no** pure file I/O. Each slice folder has its
own `index.ts`; the top-level `store/index.ts` re-exports the public hooks +
selectors so features never deep-import a slice file.

### 2f. `services/` — pure, framework-free logic

```
services/
  index.ts                 # barrel
  yaml/                    # model ↔ YAML (frozen v2 contract)
    yamlFieldMap.ts        # ← NEW (was fieldMap.ts): single source of truth for field mapping
    modelToYaml.ts         #   forward serialize — consumes yamlFieldMap
    yamlToModel.ts         #   reverse parse — consumes yamlFieldMap
    yamlLineMap.ts         #   line-number mapping for editor decorations
  project/                 # ← NEW: pure project I/O moved out of store/project
    index.ts
    projectFilePersistence.ts    # ← RENAME (was persistence.ts): localStorage load/save
    projectImportExport.ts       # ← RENAME (was projectIO.ts): import/export I/O
    exampleProjectLoader.ts      # ← RENAME (was importExample.ts): bundled-example fetch
    projectImportTransforms.ts   # ← RENAME (was importHelpers.ts): import shape transforms
    projectExportTransforms.ts   # ← RENAME (was projectIOHelpers.ts): export shape transforms
    projectDocumentParser.ts     # ← RENAME (was documentLoader.ts): document parse/load
  graph/                   # model → dependency-graph transform
    modelToGraph.ts
    dependencyGraphNodeBuilders.ts   # ← RENAME (was graphHelpers.ts): node/edge builders
  sequence/                # model → sequence-diagram transform
    modelToSequence.ts
  validation/              # schema/model validation
    validator.ts
```
Responsibility: deterministic transforms and I/O. Imports `models/` only. Never
imports React or `store/`. Each domain module has its own barrel; tests live
beside their target (`*.test.ts`).

### 2g. `models/`, `shared/`, `__tests__/` — leaf + cross-cutting layers

```
models/                    # leaf schema layer — imports nothing internal
  index.ts schemaFactories.ts environment.ts execution.ts
  schema/                  # ← SPLIT (Phase 14): schema.ts decomposed by concern
    index.ts               #   barrel — re-exports the public schema types
    testSchema.ts          #   test/step/param core types
    phaseSchema.ts         #   phase + ordering types
    assertionSchema.ts     #   assertion/validation types

shared/                    # cross-cutting reuse with NO domain knowledge
  ui/                      # generic dialogs/components, one folder per component + barrel
    AppErrorBoundary/ ConfirmDialog/ PreconditionsDialog/ SchemaDownloadDialog/
    ServiceDialog/ VariableEditorDialog/
  hooks/                   # generic reusable hooks (resizable panel, pipeline layout)
  theme/                   # Tractus-X MUI theme (TS theme object — NOT SCSS)
  types/                   # ambient declarations (e.g. blockly-internals.d.ts)
  # styles/ ← does NOT live here; ALL SCSS lives in assets/styles/ (see §2.1)

__tests__/                 # cross-cutting unit tests, grouped by the layer they target
  models/ store/ utils/
```
Responsibility: `models/` is the dependency sink (no internal imports). `shared/`
holds only generic, domain-agnostic building blocks — anything that "knows" about
TCKs, steps, or YAML belongs in a feature or service, not here. **SCSS does not
live under `shared/` — it is consolidated under `assets/styles/` (§2.1)**, the
single source of styling. This supersedes the earlier `shared/styles/` idea so
there is exactly one place to look for any token, mixin, or theme rule.

### 2.1. `assets/styles/` — the single SCSS source tree

**Rule:** there is **one** styling root — `ide/src/assets/styles/` — and it is
SCSS-only (no plain `.css` as a *shared* source). Every shared token, mixin,
reset, layout rule, feature stylesheet, and the Blockly theme lives here, wired
together with `@use` / `@forward` (never `@import`, which is deprecated and
double-emits). Requires the `sass` dev dependency.

```
assets/
  styles/
    main.scss              # composition root: @use abstracts; @forward base/layout/... — the ONE entry imported by app/main.tsx
    abstracts/             # NO CSS OUTPUT — variables, maps, mixins, functions only
      _designTokens.scss   #   color/spacing/radius/z-index/typography tokens (Sass maps)
      _mixins.scss         #   reusable mixins (focusRing, panelSurface, scrollbar, truncate)
      _functions.scss      #   pure Sass functions (token getters, rem(), clampScale())
      _placeholders.scss   #   %card, %dialogShell, %toolbarRow — shared via @extend
      _index.scss          #   @forward all of the above; consumed via `@use "abstracts" as *`
    base/                  # global resets + element defaults — emits once, app-wide
      _reset.scss _typography.scss _globals.scss _index.scss
    layout/                # app shell chrome styling (topbar, panels, bottom-panel, status, welcome)
      _topbar.scss _editorPanels.scss _bottomPanel.scss _statusBar.scss _welcomeScreen.scss _index.scss
    features/              # one stylesheet per feature — mirrors features/<name>
      _blockEditor.scss _environmentEditor.scss _tckDashboard.scss _yamlEditor.scss
      _preconditions.scss _projectExplorer.scss _execution.scss _graphView.scss
      _sequenceView.scss _export.scss _index.scss
    components/            # shared/ui component styles (one per shared component)
      _confirmDialog.scss _serviceDialog.scss _variableEditorDialog.scss
      _appErrorBoundary.scss _preconditionsDialog.scss _index.scss
    themes/                # color tokens + the Blockly workspace theme (build-time)
      _blocklyTheme.scss   #   block/category colors, flyout, toolbox styling
      _txColorTokens.scss  #   Tractus-X brand color tokens (CSS custom props for runtime theming)
      _index.scss
```

Responsibilities (one line each):
- **abstracts/** — design tokens, mixins, functions, placeholders. **Produces zero
  CSS**; only definitions consumed elsewhere via `@use "abstracts" as *`.
- **base/** — resets, typography, global element defaults. Emitted exactly once.
- **layout/** — styling for the app shell (`layout/` components only).
- **features/** — one `_<feature>.scss` per feature, mirroring `features/<name>`.
- **components/** — styling for generic `shared/ui/` components.
- **themes/** — Blockly workspace theme + Tractus-X color tokens (runtime `--tx-*`
  custom properties stay here; build-time reuse stays SCSS).
- **main.scss** — the **only** stylesheet `app/main.tsx` imports; it forwards the
  rest in cascade order: `abstracts → base → themes → layout → components → features`.

**Component-scoped styling decision (pick ONE — this plan picks centralized):**
This plan uses the **centralized** model: every stylesheet lives under
`assets/styles/` (above), and components reference shared classes/tokens — there
are **no** co-located `*.module.scss` files. Rationale: the IDE's current styling
is already a flat set of 66 component `.css` files with heavy cross-component
token reuse (colors, spacing, panel surfaces); centralizing makes the cascade
order explicit, lets `abstracts/` be the single token source, and removes the
duplication that scattered files invite. (CSS-Modules would re-scatter styling and
fight the existing global `--tx-*` theming.) Shared tokens/mixins **always** come
from `assets/styles/abstracts/` via `@use` — never copied.

---

## 3. Module / Responsibility Map

| Module | Single responsibility | Moves IN | Moves OUT |
|--------|-----------------------|----------|-----------|
| `serialize/workspaceToModel.ts` | Orchestrate workspace→model conversion | — | `readStepChain`, `flattenValidate`, `blockToStep` extracted to siblings |
| `serialize/stepChainReader.ts` | Walk a Blockly statement chain into steps | `readStepChain` | — |
| `serialize/validateBlockFlattener.ts` | Flatten validate blocks into step records | `flattenValidateToSteps` | — |
| `serialize/blockToStepSerializer.ts` | Convert one block + catalog → step definition | `blockToStep` | — |
| `populate/populateTest.ts` | Loop params, dispatch to populator registry | — | the 13-arm `switch` body |
| `populate/paramPopulators/*ParamPopulator.ts` | One param-type → workspace population each | switch arms (one file per type) | — |
| `populate/paramPopulators/paramPopulatorRegistry.ts` | `Record<ParamType, ParamPopulator>` registry | dispatch table | — |
| `populate/assertions/` | The one real multi-file populate seam: assertion population, grouping, normalization | flat `populate*`/`assertion*` files | — |
| `fields/wrappedText/` | The wrapped-text Blockly field (class + patch + dialog) | `FieldWrappedText`, `bubblePatch`, `wrappedTextDialog` | — |
| `blocks/common/catalog/{loader,variables}/` | Catalog fetch/parse vs. variable collection (two modules) | `catalogLoader`; `variableCollection`+`typedVariableCollection` | — |
| `environment-editor/{services,variables,preview,shared}/` | One module per editor section + shared field | flat section components | — |
| `tck-dashboard/dataflow/{graph,panels,builder}/` | Graph render vs. detail panels vs. data builders | flat dataflow files | — |
| `preconditions/{modal,list,rules}/` | Precondition modal vs. list/editor vs. rule sections | flat precondition components | — |
| `project-explorer/{tree,contextMenu,actions}/` | Tree render vs. context menu vs. file actions | flat explorer components | — |
| `yaml-editor/editors/` | The three editor surfaces (Monaco/Schema/Testdata) + transforms | flat editor components | — |
| `models/schema/` | Schema types split by concern (test/phase/assertion) | `schema.ts` | — |
| `store/selectors/*` | Per-domain derived read models | split `selectors.ts` | — |
| `serialization/serializationParts/` (barrel) | All serialization helpers, one folder, descriptive names | contents of flat `helpers.ts` | — |
| `serializationParts/workspaceBlockFactory.ts` | Create Blockly block instances during populate | block-creation helpers | — |
| `serializationParts/valueBlockBuilders.ts` | Build value/literal/variable-ref blocks | value helpers | — |
| `serializationParts/blockFieldAccessors.ts` | Low-level field/connection read/write | block-access helpers | — |
| `hooks/useBlocklyInit.ts` | Bootstrap workspace + load catalog | init `useEffect` | — |
| `hooks/useBlocklyStoreSync.ts` | Debounced store↔workspace sync | sync `useEffect` + refs | — |
| `hooks/useBlocklyResize.ts` | Resize + toolbox refresh | resize `useEffect` | — |
| `hooks/useBlocklyWorkspace.ts` | Compose the three hooks, expose same API | — | three effect bodies |
| `services/project/*` | Pure project I/O (load/save/import/export) | `projectFilePersistence`, `projectImportExport`, `exampleProjectLoader`, `projectImportTransforms`, `projectExportTransforms`, `projectDocumentParser` | — |
| `store/project/useProjectStore.ts` | Project state + actions, delegate I/O | — | pure I/O files |
| `services/yaml/yamlFieldMap.ts` | Single field-mapping source of truth | shared field map | duplicated mapping in both directions |
| `services/yaml/modelToYaml.ts` | Forward serialize using `yamlFieldMap` | — | inline field knowledge |
| `services/yaml/yamlToModel.ts` | Reverse parse using `yamlFieldMap` | — | inline field knowledge |
| `assets/styles/abstracts/` | Tokens/mixins/functions/placeholders — zero CSS output | shared values from all `.css` files | duplication across 66 stylesheets |
| `assets/styles/main.scss` | Single SCSS entry, cascade-ordered `@use`/`@forward` | every component stylesheet | scattered per-component `.css` |

---

## 4. Migration Phases (ordered, leaf-first)

Order is **leaf-first**: delete dead code, then split leaves with no dependents,
then modules with internal dependents, then the contract-touching mapping last.
Each phase is independently shippable and verified green.

### Phase 0 — Delete dead `components/BlockEditor/` tree
- **Scope:** remove `src/components/BlockEditor/**` (7 files). Confirm
  `src/components/YamlEditor/` is also dead before removing; if live, leave it.
- **Why first:** removes the two largest files and eliminates duplicate-helper
  confusion before any helper work begins.
- **Import-chain impact:** none expected (verified zero external importers). The
  type checker is the safety net.

### Phase 1 — Split `serialize/workspaceToModel.ts`
- **Scope:** extract `stepChainReader`, `validateBlockFlattener`, `blockToStepSerializer`
  into sibling files; `workspaceToModel.ts` becomes the orchestrator. Update
  `serialize/index.ts` barrel.
- **Why this order:** these are pure functions with the serialization folder as
  their only consumer — a self-contained leaf.
- **Import-chain impact:** internal to `serialization/serialize/`. The public
  barrel export `workspaceToModel` is unchanged, so external callers are unaffected.

### Phase 2 — Split `hooks/useBlocklyWorkspace.ts`
- **Scope:** extract `useBlocklyInit`, `useBlocklyStoreSync`, `useBlocklyResize`;
  `useBlocklyWorkspace` composes them and returns the identical shape.
- **Why this order:** the hook is consumed only by `BlocklyWorkspace.tsx`; keeping
  the composed hook's signature identical means one consumer, zero ripple.
- **Import-chain impact:** confined to `block-editor/hooks/`. Public return type
  unchanged.

### Phase 3 — Dissolve flat `serialization/helpers.ts` into `serializationParts/`
- **Scope:** rename the existing `helpers/` folder to `serializationParts/` with
  descriptive file names (`assertionChainBuilders.ts`, `blockFieldAccessors.ts`,
  `structuralBlockBuilders.ts`, `valueBlockBuilders.ts`); move the grab-bag
  contents of the flat `helpers.ts` into `workspaceBlockFactory.ts` (and the
  matching descriptive files); delete the flat file; make
  `serializationParts/index.ts` the single barrel.
- **Why this order:** after Phase 1, `serialize/` already imports from the helpers
  folder; consolidating now gives one import surface for Phase 4.
- **Import-chain impact:** importers move from `../helpers` to `../serializationParts`
  via the barrel; verify no importer reached into `helpers.ts` by full filename.

### Phase 4 — Decompose `populate/populateTest.ts` switch
- **Scope:** replace the 13-arm `switch (p.type)` with a data-driven
  `paramPopulators/` folder: one `<type>ParamPopulator.ts` file per param type plus
  `paramPopulatorRegistry.ts` (`Record<ParamType, ParamPopulator>`); `populateTest.ts`
  loops params and dispatches via the registry.
- **Why this order:** depends on the consolidated `helpers/` from Phase 3; turning
  the switch into a registry is the anti-hardcoding payoff.
- **Import-chain impact:** internal to `populate/`. `populate/index.ts` keeps
  exporting `populateTest`. New `ParamType` values plug in by adding a file +
  registry entry — no switch edit.

### Phase 5 — Modularize `serialization/populate/` into nested sub-modules
- **Scope:** group the only **real multi-file seam** in the flat `populate/` folder
  into a module: `assertions/` (`assertionPopulators` ← `populateAssertions`,
  `assertionGrouping`, `assertionNormalization`) with its own barrel.
  `populateFilterExpressions.ts` (one function) and `stepOutputTracker.ts` (shared
  leaf) **remain single-responsibility files at the `populate/` root** —
  wrapping each in its own folder would be a banned single-file module (§2.4
  guardrail). `modelToWorkspace.ts` + `populateTest.ts` stay at the root as
  orchestrators.
- **Why this order:** after Phase 4 the param-populator registry already lives
  under `populate/`; carving out the genuine assertion cluster now leaves one clean
  `populate/index.ts` surface without inventing depth where no seam exists.
- **Import-chain impact:** internal to `populate/`; the barrel keeps exporting the
  same symbols (`populateAssertions` re-exported via `./assertions`). No file is
  oversized — this is a §0.1/§0.2 modularity split.

### Phase 6 — Modularize `block-editor/fields/` into per-field modules
- **Scope:** the flat `fields/` folder (§1h) becomes one module per field class:
  `wrappedText/` (`FieldWrappedText` ← at-limit 297 lines, `bubblePatch`,
  `wrappedTextDialog`) alongside the existing `templateString/`. `fields/index.ts`
  re-exports both module barrels.
- **Why this order:** `fields/` is consumed only inside `block-editor`; splitting
  the wrapped-text field also relieves the 297-line `FieldWrappedText.ts`.
- **Import-chain impact:** confined to `block-editor/fields/`; importers move to the
  `fields/` barrel. Custom-field registration behavior unchanged.
- **Reconciliation (executed):** the 5 wrapped-text importers were rerouted to the
  specific `fields/wrappedText/` module barrel rather than the umbrella `fields/`
  barrel — this honors the cross-module "direct relative path to the responsibility
  module" rule and avoids pulling the unrelated `templateString` surface into
  registration/config call sites. `fields/index.ts` still re-exports both module
  barrels for the `block-editor/index.ts` `export * from "./fields"` consumer.

### Phase 7 — Split `blocks/common/catalog/` by responsibility
- **Scope:** the `catalog/` module bundles two jobs (§1h): `loader/`
  (`catalogLoader.ts`, 284) for fetch/parse and `variables/` (`variableCollection`
  280 + `typedVariableCollection`) for variable collection. Split into the two
  sub-modules, each with a barrel; `catalog/index.ts` re-exports both.
- **Why this order:** catalog loading is the data-driven source for every block;
  isolating loading from variable collection clarifies the data flow before later
  block-registration work.
- **Import-chain impact:** internal to `blocks/common/`; the `catalog/` barrel
  surface is unchanged. Also relieves two near-limit files.
- **Plan reconciliation (guardrail):** The plan specified both `loader/` and
  `variables/` sub-modules. Per the nesting policy guardrail, `loader/` would wrap a
  single file (`catalogLoader.ts`) in its own folder-module — a banned single-file
  module. Therefore `catalogLoader.ts` stays flat at the `catalog/` root, and only
  the real 2-file seam (`variableCollection` + `typedVariableCollection`) becomes
  the `variables/` module. The `catalog/index.ts` barrel re-exports both.

### Phase 8 — Remove dead root-level block duplicates
- **Scope:** delete `blocks/catalogBlocks.ts` (246) and `blocks/valueBlocks.ts`
  (277) — superseded duplicates of `blocks/registration/steps/catalogBlocks.ts` and
  `blocks/registration/values/valueBlocks.ts` (§1i). **Verify zero importers first.**
- **Why this order:** legacy removal (Charter Directive 4) — clears the largest
  remaining un-registration block files before block-area work elsewhere.
- **Import-chain impact:** none expected; `tsc` is the safety net. If any importer
  exists, repoint it to the `registration/` module and re-verify.

### Phase 9 — Modularize `features/environment-editor/` by section
- **Scope:** the flat folder (§1h) becomes section modules: `services/`
  (`ServicesSection`, `ServiceCard`, `InternalServiceCard`, `ExternalServiceCard`),
  `variables/` (`VariablesSection`, `VariableRow`), `preview/` (`YamlPreviewSection`
  + `yamlPreview`), `shared/` (`FieldWithToggle`, reused by both sections). Feature
  barrel `index.ts` unchanged.
- **Why this order:** self-contained feature; touches only its own folder.
- **Import-chain impact:** internal to the feature; external code still imports the
  `@/features/environment-editor` barrel only.

### Phase 10 — Modularize `features/tck-dashboard/dataflow/` by concern
- **Scope:** the 18-file flat folder (§1h) becomes `graph/` (canvas, nodes, edges,
  layout, React-Flow adapter), `panels/` (node-detail, graph-info, metadata,
  variables panels), `builder/` (`dataFlowBuilder`, `flowDataToReactFlow`, `types`,
  `constants`). Each gets a barrel; `dataflow/index.ts` re-exports them.
- **Why this order:** the single largest flat folder; isolated to one feature.
- **Import-chain impact:** internal to `tck-dashboard`; the feature barrel surface
  is unchanged. No file is oversized — a pure §0.2 split.

### Phase 11 — Modularize `features/preconditions/` by concern
- **Scope:** the flat folder (§1h) becomes `modal/` (`AddPreconditionModal`),
  `list/` (`PreconditionsList`, `PreconditionEditor`), `rules/` (`RuleSection`,
  `ConstraintRow`, `templatePolicies`); `PreconditionsPanel.tsx` stays at the root
  as the composition entry. Feature barrel unchanged.
- **Why this order:** self-contained feature; no cross-feature ripple.
- **Import-chain impact:** internal to the feature.

### Phase 12 — Modularize `features/project-explorer/` by concern
- **Scope:** the flat folder (§1h) becomes `tree/` (`TreeRow`, `ExplorerHeader`,
  `useTestDragReorder`), `contextMenu/` (`ExplorerContextMenu`,
  `ExplorerContextMenuParts`, `explorerContextMenu.types.ts`), `actions/`
  (`ExplorerActions`); `ProjectExplorer.tsx` stays as the composition entry.
- **Why this order:** self-contained feature; the drag/context-menu logic is the
  real seam.
- **Import-chain impact:** internal to the feature.

### Phase 13 — Modularize `features/yaml-editor/` by editor surface
- **Scope:** group the three editors under `editors/` (`MonacoEditor`,
  `SchemaEditor`, `TestdataEditor`, plus `testdataEditorTransforms` ←
  `TestdataEditorHelpers`); keep `VariablePicker/` and `monacoSetup.ts` as their own
  modules. Feature barrel unchanged.
- **Why this order:** self-contained feature; clarifies that three distinct editor
  surfaces share one feature.
- **Import-chain impact:** internal to the feature.

### Phase 14 — Decompose `models/schema.ts` into a `schema/` module
- **Scope:** split the 281-line `models/schema.ts` along concern seams into
  `models/schema/` (`testSchema`, `phaseSchema`, `assertionSchema`) with a barrel
  re-exporting the public types. `models/index.ts` keeps the same exported surface.
- **Why this order:** `models/` is the leaf layer — splitting it ripples nowhere as
  long as the barrel surface is identical. **Frozen-type caution:** type *names* and
  shapes are unchanged; only their file home moves.
- **Import-chain impact:** every `@/models` consumer is unaffected (barrel
  surface identical); `tsc` catches any deep import.

### Phase 15 — Modularize `store/selectors/` and tidy slice internals
- **Scope:** split `store/selectors/selectors.ts` into per-domain selector modules
  and rename the banned `store/selectors/helpers.ts` to a descriptive
  selector-builder module; confirm every slice folder (`project/`, `editor/`,
  `environment/`, `execution/`, `compile/`, `notifications/`, `ui/`) exposes its own
  barrel. No state shape or action signature changes.
- **Why this order:** store internals are consumed via the `@/store` barrel; tidying
  selectors here precedes the I/O move (Phase 16) that also touches `store/project/`.
- **Import-chain impact:** internal to `store/`; the `@/store` barrel surface is
  unchanged.

### Phase 16 — Move pure I/O to `services/project/`
- **Scope:** relocate the project I/O modules to `services/project/` with
  descriptive names (`projectFilePersistence`, `projectImportExport`,
  `exampleProjectLoader`, `projectImportTransforms`, `projectExportTransforms`,
  `projectDocumentParser`); `store/project/` actions import them from `@/services`.
- **Why this order:** respects the `store → services` rule in `ARCHITECTURE.md`;
  sequenced after the store tidy (Phase 15) so `store/project/` is touched once.
- **Import-chain impact:** `@/store/project/*` deep importers of these I/O files
  (if any) repoint to `@/services/project`. Store barrel and `useProjectStore`
  surface unchanged.

### Phase 17 — Centralize model↔YAML field mapping
- **Scope:** extract a single `services/yaml/yamlFieldMap.ts`; refactor
  `modelToYaml` and `yamlToModel` to consume it. **Contract-touching — see README
  lockstep rule.**
- **Why this order:** highest blast radius and the only phase touching a frozen
  cross-codebase contract (YAML v2). Done late, alone, with golden-file
  verification that emitted YAML is byte-identical before/after.
- **Import-chain impact:** internal to `services/yaml/`; public exports unchanged.
  Requires coordination/sign-off per the lockstep rule even though no byte changes.

### Phase 18 — Descriptive-name sweep (remaining generic file names)
- **Scope:** rename the generic/ambiguous file names not already covered by earlier
  phases so the tree matches the §2.0 convention: `store/types.ts →
  store.types.ts`, `bottom-panel/types.ts → bottomPanel.types.ts`,
  `block-editor/workspaceTypes.ts → blocklyWorkspace.types.ts`,
  `services/graph/graphHelpers.ts → dependencyGraphNodeBuilders.ts`, and any
  remaining `helpers.ts`/`utils.ts` survivors.
- **Why this order:** pure mechanical renames with no logic change; done after the
  structural splits so each renamed file already sits in its final module.
- **Import-chain impact:** rename + update every importer; barrels re-export under
  the new name. The type checker catches any missed reference.

### Phase 19 — Consolidate all styling into SCSS under `assets/styles/`
- **Scope:** the styling migration described in §2.1. Steps:
  1. **Inventory** the 66 scattered `.css` files (see §1g) and group each by its
     target bucket (abstracts/base/layout/features/components/themes).
  2. **Add the `sass` dev dependency** and create the `assets/styles/` tree with
     `_index.scss` barrels and `main.scss` as the single entry.
  3. **Extract shared values** (colors, spacing, radii, z-index, panel surfaces,
     scrollbars) into `abstracts/_designTokens.scss` + `_mixins.scss` —
     de-duplicating the values currently repeated across component `.css` files.
  4. **Move** each component's CSS into its bucket stylesheet, converting to SCSS
     and replacing duplicated values with `@use "abstracts" as *` token/mixin refs.
  5. **Rewire imports:** components stop importing their own `.css`; `app/main.tsx`
     imports only `assets/styles/main.scss`. Use `@use`/`@forward` everywhere —
     **no `@import`**.
  6. **Delete** the old per-component `.css` files.
- **Why this order:** independent of the TS structural phases; done late so style
  churn doesn't collide with file moves. Touches no TS logic and no contract.
- **Import-chain impact:** removes ~66 `import './X.css'` statements; adds one
  `import '@/assets/styles/main.scss'` in `main.tsx`. Visual output must be
  unchanged (computed styles identical) — verify in the browser.
- **Acceptance:** no `.css` file remains under `ide/src/` except generated/vendor;
  no SCSS uses `@import`; `vite build` emits one CSS bundle; the app renders
  pixel-identical to pre-migration.

### Phase 20 — Enforce barrels, feature→store mediation, naming + styles
- **Scope:** add an ESLint `no-restricted-imports` (or equivalent) guard: features
  import store only via `@/store`; no feature→feature imports; optionally migrate
  the deep `@/store/*` imports to the barrel. Add lint/CI checks that **ban the
  generic file names** from §2.0 and **reject stray style files** outside
  `assets/styles/`.
- **Why last:** a guardrail that locks in the deeply-modular structure achieved by
  Phases 0–19.
- **Import-chain impact:** mechanical import-path rewrites; no runtime change.

---

## 5. Risks

| Phase | Blast radius | Contract touch point | Mitigation |
|-------|-------------|----------------------|------------|
| 0 | Very low — dead code | None | Verify zero importers (done); rely on `tsc`. Double-check `YamlEditor` liveness first. |
| 1 | Low — internal to `serialize/` | None (internal to serialization, not the YAML contract) | Barrel export unchanged; run serialization tests. |
| 2 | Low — one consumer (`BlocklyWorkspace.tsx`) | None | Keep composed hook signature identical; manual smoke of block editor. |
| 3 | Low–medium — many helpers importers | None | Barrel path moves `../helpers → ../serializationParts`; grep for filename-specific imports of `helpers.ts`. |
| 4 | Medium — populate path is core to model→workspace | None directly, but feeds the serialization round-trip | Registry must cover **all** existing param types; round-trip tests (model→workspace→model) must stay green. |
| 5 | Low — internal to `populate/` | None | Pure folder reorg; barrel keeps same exports; round-trip tests green. |
| 6 | Low — internal to `fields/` | None | One consumer (block-editor); smoke wrapped-text + template-string fields in browser. |
| 7 | Low — internal to `blocks/common/` | **Block catalog schema** (consumer only) | Loader output unchanged; catalog barrel surface identical; verify blocks still load. |
| 8 | Very low — dead duplicates | None | Verify zero importers before delete; rely on `tsc`. |
| 9 | Low–medium — environment editor feature | **TCK env/services manifest** (consumer only) | Pure section reorg; smoke the env editor + YAML preview in browser. |
| 10 | Low–medium — dataflow view (18 files) | None | Pure reorg; smoke the data-flow graph render + panels in browser. |
| 11 | Low — preconditions feature | None | Pure reorg; smoke the precondition modal/list/rules in browser. |
| 12 | Low — project-explorer feature | None | Pure reorg; smoke tree render, context menu, drag-reorder in browser. |
| 13 | Low — yaml-editor feature | None | Pure reorg; smoke all three editors + variable picker in browser. |
| 14 | Low — leaf `models/` layer | **Frozen type names/shapes** | Barrel surface identical; only file homes move; `tsc` enforces no shape drift. |
| 15 | Low — store internals | None | Selector outputs unchanged; `@/store` barrel surface identical; selector tests green. |
| 16 | Medium — project load/save | **TCK env/services manifest** + project format (read by store) | Pure move, no logic change; persistence round-trip tests; verify localStorage keys unchanged. |
| 17 | **High** — both YAML directions | **YAML v2 syntax (FROZEN, lockstep)** | Golden-file diff: emitted YAML byte-identical; coordinate with `testlab-master`; ship alone. |
| 18 | Low — pure renames + import rewrites | None | Mechanical rename; `tsc` catches missed references; barrels re-export new names. |
| 19 | Medium — all styling | None (visual only, no TS/contract) | Convert CSS→SCSS without value changes; verify computed styles + pixel parity in browser; one CSS bundle. |
| 20 | Low — import rewrites + lint | None | Lint-only + mechanical; full `tsc`/`build` after. |

**Cross-codebase flags:** only **Phase 17** alters a frozen contract boundary
(YAML v2 / serialization↔YAML↔compiler chain) and therefore falls under the
lockstep rule. **Phases 7, 9, and 16** touch frozen-contract *consumers* (block
catalog schema, TCK env/services manifest) but must not change their shape.
**Phase 14** moves frozen type *homes* without changing names or shapes. **Phase 19**
changes only styling (no TS, no contract). All other phases are frontend-internal.

---

## 6. Acceptance Criteria

A phase is **done** only when all of the following hold (run from `ide/`):

1. **No file over 300 lines:**
   ```bash
   find ide/src \( -name '*.ts' -o -name '*.tsx' \) | xargs wc -l \
     | awk '$1 > 300 && !/total/'
   ```
   must print nothing.
2. **Types clean:** `cd ide && npx tsc --noEmit` succeeds with zero errors.
3. **Build clean:** `cd ide && npx vite build` succeeds.
4. **Tests green:** the existing IDE test suite passes unchanged — **no test
   assertion or fixture is modified** (structural-only proof).
5. **No new feature→feature imports:**
   ```bash
   grep -rn "from ['\"]@/features/" ide/src/features
   ```
   stays empty (currently empty; must remain so).
6. **Barrels intact:** every reorganized folder exposes an `index.ts`; external
   consumers import the barrel, not internal files. After Phase 20, the lint guard
   enforces this automatically.
7. **Behavior parity (Phases 16–17):** project persistence round-trips and emitted
   YAML are **byte-identical** to pre-refactor output (golden-file comparison).
8. **No generic file names (Phase 18+):** the banned names from §2.0 do not appear:
   ```bash
   find ide/src \( -name 'helpers.ts' -o -name 'utils.ts' -o -name 'misc.ts' \
     -o -name 'common.ts' -o -name '*2.ts' \) -not -name 'index.ts'
   ```
   must print nothing; every file name reads as a domain noun + role suffix.
9. **Single SCSS source (Phase 19+):** no stray style files exist outside the
   chosen home:
   ```bash
   find ide/src -name '*.css'                       # must print nothing
   find ide/src -name '*.scss' -not -path '*/assets/styles/*'   # must print nothing
   grep -rn "@import" ide/src/assets/styles          # must print nothing (use @use/@forward)
   ```
   `app/main.tsx` imports exactly one stylesheet (`@/assets/styles/main.scss`), and
   the rendered UI is pixel-identical to pre-migration (browser-verified).
