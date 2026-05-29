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

import type { Block } from "blockly";
import type * as BlocklyType from "blockly";
import { getCategoryColor } from "../../../config/blockColors";

/** Dropdown options for operand_left — maps short labels to full URIs. */
const OPERAND_LEFT_OPTIONS: Array<[string, string]> = [
  ["dct:type", "https://w3id.org/edc/v0.0.1/ns/type"],
  ["edc:id", "https://w3id.org/edc/v0.0.1/ns/id"],
  ["dct:subject", "http://purl.org/dc/terms/subject"],
  ["cx-common:version", "https://w3id.org/catenax/ontology/common#version"],
  ["asset:prop:id", "https://w3id.org/edc/v0.0.1/ns/id"],
  ["aas:semanticId", "https://admin-shell.io/aas/3/0/HasSemantics/semanticId"],
  ["custom", "custom"],
];

const OPERATOR_OPTIONS: Array<[string, string]> = [
  ["=", "="],
  ["!=", "!="],
  ["like", "like"],
  ["in", "in"],
];

export function registerFilterExpressionBlock(Blockly: typeof BlocklyType): void {
  const color = getCategoryColor("Connector");

  Blockly.Blocks["filter_expression"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Filter")
        .appendField(
          new Blockly.FieldDropdown(OPERAND_LEFT_OPTIONS),
          "OPERAND_LEFT"
        )
        .appendField(
          new Blockly.FieldDropdown(OPERATOR_OPTIONS),
          "OPERATOR"
        );

      this.appendValueInput("OPERAND_RIGHT")
        .appendField("value:")
        .setCheck("param_value");

      this.appendDummyInput("CUSTOM_URI_INPUT")
        .appendField("  URI:")
        .appendField(new Blockly.FieldTextInput(""), "OPERAND_LEFT_CUSTOM");
      this.getInput("CUSTOM_URI_INPUT")!.setVisible(false);

      this.setPreviousStatement(true, "filter_expression");
      this.setNextStatement(true, "filter_expression");
      this.setColour(color);
      this.setTooltip("A filter criterion — property, operator, value");
    },
    onchange(this: Block) {
      const operandLeft = this.getFieldValue("OPERAND_LEFT");
      const customInput = this.getInput("CUSTOM_URI_INPUT");
      if (customInput) {
        const shouldShow = operandLeft === "custom";
        if (customInput.isVisible() !== shouldShow) {
          customInput.setVisible(shouldShow);
          (this as unknown as { render: () => void }).render();
        }
      }
    },
  };
}
