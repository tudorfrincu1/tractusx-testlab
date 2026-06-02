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

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import type { RightOperandDef } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import { AVAILABLE_VARIABLES, isVariableValue } from "./policyVariables";
import {
  type RightOperandMode,
  defaultValueForMode,
  getModeOptions,
  resolveCurrentMode,
} from "./rightOperandModes";

export interface RightOperandFieldProps {
  def: RightOperandDef | undefined;
  value: string;
  hasWarning: boolean;
  onChange: (value: string) => void;
}

/**
 * Renders the right operand of a constraint. A fixed operand is a locked chip;
 * every other operand pairs a mode select (text / select / variable / …) with
 * the matching value control, mirroring the schema-driven mockup.
 */
export function RightOperandField({ def, value, hasWarning, onChange }: Readonly<RightOperandFieldProps>) {
  if (def?.type === "fixed") {
    return (
      <span className="precond-policy__locked">
        <LockOutlinedIcon className="precond-policy__lock-icon" fontSize="inherit" />
        {def.values?.[0] ?? ""}
      </span>
    );
  }

  const modes = getModeOptions(def);
  const mode = resolveCurrentMode(def, value);

  const handleModeChange = (next: RightOperandMode) => onChange(defaultValueForMode(def, next));

  return (
    <div className="precond-policy__right-operand">
      {modes.length > 0 && (
        <select
          className="precond-policy__select precond-policy__right-mode"
          value={mode}
          onChange={(event) => handleModeChange(event.target.value as RightOperandMode)}
        >
          {modes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <ValueControl def={def} mode={mode} value={value} hasWarning={hasWarning} onChange={onChange} />
    </div>
  );
}

interface ValueControlProps {
  def: RightOperandDef | undefined;
  mode: RightOperandMode;
  value: string;
  hasWarning: boolean;
  onChange: (value: string) => void;
}

function ValueControl({ def, mode, value, hasWarning, onChange }: Readonly<ValueControlProps>) {
  if (mode === "variable") {
    const current = isVariableValue(value) ? value : AVAILABLE_VARIABLES[0];
    return (
      <select
        className="precond-policy__select precond-policy__select--variable precond-policy__right-value"
        value={current}
        onChange={(event) => onChange(event.target.value)}
      >
        {AVAILABLE_VARIABLES.map((variable) => (
          <option key={variable} value={variable}>
            {variable}
          </option>
        ))}
      </select>
    );
  }

  if (mode === "select") {
    return (
      <select
        className="precond-policy__select precond-policy__right-value"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {def?.values?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={inputClass(hasWarning)}
      type={mode === "number" ? "number" : "text"}
      value={value}
      placeholder={def?.placeholder ?? "Value…"}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function inputClass(hasWarning: boolean): string {
  return hasWarning
    ? "precond-policy__input precond-policy__right-value precond-policy__input--warning"
    : "precond-policy__input precond-policy__right-value";
}
