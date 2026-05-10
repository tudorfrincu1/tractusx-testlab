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
import { blockIcon, ICON_LOCK, ICON_KEY } from "./icons";

export function registerAuthBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["auth_oauth2"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_LOCK))
        .appendField("OAuth2")
        .appendField(new Blockly.FieldTextInput("my-oauth2"), "NAME");
      this.appendDummyInput()
        .appendField("auth_url:")
        .appendField(new Blockly.FieldTextInput(""), "AUTH_URL");
      this.appendDummyInput()
        .appendField("realm:")
        .appendField(new Blockly.FieldTextInput(""), "REALM");
      this.appendDummyInput()
        .appendField("client_id:")
        .appendField(new Blockly.FieldTextInput(""), "CLIENT_ID");
      this.appendDummyInput()
        .appendField("client_secret:")
        .appendField(new Blockly.FieldTextInput(""), "CLIENT_SECRET");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.authentication);
      this.setTooltip("Configure OAuth2 authentication credentials");
    },
  };

  Blockly.Blocks["auth_api_key"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_KEY))
        .appendField("API Key")
        .appendField(new Blockly.FieldTextInput("my-api-key"), "NAME");
      this.appendDummyInput()
        .appendField("api_key:")
        .appendField(new Blockly.FieldTextInput(""), "API_KEY");
      this.appendDummyInput()
        .appendField("header_name:")
        .appendField(new Blockly.FieldTextInput("X-Api-Key"), "HEADER_NAME");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.authentication);
      this.setTooltip("Configure API Key authentication");
    },
  };
}
