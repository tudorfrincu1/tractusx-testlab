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
import { blockColors } from "../../../config/blockColors";
import { blockIcon, ICON_VARIABLE } from "../../common/fields/icons";
import {
  collectEnvironmentVariables,
  collectServiceVariables,
  collectPreconditionVariables,
  collectSetupVariables,
  collectMetadataVariables,
  collectExecutionVariables,
} from "../../common/catalog/variables/variableCollection";
import { dynamicDropdown, collectSchemaPaths, collectTestdataPaths } from "../../common/fields/dropdownProviders";

/** Registers variable reference blocks (var_steps, var_preconditions, var_env, etc.). */
export function registerVariableRefBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["var_steps"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("VAR")
        .appendField(new Blockly.FieldLabel(""), "VAR_NAME")
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varSteps);
      this.setTooltip("Step output variable \u2014 drag into inputs to use");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_preconditions"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Precondition")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectPreconditionVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varPreconditions);
      this.setTooltip("Reference a precondition output");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_env"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Environment")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectEnvironmentVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varEnv);
      this.setTooltip("Reference an environment variable");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_services"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Service")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectServiceVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varServices);
      this.setTooltip("Reference a service variable");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_metadata"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Metadata")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectMetadataVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varMetadata);
      this.setTooltip("Reference a metadata field");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_execution"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Execution")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectExecutionVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varExecution);
      this.setTooltip("Reference a runtime execution variable");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_setup"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Setup")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectSetupVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(none)", "__NONE__"]];
              },
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varSetup);
      this.setTooltip("Reference a setup step output");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_schema"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Schema")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              () => collectSchemaPaths(),
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varSchema);
      this.setTooltip("Reference a schema file");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };

  Blockly.Blocks["var_testdata"] = {
    init(this: BlocklyType.Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Testdata")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              () => collectTestdataPaths(),
              "(none)",
            ),
          ),
          "VAR_NAME",
        )
        .appendField("  ");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.varTestdata);
      this.setTooltip("Reference a testdata file");
      this.setDeletable(true);
      this.setMovable(true);
    },
  };
}
