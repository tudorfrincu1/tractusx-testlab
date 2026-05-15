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
import { blockColors } from "../config/blockColors";
import { blockIcon, ICON_VARIABLE } from "./icons";
import { dynamicDropdown } from "./dropdownProviders";
import { collectWorkspaceVariables } from "./variableCollection";
import type { BlockCatalog } from "./catalogLoader";
import {
  defaultSegments,
  parsePathToSegments,
  requestOpenPathBuilder,
  segmentsToPath,
} from "./pathBuilder";
import type { PathSegment } from "./pathBuilder";
import { requestOpenJsonEditor, truncateJsonPreview } from "./jsonEditor";

/**
 * Walk up from a value_json_path block to its parent step block and read the
 * source variable name from the sibling `variable` input (connected variable_get block).
 * Returns `undefined` when the context cannot be resolved.
 */
function resolveParentSourceVariable(block: Block): string | undefined {
  const parent = block.getParent();
  if (!parent) return undefined;
  // The json_path_extract step has a "variable" input with a connected variable_get block
  if (parent.type !== "step_json_path_extract") return undefined;
  const variableInput = parent.getInput("variable");
  const connectedBlock = variableInput?.connection?.targetBlock();
  if (!connectedBlock || connectedBlock.type !== "variable_get") return undefined;
  const varName = connectedBlock.getFieldValue("VAR_NAME");
  return varName && varName !== "__NONE__" ? String(varName) : undefined;
}

/** Pencil icon as SVG data URI for the edit button. */
const ICON_EDIT_PENCIL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">' +
  '<path fill="#80deea" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 ' +
  '7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 ' +
  '1.83 3.75 3.75 1.84-1.82z"/></svg>'
)}`;

/** Pencil icon tinted amber for the JSON editor button. */
const ICON_EDIT_JSON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">' +
  '<path fill="#fbbf24" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 ' +
  '7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 ' +
  '1.83 3.75 3.75 1.84-1.82z"/></svg>'
)}`;

const DEFAULT_JSON = JSON.stringify({ key: "value", count: 1, active: true }, null, 2);

/** Internal type for blocks that store segment data. */
interface BlockWithSegments {
  __segments?: PathSegment[];
}

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
      const segs = defaultSegments();
      const path = segmentsToPath(segs);
      this.appendDummyInput()
        .appendField("\u2922")
        .appendField(new Blockly.FieldLabelSerializable(path), "VALUE")
        .appendField(new Blockly.FieldImage(
          ICON_EDIT_PENCIL, 16, 16, "✏ Edit path",
          (field: InstanceType<typeof BlocklyType.FieldImage>) => {
            const block = field.getSourceBlock();
            if (!block) return;
            const svgRoot = field.getSvgRoot();
            const rect = svgRoot?.getBoundingClientRect();
            const pos = rect
              ? { x: rect.right + 8, y: rect.top }
              : { x: 400, y: 300 };
            const currentPath = block.getFieldValue("VALUE") || "";
            const segments: PathSegment[] = (block as BlockWithSegments).__segments
              ?? parsePathToSegments(currentPath);
            const sourceVariable = resolveParentSourceVariable(block);
            requestOpenPathBuilder({
              blockId: block.id,
              segments,
              position: pos,
              sourceVariable,
            });
          },
        ));
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueJsonPath);
      this.setTooltip("A dot-notation path (e.g. items.0.id) — click ✏ to edit");
      (this as unknown as BlockWithSegments).__segments = segs;
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

  Blockly.Blocks["value_json"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("{}")
        .appendField(
          new Blockly.FieldLabelSerializable(truncateJsonPreview(DEFAULT_JSON)),
          "JSON_PREVIEW",
        )
        .appendField(new Blockly.FieldImage(
          ICON_EDIT_JSON, 16, 16, "✏ Edit JSON",
          (field: InstanceType<typeof BlocklyType.FieldImage>) => {
            const block = field.getSourceBlock();
            if (!block) return;
            const svgRoot = field.getSvgRoot();
            const rect = svgRoot?.getBoundingClientRect();
            const pos = rect
              ? { x: rect.right + 8, y: rect.top }
              : { x: 400, y: 300 };
            const currentJson = block.getFieldValue("JSON_VALUE") || DEFAULT_JSON;
            requestOpenJsonEditor({
              blockId: block.id,
              jsonValue: currentJson,
              position: pos,
            });
          },
        ));
      this.appendDummyInput("JSON_STORE")
        .appendField(new Blockly.FieldLabelSerializable(DEFAULT_JSON), "JSON_VALUE");
      this.getInput("JSON_STORE")!.setVisible(false);
      this.setPreviousStatement(true, "key_value");
      this.setNextStatement(true, "key_value");
      this.setColour(blockColors.valueJson);
      this.setTooltip("A raw JSON object — click ✏ to edit");
    },
  };
}
