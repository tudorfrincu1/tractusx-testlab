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

import type { Block } from "blockly";
import type { StepDefinition, InlineValidation } from "@/models/schema";
import { findCatalogEntry, type BlockCatalog } from "../../../blocks";
import { readValueBlockAsString, readValueBlockAsUnknown, readAssertionChain, serializeStructuralBlock } from "../../serializationParts";
import { parseJsonWithVarRefs } from "../../../blocks/json/modal/jsonVarRefs";
import { emitVarRef } from "../../varSyntax";
import { toInlineValidation, readFilterExpressionChain } from "../validation/validationBlockReaders";
import { readStepChain } from "../reader/stepChainReader";

/** Convert a single `step_*` Blockly block into a v2 step definition. */
export function blockToStep(block: Block, catalog: BlockCatalog, knownOutputs: ReadonlySet<string>): StepDefinition | null {
  if (!block.type.startsWith("step_")) return null;

  const stepType = block.type.replace("step_", "");
  const description = block.getFieldValue("DESCRIPTION") || "";
  const catalogEntry = findCatalogEntry(stepType, catalog);

  const params = serializeBlockParams(block, catalogEntry, catalog, knownOutputs);
  const storeInMemory = resolveStepReturns(block, catalogEntry);

  const rawValidate = readAssertionChain(block.getInputTargetBlock("EXPECT"));
  const validate: InlineValidation[] = rawValidate.map((a) => toInlineValidation(a as unknown as Record<string, unknown>));

  const stepId = block.getFieldValue("STEP_ID") || "";

  return {
    id: stepId,
    uses: resolveStepUses(catalogEntry, stepType),
    name: description || undefined,
    with: params,
    validate: validate.length > 0 ? validate : undefined,
    returns: storeInMemory,
  };
}

/** Serialize all params from a step block based on its catalog entry. */
function serializeBlockParams(
  block: Block,
  catalogEntry: ReturnType<typeof findCatalogEntry>,
  catalog: BlockCatalog,
  knownOutputs: ReadonlySet<string>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (!catalogEntry) return params;

  for (const p of catalogEntry.params) {
    const fieldKey = `PARAM_${p.name.toUpperCase()}`;
    const value = serializeSingleParam(block, p, fieldKey, catalog, knownOutputs);
    if (value !== undefined) params[p.name] = value;
  }
  return params;
}

/** Serialize a field-based parameter (dropdown, text, number, variable, etc.). */
function serializeFieldParam(
  block: Block,
  paramType: string,
  fieldKey: string,
  knownOutputs: ReadonlySet<string>,
): unknown {
  const val = block.getFieldValue(fieldKey);
  switch (paramType) {
    case "dropdown":
    case "endpoint_ref":
    case "schema_path":
      return (val && val !== "__NONE__") ? val : undefined;
    case "variable":
      if (!val || val === "__NONE__") return undefined;
      return knownOutputs.has(val) ? emitVarRef("steps", val) : emitVarRef("env", val);
    case "text":
      return val ? String(val) : undefined;
    case "number":
      return (val !== undefined && val !== null) ? Number(val) : undefined;
    default:
      return undefined;
  }
}

/** Serialize an array-typed parameter from chained blocks. */
function serializeArrayParam(block: Block, fieldKey: string): unknown[] | undefined {
  const items: unknown[] = [];
  let itemBlock = block.getInputTargetBlock(fieldKey);
  while (itemBlock) {
    const serialized = serializeStructuralBlock(itemBlock);
    if (serialized !== undefined) items.push(serialized);
    itemBlock = itemBlock.getNextBlock();
  }
  return items.length > 0 ? items : undefined;
}

/** Field-based param types that use getFieldValue directly. */
const FIELD_PARAM_TYPES = new Set(["dropdown", "endpoint_ref", "schema_path", "variable", "text", "number"]);

/** Serialize one parameter based on its type. */
function serializeSingleParam(
  block: Block,
  p: { name: string; type: string },
  fieldKey: string,
  catalog: BlockCatalog,
  knownOutputs: ReadonlySet<string>,
): unknown {
  if (FIELD_PARAM_TYPES.has(p.type)) {
    return serializeFieldParam(block, p.type, fieldKey, knownOutputs);
  }
  switch (p.type) {
    case "json":
      return serializeJsonParam(block, fieldKey, knownOutputs);
    case "steps": {
      const nested = readStepChain(block.getInputTargetBlock(fieldKey), catalog);
      return nested.length > 0 ? nested : undefined;
    }
    case "filter_expression_list": {
      const filters = readFilterExpressionChain(block.getInputTargetBlock(fieldKey));
      return filters.length > 0 ? filters : undefined;
    }
    case "array":
      return serializeArrayParam(block, fieldKey);
    default: {
      const connectedBlock = block.getInputTargetBlock(fieldKey);
      return connectedBlock ? (readValueBlockAsString(connectedBlock) || undefined) : undefined;
    }
  }
}

/** Serialize a JSON-typed parameter from its connected block. */
function serializeJsonParam(
  block: Block,
  fieldKey: string,
  knownOutputs: ReadonlySet<string>,
): unknown {
  const connected = block.getInputTargetBlock(fieldKey);
  if (!connected) return undefined;

  const varStr = readValueBlockAsString(connected);
  if (varStr) return varStr;

  if (connected.type === "value_json") {
    const raw = connected.getFieldValue("JSON_VALUE") || "{}";
    try {
      const parsed: unknown = parseJsonWithVarRefs(raw, knownOutputs);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON stored — skip
    }
    return undefined;
  }

  const structured = readValueBlockAsUnknown(connected);
  return structured;
}

/** Resolve the returns/storeInMemory map for a step. */
function resolveStepReturns(
  block: Block,
  catalogEntry: ReturnType<typeof findCatalogEntry>,
): Record<string, string> | undefined {
  // First try to read custom returns from block.data (roundtrip fidelity)
  if (block.data) {
    try {
      const blockData: unknown = JSON.parse(block.data);
      if (blockData && typeof blockData === "object" && "returns" in blockData) {
        const custom = (blockData as Record<string, unknown>).returns;
        if (custom && typeof custom === "object") {
          return custom as Record<string, string>;
        }
      }
    } catch {
      // Invalid JSON in block.data — fall through to default
    }
  }

  // Fallback: generate default returns from catalog outputs
  if (catalogEntry?.outputs && catalogEntry.outputs.length > 0) {
    const storeInMemory: Record<string, string> = {};
    for (const output of catalogEntry.outputs) {
      storeInMemory[output.name] = "$";
    }
    return storeInMemory;
  }

  return undefined;
}

/** Resolve the uses field for a step definition. */
function resolveStepUses(
  catalogEntry: ReturnType<typeof findCatalogEntry>,
  stepType: string,
): string {
  if (!catalogEntry?.uses) return stepType;
  return Array.isArray(catalogEntry.uses) ? catalogEntry.uses[0] : catalogEntry.uses;
}
