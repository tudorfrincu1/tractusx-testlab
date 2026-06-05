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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

// Recognizes whether a logical policy (recovered from hand-edited ODRL) still
// matches one of the catalog templates. A match means: same kind, same set of
// constraint operands, every fixed right operand unchanged, only the templated
// `@token` value(s) free to differ. We return the template id plus the value(s)
// to bind, so the host can stay in template mode and update just the variables.
// No match (extra/removed constraints, different operands, changed literals)
// means the policy is custom and the host should drop to advanced mode.
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyType } from "../../../model";
import { POLICY_TEMPLATES } from "./policyTemplates";
import type { TemplateConstraint } from "./policyTemplates";

/** The logical policy shape this matcher compares against the catalog. */
export interface LogicalPolicyInput {
  policyType: PolicyType;
  permissions: PolicyRule[];
}

/** A recognized template and the variable value(s) to bind into it. */
export interface TemplateMatch {
  templateId: string;
  variableValues: Record<string, string>;
}

/** First catalog template whose shape matches `input`, or `null` when custom. */
export function matchTemplate(input: LogicalPolicyInput): TemplateMatch | null {
  const constraints = input.permissions[0]?.constraints ?? [];
  for (const template of POLICY_TEMPLATES) {
    if (template.kind !== input.policyType) {
      continue;
    }
    const variableValues = matchConstraints(template.constraints, constraints);
    if (variableValues !== null) {
      return { templateId: template.id, variableValues };
    }
  }
  return null;
}

/** Pair each template constraint with a logical one by operand+operator. */
function matchConstraints(
  templateConstraints: readonly TemplateConstraint[],
  logicalConstraints: readonly PolicyConstraint[],
): Record<string, string> | null {
  if (templateConstraints.length !== logicalConstraints.length) {
    return null;
  }
  const pool = [...logicalConstraints];
  const variableValues: Record<string, string> = {};
  for (const templateConstraint of templateConstraints) {
    const index = pool.findIndex(
      (candidate) =>
        candidate.leftOperand === templateConstraint.leftOperand &&
        candidate.operator === templateConstraint.operator,
    );
    if (index < 0) {
      return null;
    }
    const [matched] = pool.splice(index, 1);
    if (!bindConstraint(templateConstraint, matched, variableValues)) {
      return null;
    }
  }
  return pool.length === 0 ? variableValues : null;
}

/** A token right operand captures a value; a literal must compare equal. */
function bindConstraint(
  templateConstraint: TemplateConstraint,
  logicalConstraint: PolicyConstraint,
  variableValues: Record<string, string>,
): boolean {
  const token = tokenOf(templateConstraint.rightOperand);
  if (token !== null) {
    variableValues[token] = toScalar(logicalConstraint.rightOperand);
    return true;
  }
  return rightOperandsEqual(templateConstraint.rightOperand, logicalConstraint.rightOperand);
}

function tokenOf(rightOperand: string | string[]): string | null {
  return typeof rightOperand === "string" && rightOperand.startsWith("@") ? rightOperand : null;
}

function toScalar(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function rightOperandsEqual(left: string | string[], right: string | string[]): boolean {
  const leftList = [...toArray(left)].sort((a, b) => a.localeCompare(b));
  const rightList = [...toArray(right)].sort((a, b) => a.localeCompare(b));
  return leftList.length === rightList.length && leftList.every((value, index) => value === rightList[index]);
}

function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}
