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
import { serializePolicyBlock, createPolicyRuleBlocks } from "../serialize/policySerializers";
import { readValueBlockAsUnknown } from "./valueBlocks";
import { makeBlock, setDropdownValue, connectValue } from "./blockUtils";
import { toBlockValueString, createValueBlockFromString } from "./valueBlocks";

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
