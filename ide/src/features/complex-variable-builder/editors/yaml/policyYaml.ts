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

import type { PolicyRule } from "@/models/schema";
import type { PolicyPayload } from "../../model";
import { appendConstraint, type RuleType } from "./policyYamlConstraints";
import { YamlBuilder, type YamlLine, key, str } from "./policyYamlTokens";

export type { YamlToken, YamlTokenKind, YamlLine } from "./policyYamlTokens";

export interface PolicyYamlResult {
  lines: YamlLine[];
  valid: boolean;
}

const SECTIONS: ReadonlyArray<{ key: keyof PolicyPayload; label: string; ruleType: RuleType }> = [
  { key: "permissions", label: "permissions", ruleType: "permission" },
  { key: "prohibitions", label: "prohibitions", ruleType: "prohibition" },
  { key: "obligations", label: "obligations", ruleType: "obligation" },
] as const;

/**
 * Builds a colour-tokenised preview of the canonical authoring YAML for a
 * policy precondition: a `precondition/provide` step whose `with.value` holds
 * the permissions/prohibitions/obligations and a fixed `returns.policy` block.
 */
export function buildPolicyYaml(id: string, name: string, policy: PolicyPayload): PolicyYamlResult {
  const builder = new YamlBuilder();
  builder.line(key(`- id: ${id}`));
  builder.line(key("  uses: precondition/provide"));
  builder.line(key(`  name: ${name}`));
  builder.line(key("  with:"));
  builder.line(key("    value:"));

  for (const section of SECTIONS) {
    const rules = (policy[section.key] as PolicyRule[] | undefined) ?? [];
    if (rules.length === 0) continue;
    builder.line(key(`      ${section.label}:`));
    for (const rule of rules) appendRule(builder, rule, policy, section.ruleType);
  }

  appendReturns(builder);
  return { lines: builder.lines, valid: builder.valid };
}

/** Emits a single rule plus its constraints, wrapping multi-constraint rules in `and:`. */
function appendRule(
  builder: YamlBuilder,
  rule: PolicyRule,
  policy: PolicyPayload,
  ruleType: RuleType,
): void {
  builder.line(key(`        - action: ${rule.action}`));
  if (rule.constraints.length === 0) return;

  builder.line(key("          constraints:"));
  const wrapInAnd = rule.constraints.length > 1;
  const indent = wrapInAnd ? "              " : "            ";
  if (wrapInAnd) builder.line(key("            and:"));

  for (const constraint of rule.constraints) {
    appendConstraint(builder, constraint, indent, policy, ruleType);
  }
}

/** Emits the fixed `returns.policy` object every policy precondition produces. */
function appendReturns(builder: YamlBuilder): void {
  builder.line(key("  returns:"));
  builder.line(key("    policy:"));
  builder.line(key("      type: "), str("object"));
  builder.line(key("      class: "), str("Policy"));
}
