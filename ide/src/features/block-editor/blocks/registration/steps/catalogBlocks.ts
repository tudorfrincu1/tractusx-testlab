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

import type { Block, WorkspaceSvg } from "blockly";
import type * as BlocklyType from "blockly";
import { getCategoryColor } from "../../../config/blockColors";
import type { BlockCatalog } from "../../common/catalog/catalogLoader";
import { blockIcon, ICON_STEP, ICON_MOCK, ICON_WAIT } from "../../common/fields/icons";
import { createInfoIconField } from "../../common/fields/infoIconField";
import { generateStepId } from "../../common/stepIdGenerator";
import { registerParamField } from "./registerParamField";

function classIdToLabel(classId: string): string {
  return classId
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

          const stepIdField = new Blockly.FieldTextInput(generateStepId(block.type, this.workspace));
          stepIdField.maxDisplayLength = 80;
          this.appendDummyInput("STEP_ID_ROW")
            .appendField("id:")
            .appendField(stepIdField, "STEP_ID");

          const descField = new Blockly.FieldTextInput("");
          descField.maxDisplayLength = 80;
          this.appendDummyInput()
            .appendField("description:")
            .appendField(descField, "DESCRIPTION");

          if (block.params.length > 0) {
            this.appendDummyInput("INPUTS_HEADER")
              .appendField("\u2500\u2500\u2500 inputs \u2500\u2500\u2500");
          }

          for (const param of block.params) {
            const fieldKey = `PARAM_${param.name.toUpperCase()}`;
            const paramLabel = param.required ? `${param.name}:` : `(opt) ${param.name}:`;
            registerParamField(this, Blockly, param, fieldKey, paramLabel, catalog);
          }

          if (block.outputs && block.outputs.length > 0) {
            if (block.expect !== false) {
              this.appendStatementInput("EXPECT")
                .appendField("validate:")
                .setCheck("assertion");
            }

            // Spacer before outputs section
            this.appendDummyInput("OUTPUTS_SPACER")
              .appendField(" ");

            // Divider + hint before outputs
            this.appendDummyInput("OUTPUTS_HEADER")
              .appendField("\u2500\u2500\u2500 output variables (drag to use) \u2500\u2500\u2500");

            for (const output of block.outputs) {
              const inputName = `OUT_${output.name.toUpperCase()}`;
              const label = output.class
                ? classIdToLabel(output.class) + ":"
                : classIdToLabel(output.name) + ":";
              this.appendValueInput(inputName)
                .appendField(label)
                .setCheck("param_value");
            }
          }

          // json_path_extract can appear both as a step and inside assertion chains
          const connectionTypes = block.type === "json_path_extract"
            ? ["step", "assertion"]
            : "step";
          this.setPreviousStatement(true, connectionTypes);
          this.setNextStatement(true, connectionTypes);
          this.setColour(categoryColor);
          this.setTooltip(`${block.label}\n${block.description}`);
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

    // Register shortcut blocks with the same category appearance
    if (category.shortcuts) {
      for (const group of category.shortcuts) {
        for (const block of group.blocks) {
          if (block.custom_registration) continue;
          const blockType = `step_${block.type}`;
          if (Blockly.Blocks[blockType]) continue;

          Blockly.Blocks[blockType] = {
            init(this: Block) {
              this.appendDummyInput()
                .appendField(blockIcon(Blockly, categoryIcon))
                .appendField(block.label)
                .appendField(createInfoIconField(Blockly, block.description));

              const shortcutIdField = new Blockly.FieldTextInput(generateStepId(block.type, this.workspace));
              shortcutIdField.maxDisplayLength = 80;
              this.appendDummyInput("STEP_ID_ROW")
                .appendField("id:")
                .appendField(shortcutIdField, "STEP_ID");

              const shortcutDescField = new Blockly.FieldTextInput("");
              shortcutDescField.maxDisplayLength = 80;
              this.appendDummyInput()
                .appendField("description:")
                .appendField(shortcutDescField, "DESCRIPTION");

              if (block.params.length > 0) {
                this.appendDummyInput("INPUTS_HEADER")
                  .appendField("\u2500\u2500\u2500 inputs \u2500\u2500\u2500");
              }

              for (const param of block.params) {
                const fieldKey = `PARAM_${param.name.toUpperCase()}`;
                const paramLabel = param.required ? `${param.name}:` : `(opt) ${param.name}:`;
                registerParamField(this, Blockly, param, fieldKey, paramLabel, catalog);
              }

              if (block.outputs && block.outputs.length > 0) {
                if (block.expect !== false) {
                  this.appendStatementInput("EXPECT")
                    .appendField("validate:")
                    .setCheck("assertion");
                }

                // Spacer before outputs section
                this.appendDummyInput("OUTPUTS_SPACER")
                  .appendField(" ");

                // Divider + hint before outputs
                this.appendDummyInput("OUTPUTS_HEADER")
                  .appendField("\u2500\u2500\u2500 output variables (drag to use) \u2500\u2500\u2500");

                for (const output of block.outputs) {
                  const inputName = `OUT_${output.name.toUpperCase()}`;
                  const label = output.class
                    ? classIdToLabel(output.class) + ":"
                    : classIdToLabel(output.name) + ":";
                  this.appendValueInput(inputName)
                    .appendField(label)
                    .setCheck("param_value");
                }
              }

              this.setPreviousStatement(true, "step");
              this.setNextStatement(true, "step");
              this.setColour(categoryColor);
              this.setTooltip(`${block.label}\n${block.description}`);
            },
          };
        }
      }
    }
  }
}
