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
import {
  SATURN_LEFT_OPERANDS,
  SATURN_OPERATORS,
} from "./policyConstants";

export function registerPolicyBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["odrl_permission"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("action:")
        .appendField(
          new Blockly.FieldDropdown([
            ["use", "use"],
            ["access", "access"],
          ]),
          "ACTION"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint_item");
      this.setPreviousStatement(true, "odrl_permission");
      this.setNextStatement(true, "odrl_permission");
      this.setColour(blockColors.keyValue);
      this.setTooltip("An ODRL permission with action and constraints");
    },
  };

  Blockly.Blocks["odrl_prohibition"] = {
    init(this: Block) {
      this.appendDummyInput().appendField("prohibition");
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint_item");
      this.setPreviousStatement(true, "odrl_prohibition");
      this.setNextStatement(true, "odrl_prohibition");
      this.setColour(blockColors.assertion);
      this.setTooltip("An ODRL prohibition rule (Saturn)");
    },
  };

  Blockly.Blocks["odrl_obligation"] = {
    init(this: Block) {
      this.appendDummyInput().appendField("obligation");
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint_item");
      this.setPreviousStatement(true, "odrl_obligation");
      this.setNextStatement(true, "odrl_obligation");
      this.setColour(blockColors.variableDef);
      this.setTooltip("An ODRL obligation rule (Saturn)");
    },
  };

  Blockly.Blocks["odrl_logical_constraint"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("logical:")
        .appendField(
          new Blockly.FieldDropdown([
            ["and", "and"],
            ["or", "or"],
          ]),
          "OPERATOR"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("odrl_constraint_item");
      this.setPreviousStatement(true, "odrl_constraint_item");
      this.setNextStatement(true, "odrl_constraint_item");
      this.setColour(blockColors.valueString);
      this.setTooltip(
        "A logical constraint combining sub-constraints with AND/OR"
      );
    },
  };

  Blockly.Blocks["odrl_constraint"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("leftOperand:")
        .appendField(
          new Blockly.FieldDropdown(SATURN_LEFT_OPERANDS),
          "LEFT_OPERAND"
        )
        .appendField("operator:")
        .appendField(
          new Blockly.FieldDropdown(SATURN_OPERATORS),
          "OPERATOR"
        );
      this.appendValueInput("RIGHT")
        .appendField("rightOperand:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "odrl_constraint_item");
      this.setNextStatement(true, "odrl_constraint_item");
      this.setColour(blockColors.valueString);
      this.setTooltip(
        "An ODRL constraint (leftOperand operator rightOperand)"
      );
    },
  };
}
