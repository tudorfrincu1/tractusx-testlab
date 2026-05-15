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
import type { StepDefinition } from "../../../../models/schema";
import { serializeConstraintChain, createConstraintItemBlocks } from "./policySerializers";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
} from "../helpers";

interface ConstraintObject {
  leftOperand?: unknown;
  operator?: unknown;
  rightOperand?: unknown;
  and?: unknown[];
  or?: unknown[];
}

interface RuleObject {
  action?: string;
  constraints?: unknown[];
}

/** Serialize the custom `step_precondition_policy_config` block to a StepDefinition. */
export function serializePreconditionPolicyBlock(block: Block): StepDefinition | null {
  const version = block.getFieldValue("VERSION") || "saturn";
  const policyType = block.getFieldValue("POLICY_TYPE") || "access";
  const isJupiter = version === "jupiter";

  const permConstraints = serializeConstraintChain(block.getInputTargetBlock("PERMISSIONS"));
  const action = isJupiter ? "odrl:use" : "use";
  const permissions = permConstraints.length > 0
    ? [{ action, constraints: permConstraints }]
    : undefined;

  const params: Record<string, unknown> = {
    version,
    policy_type: policyType,
  };

  if (permissions) params.permissions = permissions;

  if (!isJupiter) {
    const prohibConstraints = serializeConstraintChain(
      block.getInputTargetBlock("PROHIBITIONS")
    );
    if (prohibConstraints.length > 0) {
      params.prohibitions = [{ constraints: prohibConstraints }];
    }

    const obligConstraints = serializeConstraintChain(
      block.getInputTargetBlock("OBLIGATIONS")
    );
    if (obligConstraints.length > 0) {
      params.obligations = [{ constraints: obligConstraints }];
    }
  }

  return {
    type: "precondition_policy_config",
    description: "Policy Config",
    params,
  };
}

/** Flatten constraints from an array of rule objects (permissions/prohibitions/obligations). */
function flattenRuleConstraints(rules: unknown[]): unknown[] {
  const allConstraints: unknown[] = [];
  for (const rule of rules) {
    if (typeof rule !== "object" || rule === null) continue;
    const ruleObj = rule as RuleObject;
    if (Array.isArray(ruleObj.constraints)) {
      allConstraints.push(...ruleObj.constraints);
    }
  }
  return allConstraints;
}

/** Create constraint blocks appropriate for the given version. */
function createConstraintBlocksForVersion(
  ws: Workspace,
  items: unknown[],
  isJupiter: boolean
): Block[] {
  if (!isJupiter) {
    return createConstraintItemBlocks(ws, items);
  }
  const blocks: Block[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as ConstraintObject;

    if (Array.isArray(obj.and) || Array.isArray(obj.or)) {
      const operator = Array.isArray(obj.and) ? "and" : "or";
      const children = (obj.and ?? obj.or) as unknown[];
      const lb = makeBlock(ws, "odrl_logical_constraint");
      setDropdownValue(lb, "OPERATOR", operator);
      const childBlocks = createConstraintBlocksForVersion(ws, children, true);
      attachChain(lb, "CONSTRAINTS", childBlocks);
      blocks.push(lb);
    } else {
      const cb = makeBlock(ws, "odrl_constraint_jupiter");
      setDropdownValue(cb, "LEFT_OPERAND", String(obj.leftOperand ?? ""));
      setDropdownValue(cb, "OPERATOR", String(obj.operator ?? "odrl:eq"));
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

interface PreconditionPolicyBlock extends Block {
  version_: string;
  updateShape_(): void;
}

/** Create a `step_precondition_policy_config` block from a model StepDefinition. */
export function deserializePreconditionPolicyBlock(
  ws: Workspace,
  step: StepDefinition
): Block {
  const params = step.params ?? {};
  const version = String(params.version ?? "saturn");
  const policyType = String(params.policy_type ?? "access");
  const isJupiter = version === "jupiter";

  const block = makeBlock(ws, "step_precondition_policy_config");
  const typed = block as unknown as PreconditionPolicyBlock;
  typed.version_ = version;
  typed.updateShape_();

  setDropdownValue(block, "VERSION", version);
  setDropdownValue(block, "POLICY_TYPE", policyType);

  if (Array.isArray(params.permissions)) {
    const constraints = flattenRuleConstraints(params.permissions as unknown[]);
    const constraintBlocks = createConstraintBlocksForVersion(ws, constraints, isJupiter);
    attachChain(block, "PERMISSIONS", constraintBlocks);
  }

  if (!isJupiter) {
    if (Array.isArray(params.prohibitions)) {
      const constraints = flattenRuleConstraints(params.prohibitions as unknown[]);
      const constraintBlocks = createConstraintBlocksForVersion(ws, constraints, false);
      attachChain(block, "PROHIBITIONS", constraintBlocks);
    }
    if (Array.isArray(params.obligations)) {
      const constraints = flattenRuleConstraints(params.obligations as unknown[]);
      const constraintBlocks = createConstraintBlocksForVersion(ws, constraints, false);
      attachChain(block, "OBLIGATIONS", constraintBlocks);
    }
  }

  if (step.description) {
    block.setFieldValue(step.description, "DESCRIPTION");
  }

  return block;
}
