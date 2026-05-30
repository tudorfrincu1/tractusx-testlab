/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 Catena-X Automotive Network e.V.
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      // --- Architecture Guards (Phase 20) ---

      // Ban deep store imports from features/ and layout/ — use @/store barrel
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/store/*/*"],
            message: "Import from '@/store' barrel instead of deep paths like '@/store/editor/useEditorStore'.",
          },
          {
            group: ["@/features/*/*"],
            message: "Features must not import from other features' internals. Use the feature barrel or mediate through store.",
          },
        ],
      }],

      // Relax rules that conflict with the existing codebase style
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Allow store internals to import from sibling store modules
    files: ["src/store/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "public/"],
  },
);
