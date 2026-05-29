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
import { blockIcon, ICON_PRECONDITION } from "../../common/fields/icons";
import { createInfoIconField } from "../../common/fields/infoIconField";

const VERSION_OPTIONS: Array<[string, string]> = [
  ["Jupiter", "jupiter"],
  ["Saturn", "saturn"],
];

const POLICY_TYPE_OPTIONS: Array<[string, string]> = [
  ["access", "access"],
  ["usage", "usage"],
];

const VERSION_LABELS: Record<string, string> = {
  jupiter: "Jupiter (EDC v0.8–0.10)",
  saturn: "Saturn (EDC v0.11+)",
};

/** Inputs that are only visible in Saturn mode. */
const SATURN_ONLY_INPUTS = ["PROHIBITIONS", "OBLIGATIONS"] as const;

interface PreconditionPolicyBlock extends Block {
  version_: string;
  updateShape_(): void;
}

export function registerPreconditionBlocks(Blockly: typeof BlocklyType) {
  Blockly.Blocks["step_precondition_policy_config"] = {
    init(this: PreconditionPolicyBlock) {
      this.version_ = "saturn";

      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_PRECONDITION))
        .appendField("Policy Config")
        .appendField(
          createInfoIconField(
            Blockly,
            "Pre-configure an ODRL policy that must exist before test execution"
          )
        );

      this.appendDummyInput("VERSION_ROW")
        .appendField("version:")
        .appendField(
          new Blockly.FieldDropdown(
            VERSION_OPTIONS,
            function (this: BlocklyType.FieldDropdown, newValue: string) {
              const block = this.getSourceBlock() as PreconditionPolicyBlock | null;
              if (block && newValue !== block.version_) {
                block.version_ = newValue;
                block.updateShape_();
              }
              return undefined;
            }
          ),
          "VERSION"
        )
        .appendField("", "VERSION_TAG");

      this.appendDummyInput()
        .appendField("policy type:")
        .appendField(
          new Blockly.FieldDropdown(POLICY_TYPE_OPTIONS),
          "POLICY_TYPE"
        );

      this.appendStatementInput("PERMISSIONS")
        .appendField("permissions:")
        .setCheck("odrl_constraint_item");

      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.precondition);
      this.updateShape_();
    },

    updateShape_(this: PreconditionPolicyBlock) {
      const tagField = this.getField("VERSION_TAG");
      if (tagField) {
        tagField.setValue(VERSION_LABELS[this.version_] ?? "");
      }

      const isSaturn = this.version_ === "saturn";

      for (const inputName of SATURN_ONLY_INPUTS) {
        const existing = this.getInput(inputName);
        if (isSaturn && !existing) {
          this.appendStatementInput(inputName)
            .appendField(`${inputName.toLowerCase()}:`)
            .setCheck("odrl_constraint_item");
        } else if (!isSaturn && existing) {
          this.removeInput(inputName);
        }
      }
    },

    saveExtraState(this: PreconditionPolicyBlock): { version: string } {
      return { version: this.version_ };
    },

    loadExtraState(this: PreconditionPolicyBlock, state: { version: string }) {
      this.version_ = state.version ?? "saturn";
      this.updateShape_();
    },
  };
}
