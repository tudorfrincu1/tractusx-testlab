---
applyTo: "ide/**"
---

# TestLab IDE — TypeScript/React/Blockly Conventions

## Stack
- Vite 6 + React 19 + TypeScript + Blockly 12 + Zustand + Monaco Editor
- No MUI or heavy UI libraries — plain CSS + Blockly built-in styling

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
