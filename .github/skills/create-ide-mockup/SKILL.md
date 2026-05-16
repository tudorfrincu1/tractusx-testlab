---
name: create-ide-mockup
description: "Create standalone HTML mockups to prototype and preview IDE UI features before implementation. Use when designing new components, validating layout and UX decisions, or sharing visual prototypes with stakeholders. Produces interactive, self-contained HTML files in ide/mockups/. Keywords: mockup, prototype, UI, visual, HTML, preview, design, block, component, layout, wireframe, interactive, UX."
---

# Create IDE Mockup

## What This Skill Produces

A standalone, interactive HTML mockup file that:
1. **Visualizes a proposed UI feature** — realistic layout, colors, typography matching the IDE theme
2. **Demonstrates interactions** — hover states, clicks, toggles, dropdowns, animations
3. **Uses realistic data** — actual block names, variable references, YAML snippets, not lorem ipsum
4. **Lives at** `ide/mockups/{feature}-mockup.html` — ready to open in any browser, zero dependencies

## When to Use

- **Before implementing a new UI feature** — validate the design cheaply before writing React code
- **When exploring layout alternatives** — build 2-3 variants quickly, pick the best
- **To share with stakeholders** — anyone can open the HTML file, no dev environment needed
- **For complex interactions** — test drag-and-drop, dropdowns, panel resizing, state transitions
- **When the UX is uncertain** — mockups are disposable; real components are not

## Workflow

### Phase 1: Understand the Requirement

1. **Clarify what is being mocked** — which component, panel, or feature?
2. **Identify the user flow** — what does the user do? What do they see at each step?
3. **Check existing mockups** in `ide/mockups/` — reuse patterns, color variables, and layout structures
4. **Check the real IDE** — read the relevant components in `ide/src/components/` to match existing visual language

### Phase 2: Design the Layout

1. **Sketch the structure** — header, main area, sidebars, panels, footers
2. **Define CSS custom properties** — reuse the IDE's dark theme palette:
   - Backgrounds: `#1a1a1a` (base), `#242424` (surface), `#2d2d2d` (elevated)
   - Text: `#e0e0e0` (primary), `#999` (muted), `#fff` (bright)
   - Accent: `#FFD700` (Tractus-X gold), `#89b4fa` (info blue), `#a6e3a1` (success green)
   - Borders: `#404040` (default), `#555` (hover)
3. **Plan responsive behavior** — mockups should work at different viewport widths
4. **Identify interactive elements** — buttons, toggles, dropdowns, expandable sections

### Phase 3: Build the HTML

1. **Start with the license header** — Apache-2.0 comment block + AI subtitle
2. **Single `<style>` block** — all CSS inline in `<head>`, using `:root` custom properties
3. **Semantic HTML structure** — use `<header>`, `<main>`, `<section>`, `<nav>` where appropriate
4. **Realistic content** — use actual TestLab terminology:
   - Block names: "Create an Asset", "Get Catalog", "Register AAS Shell"
   - Variables: `@asset_id`, `@contract_agreement_id`, `@shell_id`
   - Services: "Provider Connector", "Digital Twin Registry"
   - Categories: Mock, Flow, EDC Connector, Validation, etc.
5. **Single `<script>` block** — all JavaScript inline at the bottom of `<body>`

### Phase 4: Make It Interactive

1. **State management** — use plain JavaScript objects for mockup state
2. **Event listeners** — attach via `addEventListener`, not inline `onclick`
3. **Animations** — CSS transitions for hover/active states, `@keyframes` for progress indicators
4. **Dropdowns and menus** — implement open/close toggle with click-outside-to-close
5. **Visual feedback** — highlight active items, show selection state, animate transitions
6. **Simulation** — if mocking a process (e.g., test execution), add a "Run Simulation" button that steps through states with timers

### Phase 5: Place and Verify

1. **Save to** `ide/mockups/{feature}-mockup.html`
2. **Auto-open in browser** — immediately open the saved file in the user's browser using `open` on macOS (or VS Code browser tools as fallback) so the user can preview the result without manual steps
3. **Verify rendering** — confirm it renders correctly standalone
3. **Check responsiveness** — resize the browser window, ensure layout adapts
4. **Test all interactions** — click every button, open every dropdown, trigger every state
5. **Verify file size** — mockup HTML files are exempt from the 300-line source rule, but keep them focused

## Conventions

### File Naming
- Pattern: `{feature}-mockup.html`
- Examples: `api-path-block-mockup.html`, `dataflow-graph-mockup.html`, `metadata-editor-mockup.html`
- Use kebab-case, descriptive names

### File Structure
```html
<!-- Apache-2.0 license header -->
<!-- AI-generated code subtitle -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TestLab IDE — {Feature Name}</title>
  <style>
    :root { /* theme variables */ }
    /* all styles */
  </style>
</head>
<body>
  <!-- semantic HTML structure -->
  <script>
    // all interactivity
  </script>
</body>
</html>
```

### Required Elements
- **Title bar** — shows feature name, matches IDE header style
- **Description** — brief text explaining what the mockup demonstrates
- **Interactive controls** — at minimum, one clickable/toggleable element
- **Realistic data** — never use placeholder text like "Item 1", "Lorem ipsum"

### Theme Palette (Reference)
```css
:root {
  --bg: #1a1a1a;
  --bg-light: #242424;
  --bg-lighter: #2d2d2d;
  --surface: #2a2a2a;
  --text: #e0e0e0;
  --text-muted: #999;
  --text-bright: #fff;
  --border: #404040;
  --primary: #FFD700;        /* Tractus-X gold */
  --primary-dark: #B8860B;
  --passed: #22c55e;
  --failed: #ef4444;
  --info: #60a5fa;
  --input: #2dd4bf;
  --output: #3b82f6;
}
```

## Best Practices

- **Self-contained** — zero external dependencies (no CDN links, no Google Fonts, no frameworks)
- **System fonts** — use `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace** — use `'SF Mono', Monaco, Consolas, 'Courier New', monospace` for code/paths
- **Dark theme only** — the IDE is dark-themed; mockups must match
- **Accessible** — visible focus states, sufficient contrast, keyboard navigable where practical
- **Animations** — subtle and purposeful (150-300ms transitions), never distracting
- **Comments in JS** — brief section comments to explain simulation logic

## Common Pitfalls

| Pitfall | Why It Hurts | Fix |
|---------|-------------|-----|
| External CDN dependencies | Mockup breaks offline, adds load time | Inline everything |
| Light theme colors | Doesn't match the IDE, misleads reviewers | Use the dark palette from `:root` variables |
| Placeholder data | Stakeholders can't evaluate real UX | Use actual block names, variables, categories |
| No interactivity | Static screenshot would suffice — mockup adds no value | Add at least toggles, hovers, or state transitions |
| Overly complex JS | Mockup becomes a maintenance burden | Keep logic simple — this is throwaway prototype code |
| Missing license header | Non-compliant with Eclipse Foundation requirements | Always start with Apache-2.0 + AI subtitle |
| Forgetting `<meta viewport>` | Broken on tablets/smaller screens | Always include the responsive viewport meta tag |

## Completion Criteria

- [ ] File created at `ide/mockups/{feature}-mockup.html`
- [ ] Apache-2.0 license header and AI subtitle present
- [ ] Self-contained — opens correctly in a browser with no network requests
- [ ] Dark theme matching the IDE palette
- [ ] Realistic TestLab data (block names, variables, services)
- [ ] At least one interactive element functional
- [ ] Responsive at common viewport widths
- [ ] No external dependencies (fonts, CSS frameworks, JS libraries)
- [ ] Mockup was automatically opened in the user's browser for preview

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
