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

import * as Blockly from "blockly";

/** Tractus-X dark theme for the Blockly workspace. */
export function createTractusXTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme("tractusXDark", {
    name: "tractusXDark",
    base: Blockly.Themes.Classic,
    blockStyles: {
      logic_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
      loop_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
      math_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
      text_blocks: { colourPrimary: "#334155", colourSecondary: "#475569", colourTertiary: "#1E293B" },
      list_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
      variable_blocks: { colourPrimary: "#4338CA", colourSecondary: "#4F46E5", colourTertiary: "#3730A3" },
      procedure_blocks: { colourPrimary: "#1E40AF", colourSecondary: "#2563EB", colourTertiary: "#1E3A8A" },
    },
    categoryStyles: {
      logic_category: { colour: "#2D3748" },
      loop_category: { colour: "#2D3748" },
      math_category: { colour: "#2D3748" },
      text_category: { colour: "#334155" },
      list_category: { colour: "#2D3748" },
      variable_category: { colour: "#4338CA" },
      procedure_category: { colour: "#1E40AF" },
    },
    fontStyle: {
      family: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      weight: "500",
      size: 11,
    },
    componentStyles: {
      workspaceBackgroundColour: "#141414",
      toolboxBackgroundColour: "#1a1a1a",
      toolboxForegroundColour: "#9CA3AF",
      flyoutBackgroundColour: "#111111",
      flyoutForegroundColour: "#9CA3AF",
      flyoutOpacity: 0.98,
      scrollbarColour: "#333333",
      scrollbarOpacity: 0.3,
      insertionMarkerColour: "#FFD700",
      insertionMarkerOpacity: 0.35,
      cursorColour: "#FFD700",
    },
    startHats: true,
  });
}

/** Build Blockly.inject options with the given toolbox definition. */
export function createWorkspaceOptions(
  toolbox: Blockly.utils.toolbox.ToolboxDefinition,
): Blockly.BlocklyOptions {
  return {
    toolbox,
    trashcan: true,
    grid: { spacing: 20, length: 1, colour: "#2a2a2a", snap: true },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.85,
      maxScale: 2.5,
      minScale: 0.15,
    },
    move: { scrollbars: true, drag: true, wheel: true },
    renderer: "zelos",
    theme: createTractusXTheme(),
    sounds: false,
  };
}
