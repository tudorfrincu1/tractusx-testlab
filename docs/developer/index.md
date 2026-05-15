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

# Developer Handover — TestLab IDE

This documentation is a technical handover guide for the **TestLab IDE**, the browser-based visual test authoring tool for Eclipse Tractus-X dataspaces. It covers architecture, data flow, every source file, and the patterns used throughout the codebase so that a new developer can orient quickly and contribute confidently.

## Repository layout

The IDE lives under `ide/` in the monorepo. The Python library lives under `src/tractusx_testlab/`.

```
tractusx-testlab/
├── ide/                          ← Browser IDE (this documentation)
│   ├── public/                   ← Static assets & block catalog
│   │   ├── blocks/               ← Block definitions (one JSON per block)
│   │   │   ├── index.json        ← Catalog manifest
│   │   │   ├── edc-connector/    ← EDC block JSONs
│   │   │   ├── digital-twin-registry/
│   │   │   ├── discovery-finder/
│   │   │   ├── flow/
│   │   │   ├── function/
│   │   │   ├── http/
│   │   │   ├── mock/
│   │   │   ├── notification/
│   │   │   ├── validation/
│   │   │   └── wait/
│   │   ├── examples/             ← Bundled example projects
│   │   │   ├── certificate-management-v1.0/
│   │   │   ├── connector-ping-v1.0/
│   │   │   ├── dtr-ping-v1.0/
│   │   │   ├── industry-core-validation-v1.0/
│   │   │   ├── product-carbon-footprint-v1.0/
│   │   │   ├── special-characteristics-v1.0/
│   │   │   └── traceability-notification-v1.0/
│   │   └── templates/            ← Reusable step templates
│   │       └── index.json
│   ├── src/
│   │   ├── main.tsx              ← React entry point
│   │   ├── App.tsx               ← Root layout component
│   │   ├── components/           ← All UI components
│   │   ├── models/               ← TypeScript types & validation
│   │   ├── store/                ← Zustand state management
│   │   ├── sync/                 ← YAML ↔ Model ↔ Graph converters
│   │   └── theme/                ← Design tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
├── src/tractusx_testlab/         ← Python library (separate docs)
└── docs/developer/              ← You are here
```

## Quick start

```bash
cd ide
npm install
npm run dev          # http://localhost:5173
```

Build for production:

```bash
npm run build        # tsc --noEmit && vite build
npm run preview      # serve the production bundle locally
```

## Documentation structure

| Page | What it covers |
|------|----------------|
| [Product Scope](product-scope.md) | Mission, MVP scope boundaries, lifecycle, execution ordering, versioning, and validation model |
| [Architecture](architecture.md) | High-level architecture, data flow, sync loop |
| [State Management](state-management.md) | Zustand stores, persistence, file switching |
| [Block System](block-system.md) | Blockly integration, block catalog, registration, serialization |
| [Components](components.md) | Every React component, its purpose, props, and dependencies |
| [Data Models](data-models.md) | TypeScript types, validation rules, YAML schema |
| [Sync Layer](sync-layer.md) | YAML ↔ Model ↔ Graph conversion |
| [Block Lifecycle](block-lifecycle.md) | How a block maps from IDE → YAML → Python executor → SDK call |
| [Step-by-Step Tutorials](tutorials.md) | How-to guides: new blocks, steps, categories, assertions, templates, examples |

## Tech stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1 | UI framework |
| TypeScript | strict mode | Type safety |
| Vite | 6 | Build tool & dev server |
| Blockly | 12.5 | Visual block editor |
| Zustand | 5.0 | State management |
| Monaco Editor | 4.7 | YAML/JSON code editor |
| React Flow (@xyflow/react) | 12.10 | Graph visualization |
| MUI Icons | 9.0 | Icon set |
| js-yaml | 4.1 | YAML parsing/serialization |
| JSZip | 3.10 | ZIP import/export |
| Dagre | 3.0 | Graph layout algorithm |

## Key design principles

1. **Blocks are the primary editing surface.** The YAML editor is secondary and can be read-only.
2. **Model is the source of truth.** Blocks and YAML are both derived from a shared `TestLabDocument` model in Zustand.
3. **Steps are functions.** Every block has typed inputs and typed outputs. Outputs auto-appear as draggable variables.
4. **Auto-generate IDs.** Asset IDs, policy IDs, contract IDs are auto-generated UUIDs — never ask the user.
5. **Hide plumbing.** Connector addresses come from service config, not per-step fields.
6. **Defaults everywhere.** Blocks work with minimal input. Optional fields are behind expandable sections.
