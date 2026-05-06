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
 * Professional dark color palette for Blockly blocks.
 * Uses desaturated, muted tones that work on a #1e1e1e workspace.
 */

export const blockColors = {
  /** Root / structural blocks */
  root: "#1E293B",
  rootTestCase: "#1E293B",

  /** Variable system */
  variableDef: "#312E81",
  variableGet: "#312E81",
  valueString: "#334155",
  valueAuto: "#78350F",
  storeOutput: "#312E81",

  /** Core block types */
  service: "#0F766E",
  assertion: "#9F1239",
  precondition: "#92400E",
  testRef: "#1E40AF",

  /** ODRL / Policy */
  odrlPermission: "#1E40AF",
  odrlConstraint: "#1E3A8A",
  odrlGroup: "#1E3A8A",

  /** Data blocks */
  json: "#374151",
  keyValue: "#374151",
  context: "#0E7490",

  /** Step category colors (catalog-driven) */
  categories: {
    Simulate: "#475569",
    Prepare: "#166534",
    Discover: "#9A3412",
    Exchange: "#6D28D9",
    "Digital Twins": "#1E40AF",
    Notifications: "#991B1B",
    Utility: "#475569",
  } as Record<string, string>,

  /** Phase colors */
  phaseSetup: "#166534",
  phaseSteps: "#1E40AF",
  phaseCleanup: "#9F1239",
} as const;

/** Get a category color for a catalog step block. Falls back to Utility. */
export function getCategoryColor(categoryName: string): string {
  return blockColors.categories[categoryName] ?? blockColors.categories.Utility;
}
