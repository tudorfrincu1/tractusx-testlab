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
import { requestOpenJsonEditor, truncateJsonPreview } from "../../json/core/jsonEditor";
import { FieldTemplateString } from "../../../fields/templateString/FieldTemplateString";
import { requestOpenTemplateEditor } from "../../../fields/templateString/templateStringEditorBridge";

/** Pencil icon tinted amber for the JSON editor button. */
const ICON_EDIT_JSON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">' +
  '<path fill="#fbbf24" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 ' +
  '7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 ' +
  '1.83 3.75 3.75 1.84-1.82z"/></svg>'
)}`;

/** Pencil icon tinted sky-blue for the template string editor button. */
const ICON_EDIT_TEMPLATE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">' +
  '<path fill="#38bdf8" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 ' +
  '7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 ' +
  '1.83 3.75 3.75 1.84-1.82z"/></svg>'
)}`;

const DEFAULT_JSON = JSON.stringify({ key: "value", count: 1, active: true }, null, 2);

/** Registers literal value blocks (string, number, boolean, regex, json, key_value_pair, template_string). */
export function registerLiteralValueBlocks(Blockly: typeof BlocklyType) {
  // Register custom field type before using it in block definitions.
  // Blockly 12 fieldRegistry has no getClass() — use try/catch to handle double-registration.
  try {
    Blockly.fieldRegistry.unregister(FieldTemplateString.TYPE);
  } catch { /* not registered yet — safe to ignore */ }
  Blockly.fieldRegistry.register(FieldTemplateString.TYPE, FieldTemplateString);
  Blockly.Blocks["value_string"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("str  \"")
        .appendField(new Blockly.FieldTextInput(""), "VALUE")
        .appendField("\"");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setHelpUrl("");
      this.setCommentText("This is a string")
      this.setTooltip("A literal string value");
    },
  };

  Blockly.Blocks["value_regex"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("regex  /")
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
        .appendField("num")
        .appendField(new Blockly.FieldNumber(0, -Infinity, Infinity, 0), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setCommentText("This is a numeric value variable")
      this.setTooltip("A numeric value (supports decimals)");
    },
  };

  Blockly.Blocks["value_boolean"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("bool")
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
        .appendField("JSON ")
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

  Blockly.Blocks["value_template_string"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("tpl")
        .appendField(new FieldTemplateString("") as unknown as BlocklyType.Field, "TEMPLATE")
        .appendField(new Blockly.FieldImage(
          ICON_EDIT_TEMPLATE, 16, 16, "Edit template",
          (field: InstanceType<typeof BlocklyType.FieldImage>) => {
            const block = field.getSourceBlock();
            if (!block) return;
            const currentValue = block.getFieldValue("TEMPLATE");
            requestOpenTemplateEditor(currentValue, (newValue) => {
              if (newValue !== null) {
                block.setFieldValue(newValue, "TEMPLATE");
              }
            });
          },
        ));
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A template string with embedded variable references");
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

  Blockly.Blocks["value_list"] = {
    init(this: Block) {
      this.appendDummyInput().appendField("[ list ]");
      this.appendStatementInput("ITEMS").setCheck("list_item");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueList);
      this.setTooltip("A list of values — stack list items inside");
    },
  };

  Blockly.Blocks["value_object"] = {
    init(this: Block) {
      this.appendDummyInput().appendField("{ object }");
      this.appendStatementInput("ENTRIES").setCheck("key_value");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueJson);
      this.setTooltip("A key-value object — stack key:value pairs inside");
    },
  };

  Blockly.Blocks["list_item"] = {
    init(this: Block) {
      this.appendValueInput("VALUE")
        .setCheck("param_value")
        .appendField("\u2022");
      this.setPreviousStatement(true, "list_item");
      this.setNextStatement(true, "list_item");
      this.setColour(blockColors.listItem);
      this.setTooltip("A single item in a value list \u2014 connect any value block");
    },
  };
}
