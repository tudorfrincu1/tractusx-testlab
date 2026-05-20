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
import type { BlockCatalog } from "../../common/catalog/catalogLoader";
import { collectSchemaVariables, dynamicDropdown } from "../../common/fields/dropdownProviders";
import {
  defaultSegments,
  parsePathToSegments,
  requestOpenPathBuilder,
  segmentsToPath,
} from "../../path/core/pathBuilder";
import type { PathSegment } from "../../path/core/pathBuilder";
import {
  ICON_EDIT_PENCIL,
  type BlockWithSegments,
  resolveParentStepSchema,
  outputDropdown,
} from "./assertionHelpers";

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
      this.appendDummyInput()
        .appendField("schema:")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => collectSchemaVariables(ws),
              "(no schemas loaded)"
            ) as () => Array<[string, string]>
          ),
          "SCHEMA_REF"
        );
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output validates against a schema loaded via Import Schema");
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

  Blockly.Blocks["assert_field"] = {
    init(this: Block) {
      const segs = defaultSegments();
      const path = segmentsToPath(segs);
      this.appendDummyInput()
        .appendField("Assert field")
        .appendField(new Blockly.FieldLabelSerializable(path), "PATH")
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
            const currentPath = block.getFieldValue("PATH") || "";
            const storedSegments = (block as unknown as BlockWithSegments).__segments;
            const segments: PathSegment[] =
              (storedSegments && segmentsToPath(storedSegments) === currentPath)
                ? storedSegments
                : parsePathToSegments(currentPath);
            const sourceSchema = resolveParentStepSchema(block, catalog);
            requestOpenPathBuilder({
              blockId: block.id,
              segments,
              position: pos,
              sourceVariable: undefined,
              sourceSchema,
            });
          },
        ));
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ["equals", "equals"],
            ["not equals", "not_equals"],
            ["contains", "contains"],
            ["not contains", "not_contains"],
            ["greater than", "greater_than"],
            ["less than", "less_than"],
            ["matches", "matches"],
            ["is empty", "is_empty"],
            ["is not empty", "is_not_empty"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("EXPECTED").appendField("expected:").setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert a field value within the step output using a JSON path");
      (this as unknown as BlockWithSegments).__segments = segs;
    },
  };
}
