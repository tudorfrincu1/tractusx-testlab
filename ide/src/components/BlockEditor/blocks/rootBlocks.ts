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
import { blockColors } from "../config/blockColors";
import { FieldWrappedText } from "../fields/FieldWrappedText";
import {
  blockIcon,
  ICON_TEST,
  ICON_TCK,
  ICON_VARIABLE,
  ICON_PRECONDITION,
} from "./icons";

export function registerRootBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["test_root"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TEST))
        .appendField("Test:")
        .appendField(new Blockly.FieldTextInput("my_test"), "NAME");
      this.appendDummyInput()
        .appendField("Version:")
        .appendField(new Blockly.FieldTextInput("1.0"), "VERSION");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("SETUP").appendField("Setup").setCheck("step");
      this.appendStatementInput("STEPS").appendField("Steps").setCheck("step");
      this.appendStatementInput("TEARDOWN").appendField("Teardown").setCheck("step");
      this.setColour(blockColors.root);
      this.setTooltip("Root test definition");
      this.setDeletable(false);
    },
  };

  Blockly.Blocks["tck_root"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TCK))
        .appendField("TCK:")
        .appendField(new Blockly.FieldTextInput("my-tck"), "NAME");
      this.appendDummyInput()
        .appendField("Version:")
        .appendField(new Blockly.FieldTextInput("1.0"), "VERSION");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("PRECONDITIONS")
        .appendField("Preconditions")
        .setCheck("precondition");
      this.appendStatementInput("TESTS")
        .appendField("Tests")
        .setCheck("test_entry");
      this.setColour(blockColors.rootTck);
      this.setTooltip("Test case — groups multiple tests with shared configuration");
      this.setDeletable(false);
    },
  };

  Blockly.Blocks["test_ref"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TEST))
        .appendField("Test:")
        .appendField(new Blockly.FieldTextInput("test-name"), "TEST_NAME");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("WITH")
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("with:")
        .setCheck("key_value");
      this.setPreviousStatement(true, "test_entry");
      this.setNextStatement(true, "test_entry");
      this.setColour(blockColors.testRef);
      this.setTooltip("Reference a reusable test with optional variable overrides");
    },
  };

  Blockly.Blocks["variable_def"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Variable:")
        .appendField(new Blockly.FieldTextInput("var_name"), "VAR_NAME");
      this.appendDummyInput()
        .appendField("type:")
        .appendField(
          new Blockly.FieldDropdown([
            ["str", "str"],
            ["int", "int"],
            ["bool", "bool"],
            ["float", "float"],
          ]),
          "VAR_TYPE"
        );
      this.appendDummyInput()
        .appendField("default:")
        .appendField(new FieldWrappedText(""), "VAR_DEFAULT");
      this.appendDummyInput()
        .appendField("runtime:")
        .appendField(
          new Blockly.FieldDropdown([
            ["false", "false"],
            ["true", "true"],
          ]),
          "VAR_RUNTIME"
        );
      this.appendDummyInput()
        .appendField("description:")
        .appendField(new FieldWrappedText(""), "VAR_DESCRIPTION");
      this.setPreviousStatement(true, "variable_def");
      this.setNextStatement(true, "variable_def");
      this.setColour(blockColors.variableDef);
      this.setTooltip("Define a shared variable for the TCK");
    },
  };

  Blockly.Blocks["precondition"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_PRECONDITION))
        .appendField("Precondition:")
        .appendField(new Blockly.FieldTextInput("PRE-001"), "PRE_ID");
      this.appendDummyInput()
        .appendField("description:")
        .appendField(new FieldWrappedText(""), "PRE_DESCRIPTION");
      this.setPreviousStatement(true, "precondition");
      this.setNextStatement(true, "precondition");
      this.setColour(blockColors.precondition);
      this.setTooltip("Define a precondition that must be met before running");
    },
  };
}
