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
import type { VarScope } from "../../serialization/varSyntax";
import type { TemplateSegment } from "./templateSegment.types";
import { parseTemplateString, serializeTemplateString } from "./templateStringParser";

const PILL_H_PAD = 4;
const PILL_V_PAD = 2;
const SEGMENT_GAP = 2;
const MAX_TOTAL_WIDTH = 300;
const PILL_RADIUS = 4;
const FIELD_HEIGHT = 16;
const FONT_SIZE = 11;

/** Scope-based pill background colors. */
const SCOPE_COLORS: Record<VarScope, string> = {
  steps: "#4a90d9",
  env: "#5ba55b",
  preconditions: "#d98c4a",
  metadata: "#8e6bbf",
  setup: "#4a90d9",
  services: "#7c3aed",
  execution: "#0369a1",
} as const;

/** Shorten a dot-separated path to at most 2 segments. */
function shortenPath(path: string): string {
  const parts = path.split(".");
  return parts.length <= 2 ? path : parts.slice(-2).join(".");
}

/**
 * Custom Blockly field rendering template strings with inline SVG variable pills.
 * Static text renders as normal text; variable references render as colored rounded-rect pills.
 */
export class FieldTemplateString extends Blockly.Field<string> {
  static readonly TYPE = "field_template_string";
  SERIALIZABLE = true;

  private segments: TemplateSegment[] = [];
  private svgGroup: SVGGElement | null = null;
  private measureEl: SVGTextElement | null = null;

  constructor(value?: string) {
    super(value ?? "");
    this.segments = parseTemplateString(this.getValue() ?? "");
  }

  // ─── Blockly lifecycle ──────────────────────────────────────────

  protected override initView(): void {
    const fieldGroup = this.fieldGroup_;
    if (!fieldGroup) return;

    this.svgGroup = Blockly.utils.dom.createSvgElement(
      "g", { class: "fieldTemplateString" }, fieldGroup,
    ) as SVGGElement;

    this.measureEl = Blockly.utils.dom.createSvgElement(
      "text",
      { class: "fieldTemplateStringMeasure", style: `font-size:${FONT_SIZE}px`, visibility: "hidden" },
      fieldGroup,
    ) as SVGTextElement;
  }

  protected override render_(): void {
    if (!this.svgGroup) return;
    this.clearSvg();

    let xOffset = 0;
    const yCenter = FIELD_HEIGHT / 2;

    for (const seg of this.segments) {
      if (xOffset > MAX_TOTAL_WIDTH) {
        this.appendEllipsis(xOffset, yCenter);
        break;
      }

      if (seg.type === "literal") {
        xOffset = this.renderLiteral(seg.value, xOffset, yCenter);
      } else {
        xOffset = this.renderPill(seg.scope, seg.path, xOffset, yCenter);
      }
    }
  }

  protected override getSize(): Blockly.utils.Size {
    if (!this.svgGroup) return new Blockly.utils.Size(0, FIELD_HEIGHT);
    const bbox = this.svgGroup.getBBox();
    const width = Math.min(bbox.width || 10, MAX_TOTAL_WIDTH + 10);
    return new Blockly.utils.Size(width, FIELD_HEIGHT + PILL_V_PAD * 2);
  }

  // ─── Value management ───────────────────────────────────────────

  protected override doClassValidation_(newValue: unknown): string | null {
    if (typeof newValue !== "string") return null;
    return newValue;
  }

  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    this.segments = parseTemplateString(newValue);
    this.isDirty_ = true;
  }

  override saveState(): string {
    return this.getValue() ?? "";
  }

  override loadState(state: unknown): void {
    if (typeof state === "string") {
      this.setValue(state);
    }
  }

  /** Editor is disabled — editing happens via external pencil icon (WP-4). */
  protected override showEditor_(): void {
    // No-op: field is not directly editable.
  }

  // ─── SVG rendering helpers ──────────────────────────────────────

  private clearSvg(): void {
    if (!this.svgGroup) return;
    while (this.svgGroup.firstChild) {
      this.svgGroup.firstChild.remove();
    }
  }

  private measureText(text: string): number {
    if (!this.measureEl) return text.length * 6;
    this.measureEl.textContent = text;
    return this.measureEl.getComputedTextLength();
  }

  private renderLiteral(text: string, x: number, yCenter: number): number {
    const width = this.measureText(text);
    Blockly.utils.dom.createSvgElement(
      "text",
      { x: String(x), y: String(yCenter + FONT_SIZE * 0.35), "font-size": `${FONT_SIZE}px` },
      this.svgGroup!,
    ).textContent = text;
    return x + width + SEGMENT_GAP;
  }

  private renderPill(scope: VarScope, path: string, x: number, yCenter: number): number {
    const label = shortenPath(path);
    const textWidth = this.measureText(label);
    const pillWidth = textWidth + PILL_H_PAD * 2;
    const pillHeight = FONT_SIZE + PILL_V_PAD * 2;
    const pillY = yCenter - pillHeight / 2;

    Blockly.utils.dom.createSvgElement(
      "rect",
      {
        x: String(x), y: String(pillY),
        width: String(pillWidth), height: String(pillHeight),
        rx: String(PILL_RADIUS), ry: String(PILL_RADIUS),
        fill: SCOPE_COLORS[scope] ?? "#666",
      },
      this.svgGroup!,
    );

    const textEl = Blockly.utils.dom.createSvgElement(
      "text",
      {
        x: String(x + PILL_H_PAD), y: String(yCenter + FONT_SIZE * 0.35),
        fill: "white", "font-size": `${FONT_SIZE}px`,
      },
      this.svgGroup!,
    ) as SVGTextElement;
    textEl.textContent = label;

    return x + pillWidth + SEGMENT_GAP;
  }

  private appendEllipsis(x: number, yCenter: number): void {
    Blockly.utils.dom.createSvgElement(
      "text",
      { x: String(x), y: String(yCenter + FONT_SIZE * 0.35), "font-size": `${FONT_SIZE}px` },
      this.svgGroup!,
    ).textContent = "\u2026";
  }

  // ─── Static factory for Blockly registry ────────────────────────

  static fromJson(options: Record<string, unknown>): FieldTemplateString {
    const value = typeof options["value"] === "string" ? options["value"] : "";
    return new FieldTemplateString(value);
  }
}
