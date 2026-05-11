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
import { FieldWrappedText } from "../FieldWrappedText";
import { blockIcon, ICON_STORE, ICON_SCHEMA, ICON_VARIABLE, ICON_STEP } from "./icons";
import {
  dynamicDropdown,
  collectSchemaPaths,
  collectTestFilePaths,
  collectExportedVariables,
} from "./dropdownProviders";
import { collectWorkspaceVariables } from "./variableCollection";

export function registerUtilityBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["depends_on_entry"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("file:")
        .appendField(new Blockly.FieldTextInput("tests/my_test.yaml"), "FILE");
      this.appendDummyInput()
        .appendField("outputs:")
        .appendField(new FieldWrappedText(""), "OUTPUTS");
      this.setPreviousStatement(true, "depends_on_entry");
      this.setNextStatement(true, "depends_on_entry");
      this.setColour(blockColors.root);
      this.setTooltip("Declare a dependency on another test file and its outputs (comma-separated)");
    },
  };

  Blockly.Blocks["output_entry"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField(new Blockly.FieldTextInput("variable_name"), "OUTPUT_NAME")
        .appendField(":")
        .appendField(new Blockly.FieldTextInput("$"), "OUTPUT_EXPR");
      this.setPreviousStatement(true, "output_entry");
      this.setNextStatement(true, "output_entry");
      this.setColour(blockColors.root);
      this.setTooltip("Declare a test-level output variable exposed to dependent tests");
    },
  };

  Blockly.Blocks["schema_import"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_SCHEMA))
        .appendField("Import Schema");
      this.appendDummyInput()
        .appendField("schema:")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(() => collectSchemaPaths()) as () => Array<[string, string]>
          ),
          "SCHEMA_PATH"
        );
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("variable:")
        .appendField(new Blockly.FieldTextInput("schema_var"), "OUTPUT_SCHEMA");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#0891B2");
      this.setTooltip("Import a schema file from the project and store it as a variable");
    },
  };

  Blockly.Blocks["export_variable"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("Export Variable");
      this.appendDummyInput()
        .appendField("name:")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectWorkspaceVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(no variables)", "__NONE__"]];
              },
              "(no variables)"
            ) as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#059669");
      this.setTooltip("Export a variable as a test output — available to dependent tests");
    },
  };

  Blockly.Blocks["import_variable"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Import Variable");
      this.appendDummyInput()
        .appendField("from:")
        .appendField(new Blockly.FieldDropdown(
          dynamicDropdown(() => collectTestFilePaths()),
        ), "FILE");
      this.appendDummyInput()
        .appendField("export:")
        .appendField(new Blockly.FieldDropdown(
          dynamicDropdown(
            (_ws) => {
              const filePath = this.getFieldValue("FILE") || "";
              return collectExportedVariables(filePath);
            },
            "(select a test first)"
          ) as () => Array<[string, string]>
        ), "EXPORT_VAR");
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("variable:")
        .appendField(new Blockly.FieldTextInput("imported_var"), "OUTPUT_VAR");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#7C3AED");
      this.setTooltip("Import an exported variable from another test and store it locally.");
    },
  };

  Blockly.Blocks["unsupported_step"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STEP))
        .appendField("Unsupported Step (Import Only)");
      this.appendDummyInput()
        .appendField("description:")
        .appendField(new Blockly.FieldTextInput(""), "STEP_DESCRIPTION");
      this.appendDummyInput()
        .appendField("original type/template:")
        .appendField(new (FieldWrappedText as typeof Blockly.FieldTextInput)(""), "ORIGINAL_TYPE");
      this.appendDummyInput()
        .appendField("warning:")
        .appendField("unsupported mapping - kept for roundtrip");
      this.appendDummyInput()
        .appendField("params payload:")
        .appendField(new (FieldWrappedText as typeof Blockly.FieldTextInput)("{}"), "PARAMS_JSON");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#6D28D9");
      this.setTooltip("Import-only placeholder for unsupported or unknown step mappings.");
    },
  };

  // Backward compatibility for legacy workspaces that still reference generic blocks.
  Blockly.Blocks["step_operation"] = Blockly.Blocks["unsupported_step"];
  Blockly.Blocks["step_template"] = Blockly.Blocks["unsupported_step"];
}
