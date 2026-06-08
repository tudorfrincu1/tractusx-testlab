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

import { getConstraintsForContext } from "@/shared/ui/policy-constraints/constraintSchemas";
import type { PolicyConstraint } from "@/models/schema";
import type { PolicyPayload } from "../../model";
import { validateRightOperand } from "../right-operand/constraintValidation";
import { YamlBuilder, key, scalarValueToken } from "./policyYamlTokens";

export type RuleType = "permission" | "prohibition" | "obligation";

/** Operators whose right operand is a list, even when only one value is given. */
const ARRAY_OPERATORS: ReadonlySet<string> = new Set([
  "isAnyOf",
  "isAllOf",
  "isNoneOf",
  "isPartOf",
]);

/** Normalises a right operand to a value list, dropping empty entries. */
function toValueList(rightOperand: string | string[]): string[] {
  const values = Array.isArray(rightOperand) ? rightOperand : [rightOperand];
  return values.filter((value) => value.trim() !== "");
}

/**
 * Emits one constraint at the given indentation. The `- left_operand` marker
 * sits at `indent`; `operator` / `right_operand` align two spaces deeper.
 * Array operators render their right operand as a YAML list, scalar operators
 * inline a single value.
 */
export function appendConstraint(
  builder: YamlBuilder,
  constraint: PolicyConstraint,
  indent: string,
  policy: PolicyPayload,
  ruleType: RuleType,
): void {
  const inner = `${indent}  `;
  builder.line(key(`${indent}- left_operand: ${constraint.leftOperand}`));
  builder.line(key(`${inner}operator: ${constraint.operator}`));

  const values = toValueList(constraint.rightOperand);
  if (ARRAY_OPERATORS.has(constraint.operator)) {
    builder.line(key(`${inner}right_operand:`));
    for (const value of values) {
      builder.line(key(`${inner}  - `), scalarValueToken(value));
    }
  } else {
    builder.line(key(`${inner}right_operand: `), scalarValueToken(values[0] ?? ""));
  }

  trackValidity(builder, constraint, values, policy, ruleType);
}

function trackValidity(
  builder: YamlBuilder,
  constraint: PolicyConstraint,
  values: string[],
  policy: PolicyPayload,
  ruleType: RuleType,
): void {
  const registry = getConstraintsForContext(policy.version, policy.policyType, ruleType);
  const def = registry[constraint.leftOperand]?.rightOperand;
  const checked = values.length === 0 ? [""] : values;
  for (const value of checked) {
    if (validateRightOperand(def, value) !== null) builder.valid = false;
  }
}
