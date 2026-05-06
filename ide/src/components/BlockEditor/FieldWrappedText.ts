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

    // Backdrop
    const backdrop = document.createElement("div");
    Object.assign(backdrop.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.55)",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    // Dialog container
    const dialog = document.createElement("div");
    Object.assign(dialog.style, {
      background: "#1a1a2e",
      border: "1px solid #333",
      borderRadius: "10px",
      padding: "20px",
      width: "600px",
      maxWidth: "90vw",
      boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      fontFamily:
        "'JetBrains Mono','SF Mono','Fira Code','Cascadia Code',monospace",
    });

    // Title
    const title = document.createElement("div");
    title.textContent = "Edit Text";
    Object.assign(title.style, {
      color: "#FFD700",
      fontSize: "13px",
      fontWeight: "600",
      letterSpacing: "0.5px",
    });

    // Textarea
    const textarea = document.createElement("textarea");
    textarea.value = oldValue;
    textarea.spellcheck = false;
    Object.assign(textarea.style, {
      background: "#111",
      border: "1px solid #444",
      borderRadius: "6px",
      color: "#F3F4F6",
      fontFamily: "inherit",
      fontSize: "14px",
      lineHeight: "1.7",
      padding: "12px 14px",
      resize: "vertical",
      minHeight: "280px",
      maxHeight: "60vh",
      outline: "none",
    });

    // Focus ring
    textarea.addEventListener("focus", () => {
      textarea.style.borderColor = "#FFD700";
      textarea.style.boxShadow =
        "0 0 0 2px rgba(255,215,0,0.15), 0 4px 12px rgba(0,0,0,0.4)";
    });
    textarea.addEventListener("blur", () => {
      textarea.style.borderColor = "#444";
      textarea.style.boxShadow = "none";
    });

    // Button row
    const buttonRow = document.createElement("div");
    Object.assign(buttonRow.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    });

    const cancelBtn = this.createButton("Cancel", false);
    const saveBtn = this.createButton("Save", true);

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(saveBtn);

    dialog.appendChild(title);
    dialog.appendChild(textarea);
    dialog.appendChild(buttonRow);
    backdrop.appendChild(dialog);
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

  private createButton(label: string, isPrimary: boolean): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "6px 16px",
      borderRadius: "6px",
      border: isPrimary ? "1px solid #FFD700" : "1px solid #555",
      background: isPrimary ? "rgba(255,215,0,0.12)" : "transparent",
      color: isPrimary ? "#FFD700" : "#9CA3AF",
      fontSize: "12px",
      fontFamily: "inherit",
      cursor: "pointer",
      fontWeight: isPrimary ? "600" : "400",
    });
    btn.addEventListener("mouseenter", () => {
      btn.style.background = isPrimary
        ? "rgba(255,215,0,0.22)"
        : "rgba(255,255,255,0.06)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = isPrimary
        ? "rgba(255,215,0,0.12)"
        : "transparent";
    });
    return btn;
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
