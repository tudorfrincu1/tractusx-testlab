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

import type { Block, Workspace } from "blockly";
import type { BlocklyFieldDropdownInternal } from "../../../types/blockly-internals.d";
import { serializePolicyBlock, createPolicyRuleBlocks } from "./serialize/policySerializers";
import * as deferredDropdowns from "./deferredDropdowns";
import { parseJsonWithVarRefs } from "../blocks/json/modal/jsonVarRefs";
import { VAR_BLOCK_TYPES, emitVarRef, parseVarRef, SCOPE_TO_BLOCK_TYPE } from "./varSyntax";

export type { WorkspaceAssertion } from "./assertionChain";
export { readAssertionChain } from "./assertionChain";

/** Read a value block's content as a plain string (or variable reference).
 *  - `var_steps` → `${{ steps.id.field }}` (step output)
 *  - `var_preconditions` → `${{ preconditions.id.field }}`
 *  - `var_env` → `${{ env.name }}`
 *  - `var_services` → `${{ env.services.name.field }}`
 *  - `var_metadata` → `${{ metadata.field }}`
 *  - `var_setup` → `${{ setup.id.field }}`
 */
export function readValueBlockAsString(block: Block | null): string | undefined {
  if (!block) return undefined;
  if (block.type === "output_variable") {
    // Legacy fallback: old workspaces may still contain this block type
    const raw = block.getFieldValue("VAR_NAME") || "";
    const v = raw.replace(/^steps\./, "");
    return v && v !== "__NONE__" ? emitVarRef("steps", v) : undefined;
  }
  const scope = VAR_BLOCK_TYPES[block.type];
  if (scope) {
    const varName = block.getFieldValue("VAR_NAME") || "";
    if (!varName || varName === "__NONE__") return undefined;
    return emitVarRef(scope, varName);
  }
  if (block.type === "value_string" || block.type === "value_regex") {
    return block.getFieldValue("VALUE") || undefined;
  }
  if (block.type === "value_json_path") {
    return block.getFieldValue("VALUE") || undefined;
  }
  if (block.type === "value_api_path") {
    return block.getFieldValue("PATH") || undefined;
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
  if (!block) return undefined;
  if (block.type === "value_list") {
    const items: unknown[] = [];
    let current = block.getInputTargetBlock("ITEMS");
    while (current) {
      if (current.type === "list_item") {
        const valueBlock = current.getInputTargetBlock("VALUE");
        const val = readValueBlockAsUnknown(valueBlock);
        if (val !== undefined) items.push(val);
      }
      current = current.getNextBlock();
    }
    return items;
  }
  if (block.type === "value_object") {
    const entries: Record<string, unknown> = {};
    let current = block.getInputTargetBlock("ENTRIES");
    while (current) {
      if (current.type === "key_value_pair") {
        const key = current.getFieldValue("KEY") || "";
        if (key) {
          const valueBlock = current.getInputTargetBlock("VALUE");
          entries[key] = readValueBlockAsUnknown(valueBlock);
        }
      }
      current = current.getNextBlock();
    }
    return entries;
  }
  const rawValue = readValueBlockAsString(block);
  if (rawValue === undefined) return undefined;
  if (parseVarRef(rawValue)) return rawValue;

  const trimmed = rawValue.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseJsonWithVarRefs(trimmed);
    } catch {
      return rawValue;
    }
  }

  return rawValue;
}

export function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  (b as unknown as { initSvg: () => void }).initSvg();
  (b as unknown as { render: () => void }).render();
  return b;
}

export function setDropdownValue(block: Block, fieldName: string, value: string) {
  const field = block.getField(fieldName);
  if (!field) return;
  const f = field as unknown as BlocklyFieldDropdownInternal;
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
  // Try v2 scoped refs first (steps, preconditions, services, metadata, setup)
  const parsed = parseVarRef(strVal);
  if (parsed) {
    const blockType = SCOPE_TO_BLOCK_TYPE[parsed.scope];
    if (blockType) {
      const vb = makeBlock(ws, blockType);
      setDropdownValue(vb, "VAR_NAME", parsed.path);
      return vb;
    }
  }

  const parsedVar = parseVarRef(strVal);
  if (parsedVar && parsedVar.scope === "env") {
    const vb = makeBlock(ws, "var_env");
    setDropdownValue(vb, "VAR_NAME", parsedVar.path);
    return vb;
  }
  const varMatch = strVal.match(/^(?:\{\{(.+)\}\}|\$\{(.+)\})$/);
  if (varMatch) {
    const vb = makeBlock(ws, "var_env");
    const name = varMatch[1] || varMatch[2];
    setDropdownValue(vb, "VAR_NAME", name);
    return vb;
  }

  const trimmed = strVal.trim();
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "" && String(num) === trimmed) {
    const nb = makeBlock(ws, "value_number");
    nb.setFieldValue(num, "VALUE");
    return nb;
  }
  const vb = makeBlock(ws, "value_string");
  vb.setFieldValue(strVal, "VALUE");
  return vb;
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
