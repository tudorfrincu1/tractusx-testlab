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

import { resolveDefaultRight } from "@/shared/ui/policy-constraints/ConstraintRow";
import { getConstraintsForContext } from "@/shared/ui/policy-constraints/constraintSchemas";
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyType, PolicyVersion } from "../../model";
import { ConstraintRow } from "../right-operand/ConstraintRow";

export interface RuleSectionEditorProps {
  title: string;
  addLabel: string;
  rules: PolicyRule[];
  ruleType: "permission" | "prohibition" | "obligation";
  version: PolicyVersion;
  policyType: PolicyType;
  action: string;
  onChange: (rules: PolicyRule[]) => void;
}

/** A policy rule section: a list of rule cards, each with a constraint table. */
export function RuleSectionEditor({
  title,
  addLabel,
  rules,
  ruleType,
  version,
  policyType,
  action,
  onChange,
}: Readonly<RuleSectionEditorProps>) {
  const registry = getConstraintsForContext(version, policyType, ruleType);

  const replaceRule = (index: number, rule: PolicyRule) =>
    onChange(rules.map((existing, i) => (i === index ? rule : existing)));

  const handleAddRule = () => onChange([...rules, { action, constraints: [] }]);
  const handleRemoveRule = (index: number) => onChange(rules.filter((_, i) => i !== index));

  const handleAddConstraint = (index: number) => {
    const constraint = createConstraint(registry);
    if (!constraint) return;
    const rule = rules[index];
    replaceRule(index, { ...rule, constraints: [...rule.constraints, constraint] });
  };

  const handleConstraintChange = (ruleIndex: number, cIndex: number, updated: PolicyConstraint) => {
    const rule = rules[ruleIndex];
    const constraints = rule.constraints.map((c, i) => (i === cIndex ? updated : c));
    replaceRule(ruleIndex, { ...rule, constraints });
  };

  const handleConstraintDelete = (ruleIndex: number, cIndex: number) => {
    const rule = rules[ruleIndex];
    replaceRule(ruleIndex, { ...rule, constraints: rule.constraints.filter((_, i) => i !== cIndex) });
  };

  return (
    <section className="precond-policy__section">
      <h4 className="precond-policy__section-title">{title}</h4>
      {rules.map((rule, ruleIndex) => (
        <div className="precond-policy__card" key={`${ruleType}-${ruleIndex}`}>
          <div className="precond-policy__card-head">
            <span className="precond-policy__action-row">
              <span className="precond-policy__action-label">Action</span>
              <span className="precond-policy__static">{rule.action}</span>
            </span>
            <button
              type="button"
              className="precond-policy__card-remove"
              onClick={() => handleRemoveRule(ruleIndex)}
              title="Remove rule"
            >
              ×
            </button>
          </div>
          <div className="precond-policy__constraints">
            {rule.constraints.length === 0 && (
              <p className="precond-policy__constraints-empty">
                No constraints yet. Add one to restrict this rule.
              </p>
            )}
            {rule.constraints.map((constraint, cIndex) => (
              <ConstraintRow
                key={`${constraint.leftOperand}-${cIndex}`}
                index={cIndex}
                constraint={constraint}
                registry={registry}
                onChange={(updated) => handleConstraintChange(ruleIndex, cIndex, updated)}
                onDelete={() => handleConstraintDelete(ruleIndex, cIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            className="precond-policy__add-constraint"
            onClick={() => handleAddConstraint(ruleIndex)}
          >
            + Add constraint
          </button>
        </div>
      ))}
      <button type="button" className="precond-policy__add-rule" onClick={handleAddRule}>
        {addLabel}
      </button>
    </section>
  );
}

function createConstraint(
  registry: ReturnType<typeof getConstraintsForContext>,
): PolicyConstraint | null {
  const [firstOperand] = Object.keys(registry);
  if (!firstOperand) return null;
  const def = registry[firstOperand];
  return {
    leftOperand: firstOperand,
    operator: def.operators[0],
    rightOperand: resolveDefaultRight(def.rightOperand),
  };
}
