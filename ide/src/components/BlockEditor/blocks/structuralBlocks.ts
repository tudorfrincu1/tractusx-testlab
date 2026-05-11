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
import { blockColors } from "../blockColors";

export function registerStructuralBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["asset_criterion"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("operandLeft:")
        .appendField(
          new Blockly.FieldTextInput("https://w3id.org/edc/v0.0.1/ns/id"),
          "LEFT"
        )
        .appendField("operator:")
        .appendField(
          new Blockly.FieldDropdown([
            ["=", "="],
            ["like", "like"],
            ["!=", "!="],
            ["in", "in"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("RIGHT")
        .appendField("operandRight:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "asset_criterion");
      this.setNextStatement(true, "asset_criterion");
      this.setColour(blockColors.keyValue);
      this.setTooltip("An EDC asset selector criterion");
    },
  };

  Blockly.Blocks["odrl_permission"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("action:")
        .appendField(
          new Blockly.FieldDropdown([
            ["use", "use"],
            ["read", "read"],
            ["write", "write"],
          ]),
          "ACTION"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint");
      this.setPreviousStatement(true, "odrl_permission");
      this.setNextStatement(true, "odrl_permission");
      this.setColour(blockColors.keyValue);
      this.setTooltip("An ODRL permission with action and constraints");
    },
  };

  Blockly.Blocks["odrl_constraint"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("leftOperand:")
        .appendField(
          new Blockly.FieldDropdown([
            ["BusinessPartnerNumber", "BusinessPartnerNumber"],
            ["Membership", "Membership"],
            ["FrameworkAgreement", "FrameworkAgreement"],
            ["UsagePurpose", "UsagePurpose"],
            ["custom...", "__CUSTOM__"],
          ]),
          "LEFT_OPERAND"
        )
        .appendField("operator:")
        .appendField(
          new Blockly.FieldDropdown([
            ["eq", "eq"],
            ["neq", "neq"],
            ["in", "in"],
            ["isPartOf", "isPartOf"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("RIGHT")
        .appendField("rightOperand:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "odrl_constraint");
      this.setNextStatement(true, "odrl_constraint");
      this.setColour(blockColors.valueString);
      this.setTooltip("An ODRL constraint (leftOperand operator rightOperand)");
    },
  };

  Blockly.Blocks["odrl_prohibition"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("action:")
        .appendField(
          new Blockly.FieldDropdown([
            ["use", "use"],
            ["read", "read"],
            ["write", "write"],
          ]),
          "ACTION"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint");
      this.setPreviousStatement(true, "odrl_prohibition");
      this.setNextStatement(true, "odrl_prohibition");
      this.setColour(blockColors.keyValue);
      this.setTooltip("An ODRL prohibition with action and constraints");
    },
  };

  Blockly.Blocks["odrl_obligation"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("action:")
        .appendField(
          new Blockly.FieldDropdown([
            ["use", "use"],
            ["read", "read"],
            ["write", "write"],
          ]),
          "ACTION"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint");
      this.setPreviousStatement(true, "odrl_obligation");
      this.setNextStatement(true, "odrl_obligation");
      this.setColour(blockColors.keyValue);
      this.setTooltip("An ODRL obligation with action and constraints");
    },
  };
}
