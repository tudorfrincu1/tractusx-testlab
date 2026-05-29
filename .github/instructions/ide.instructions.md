---
applyTo: "ide/**"
---

# TestLab IDE — TypeScript/React/Blockly Conventions

## Stack
- Vite 6 + React 19 + TypeScript + Blockly 12 + Zustand + Monaco Editor

## Block Definitions
- Block definitions live in `public/blocks/` — one JSON file per block, organized in category folders
- `blocks/index.json` is the manifest listing categories and their block file paths
- `blockDefinitions.ts` fetches the index at runtime and loads each block file in parallel — never hardcode block definitions
- Toolbox is built from catalog categories dynamically
- Category order: Mock → Wait → Function → Flow → EDC Connector → Digital Twin Registry → Discovery Finder → HTTP → Notification → Validation

## Variables
- `variable_ref` blocks are auto-generated when steps produce outputs — never manually defined
- All Blockly blocks use `param_value` output type for pluggable inputs

## Sync Flow
workspace change → `workspaceToModel()` → `modelToYaml()` → Zustand store → YAML preview

## Code Quality
- No `console.log` in committed code — use structured error handling
- TypeScript strict mode enabled
- Functional components only (no class components)
- **No file may exceed 300 lines** — split using component/hook/constant extraction
- **Write modular code from the start** — extract non-trivial logic into custom hooks (`useXxx`), pure transform functions, sub-components, and typed constant/type modules. Each file has one responsibility and a minimal export surface.
- **When splitting, create reusable units, not arbitrary fragments** — hooks for behavior, pure functions for data transforms, sub-components for UI sections. Shared logic goes in an importable module; never duplicate it.
- **No inline `style={{}}`** — use `.scss` files (Sass). Reusable tokens, mixins, and placeholders live in `shared/styles/` (`_variables.scss`, `_mixins.scss`, `_placeholders.scss`) and are consumed via `@use`. Keep runtime theming as `--tx-*` CSS custom properties; never duplicate a color/spacing/mixin across components
- **No `: any` or `as any`** — use `unknown` + type narrowing
- **No bare `catch {}` blocks** — always handle or log the error with context
