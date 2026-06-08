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
import type { ConstraintRegistry } from "@/shared/ui/policy-constraints/constraintSchemas";
import type { PolicyConstraint } from "@/models/schema";
import { RightOperandField } from "./RightOperandField";
import { validateRightOperand } from "./constraintValidation";

export interface ConstraintRowProps {
  index: number;
  constraint: PolicyConstraint;
  registry: ConstraintRegistry;
  onChange: (updated: PolicyConstraint) => void;
  onDelete: () => void;
}

/** One constraint as a labeled card: left operand · operator · value. */
export function ConstraintRow({
  index,
  constraint,
  registry,
  onChange,
  onDelete,
}: Readonly<ConstraintRowProps>) {
  const def = registry[constraint.leftOperand];
  const operands = Object.keys(registry);
  const isUnknownOperand = !operands.includes(constraint.leftOperand);
  const rightValue = toStringValue(constraint.rightOperand);
  const warning = validateRightOperand(def?.rightOperand, rightValue);

  const handleLeftChange = (leftOperand: string) => {
    const nextDef = registry[leftOperand];
    onChange({
      leftOperand,
      operator: nextDef?.operators[0] ?? "eq",
      rightOperand: resolveDefaultRight(nextDef?.rightOperand),
    });
  };

  return (
    <div className="precond-policy__constraint">
      <div className="precond-policy__constraint-head">
        <span className="precond-policy__constraint-title">Constraint {index + 1}</span>
        <button
          type="button"
          className="precond-policy__row-delete"
          onClick={onDelete}
          title="Remove constraint"
        >
          ×
        </button>
      </div>
      <div className="precond-policy__constraint-fields">
        <label className="precond-policy__field">
          <span className="precond-policy__field-label">Left operand</span>
          <select
            className="precond-policy__select"
            value={constraint.leftOperand}
            onChange={(event) => handleLeftChange(event.target.value)}
          >
            {operands.map((operand) => (
              <option key={operand} value={operand}>
                {operand}
              </option>
            ))}
            {isUnknownOperand && (
              <option value={constraint.leftOperand}>{constraint.leftOperand} (custom)</option>
            )}
          </select>
        </label>
        <div className="precond-policy__field">
          <span className="precond-policy__field-label">Operator</span>
          <OperatorField
            operators={def?.operators ?? [constraint.operator]}
            value={constraint.operator}
            onChange={(operator) => onChange({ ...constraint, operator })}
          />
        </div>
        <div className="precond-policy__field precond-policy__field--full">
          <span className="precond-policy__field-label">Value</span>
          <RightOperandField
            def={def?.rightOperand}
            value={rightValue}
            hasWarning={warning !== null}
            onChange={(value) => onChange({ ...constraint, rightOperand: value })}
          />
          {warning && <p className="precond-policy__warning">{warning}</p>}
        </div>
      </div>
    </div>
  );
}

interface OperatorFieldProps {
  operators: string[];
  value: string;
  onChange: (operator: string) => void;
}

function OperatorField({ operators, value, onChange }: Readonly<OperatorFieldProps>) {
  if (operators.length <= 1) {
    return <span className="precond-policy__static">{value}</span>;
  }
  return (
    <select
      className="precond-policy__select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {operators.map((operator) => (
        <option key={operator} value={operator}>
          {operator}
        </option>
      ))}
    </select>
  );
}

function toStringValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}
