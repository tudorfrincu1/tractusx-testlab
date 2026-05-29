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

import { useState, useEffect } from "react";
import type { PolicyConstraint } from "@/models/schema";
import type { ConstraintRegistry, RightOperandDef } from "@/shared/ui/PreconditionsDialog/constraintSchemas";

export interface ConstraintRowProps {
  constraint: PolicyConstraint;
  registry: ConstraintRegistry;
  onChange: (updated: PolicyConstraint) => void;
  onDelete: () => void;
}

const AVAILABLE_VARIABLES = [
  "@provider_address", "@provider_bpn", "@consumer_bpn", "@certificate_type",
  "@location_bpns", "@testlab_management_url", "@testlab_dsp_url",
  "@testlab_mock_base_url", "@sut_response_timeout",
] as const;

type InputMode = "value" | "custom" | "variable";

function detectMode(value: string | string[]): InputMode {
  const v = Array.isArray(value) ? value[0] ?? "" : value;
  return v.startsWith("${{") || v.startsWith("@") ? "variable" : "value";
}

function getModesForType(def: RightOperandDef): InputMode[] {
  switch (def.type) {
    case "fixed": return [];
    case "select": return ["value", "variable"];
    case "selectOrCustom": return ["value", "custom", "variable"];
    case "pattern":
    case "custom": return ["value", "variable"];
    case "number": return ["value", "variable"];
    case "date": return ["value", "variable"];
    default: return ["value"];
  }
}

function getModeLabel(mode: InputMode, def: RightOperandDef): string {
  if (mode === "variable") return "Variable (@)";
  if (mode === "custom") return "Custom";
  switch (def.type) {
    case "select":
    case "selectOrCustom": return "Select value...";
    case "number": return "Number";
    case "date": return "Date";
    default: return "Text";
  }
}

export function ConstraintRow({ constraint, registry, onChange, onDelete }: Readonly<ConstraintRowProps>) {
  const def = registry[constraint.leftOperand];
  const operators = def?.operators ?? ["eq"];
  const rightDef: RightOperandDef = def?.rightOperand ?? { type: "custom", placeholder: "" };
  const modes = getModesForType(rightDef);

  const currentValue = Array.isArray(constraint.rightOperand)
    ? constraint.rightOperand[0] ?? ""
    : constraint.rightOperand;

  const [mode, setMode] = useState<InputMode>(() => detectMode(constraint.rightOperand));

  useEffect(() => {
    setMode(detectMode(constraint.rightOperand));
  }, [constraint.rightOperand]);

  const handleLeftChange = (left: string) => {
    const newDef = registry[left];
    const newOp = newDef?.operators[0] ?? "eq";
    const newVal = newDef?.rightOperand.values?.[0] ?? "";
    onChange({ leftOperand: left, operator: newOp, rightOperand: newVal });
  };

  const handleOperatorChange = (op: string) => {
    onChange({ ...constraint, operator: op });
  };

  const handleValueChange = (val: string) => {
    onChange({ ...constraint, rightOperand: val });
  };

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    if (newMode === "variable") {
      onChange({ ...constraint, rightOperand: AVAILABLE_VARIABLES[0] });
    } else {
      const fallback = rightDef.values?.[0] ?? "";
      onChange({ ...constraint, rightOperand: fallback });
    }
  };

  const renderValueInput = () => {
    if (mode === "custom" || rightDef.type === "pattern" || rightDef.type === "custom" || rightDef.type === "number" || rightDef.type === "date") {
      const inputType = rightDef.type === "number" ? "number" : rightDef.type === "date" ? "date" : "text";
      return <input className="preconditions-constraint__input" type={inputType} value={currentValue} placeholder={rightDef.placeholder} onChange={(e) => handleValueChange(e.target.value)} />;
    }
    return (
      <select className="preconditions-constraint__select" value={currentValue} onChange={(e) => handleValueChange(e.target.value)}>
        {(rightDef.values ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    );
  };

  const renderRightOperand = () => {
    if (rightDef.type === "fixed") {
      return <span className="preconditions-rule-card__locked-chip">{rightDef.values?.[0]}</span>;
    }

    return (
      <div className="preconditions-right-operand">
        {modes.length > 0 && (
          <select
            className="preconditions-constraint__select"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as InputMode)}
          >
            {modes.map((m) => (
              <option key={m} value={m}>{getModeLabel(m, rightDef)}</option>
            ))}
          </select>
        )}
        {mode === "variable" ? (
          <select
            className="preconditions-constraint__select preconditions-constraint__input--variable"
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            {AVAILABLE_VARIABLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : renderValueInput()}
      </div>
    );
  };

  return (
    <tr>
      <td>
        <select
          className="preconditions-constraint__select"
          value={constraint.leftOperand}
          onChange={(e) => handleLeftChange(e.target.value)}
        >
          {Object.keys(registry).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </td>
      <td>
        <select
          className="preconditions-constraint__select"
          value={constraint.operator}
          onChange={(e) => handleOperatorChange(e.target.value)}
        >
          {operators.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </td>
      <td>{renderRightOperand()}</td>
      <td>
        <button className="preconditions-constraint__delete" onClick={onDelete} title="Remove">×</button>
      </td>
    </tr>
  );
}
