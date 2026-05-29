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
 * https://www.apache.org/licenses/LICENSE-2.0
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

import type { PolicyRule, PolicyConstraint } from "@/models/schema";
import { getConstraintsForContext, VERSION_SCHEMAS } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import { ConstraintRow } from "./ConstraintRow";

export interface RuleSectionProps {
  title: string;
  rules: PolicyRule[];
  ruleType: "permission" | "prohibition" | "obligation";
  version: "jupiter" | "saturn";
  policyType: "access" | "usage";
  isHidden?: boolean;
  onChange: (rules: PolicyRule[]) => void;
}

export function RuleSection({ title, rules, ruleType, version, policyType, isHidden, onChange }: Readonly<RuleSectionProps>) {
  const registry = getConstraintsForContext(version, policyType, ruleType);
  const schema = VERSION_SCHEMAS[version];
  const actions = schema.allowedActions[policyType] ?? [];

  const handleAddRule = () => {
    const action = actions[0] ?? "use";
    onChange([...rules, { action, constraints: [] }]);
  };

  const handleRemoveRule = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx));
  };

  const handleConstraintChange = (ruleIdx: number, cIdx: number, updated: PolicyConstraint) => {
    const newRules = rules.map((rule, ri) =>
      ri === ruleIdx
        ? { ...rule, constraints: rule.constraints.map((c, ci) => (ci === cIdx ? updated : c)) }
        : rule
    );
    onChange(newRules);
  };

  const handleConstraintDelete = (ruleIdx: number, cIdx: number) => {
    const newRules = rules.map((rule, ri) =>
      ri === ruleIdx
        ? { ...rule, constraints: rule.constraints.filter((_, ci) => ci !== cIdx) }
        : rule
    );
    onChange(newRules);
  };

  const handleAddConstraint = (ruleIdx: number) => {
    const firstKey = Object.keys(registry)[0] ?? "";
    const def = registry[firstKey];
    const newConstraint: PolicyConstraint = {
      leftOperand: firstKey,
      operator: def?.operators[0] ?? "eq",
      rightOperand: def?.rightOperand.values?.[0] ?? "",
    };
    const newRules = rules.map((rule, ri) =>
      ri === ruleIdx ? { ...rule, constraints: [...rule.constraints, newConstraint] } : rule
    );
    onChange(newRules);
  };

  const sectionClass = isHidden
    ? "preconditions-rule-section preconditions-rule-section--hidden"
    : "preconditions-rule-section";

  return (
    <div className={sectionClass}>
      <div className="preconditions-config__title">{title}</div>
      {rules.map((rule, ruleIdx) => (
        <div key={`${rule.action}-${ruleIdx}`} className="preconditions-rule-card">
          <div className="preconditions-rule-card__header">
            <span className="preconditions-rule-card__locked-chip">{rule.action}</span>
            <button className="preconditions-constraint__delete" onClick={() => handleRemoveRule(ruleIdx)} title="Remove rule">×</button>
          </div>
          <table className="preconditions-constraints">
            <thead>
              <tr><th>Left Operand</th><th>Operator</th><th>Right Operand</th><th></th></tr>
            </thead>
            <tbody>
              {rule.constraints.map((c, cIdx) => (
                <ConstraintRow
                  key={`${c.leftOperand}-${cIdx}`}
                  constraint={c}
                  registry={registry}
                  onChange={(updated) => handleConstraintChange(ruleIdx, cIdx, updated)}
                  onDelete={() => handleConstraintDelete(ruleIdx, cIdx)}
                />
              ))}
            </tbody>
          </table>
          <button className="preconditions-constraint__add-btn" onClick={() => handleAddConstraint(ruleIdx)}>
            + Add Constraint
          </button>
        </div>
      ))}
      <button className="preconditions-add-btn" onClick={handleAddRule}>
        + Add {title.slice(0, -1)}
      </button>
    </div>
  );
}
