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

import type * as BlocklyType from "blockly";
type Block = BlocklyType.Block;
import type { BlockCatalog } from "../../common/catalog/catalogLoader";
import { blockIcon, ICON_JSON } from "../../common/fields/icons";
import {
  dynamicDropdown,
  collectMockEndpointIds,
  collectSchemaPaths,
  collectPreconditionRefs,
} from "../../common/fields/dropdownProviders";
import { collectEnvironmentVariables } from "../../common/catalog/variables/variableCollection";

export interface ParamFieldDef {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  default?: unknown;
  item_type?: string;
  accepts?: string[];
}

export function registerParamField(
  self: Block,
  Blockly: typeof BlocklyType,
  param: ParamFieldDef,
  fieldKey: string,
  paramLabel: string,
  catalog: BlockCatalog,
): void {
  // If param has accepts, use value input (puzzle piece) for variable blocks
  if (param.accepts && param.accepts.length > 0 && param.type !== "variable") {
    self.appendValueInput(fieldKey)
      .appendField(paramLabel)
      .setCheck("param_value");
    return;
  }

  switch (param.type) {
    case "dropdown":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldDropdown(
            (param.options || []).map((o: string): [string, string] => [o, o])
          ),
          fieldKey
        );
      break;
    case "text": {
      const textField = new Blockly.FieldTextInput(String(param.default ?? ""));
      textField.maxDisplayLength = 80;
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(textField, fieldKey);
      break;
    }
    case "number":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldNumber(
            typeof param.default === "number" ? param.default : 0,
            -Infinity, Infinity, 0
          ),
          fieldKey
        );
      break;
    case "json":
      self.appendValueInput(fieldKey)
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField(paramLabel)
        .setCheck("param_value");
      break;
    case "array":
      self.appendStatementInput(fieldKey)
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField(paramLabel)
        .setCheck(param.item_type ?? "key_value");
      break;
    case "endpoint_ref":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown((ws) => collectMockEndpointIds(ws))
          ),
          fieldKey
        );
      break;

    case "schema_path":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(() => collectSchemaPaths())
          ),
          fieldKey
        );
      break;
    case "variable":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectEnvironmentVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(no variables)", "__NONE__"]];
              },
              "(no variables)"
            )
          ),
          fieldKey
        );
      break;
    case "steps":
      self.appendStatementInput(fieldKey)
        .appendField(paramLabel)
        .setCheck("step");
      break;
    case "filter_expression_list":
      self.appendStatementInput(fieldKey)
        .appendField(paramLabel)
        .setCheck("filter_expression");
      break;
    case "precondition_ref":
      self.appendDummyInput()
        .appendField(paramLabel)
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown((ws) => collectPreconditionRefs(ws))
          ),
          fieldKey
        );
      break;
    default:
      self.appendValueInput(fieldKey)
        .appendField(paramLabel)
        .setCheck("param_value");
      break;
  }
}
