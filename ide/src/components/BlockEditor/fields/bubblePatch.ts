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

import * as Blockly from "blockly";

export interface WarningShowRequest {
  text: string;
  position: { x: number; y: number };
}

/**
 * SVG style that hides Blockly's native warning bubble while keeping
 * the warning icon visible and clickable.
 */
const BUBBLE_HIDE_STYLE = `
  .blocklyBubbleCanvas { display: none !important; }
`;

/**
 * Injects a <style> into the workspace SVG to hide native bubbles.
 */
export function injectBubbleStyles(workspaceSvg: SVGElement): void {
  if (workspaceSvg.querySelector("#testlab-bubble-style")) return;

  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.id = "testlab-bubble-style";
  styleEl.textContent = BUBBLE_HIDE_STYLE;
  workspaceSvg.insertBefore(styleEl, workspaceSvg.firstChild);
}

/**
 * Legacy no-op kept for backward compatibility with registerBlocks().
 */
export function patchBubbleColours(): void {
  // Intentionally empty — bubbles are now hidden; tooltip overlay replaces them.
}

/**
 * Sets up a document-level capture listener to intercept clicks on warning
 * icons before Blockly's own element-level handlers fire. Invokes
 * `onShowWarning` with the warning text and screen position.
 * Returns a cleanup function.
 */
export function setupWarningTooltip(
  workspace: Blockly.WorkspaceSvg,
  onShowWarning: (req: WarningShowRequest) => void,
): () => void {
  const svgEl = workspace.getParentSvg();
  if (!svgEl) return () => {};

  injectBubbleStyles(svgEl);

  function handlePointerDown(e: PointerEvent) {
    const target = e.target as Element | null;
    if (!target) return;

    // Check if click is inside the workspace SVG
    if (!svgEl.contains(target)) return;

    // Find nearest icon group ancestor
    const iconGroup = target.closest(".blocklyIconGroup") as SVGElement | null;
    if (!iconGroup) return;

    // Only handle warning icons specifically
    if (!iconGroup.classList.contains("blocklyWarningIcon")) return;

    // eslint-disable-next-line no-console
    console.debug("[WarningTooltip] icon clicked");

    // Traverse up to find block with data-id (more robust in SVG than .closest)
    let current: Element | null = iconGroup.parentElement;
    let blockId: string | null = null;
    while (current && current !== svgEl) {
      blockId = current.getAttribute("data-id");
      if (blockId) break;
      current = current.parentElement;
    }
    if (!blockId) {
      // eslint-disable-next-line no-console
      console.debug("[WarningTooltip] no blockId found");
      return;
    }

    const block = workspace.getBlockById(blockId);
    if (!block) {
      // eslint-disable-next-line no-console
      console.debug("[WarningTooltip] block not found for id:", blockId);
      return;
    }

    // eslint-disable-next-line no-console
    console.debug("[WarningTooltip] block found:", block.type);

    // Check if this block has a warning icon
    let warningText: string | undefined;
    try {
      const warningIcon = block.getIcon(Blockly.icons.WarningIcon.TYPE);
      // eslint-disable-next-line no-console
      console.debug("[WarningTooltip] warningIcon:", warningIcon);
      if (warningIcon) {
        warningText = (warningIcon as Blockly.icons.WarningIcon).getText();
      }
    } catch {
      // Fallback: try getWarningText if available
      warningText = (
        block as unknown as { warning?: { getText?: () => string } }
      ).warning?.getText?.();
    }

    // eslint-disable-next-line no-console
    console.debug("[WarningTooltip] warningText:", warningText);

    if (!warningText) return;

    // Position tooltip near the icon
    const rect = iconGroup.getBoundingClientRect();

    // Use setTimeout to escape Blockly's gesture system interference
    setTimeout(() => {
      onShowWarning({
        text: warningText,
        position: { x: rect.right + 8, y: rect.top - 4 },
      });
    }, 0);

    e.stopPropagation();
    e.preventDefault();
  }

  // Attach to document in capture phase — fires before any element-level handlers
  document.addEventListener("pointerdown", handlePointerDown, true);
  return () => document.removeEventListener("pointerdown", handlePointerDown, true);
}
