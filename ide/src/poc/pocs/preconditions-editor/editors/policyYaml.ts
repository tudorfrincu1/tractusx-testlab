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

import { getConstraintsForContext } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyPayload } from "../types";
import { isVariableValue } from "./policyVariables";
import { validateRightOperand } from "./constraintValidation";

export type YamlTokenKind = "key" | "string" | "variable";
export interface YamlToken {
  id: string;
  text: string;
  kind: YamlTokenKind;
}
export interface YamlLine {
  id: string;
  tokens: YamlToken[];
}

export interface PolicyYamlResult {
  lines: YamlLine[];
  valid: boolean;
}

type RuleType = "permission" | "prohibition" | "obligation";

const SECTIONS: ReadonlyArray<{ key: keyof PolicyPayload; label: string; ruleType: RuleType }> = [
  { key: "permissions", label: "permissions", ruleType: "permission" },
  { key: "prohibitions", label: "prohibitions", ruleType: "prohibition" },
  { key: "obligations", label: "obligations", ruleType: "obligation" },
] as const;

/** Builds a colour-tokenised YAML preview plus an overall validity flag. */
export function buildPolicyYaml(id: string, policy: PolicyPayload): PolicyYamlResult {
  const builder = new YamlBuilder();
  builder.line(key("- id: "), str(id));
  builder.line(key("  type: "), str("policy"));
  builder.line(key("  policy_type: "), str(policy.policyType));
  builder.line(key("  dataspace_version: "), str(policy.version));

  for (const section of SECTIONS) {
    const rules = (policy[section.key] as PolicyRule[] | undefined) ?? [];
    if (rules.length === 0) continue;
    builder.line(key(`  ${section.label}:`));
    for (const rule of rules) {
      builder.line(key("    - action: "), str(rule.action));
      if (rule.constraints.length === 0) continue;
      builder.line(key("      constraints:"));
      for (const constraint of rule.constraints) {
        appendConstraint(builder, constraint, policy, section.ruleType);
      }
    }
  }
  return { lines: builder.lines, valid: builder.valid };
}

/** Accumulates colour-tokenised lines and tracks overall validity. */
class YamlBuilder {
  readonly lines: YamlLine[] = [];
  valid = true;
  private counter = 0;

  line(...tokens: YamlToken[]): void {
    const id = `line-${this.counter++}`;
    this.lines.push({ id, tokens });
  }
}

function appendConstraint(
  builder: YamlBuilder,
  constraint: PolicyConstraint,
  policy: PolicyPayload,
  ruleType: RuleType,
): void {
  const right = toStringValue(constraint.rightOperand);
  builder.line(key("        - left_operand: "), str(constraint.leftOperand));
  builder.line(key("          operator: "), str(constraint.operator));
  builder.line(key("          right_operand: "), valueToken(right));

  const registry = getConstraintsForContext(policy.version, policy.policyType, ruleType);
  const def = registry[constraint.leftOperand]?.rightOperand;
  if (validateRightOperand(def, right) !== null) builder.valid = false;
}

function valueToken(value: string): YamlToken {
  return isVariableValue(value) ? variable(value) : str(value);
}

function toStringValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

let tokenCounter = 0;
function makeToken(text: string, kind: YamlTokenKind): YamlToken {
  return { id: `token-${tokenCounter++}`, text, kind };
}
function key(text: string): YamlToken {
  return makeToken(text, "key");
}
function str(text: string): YamlToken {
  return makeToken(text, "string");
}
function variable(text: string): YamlToken {
  return makeToken(text, "variable");
}
