/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
  rootTck: "#1E293B",

  /** Variable system */
  variableDef: "#5B21B6",
  variableGet: "#5B21B6",
  valueString: "#475569",
  valueJsonPath: "#0E7490",
  storeOutput: "#5B21B6",

  /** Core block types */
  assertion: "#BE123C",
  precondition: "#B45309",
  testRef: "#1D4ED8",

  /** Authentication blocks */
  authentication: "#7C3AED",

  /** Data blocks */
  json: "#374151",
  keyValue: "#374151",

  /** Step category colors (catalog-driven) — each category gets a unique hue */
  categories: {
    Mock: "#0F766E",
    Wait: "#A16207",
    Function: "#CA8A04",
    Flow: "#9333EA",
    "EDC Connector": "#2563EB",
    "EDC Connector (Saturn)": "#2563EB",
    "EDC Connector (Jupiter)": "#1D4ED8",
    "Digital Twin Registry": "#059669",
    "AAS Registry": "#059669",
    "Discovery Finder": "#D97706",
    "EDC Discovery": "#EA580C",
    "BPN Discovery": "#DC2626",
    HTTP: "#7C3AED",
  } as Record<string, string>,
} as const;

/** Get a category color for a catalog step block. Falls back to a neutral dark tone. */
export function getCategoryColor(categoryName: string): string {
  return blockColors.categories[categoryName] ?? "#374151";
}
