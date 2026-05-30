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
import { FieldWrappedText } from "../../../fields/wrappedText";
import {
  blockIcon,
  ICON_TEST,
  ICON_VARIABLE,
} from "../../common/fields/icons";

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



}
