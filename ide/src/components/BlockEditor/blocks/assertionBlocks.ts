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
import { findCatalogEntry, type BlockCatalog } from "./catalogLoader";

/** Collect output names from the parent step block's catalog entry */
function collectParentOutputs(block: Block, catalog: BlockCatalog): Array<[string, string]> {
  let parent = block.getSurroundParent();
  while (parent && !parent.type.startsWith("step_")) {
    parent = parent.getSurroundParent();
  }
  if (!parent) return [["(no outputs)", "__NONE__"]];
  const stepType = parent.type.replace(/^step_/, "");
  const entry = findCatalogEntry(stepType, catalog);
  if (!entry?.outputs || entry.outputs.length === 0) return [["(no outputs)", "__NONE__"]];
  return entry.outputs.map((o) => [o.name, o.name] as [string, string]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function outputDropdown(catalog: BlockCatalog): (this: any) => Array<[string, string]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any): Array<[string, string]> {
    const b = this.getSourceBlock?.();
    if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) {
      const cur = this.getValue?.() ?? "";
      if (cur && cur !== "__NONE__") return [[cur, cur]];
      return [["—", "__NONE__"]];
    }
    const options = collectParentOutputs(b, catalog);
    // Preserve the current value even if the parent step isn't attached yet
    const currentVal = this.getValue?.() ?? "";
    if (
      currentVal &&
      currentVal !== "__NONE__" &&
      !options.some(([, v]: [string, string]) => v === currentVal)
    ) {
      options.unshift([currentVal, currentVal]);
    }
    return options;
  };
}

export function registerAssertionBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {
  Blockly.Blocks["assert_equals"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("equals");
      this.appendValueInput("EXPECTED").appendField("expected:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output equals expected value");
    },
  };

  Blockly.Blocks["assert_not_equals"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("not equals");
      this.appendValueInput("EXPECTED").appendField("expected:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output does not equal expected value");
    },
  };

  Blockly.Blocks["assert_contains"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("contains");
      this.appendValueInput("SUBSTRING").appendField("substring:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output contains substring");
    },
  };

  Blockly.Blocks["assert_not_contains"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("not contains");
      this.appendValueInput("SUBSTRING").appendField("substring:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output does not contain substring");
    },
  };

  Blockly.Blocks["assert_matches"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("matches");
      this.appendValueInput("PATTERN").appendField("pattern:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output matches regex pattern");
    },
  };

  Blockly.Blocks["assert_schema"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("matches schema");
      this.appendValueInput("SCHEMA").appendField("schema:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output conforms to a JSON Schema");
    },
  };

  Blockly.Blocks["assert_validates_schema"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("validates against schema");
      this.appendValueInput("SEMANTIC_ID").appendField("semantic id:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output validates against a semantic schema (e.g. CX-0135)");
    },
  };

  Blockly.Blocks["assert_compare"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField(
          new Blockly.FieldDropdown([
            ["greater than", "greater_than"],
            ["less than", "less_than"],
            ["greater or equal", "greater_or_equal"],
            ["less or equal", "less_or_equal"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("VALUE").appendField("value:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert numeric comparison on output");
    },
  };

  Blockly.Blocks["assert_between"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("between");
      this.appendValueInput("MIN").appendField("min:").setCheck("param_value");
      this.appendValueInput("MAX").appendField("max:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is between min and max (inclusive)");
    },
  };

  Blockly.Blocks["assert_not_null"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("is not null");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is not null");
    },
  };

  Blockly.Blocks["assert_not_empty"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(new Blockly.FieldDropdown(outputDropdown(catalog) as () => Array<[string, string]>), "OUTPUT")
        .appendField("is not empty");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is not empty");
    },
  };
}
