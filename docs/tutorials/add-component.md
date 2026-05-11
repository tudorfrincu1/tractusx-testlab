<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

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

# How to Add a New Component (IDE)

## Step 1 — Create the component folder

```bash
mkdir ide/src/components/MyComponent/
```

## Step 2 — Create the component file

Create `ide/src/components/MyComponent/MyComponent.tsx`:

```typescript
import { type FC } from "react";
import "./MyComponent.css";

export interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  const handleClick = () => {
    onAction?.();
  };

  return (
    <div className="my-component">
      <h3>{title}</h3>
      <button onClick={handleClick}>Do Thing</button>
    </div>
  );
};
```

## Step 3 — Create the CSS file

Create `ide/src/components/MyComponent/MyComponent.css`:

```css
.my-component {
  background: var(--surface, #2a2a2a);
  border: 1px solid var(--border, #404040);
  border-radius: 8px;
  padding: 16px;
}

.my-component h3 {
  color: var(--text, #e0e0e0);
  margin: 0 0 12px 0;
}
```

## Rules

- **Functional components only** — no class components (the sole exception is `BlockEditorErrorBoundary` which React requires to be a class)
- **Props interface co-located** — define and export `Props` in the same file
- **Plain CSS** — no CSS-in-JS, no MUI, no Ant Design
- **Event handlers**: `onXxx` for props, `handleXxx` for internal handlers
- **Max 300 lines per file** — split into sub-components if larger
- **No `any`** — use `unknown` + narrowing or proper generics
- **No `console.log`** — use structured error handling
