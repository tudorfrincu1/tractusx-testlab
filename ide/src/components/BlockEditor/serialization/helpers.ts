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

import type { Block, Workspace } from "blockly";
import { type Assertion, AssertionOperator } from "../../../models/schema";
import { serializePolicyBlock, createPolicyRuleBlocks } from "./policySerializers";
import * as deferredDropdowns from "./deferredDropdowns";

/** Maps the assert_compare block dropdown values to typed YAML assertion types. */
const COMPARE_OP_TO_TYPE: Record<string, AssertionOperator> = {
  greater_than: AssertionOperator.GREATER_THAN,
  less_than: AssertionOperator.LESS_THAN,
  greater_or_equal: AssertionOperator.GREATER_OR_EQUAL,
  less_or_equal: AssertionOperator.LESS_OR_EQUAL,
};

/** Read a value block's content as a plain string (or @variable reference). */
export function readValueBlockAsString(block: Block | null): string | undefined {
  if (!block) return undefined;
  if (block.type === "variable_get") {
    const v = block.getFieldValue("VAR_NAME") || "";
    return v && v !== "__NONE__" ? `@${v}` : undefined;
  }
  if (block.type === "value_string") {
    return block.getFieldValue("VALUE") || undefined;
  }
  if (block.type === "value_json_path") {
    const path = block.getFieldValue("VALUE") || "";
    return path ? `$.${path}` : undefined;
  }
  if (block.type === "value_number") {
    const n = block.getFieldValue("VALUE");
    return n !== undefined ? String(n) : undefined;
  }
  if (block.type === "value_boolean") {
    return block.getFieldValue("VALUE") || undefined;
  }
  return undefined;
}

export function toBlockValueString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function readValueBlockAsUnknown(block: Block | null): unknown {
  const rawValue = readValueBlockAsString(block);
  if (rawValue === undefined) return undefined;
  if (rawValue.startsWith("@")) return rawValue;

  const trimmed = rawValue.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return rawValue;
    }
  }

  return rawValue;
}

export function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  (b as unknown as { initSvg: () => void }).initSvg();
  return b;
}

export function setDropdownValue(block: Block, fieldName: string, value: string) {
  const field = block.getField(fieldName);
  if (!field) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = field as any;
  const original = f.doClassValidation_;
  f.doClassValidation_ = (v: string) => v;
  try {
    field.setValue(value);
  } finally {
    f.doClassValidation_ = original;
  }
  if (typeof f.getOptions === "function") {
    f.getOptions(true);
    const opts = f.getOptions(false) as Array<[string, string]>;
    const match = opts.find(([, v]: [string, string]) => v === value);
    // Blockly 12 uses `selectedOption` (no trailing underscore)
    f.selectedOption = match ?? [value, value];
  }
  // Queue the value for re-application after the render pass
  deferredDropdowns.enqueue(block.id, fieldName, value);
}

export { deferredDropdowns };

export function attachChain(parent: Block, inputName: string, blocks: Block[]) {
  if (blocks.length === 0) return;
  const input = parent.getInput(inputName);
  if (!input?.connection) return;
  input.connection.connect(blocks[0].previousConnection!);
  for (let i = 1; i < blocks.length; i++) {
    blocks[i - 1].nextConnection!.connect(blocks[i].previousConnection!);
  }
}

export function connectValue(parent: Block, inputName: string, child: Block) {
  const input = parent.getInput(inputName);
  if (input?.connection && child.outputConnection) {
    input.connection.connect(child.outputConnection);
  }
}

export function createValueBlockFromString(ws: Workspace, strVal: string): Block {
  if (strVal.startsWith("@")) {
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", strVal.slice(1));
    return vb;
  }
  const varMatch = strVal.match(/^(?:\{\{(.+)\}\}|\$\{(.+)\})$/);
  if (varMatch) {
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", varMatch[1] || varMatch[2]);
    return vb;
  }
  if (strVal.startsWith("$.")) {
    const jpb = makeBlock(ws, "value_json_path");
    jpb.setFieldValue(strVal.slice(2), "VALUE");
    return jpb;
  }
  const num = Number(strVal);
  if (!isNaN(num) && strVal.trim() !== "") {
    const nb = makeBlock(ws, "value_number");
    nb.setFieldValue(num, "VALUE");
    return nb;
  }
  const vb = makeBlock(ws, "value_string");
  vb.setFieldValue(strVal, "VALUE");
  return vb;
}

export function readAssertionChain(block: Block | null): Assertion[] {
  const assertions: Assertion[] = [];
  let current = block;
  while (current) {
    const output = current.getFieldValue("OUTPUT") || "";
    if (!output || output === "__NONE__") {
      current = current.getNextBlock();
      continue;
    }

    switch (current.type) {
      case "assert_equals": {
        const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
        assertions.push({ type: AssertionOperator.EQUALS, output, value: val });
        break;
      }
      case "assert_not_equals": {
        const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
        assertions.push({ type: AssertionOperator.NOT_EQUALS, output, value: val });
        break;
      }
      case "assert_contains": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
        assertions.push({ type: AssertionOperator.CONTAINS, output, value: val });
        break;
      }
      case "assert_not_contains": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
        assertions.push({ type: AssertionOperator.NOT_CONTAINS, output, value: val });
        break;
      }
      case "assert_matches": {
        const val = readValueBlockAsString(current.getInputTargetBlock("PATTERN")) || "";
        assertions.push({ type: AssertionOperator.MATCHES, output, value: val });
        break;
      }
      case "assert_schema": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SCHEMA")) || "";
        assertions.push({ type: AssertionOperator.SCHEMA, output, value: val });
        break;
      }
      case "assert_validates_schema": {
        const schemaRef = current.getFieldValue("SCHEMA_REF") || "";
        const schema = schemaRef && schemaRef !== "__NONE__" ? `@${schemaRef}` : "";
        assertions.push({ type: AssertionOperator.VALIDATES_AGAINST_SCHEMA, output, schema });
        break;
      }
      case "assert_compare": {
        const operator = current.getFieldValue("OPERATOR") || "greater_than";
        const val = readValueBlockAsString(current.getInputTargetBlock("VALUE")) || "";
        const assertType = COMPARE_OP_TO_TYPE[operator];
        if (assertType) {
          assertions.push({ type: assertType, output, value: val });
        }
        break;
      }
      case "assert_between": {
        const min = readValueBlockAsString(current.getInputTargetBlock("MIN")) || "";
        const max = readValueBlockAsString(current.getInputTargetBlock("MAX")) || "";
        assertions.push({ type: AssertionOperator.BETWEEN, output, min, max });
        break;
      }
      case "assert_not_null":
        assertions.push({ type: AssertionOperator.NOT_NULL, output });
        break;
      case "assert_not_empty":
        assertions.push({ type: AssertionOperator.NOT_EMPTY, output });
        break;
    }
    current = current.getNextBlock();
  }
  return assertions;
}

export function serializeStructuralBlock(block: Block): unknown {
  if (block.type === "asset_criterion") {
    return {
      operandLeft: block.getFieldValue("LEFT") || "",
      operator: block.getFieldValue("OPERATOR") || "=",
      operandRight: readValueBlockAsUnknown(block.getInputTargetBlock("RIGHT")),
    };
  }
  const policyTypes = ["odrl_permission", "odrl_prohibition", "odrl_obligation", "odrl_constraint", "odrl_constraint_jupiter", "odrl_logical_constraint"];
  if (policyTypes.includes(block.type)) {
    return serializePolicyBlock(block);
  }
  return undefined;
}

const POLICY_RULE_TYPES = ["odrl_permission", "odrl_prohibition", "odrl_obligation"] as const;

export function createArrayItemBlocks(
  ws: Workspace,
  items: unknown[],
  itemType: string
): Block[] {
  const blocks: Block[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    if (itemType === "asset_criterion") {
      const b = makeBlock(ws, "asset_criterion");
      b.setFieldValue(String(obj.operandLeft ?? ""), "LEFT");
      setDropdownValue(b, "OPERATOR", String(obj.operator ?? "="));
      if (obj.operandRight !== undefined) {
        connectValue(b, "RIGHT", createValueBlockFromString(ws, toBlockValueString(obj.operandRight)));
      }
      blocks.push(b);
    }

    if ((POLICY_RULE_TYPES as readonly string[]).includes(itemType)) {
      blocks.push(createPolicyRuleBlocks(ws, obj, itemType));
    }
  }
  return blocks;
}
