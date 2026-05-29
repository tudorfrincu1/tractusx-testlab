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

import type { Block } from "blockly";
import type * as BlocklyType from "blockly";
import { blockColors } from "../../../config/blockColors";
import { blockIcon, ICON_VARIABLE } from "../../common/fields/icons";
import { dynamicDropdown } from "../../common/fields/dropdownProviders";
import { collectEnvironmentVariables, collectWorkspaceVariables } from "../../common/catalog/variableCollection";
import type { BlockCatalog } from "../../common/catalog/catalogLoader";
import {
  defaultSegments,
  parsePathToSegments,
  requestOpenPathBuilder,
  segmentsToPath,
} from "../../path/core/pathBuilder";
import type { PathSegment } from "../../path/core/pathBuilder";
import {
  defaultApiSegments,
  parseApiPath,
  requestOpenApiPathBuilder,
  segmentsToApiPath,
} from "../../api-path/core/apiPathBuilder";
import type { ApiPathSegment } from "../../api-path/core/apiPathBuilder";
import { requestOpenJsonEditor, truncateJsonPreview } from "../../json/core/jsonEditor";
import { resolveVariableSchema } from "../../path/schema/schemaResolver";

/**
 * Walk up from a value block to the nearest parent `step_*` block and read the
 * source variable name from its `variable` input (connected variable_get block).
 * Works for any step block that accepts a variable input, not just json_path_extract.
 * Returns `undefined` when the context cannot be resolved.
 */
function resolveParentSourceVariable(block: Block): string | undefined {
  let current: Block | null = block.getParent();
  while (current) {
    if (current.type.startsWith("step_")) {
      // Search all inputs for a connected variable_get or var_* block
      for (const input of current.inputList) {
        const connected = input.connection?.targetBlock();
        if (connected?.type === "variable_get" || connected?.type.startsWith("var_")) {
          const varName = connected.getFieldValue("VAR_NAME");
          if (varName && varName !== "__NONE__") return String(varName);
        }
      }
      // Check dropdown field (used by json_path_extract and similar blocks)
      const dropdownVar = current.getFieldValue("PARAM_VARIABLE");
      if (dropdownVar && dropdownVar !== "__NONE__") return String(dropdownVar);
      // Found a step block but no variable input — stop searching
      return undefined;
    }
    current = current.getParent();
  }
  return undefined;
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

/** Internal type for blocks that store JSON path segment data. */
interface BlockWithSegments {
  __segments?: PathSegment[];
}

/** Internal type for blocks that store API path segment data. */
interface BlockWithApiSegments {
  __segments?: ApiPathSegment[];
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
      this.setHelpUrl();
      this.setCommentText("This is a string")
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
            const storedSegments = (block as BlockWithSegments).__segments;
            const segments: PathSegment[] =
              (storedSegments && segmentsToPath(storedSegments) === currentPath)
                ? storedSegments
                : parsePathToSegments(currentPath);
            const sourceVariable = resolveParentSourceVariable(block);
            const sourceSchema = sourceVariable && catalog
              ? resolveVariableSchema(sourceVariable, block.workspace, catalog)
              : undefined;
            requestOpenPathBuilder({
              blockId: block.id,
              segments,
              position: pos,
              sourceVariable,
              sourceSchema,
            });
          },
        ));
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueJsonPath);
      this.setCommentText("This is json path variable, with editable path tool")
      this.setTooltip("A dot-notation path (e.g. items.0.id) — click pencil to edit");
      (this as unknown as BlockWithSegments).__segments = segs;
    },
  };

  Blockly.Blocks["value_api_path"] = {
    init(this: Block) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG value_api_path] init called`);
      const segs = defaultApiSegments();
      const path = segmentsToApiPath(segs);
      this.appendDummyInput()
        .appendField("/")
        .appendField(new Blockly.FieldLabelSerializable(path), "PATH")
        .appendField(new Blockly.FieldImage(
          ICON_EDIT_PENCIL, 16, 16, "Edit path",
          (field: InstanceType<typeof BlocklyType.FieldImage>) => {
            const block = field.getSourceBlock();
            if (!block) return;
            const svgRoot = field.getSvgRoot();
            const rect = svgRoot?.getBoundingClientRect();
            const pos = rect
              ? { x: rect.right + 8, y: rect.top }
              : { x: 400, y: 300 };
            const currentPath = block.getFieldValue("PATH") || "";
            const segments: ApiPathSegment[] =
              (block as unknown as BlockWithApiSegments).__segments
              ?? parseApiPath(currentPath);
            const variables = collectWorkspaceVariables(block.workspace, catalog);
            requestOpenApiPathBuilder({
              blockId: block.id,
              segments,
              position: pos,
              variables,
            });
          },
        ));
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueApiPath);
      this.setTooltip("An API endpoint path — click pencil to edit segments");
      (this as unknown as BlockWithApiSegments).__segments = segs;
    },
  };

  Blockly.Blocks["value_regex"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("/")
        .appendField(new Blockly.FieldTextInput(".*"), "VALUE")
        .appendField("/");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueRegex);
      this.setCommentText("This is a regex pattern");
      this.setTooltip("A regular expression pattern (e.g. ^urn:uuid:[0-9a-f]{8}$)");
    },
  };

  Blockly.Blocks["value_number"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("#")
        .appendField(new Blockly.FieldNumber(0, -Infinity, Infinity, 0), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setCommentText("This is a numeric value variable")
      this.setTooltip("A numeric value (supports decimals)");
    },
  };

  Blockly.Blocks["variable_get"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("env.")
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
            ) as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.variableGet);
      this.setTooltip("Reference an environment/TCK variable — uses ${{ env.variable_name }} syntax");
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
      this.setCommentText("This is a boolean variable")
    },
  };

  Blockly.Blocks["value_json"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("JSON")
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
        ))
        .appendField(new Blockly.FieldLabelSerializable(DEFAULT_JSON), "JSON_VALUE");
      this.getField("JSON_VALUE")!.setVisible(false);
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueJson);
      this.setTooltip("A raw JSON object — click ✏ to edit");
    },
  };
}
