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

/** Maximum lines shown in the JSON block preview. */
const PREVIEW_MAX_LINES = 5;

/** Maximum characters per preview line. */
const PREVIEW_MAX_LINE_WIDTH = 36;

/** Font size in pt for preview text. */
const FONT_SIZE = 10;

/** Line height in px for multi-line rendering. */
const LINE_HEIGHT = 14;

/**
 * Format a raw JSON string into a multi-line preview.
 * Handles @variable_name references gracefully (kept as-is).
 */
export function formatJsonPreview(json: string): string {
  let formatted: string;
  try {
    formatted = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    formatted = json.trim();
  }
  const lines = formatted.split("\n");
  const visible = lines.slice(0, PREVIEW_MAX_LINES).map((line) =>
    line.length > PREVIEW_MAX_LINE_WIDTH
      ? line.slice(0, PREVIEW_MAX_LINE_WIDTH) + "\u2026"
      : line,
  );
  if (lines.length > PREVIEW_MAX_LINES) {
    visible.push("  \u2026");
  }
  return visible.join("\n");
}

/**
 * A serializable, read-only Blockly field that renders multi-line text
 * using SVG `<tspan>` elements — designed for JSON previews on blocks.
 */
export class FieldJsonPreview extends Blockly.FieldLabelSerializable {
  private textLines: string[] = [];

  constructor(value?: string) {
    super(value ?? "");
    this.textLines = (value ?? "").split("\n");
  }

  /** Required for Blockly serialization round-trips. */
  static override fromJson(
    options: Record<string, string>,
  ): FieldJsonPreview {
    return new FieldJsonPreview(options["text"] ?? "");
  }

  override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    this.textLines = (newValue ?? "").split("\n");
  }

  override initView(): void {
    this.createTextElement_();
    this.renderMultiline();
  }

  /** Rebuild the SVG tspan elements for each line. */
  private renderMultiline(): void {
    const textEl = this.getTextElement();
    if (!textEl) return;
    while (textEl.firstChild) {
      textEl.removeChild(textEl.firstChild);
    }
    const ns = "http://www.w3.org/2000/svg";
    this.textLines.forEach((line, i) => {
      const tspan = document.createElementNS(ns, "tspan");
      tspan.setAttribute("x", "0");
      tspan.setAttribute("dy", i === 0 ? "0" : `${LINE_HEIGHT}`);
      tspan.setAttribute("style", `font-size:${FONT_SIZE}pt;font-family:monospace`);
      tspan.textContent = line || "\u00A0";
      textEl.appendChild(tspan);
    });
  }

  override render_(): void {
    this.renderMultiline();
    this.updateSize_();
  }

  override updateSize_(): void {
    const textEl = this.getTextElement();
    if (!textEl) {
      this.size_ = new Blockly.utils.Size(0, 0);
      return;
    }
    const bbox = textEl.getBBox();
    const totalHeight = Math.max(
      LINE_HEIGHT * this.textLines.length,
      bbox.height,
    );
    this.size_ = new Blockly.utils.Size(
      Math.max(bbox.width + 4, 20),
      totalHeight + 2,
    );
  }
}

Blockly.fieldRegistry.register("field_json_preview", FieldJsonPreview);
