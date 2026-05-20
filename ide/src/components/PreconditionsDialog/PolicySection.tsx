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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useCallback } from "react";
import { ConstraintRow, resolveDefaultRight } from "./ConstraintRow";
import { getConstraintsForContext } from "./constraintSchemas";
import type { PolicyConstraint, PolicyRule } from "../../models/schema";

export interface PolicySectionProps {
  title: string;
  rules: PolicyRule[];
  ruleType: "permission" | "prohibition" | "obligation";
  version: "jupiter" | "saturn";
  policyType: "access" | "usage";
  onChange: (rules: PolicyRule[]) => void;
}

export function PolicySection({ title, rules, ruleType, version, policyType, onChange }: PolicySectionProps) {
  const registry = getConstraintsForContext(version, policyType, ruleType);
  const constraints = rules[0]?.constraints ?? [];

  const handleConstraintChange = useCallback((index: number, updated: PolicyConstraint) => {
    const newConstraints = [...constraints];
    newConstraints[index] = updated;
    onChange([{ ...rules[0], constraints: newConstraints }]);
  }, [constraints, rules, onChange]);

  const handleConstraintDelete = useCallback((index: number) => {
    const newConstraints = constraints.filter((_, i) => i !== index);
    onChange([{ ...rules[0], constraints: newConstraints }]);
  }, [constraints, rules, onChange]);

  const handleAddConstraint = useCallback(() => {
    const operands = Object.keys(registry);
    if (operands.length === 0) return;
    const firstOperand = operands[0];
    const def = registry[firstOperand];
    const newConstraint: PolicyConstraint = {
      leftOperand: firstOperand,
      operator: def.operators[0],
      rightOperand: resolveDefaultRight(def.rightOperand),
    };
    const newConstraints = [...constraints, newConstraint];
    const action = rules[0]?.action ?? "use";
    onChange([{ action, constraints: newConstraints }]);
  }, [constraints, rules, registry, onChange]);

  const operands = Object.keys(registry);
  if (operands.length === 0) return null;

  return (
    <div className="policy-section">
      <h4 className="policy-section__title">{title}</h4>
      <div className="policy-section__rows">
        {constraints.length === 0 && (
          <div className="policy-section__empty">No constraints configured</div>
        )}
        {constraints.map((constraint, index) => (
          <ConstraintRow
            key={`${constraint.leftOperand}-${constraint.operator}-${index}`}
            constraint={constraint}
            registry={registry}
            onChange={(updated) => handleConstraintChange(index, updated)}
            onDelete={() => handleConstraintDelete(index)}
          />
        ))}
      </div>
      <button className="policy-section__add-btn" onClick={handleAddConstraint}>
        + Add Constraint
      </button>
    </div>
  );
}
