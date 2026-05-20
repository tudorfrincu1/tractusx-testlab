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
import { blockColors, getCategoryColor } from "../config/blockColors";
import type { BlockCatalog, BlockCatalogEntry } from "./catalogLoader";
import { blockIcon, ICON_STEP, ICON_MOCK, ICON_WAIT, ICON_JSON } from "./icons";
import {
  dynamicDropdown,
  collectMockEndpointIds,
  collectServiceRefs,
  collectSchemaPaths,
} from "./dropdownProviders";
import { collectWorkspaceVariables } from "./variableCollection";
import { createInfoIconField } from "./infoIconField";

interface BlockRegistrationContext {
  Blockly: typeof BlocklyType;
  catalog: BlockCatalog;
  categoryColor: number;
  categoryIcon: string;
  serviceType?: string;
}

function registerSingleBlock(
  block: BlockCatalogEntry,
  ctx: BlockRegistrationContext,
  withOnchange: boolean,
): void {
  const { Blockly, catalog, categoryColor, categoryIcon, serviceType } = ctx;
  if (block.custom_registration) return;
  const blockType = `step_${block.type}`;
  if (Blockly.Blocks[blockType]) return;

  Blockly.Blocks[blockType] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, categoryIcon))
        .appendField(block.label)
        .appendField(createInfoIconField(Blockly, block.description));

      this.appendDummyInput()
        .appendField("description:")
        .appendField(new Blockly.FieldTextInput(""), "DESCRIPTION");

      registerBlockParams(this, block, Blockly, catalog, serviceType);

      if (block.outputs && block.outputs.length > 0) {
        this.appendStatementInput("EXPECT")
          .appendField("validate:")
          .setCheck("assertion");
      }

      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(categoryColor);
    },
    ...(withOnchange && block.depends_on && block.depends_on.length > 0
      ? {
          onchange(this: Block) {
            if (!this.workspace) return;
            if ("isDragging" in this.workspace && (this.workspace as WorkspaceSvg).isDragging()) return;
            const requiredTypes = new Set(block.depends_on!.map((t: string) => `step_${t}`));
            let found = false;
            for (const wsBlock of this.workspace.getAllBlocks(false)) {
              if (wsBlock === this) continue;
              if (requiredTypes.has(wsBlock.type)) { found = true; break; }
            }
            this.setWarningText(
              found ? null : `Requires a mock endpoint block (${block.depends_on!.join(" or ")}) to be present in the workspace.`
            );
          },
        }
      : {}),
  };
}

function registerBlockParams(
  self: Block,
  block: BlockCatalogEntry,
  Blockly: typeof BlocklyType,
  catalog: BlockCatalog,
  serviceType?: string,
): void {
  for (const param of block.params) {
    const fieldKey = `PARAM_${param.name.toUpperCase()}`;
    const paramLabel = param.required ? `${param.name}:` : `(opt) ${param.name}:`;

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
              dynamicDropdown((ws) => collectMockEndpointIds(ws)) as () => Array<[string, string]>
            ),
            fieldKey
          );
        break;

      case "service_ref":
        self.appendDummyInput()
          .appendField(paramLabel)
          .appendField(
            new Blockly.FieldDropdown(
              dynamicDropdown((ws) => collectServiceRefs(ws, serviceType)) as () => Array<[string, string]>
            ),
            fieldKey
          );
        break;

      case "schema_path":
        self.appendDummyInput()
          .appendField(paramLabel)
          .appendField(
            new Blockly.FieldDropdown(
              dynamicDropdown(() => collectSchemaPaths()) as () => Array<[string, string]>
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
        self.appendStatementInput(fieldKey)
          .appendField(paramLabel)
          .setCheck("step");
        break;

      case "filter_expression_list":
        self.appendStatementInput(fieldKey)
          .appendField(paramLabel)
          .setCheck("filter_expression");
        break;

      default:
        self.appendValueInput(fieldKey)
          .appendField(paramLabel)
          .setCheck("param_value");
        break;
    }
  }
}

export function registerCatalogBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {
  for (const category of catalog) {
    const categoryColor = getCategoryColor(category.name);
    const categoryIcon = category.name === "Mock" ? ICON_MOCK
      : category.name === "Wait" ? ICON_WAIT
      : ICON_STEP;

    const ctx: BlockRegistrationContext = {
      Blockly, catalog, categoryColor, categoryIcon, serviceType: category.service_type,
    };

    for (const block of category.blocks) {
      registerSingleBlock(block, ctx, true);
    }

    if (category.shortcuts) {
      for (const group of category.shortcuts) {
        for (const block of group.blocks) {
          registerSingleBlock(block, ctx, false);
        }
      }
    }
  }
}
