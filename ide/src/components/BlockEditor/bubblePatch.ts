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
 * Monkey-patches Blockly's Bubble.prototype.setColour so that warning/text
 * bubbles use our dark-theme colours instead of inheriting the block colour.
 *
 * Must be called once, before any workspace is created.
 */
import * as Blockly from "blockly";

const BUBBLE_BG = "#1a1a2e";
const BUBBLE_BORDER = "rgba(239,68,68,0.3)";
const BUBBLE_TEXT_FILL = "#e0e0e0";

export function patchBubbleColours(): void {
  const BubbleProto = Blockly.bubbles.Bubble.prototype;
  const original = BubbleProto.setColour;

  BubbleProto.setColour = function (colour: string) {
    // Let Blockly do its normal work (sets this.colour, tail fill, bg fill)
    original.call(this, colour);

    // Now override the fills on the SVG children inside svgRoot
    const root = (this as unknown as { svgRoot: SVGGElement }).svgRoot;
    if (!root) return;

    // Background rect — first <rect> child
    const rect = root.querySelector("rect");
    if (rect) {
      rect.setAttribute("fill", BUBBLE_BG);
      rect.setAttribute("stroke", BUBBLE_BORDER);
      rect.setAttribute("stroke-width", "1.5");
      rect.setAttribute("rx", "10");
      rect.setAttribute("ry", "10");
    }

    // Tail path — element with class blocklyBubbleTail
    const tail = root.querySelector(".blocklyBubbleTail");
    if (tail) {
      tail.setAttribute("fill", BUBBLE_BG);
      tail.setAttribute("stroke", BUBBLE_BORDER);
      tail.setAttribute("stroke-width", "1");
    }

    // Text elements inside the bubble
    const texts = root.querySelectorAll(".blocklyBubbleText, .blocklyText");
    for (const t of texts) {
      t.setAttribute("fill", BUBBLE_TEXT_FILL);
    }
  };
}
