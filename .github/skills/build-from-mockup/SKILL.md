---
name: build-from-mockup
description: "Build production-ready IDE components from an HTML mockup file. The frontend agent translates mockup visuals into organized React components, hooks, and CSS. The backend agent identifies API contracts and open points needed to support the frontend. Use when a mockup exists in ide/mockups/ and needs to become real code. Keywords: mockup, implement, build, component, React, translate, UI, frontend, backend, API, contract, open points, organize."
---

# Build From Mockup

## What This Skill Produces

### Frontend (testlab-ide-master)
A set of production-ready React components that faithfully reproduce the mockup's visual design and interactions:
1. **Component tree** — organized hierarchy matching the mockup's visual sections
2. **Custom hooks** — extracted logic for state, data transforms, and event handling
3. **CSS files** — scoped styles that match the mockup's look and feel exactly
4. **Type definitions** — props interfaces and domain types for each component

### Backend (testlab-master)
A gap analysis document identifying what the backend must provide:
1. **API contracts** — endpoints, request/response shapes the frontend expects
2. **Data models** — Pydantic models needed to serve the frontend
3. **Missing services** — business logic not yet implemented
4. **Integration points** — where the backend connects to SDK, mock server, or external systems

## When to Use

- **After a mockup is approved** — the mockup in `ide/mockups/` has been reviewed and the design is locked
- **When translating design to code** — the visual is clear, now build it properly
- **When frontend and backend must align** — the mockup implies data needs that the backend must satisfy

## Workflow

### Phase 1: Analyze the Mockup

1. **Read the mockup HTML file** — understand every visual section, interactive element, and data displayed
2. **Identify visual zones** — header, sidebar panels, main content, modals, toolbars, status bars
3. **Catalog all data shown** — what text, lists, statuses, counts, labels appear? Where does this data come from?
4. **Catalog all interactions** — buttons, toggles, dropdowns, drag targets, expandable sections, navigation
5. **Map state transitions** — what changes when the user interacts? What states exist?

### Phase 2: Plan the Component Architecture (Frontend)

1. **Decompose into components** — one component per visual zone; never a monolithic component
2. **Name components clearly** — descriptive PascalCase names matching their visual role (e.g., `TestSuitePanel`, `StepCard`, `ExecutionToolbar`)
3. **Identify shared vs. unique components** — reuse existing components from `ide/src/components/` where they match
4. **Plan the file structure**:
   ```
   ide/src/components/{feature}/
   ├── {Feature}.tsx            ← top-level container
   ├── {Feature}.scss           ← scoped styles, @use shared/styles partials
   ├── {SubComponent}.tsx       ← one per visual zone
   ├── {SubComponent}.scss      ← scoped styles per sub-component
   ├── use{Feature}Logic.ts     ← custom hook for state/logic
   ├── types.ts                 ← props interfaces and domain types
   └── constants.ts             ← magic values extracted as named constants
   ```
5. **Define data flow** — which component owns state? Where do props flow down? Where do events bubble up?

### Phase 3: Identify Backend Requirements (Backend)

1. **List every piece of dynamic data** shown in the mockup — what must be fetched, computed, or stored?
2. **For each data piece, determine the source**:
   - Already exists in a Zustand store? → No backend work needed
   - Comes from an API call? → Define the endpoint contract
   - Needs computation/aggregation? → Define the service method
   - Needs persistence? → Define the model and storage
3. **Define API contracts** as TypeScript interfaces (request/response shapes)
4. **Identify missing Pydantic models** in `src/tractusx_testlab/models/`
5. **Identify missing service methods** in `src/tractusx_testlab/services/` or `src/tractusx_testlab/steps/`
6. **Flag SDK gaps** — does the mockup require SDK functionality that doesn't exist yet?
7. **Produce an open-points list** with priority (P0 = blocks frontend, P1 = needed for full feature, P2 = nice-to-have)

### Phase 4: Build the Components (Frontend)

1. **Start with types** — define all interfaces in `types.ts` before writing JSX
2. **Build bottom-up** — implement leaf components first (cards, badges, buttons), then containers
3. **Match the mockup pixel-for-pixel** where possible:
   - Same colors (use CSS custom properties from the IDE theme)
   - Same spacing (use consistent rem values)
   - Same typography (font sizes, weights, line heights)
   - Same border radii, shadows, transitions
4. **Extract all logic into hooks** — components should be pure renderers
5. **Wire interactions** — event handlers in hooks, not inline in JSX
6. **Use existing patterns** — check how similar components are built in `ide/src/components/`
7. **No hardcoded data** — use props or hook return values for all displayed content
8. **Accessible by default** — `aria-label`, `role`, keyboard handlers where applicable

### Phase 5: Style Faithfully (Frontend)

1. **Use SCSS files, not inline styles** — one `.scss` file per component, importing shared tokens/mixins via `@use "@/shared/styles" as *;`
2. **Reuse shared design tokens** — `--tx-*` CSS custom properties for theming and `shared/styles/` partials for mixins/placeholders; never hardcode a value that exists as a token
3. **Match the mockup's spacing system** — extract consistent gaps/padding
4. **Transitions from the mockup** — if the mockup has hover effects or animations, replicate them
5. **Responsive** — if the mockup shows responsive behavior, implement it with SCSS (media queries or flexbox)
6. **BEM-like naming** — `.feature__element--modifier` or scoped class names

### Phase 6: Connect and Verify

1. **Integrate into the IDE** — add the component to the appropriate parent/route
2. **Mock data initially** — if the backend isn't ready, use static mock data with the correct shape
3. **Verify visually** — compare the running component side-by-side with the mockup
4. **Verify interactions** — every button, toggle, dropdown from the mockup must work
5. **Run quality gates**:
   ```bash
   cd ide && npx tsc --noEmit    # Zero type errors
   cd ide && npx vite build      # Production build succeeds
   find ide/src -name '*.ts' -o -name '*.tsx' | xargs wc -l | awk '$1 > 300 && !/total/'  # No oversized files
   ```

## Component Organization Rules

| Rule | Rationale |
|------|-----------|
| One component per file | Single responsibility, easy to find |
| Max 150 lines per component file | Forces decomposition before hitting 300-line limit |
| Props interface in same file or `types.ts` | Co-location for simple, shared file for complex |
| Hook per feature, not per component | Avoids micro-hooks that fragment logic |
| CSS file per component | Scoped styles, no conflicts |
| Constants extracted | No magic strings in JSX or CSS |
| Index barrel export from feature folder | Clean imports from outside the feature |

## Backend Open Points Format

The backend agent produces a structured list:

```markdown
## Open Points for {Feature}

### P0 — Blocks Frontend (must implement first)
| # | What | Endpoint/Model | Current State | Notes |
|---|------|---------------|---------------|-------|
| 1 | ... | ... | Missing | ... |

### P1 — Required for Full Feature
| # | What | Endpoint/Model | Current State | Notes |
|---|------|---------------|---------------|-------|
| 1 | ... | ... | Partial | ... |

### P2 — Enhancement
| # | What | Endpoint/Model | Current State | Notes |
|---|------|---------------|---------------|-------|
| 1 | ... | ... | Missing | ... |

### Proposed API Contracts
\```typescript
interface GetFeatureDataRequest { ... }
interface GetFeatureDataResponse { ... }
\```

### Proposed Pydantic Models
\```python
class FeatureModel(BaseModel): ...
\```
```

## Delegation Pattern (for testlab-ai-master)

When using this skill, the orchestrator should:

1. **Send the mockup to both agents in parallel** (they analyze independently):
   - `testlab-ide-master`: "Analyze this mockup and plan the component architecture. Then build the components."
   - `testlab-master`: "Analyze this mockup and identify all backend open points the frontend will need."

2. **Review frontend delivery** against:
   - Does it visually match the mockup?
   - Is the component tree well-organized?
   - Are all interactions functional?
   - Quality gates pass?

3. **Review backend delivery** against:
   - Are all data needs identified?
   - Are API contracts clearly defined?
   - Are priorities (P0/P1/P2) sensible?
   - Does it reference existing code correctly?

4. **Integrate results** — share the backend open-points list with the human as the next work backlog.

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Building one giant component | Decompose: one file per visual zone |
| Ignoring the mockup's exact spacing | Measure and replicate precisely |
| Hardcoding data that should be props | Everything displayed = props or hook data |
| Frontend inventing API shapes | Backend defines contracts; frontend consumes |
| Skipping hover/active states | If the mockup has them, implement them |
| Over-abstracting prematurely | Build concrete first, abstract only when reuse is proven |
| Not checking existing components | Always scan `ide/src/components/` for reusable pieces |

## Completion Criteria

### Frontend
- [ ] All visual zones from mockup have corresponding components
- [ ] Component files under 150 lines each (300 max)
- [ ] CSS matches mockup colors, spacing, typography
- [ ] All interactions from mockup are functional
- [ ] Props interfaces defined for all components
- [ ] Logic extracted into custom hooks
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vite build` passes
- [ ] No hardcoded strings — constants extracted

### Backend
- [ ] All dynamic data in mockup identified
- [ ] API contracts defined with TypeScript interfaces
- [ ] Pydantic models proposed for new data
- [ ] Open points prioritized (P0/P1/P2)
- [ ] Existing code referenced where applicable
- [ ] SDK gaps flagged

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
