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

/**
 * Custom warning icon that replaces the native Blockly WarningIcon.
 * Renders a clean amber circle with "!" and shows a styled HTML popup on click.
 */
export class CustomWarningIcon extends Blockly.icons.WarningIcon {
  private popupEl: HTMLDivElement | null = null;

  override initView(pointerdownListener: (e: PointerEvent) => void): void {
    if (this.svgRoot) return;
    super.initView(pointerdownListener);

    // Clear native icon content and draw custom SVG
    Blockly.utils.dom.removeChildren(this.svgRoot!);

    // Amber circle background
    Blockly.utils.dom.createSvgElement(
      "circle",
      {
        cx: "8",
        cy: "8",
        r: "7",
        fill: "#f59e0b",
        "fill-opacity": "0.2",
        stroke: "#f59e0b",
        "stroke-width": "1.5",
      },
      this.svgRoot!,
    );

    // Warning exclamation mark
    const text = Blockly.utils.dom.createSvgElement(
      "text",
      {
        x: "8",
        y: "12",
        "text-anchor": "middle",
        fill: "#f59e0b",
        "font-size": "11",
        "font-weight": "700",
        "font-family": "sans-serif",
      },
      this.svgRoot!,
    );
    text.textContent = "!";
  }

  override onClick(): void {
    if (this.popupEl) {
      this.hidePopup();
      return;
    }
    this.showPopup();
  }

  override async setBubbleVisible(visible: boolean): Promise<void> {
    if (visible) {
      this.showPopup();
    } else {
      this.hidePopup();
    }
  }

  override bubbleIsVisible(): boolean {
    return this.popupEl !== null;
  }

  override dispose(): void {
    this.hidePopup();
    super.dispose();
  }

  private showPopup(): void {
    const text = this.getText();
    if (!text) return;

    const block = this.getSourceBlock();
    if (!block) return;

    const svgRoot = (block as Blockly.BlockSvg).getSvgRoot();
    if (!svgRoot) return;
    const rect = svgRoot.getBoundingClientRect();

    const popup = document.createElement("div");
    popup.className = "custom-warning-popup";

    const escapedText = this.escapeHtml(text).replace(/\n/g, "<br>");
    popup.innerHTML = [
      '<div class="custom-warning-popup__header">',
      '  <span class="custom-warning-popup__icon">⚠</span>',
      '  <span class="custom-warning-popup__title">Warning</span>',
      "</div>",
      `<div class="custom-warning-popup__body">${escapedText}</div>`,
    ].join("");

    popup.style.position = "fixed";
    popup.style.left = `${rect.right + 8}px`;
    popup.style.top = `${rect.top}px`;

    document.body.appendChild(popup);
    this.popupEl = popup;

    // Close on click outside (defer to avoid immediate trigger)
    setTimeout(() => {
      document.addEventListener("pointerdown", this.handleOutsideClick);
    }, 0);
  }

  private hidePopup(): void {
    if (this.popupEl) {
      this.popupEl.remove();
      this.popupEl = null;
    }
    document.removeEventListener("pointerdown", this.handleOutsideClick);
  }

  private handleOutsideClick = (e: PointerEvent): void => {
    if (this.popupEl && !this.popupEl.contains(e.target as Node)) {
      this.hidePopup();
    }
  };

  /** Escape HTML to prevent XSS in warning text. */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
