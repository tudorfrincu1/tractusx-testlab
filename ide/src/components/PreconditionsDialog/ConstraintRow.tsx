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

import { useState } from "react";
import type { ConstraintRegistry, RightOperandDef } from "./constraintSchemas";
import type { PolicyConstraint } from "../../models/schema";

export interface ConstraintRowProps {
  constraint: PolicyConstraint;
  registry: ConstraintRegistry;
  onChange: (updated: PolicyConstraint) => void;
  onDelete: () => void;
}

export function ConstraintRow({ constraint, registry, onChange, onDelete }: ConstraintRowProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const operands = Object.keys(registry);
  const def = registry[constraint.leftOperand];

  const handleLeftOperandChange = (value: string) => {
    const newDef = registry[value];
    const defaultRight = resolveDefaultRight(newDef?.rightOperand);
    onChange({
      leftOperand: value,
      operator: newDef?.operators[0] ?? "eq",
      rightOperand: defaultRight,
    });
    setIsCustomMode(false);
  };

  const handleOperatorChange = (value: string) => {
    onChange({ ...constraint, operator: value });
  };

  const handleRightOperandChange = (value: string) => {
    onChange({ ...constraint, rightOperand: value });
  };

  const handleSelectOrCustomChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomMode(true);
      onChange({ ...constraint, rightOperand: "" });
    } else {
      setIsCustomMode(false);
      onChange({ ...constraint, rightOperand: value });
    }
  };

  return (
    <div className="constraint-row">
      <select
        className="constraint-row__select"
        value={constraint.leftOperand}
        onChange={(e) => handleLeftOperandChange(e.target.value)}
      >
        {operands.map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      {renderOperator(def, constraint.operator, handleOperatorChange)}
      {renderRightOperand(def?.rightOperand, constraint.rightOperand, handleRightOperandChange, handleSelectOrCustomChange, isCustomMode)}

      <button
        className="constraint-row__delete-btn"
        onClick={onDelete}
        title="Remove constraint"
      >
        x
      </button>
    </div>
  );
}

function renderOperator(
  def: { operators: string[] } | undefined,
  value: string,
  onChange: (v: string) => void,
) {
  if (!def || def.operators.length <= 1) {
    return <span className="constraint-row__locked">{value}</span>;
  }
  return (
    <select
      className="constraint-row__select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {def.operators.map((op) => (
        <option key={op} value={op}>{op}</option>
      ))}
    </select>
  );
}

function renderRightOperand(
  def: RightOperandDef | undefined,
  value: string | string[],
  onChange: (v: string) => void,
  onSelectOrCustom: (v: string) => void,
  isCustomMode: boolean,
) {
  const strValue = Array.isArray(value) ? value.join(", ") : value;

  if (!def) {
    return <input className="constraint-row__input" value={strValue} onChange={(e) => onChange(e.target.value)} />;
  }

  switch (def.type) {
    case "fixed":
      return <span className="constraint-row__locked">{def.values?.[0] ?? ""}</span>;

    case "select":
      return (
        <select className="constraint-row__select" value={strValue} onChange={(e) => onChange(e.target.value)}>
          {def.values?.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      );

    case "selectOrCustom":
      if (isCustomMode) {
        return (
          <input
            className="constraint-row__input"
            value={strValue}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      }
      return (
        <select className="constraint-row__select" value={strValue} onChange={(e) => onSelectOrCustom(e.target.value)}>
          {def.values?.map((v) => <option key={v} value={v}>{v}</option>)}
          <option value="__custom__">Custom...</option>
        </select>
      );

    case "pattern":
    case "custom":
    case "date":
      return (
        <input
          className="constraint-row__input"
          value={strValue}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          className="constraint-row__input"
          type="number"
          value={strValue}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function resolveDefaultRight(rightDef: RightOperandDef | undefined): string {
  if (!rightDef) return "";
  if (rightDef.type === "fixed") return rightDef.values?.[0] ?? "";
  if (rightDef.type === "select" || rightDef.type === "selectOrCustom") return rightDef.values?.[0] ?? "";
  return "";
}

// Re-export for use by PolicySection
export { resolveDefaultRight };
