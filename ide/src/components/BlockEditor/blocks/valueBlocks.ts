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
import { blockIcon, ICON_VARIABLE } from "./icons";
import { dynamicDropdown } from "./dropdownProviders";
import { collectWorkspaceVariables } from "./variableCollection";
import type { BlockCatalog } from "./catalogLoader";

export function registerValueBlocks(Blockly: typeof BlocklyType, catalog?: BlockCatalog) {
  Blockly.Blocks["value_string"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("\"")
        .appendField(new Blockly.FieldTextInput(""), "VALUE")
        .appendField("\"");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A literal string value");
    },
  };

  Blockly.Blocks["value_json_path"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("$.")
        .appendField(new Blockly.FieldTextInput(""), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueJsonPath);
      this.setTooltip("A JSONPath expression (e.g. $.response.id)");
    },
  };

  Blockly.Blocks["value_number"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("#")
        .appendField(new Blockly.FieldNumber(0), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A numeric value");
    },
  };

  Blockly.Blocks["variable_get"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("@")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectWorkspaceVariables(ws, catalog);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(no variables)", "__NONE__"]];
              },
              "(no variables)"
            ) as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.variableGet);
      this.setTooltip("Reference a variable — uses @variable_name syntax");
    },
  };

  Blockly.Blocks["key_value_pair"] = {
    init(this: Block) {
      this.appendValueInput("VALUE")
        .appendField(new Blockly.FieldTextInput("key"), "KEY")
        .appendField(":")
        .setCheck("param_value");
      this.setPreviousStatement(true, "key_value");
      this.setNextStatement(true, "key_value");
      this.setColour(blockColors.keyValue);
      this.setTooltip("A key-value pair for JSON objects");
    },
  };

  Blockly.Blocks["value_boolean"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ["true", "true"],
            ["false", "false"],
          ]),
          "VALUE"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A boolean value (true/false)");
    },
  };
}
