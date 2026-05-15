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
import { KNOWN_LEFT_OPERANDS } from "../../blocks/policyConstants";
import {
  readValueBlockAsUnknown,
  makeBlock,
  setDropdownValue,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
  attachChain,
} from "../helpers";

/** Walk a chain of constraint/logical-constraint blocks and serialize each. */
export function serializeConstraintChain(startBlock: Block | null): unknown[] {
  const items: unknown[] = [];
  let current = startBlock;
  while (current) {
    if (
      current.type === "odrl_constraint" ||
      current.type === "odrl_constraint_jupiter" ||
      current.type === "odrl_logical_constraint"
    ) {
      const serialized = serializePolicyBlock(current);
      if (serialized !== undefined) items.push(serialized);
    }
    current = current.getNextBlock();
  }
  return items;
}

/** Serialize a single ODRL policy block (permission, prohibition, obligation, constraint, logical). */
export function serializePolicyBlock(block: Block): unknown {
  if (block.type === "odrl_permission" || block.type === "odrl_prohibition" || block.type === "odrl_obligation") {
    const constraints = serializeConstraintChain(
      block.getInputTargetBlock("CONSTRAINTS")
    );
    return {
      action: block.getFieldValue("ACTION") || "use",
      constraints: constraints.length > 0 ? constraints : undefined,
    };
  }

  if (block.type === "odrl_logical_constraint") {
    const operator = block.getFieldValue("OPERATOR") || "and";
    const children = serializeConstraintChain(
      block.getInputTargetBlock("CONSTRAINTS")
    );
    return { [operator]: children };
  }

  if (block.type === "odrl_constraint" || block.type === "odrl_constraint_jupiter") {
    const left = block.getFieldValue("LEFT_OPERAND") || "";
    return {
      leftOperand: left === "__CUSTOM__" ? "" : left,
      operator: block.getFieldValue("OPERATOR") || "eq",
      rightOperand: readValueBlockAsUnknown(
        block.getInputTargetBlock("RIGHT")
      ),
    };
  }

  return undefined;
}

/** Recursively create Blockly blocks from a YAML constraint array (handles atomic + logical). */
export function createConstraintItemBlocks(
  ws: Workspace,
  items: unknown[]
): Block[] {
  const blocks: Block[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    if (Array.isArray(obj.and) || Array.isArray(obj.or)) {
      const operator = Array.isArray(obj.and) ? "and" : "or";
      const children = (obj.and ?? obj.or) as unknown[];
      const lb = makeBlock(ws, "odrl_logical_constraint");
      setDropdownValue(lb, "OPERATOR", operator);
      const childBlocks = createConstraintItemBlocks(ws, children);
      attachChain(lb, "CONSTRAINTS", childBlocks);
      blocks.push(lb);
    } else {
      const cb = makeBlock(ws, "odrl_constraint");
      const leftVal = String(obj.leftOperand ?? "");
      const mappedLeft = KNOWN_LEFT_OPERANDS.includes(leftVal)
        ? leftVal
        : "__CUSTOM__";
      setDropdownValue(cb, "LEFT_OPERAND", mappedLeft);
      setDropdownValue(cb, "OPERATOR", String(obj.operator ?? "eq"));
      if (obj.rightOperand !== undefined) {
        connectValue(
          cb,
          "RIGHT",
          createValueBlockFromString(ws, toBlockValueString(obj.rightOperand))
        );
      }
      blocks.push(cb);
    }
  }
  return blocks;
}

/** Create Blockly blocks for a policy rule type (permission, prohibition, obligation). */
export function createPolicyRuleBlocks(
  ws: Workspace,
  obj: Record<string, unknown>,
  blockType: string
): Block {
  const rb = makeBlock(ws, blockType);
  if (blockType === "odrl_permission") {
    setDropdownValue(rb, "ACTION", String(obj.action ?? "use"));
  }
  if (Array.isArray(obj.constraints)) {
    const constraintBlocks = createConstraintItemBlocks(ws, obj.constraints);
    attachChain(rb, "CONSTRAINTS", constraintBlocks);
  }
  return rb;
}
