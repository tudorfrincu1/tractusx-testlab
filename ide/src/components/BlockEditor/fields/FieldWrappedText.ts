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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import * as Blockly from "blockly";
import { createWrappedTextDialog } from "./wrappedTextDialog";

const MAX_LINE_WIDTH = 320;
const MAX_DISPLAY_LINES = 3;
const LINE_HEIGHT_FACTOR = 1.4;
const RIGHT_PADDING = 12;

/**
 * A text input field that wraps long text into multiple SVG lines.
 * Opens a modal dialog with a textarea for comfortable editing.
 */
export class FieldWrappedText extends Blockly.FieldTextInput {
  private tspans: SVGTSpanElement[] = [];
  private hintTspan: SVGTSpanElement | null = null;
  private lineCount = 1;
  private dialog: HTMLDivElement | null = null;

  constructor(value?: string, validator?: Blockly.FieldValidator<string>) {
    super(value ?? "", validator);
    this.maxDisplayLength = Infinity;
  }

  // ─── Editor: modal dialog with textarea ─────────────────────────

  /**
   * Override the default inline editor with a popup dialog.
   * Blockly calls this on click/double-click.
   */
  protected override showEditor_(): void {
    this.openDialog();
  }

  private openDialog(): void {
    if (this.dialog) return;

    const oldValue = this.getValue() ?? "";
    const { backdrop, textarea, saveBtn, cancelBtn } = createWrappedTextDialog(oldValue);

    document.body.appendChild(backdrop);
    this.dialog = backdrop as HTMLDivElement;

    // Focus textarea and select all
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
    });

    // Event handlers
    const close = () => {
      backdrop.remove();
      this.dialog = null;
    };

    const save = () => {
      const newValue = textarea.value;
      this.setValue(newValue);
      close();
      // Re-render the block so wrapped text updates
      const block = this.getSourceBlock();
      if (block && "render" in block) {
        (block as Blockly.BlockSvg).render();
      }
    };

    saveBtn.addEventListener("click", save);
    cancelBtn.addEventListener("click", close);
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) close();
    });

    // Keyboard shortcuts
    textarea.addEventListener("keydown", (e) => {
      // Ctrl/Cmd+Enter to save
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        save();
      }
      // Escape to cancel
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      // Stop propagation so Blockly doesn't handle keys
      e.stopPropagation();
    });
  }

  // ─── Multi-line SVG rendering ───────────────────────────────────

  /** Split text into lines that fit within MAX_LINE_WIDTH. */
  private wrapText(text: string): string[] {
    if (!this.textElement_) return [text];
    if (!text.trim()) return [text];

    const measureEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan",
    );
    this.textElement_.appendChild(measureEl);

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      measureEl.textContent = testLine;
      const width = measureEl.getComputedTextLength();

      if (width > MAX_LINE_WIDTH && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    this.textElement_.removeChild(measureEl);
    return lines.length > 0 ? lines : [""];
  }

  private clearTspans(): void {
    for (const t of this.tspans) {
      t.remove();
    }
    this.tspans = [];
    this.hintTspan?.remove();
    this.hintTspan = null;
  }

  override render_(): void {
    super.render_();

    const text = this.getDisplayText_();
    if (!this.textElement_ || !text?.trim()) return;

    const lines = this.wrapText(text);
    const isTruncated = lines.length > MAX_DISPLAY_LINES;
    const displayLines = isTruncated ? lines.slice(0, MAX_DISPLAY_LINES) : lines;
    this.lineCount = displayLines.length;

    if (displayLines.length <= 1) {
      this.clearTspans();
      this.applyRightPadding();
      return;
    }

    this.clearTspans();
    if (this.textContent_) {
      this.textContent_.nodeValue = "";
    }

    const constants = this.getConstants();
    const fontSize = constants?.FIELD_TEXT_HEIGHT ?? 16;
    const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
    const xPos = this.textElement_.getAttribute("x") ?? "0";

    for (let i = 0; i < displayLines.length; i++) {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan",
      );
      let lineText = displayLines[i];
      // Add ellipsis to last displayed line if truncated
      if (isTruncated && i === displayLines.length - 1) {
        lineText = lineText.substring(0, lineText.length - 1) + "\u2026";
      }
      tspan.textContent = lineText;
      tspan.setAttribute("x", xPos);
      tspan.setAttribute("dy", i === 0 ? "0" : String(lineHeight));
      this.textElement_.appendChild(tspan);
      this.tspans.push(tspan);
    }

    // Add "click to expand" hint after the last line
    if (isTruncated) {
      const hint = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan",
      );
      hint.textContent = "\u25B6 click to expand";
      hint.setAttribute("x", xPos);
      hint.setAttribute("dy", String(lineHeight));
      hint.setAttribute("fill", "#FFD700");
      hint.setAttribute("font-size", "10");
      hint.setAttribute("opacity", "0.7");
      this.textElement_.appendChild(hint);
      this.hintTspan = hint;
      this.lineCount += 1;
    }

    this.resizeForMultiline(lineHeight);
  }

  private applyRightPadding(): void {
    const newWidth = this.size_.width + RIGHT_PADDING;
    this.size_ = new Blockly.utils.Size(newWidth, this.size_.height);
    if (this.borderRect_) {
      this.borderRect_.setAttribute("width", String(newWidth));
    }
  }

  private resizeForMultiline(lineHeight: number): void {
    const constants = this.getConstants();
    if (!constants) return;

    const xPadding = this.isFullBlockField()
      ? 0
      : constants.FIELD_BORDER_RECT_X_PADDING;

    let maxWidth = 0;
    for (const t of this.tspans) {
      const w = t.getComputedTextLength();
      if (w > maxWidth) maxWidth = w;
    }
    // Include hint width if present
    if (this.hintTspan) {
      const hw = this.hintTspan.getComputedTextLength();
      if (hw > maxWidth) maxWidth = hw;
    }

    const totalWidth = maxWidth + xPadding * 2 + RIGHT_PADDING;
    // Content lines + hint line (smaller) + minimal bottom padding
    const contentLines = this.hintTspan
      ? this.lineCount - 1
      : this.lineCount;
    const hintHeight = this.hintTspan ? lineHeight * 0.85 : 0;
    const totalHeight = lineHeight * contentLines + hintHeight + xPadding;

    this.size_ = new Blockly.utils.Size(totalWidth, totalHeight);

    if (this.borderRect_) {
      this.borderRect_.setAttribute("width", String(totalWidth));
      this.borderRect_.setAttribute("height", String(totalHeight));
    }

    this.positionBorderRect_();
  }

  override getSize(): Blockly.utils.Size {
    if (!this.isVisible()) {
      return new Blockly.utils.Size(0, 0);
    }
    if (this.isDirty_) {
      this.render_();
      this.isDirty_ = false;
    }
    return this.size_;
  }

  override dispose(): void {
    this.dialog?.remove();
    this.clearTspans();
    super.dispose();
  }
}
