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

import type { Block, WorkspaceSvg } from "blockly";
import type * as BlocklyType from "blockly";
import { blockColors, getCategoryColor } from "../config/blockColors";
import type { BlockCatalog } from "./catalogLoader";
import { blockIcon, ICON_STEP, ICON_MOCK, ICON_WAIT, ICON_JSON } from "./icons";
import {
  dynamicDropdown,
  collectMockEndpointIds,
  collectServiceRefs,
  collectSchemaPaths,
} from "./dropdownProviders";
import { collectWorkspaceVariables } from "./variableCollection";
import { createInfoIconField } from "./infoIconField";

export function registerCatalogBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {
  for (const category of catalog) {
    const categoryColor = getCategoryColor(category.name);
    const categoryIcon = category.name === "Mock" ? ICON_MOCK
      : category.name === "Wait" ? ICON_WAIT
      : ICON_STEP;

    for (const block of category.blocks) {
      if (block.custom_registration) continue;
      const blockType = `step_${block.type}`;

      Blockly.Blocks[blockType] = {
        init(this: Block) {
          this.appendDummyInput()
            .appendField(blockIcon(Blockly, categoryIcon))
            .appendField(block.label)
            .appendField(createInfoIconField(Blockly, block.description));

          this.appendDummyInput()
            .appendField("description:")
            .appendField(new Blockly.FieldTextInput(""), "DESCRIPTION");

          for (const param of block.params) {
            const fieldKey = `PARAM_${param.name.toUpperCase()}`;
            const paramLabel = param.required ? `${param.name}:` : `(opt) ${param.name}:`;

            switch (param.type) {
              case "dropdown":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      (param.options || []).map((o: string): [string, string] => [o, o])
                    ),
                    fieldKey
                  );
                break;

              case "number":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldNumber(
                      typeof param.default === "number" ? param.default : 0
                    ),
                    fieldKey
                  );
                break;

              case "json":
                this.appendStatementInput(fieldKey)
                  .appendField(blockIcon(Blockly, ICON_JSON))
                  .appendField(paramLabel)
                  .setCheck("key_value");
                break;

              case "array":
                this.appendStatementInput(fieldKey)
                  .appendField(blockIcon(Blockly, ICON_JSON))
                  .appendField(paramLabel)
                  .setCheck(param.item_type ?? "key_value");
                break;

              case "endpoint_ref":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown((ws) => collectMockEndpointIds(ws)) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;

              case "service_ref": {
                const catServiceType = category.service_type;
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown((ws) => collectServiceRefs(ws, catServiceType)) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;
              }

              case "schema_path":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown(() => collectSchemaPaths()) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;

              case "variable":
                this.appendDummyInput()
                  .appendField(paramLabel)
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
                    fieldKey
                  );
                break;

              case "steps":
                this.appendStatementInput(fieldKey)
                  .appendField(paramLabel)
                  .setCheck("step");
                break;

              default:
                this.appendValueInput(fieldKey)
                  .appendField(paramLabel)
                  .setCheck("param_value");
                break;
            }
          }

          if (block.outputs && block.outputs.length > 0) {
            this.appendStatementInput("EXPECT")
              .appendField("expect:")
              .setCheck("assertion");
          }

          this.setPreviousStatement(true, "step");
          this.setNextStatement(true, "step");
          this.setColour(categoryColor);
          // Tooltip suppressed — info icon handles description display
        },
        onchange(this: Block) {
          if (!this.workspace) return;
          if ("isDragging" in this.workspace && (this.workspace as WorkspaceSvg).isDragging()) return;

          const warnings: string[] = [];

          // Check depends_on: required block types in workspace
          if (block.depends_on && block.depends_on.length > 0) {
            const requiredTypes = new Set(block.depends_on.map((t: string) => `step_${t}`));
            let found = false;
            for (const wsBlock of this.workspace.getAllBlocks(false)) {
              if (wsBlock === this) continue;
              if (requiredTypes.has(wsBlock.type)) {
                found = true;
                break;
              }
            }
            if (!found) {
              warnings.push(
                `Requires a mock endpoint block (${block.depends_on.join(" or ")}) to be present in the workspace.`
              );
            }
          }

          this.setWarningText(warnings.length > 0 ? warnings.join("\n") : null);
        },
      };
    }
  }
}
