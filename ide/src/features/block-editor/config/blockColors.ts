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

/**
 * Professional color palette for Blockly blocks.
 * Each category gets a distinct hue for visual differentiation on dark backgrounds.
 */

export const blockColors = {
  /** Root / structural blocks */
  root: "#1E293B",

  /** Variable system */
  variableDef: "#5B21B6",
  variableGet: "#5B21B6",
  varSteps: "#4F46E5",
  varPreconditions: "#B45309",
  varEnv: "#059669",
  varServices: "#7C3AED",
  varMetadata: "#6B7280",
  varSetup: "#0F766E",
  varExecution: "#0369A1",
  varSchema: "#42a5f5",
  varTestdata: "#AB47BC",
  valueString: "#1E293B",
  valueRegex: "#7E22CE",
  valueJsonPath: "#0E7490",
  valueApiPath: "#1E40AF",
  valueList: "#1E40AF",
  listItem: "#1E3A5F",
  storeOutput: "#5B21B6",

  /** Core block types */
  assertion: "#BE123C",
  precondition: "#B45309",
  authentication: "#7C3AED",

  /** Data blocks */
  json: "#5f92e5",
  keyValue: "#0042ac",
  valueJson: "#92400E",

  /** Step category colors (catalog-driven) — each category gets a unique hue */
  categories: {
    Mock: "#0D9488",
    Wait: "#D97706",
    Utility: "#65A30D",
    Flow: "#7C3AED",
    Connector: "#2563EB",
    "Digital Twin Registry": "#059669",
    "Discovery Finder": "#EA580C",
    HTTP: "#4F46E5",
    Notification: "#E11D48",
    Validation: "#BE123C",
    Precondition: "#B45309",
    Cleanup: "#0F766E",
  } as Record<string, string>,
} as const;

/** Get a category color for a catalog step block. Falls back to a neutral dark tone. */
export function getCategoryColor(categoryName: string): string {
  return blockColors.categories[categoryName] ?? "#374151";
}
