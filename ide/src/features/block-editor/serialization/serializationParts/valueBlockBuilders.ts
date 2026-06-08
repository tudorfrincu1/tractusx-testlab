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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { Block, Workspace } from "blockly";
import { parseJsonWithVarRefs } from "../../blocks/json/modal/jsonVarRefs";
import { VAR_BLOCK_TYPES, emitVarRef, parseVarRef, SCOPE_TO_BLOCK_TYPE } from "../varSyntax";
import { makeBlock } from "./workspaceBlockFactory";
import { setDropdownValue } from "./blockFieldAccessors";

/** Read a value block's content as a plain string (or variable reference).
 *  - `var_steps` → `${{ steps.id.field }}` (step output)
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
    return n === undefined ? undefined : String(n);
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

function readListBlock(block: Block): unknown[] {
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

function readObjectBlock(block: Block): Record<string, unknown> {
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

function tryParseJson(rawValue: string): unknown {
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

export function readValueBlockAsUnknown(block: Block | null): unknown {
  if (!block) return undefined;
  if (block.type === "value_list") return readListBlock(block);
  if (block.type === "value_object") return readObjectBlock(block);

  const rawValue = readValueBlockAsString(block);
  if (rawValue === undefined) return undefined;
  if (parseVarRef(rawValue)) return rawValue;
  return tryParseJson(rawValue);
}

export function createValueBlockFromString(ws: Workspace, strVal: string): Block {
  // Try v2 scoped refs first (steps, services, metadata, setup, env)
  const parsed = parseVarRef(strVal);
  if (parsed) {
    const blockType = SCOPE_TO_BLOCK_TYPE[parsed.scope];
    if (blockType) {
      const vb = makeBlock(ws, blockType);
      setDropdownValue(vb, "VAR_NAME", parsed.path);
      return vb;
    }
  }

  // Legacy template syntax: {{name}} or ${name} → env variable
  const varRegex = /^(?:\{\{([^}]+)\}\}|\$\{([^}]+)\})$/;
  const varMatch = varRegex.exec(strVal);
  if (varMatch) {
    const vb = makeBlock(ws, "var_env");
    setDropdownValue(vb, "VAR_NAME", varMatch[1] || varMatch[2]);
    return vb;
  }

  // Numeric literal
  const trimmed = strVal.trim();
  const num = Number(trimmed);
  if (!Number.isNaN(num) && trimmed !== "" && String(num) === trimmed) {
    const nb = makeBlock(ws, "value_number");
    nb.setFieldValue(num, "VALUE");
    return nb;
  }

  // Default: string literal
  const vb = makeBlock(ws, "value_string");
  vb.setFieldValue(strVal, "VALUE");
  return vb;
}
