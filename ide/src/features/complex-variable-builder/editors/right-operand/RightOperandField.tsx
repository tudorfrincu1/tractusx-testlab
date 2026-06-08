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

import type { ChangeEvent } from "react";
import type { RightOperandDef } from "@/shared/ui/policy-constraints/constraintSchemas";
import { useEnvVariables } from "../templates/ui/EnvVariableProvider";
import { isVariableValue } from "../yaml/policyVariables";
import {
  type RightOperandMode,
  defaultValueForMode,
  getModeOptions,
  resolveCurrentMode,
} from "./rightOperandModes";
import { envNameFromReference, envReference } from "../templates/ui/envVariables";

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
  const { variables, valueOf } = useEnvVariables();
  if (def?.type === "fixed") {
    return <span className="precond-policy__static">{def.values?.[0] ?? ""}</span>;
  }

  const modes = getModeOptions(def);
  const mode = resolveCurrentMode(def, value);
  const variableNames = variables.map((variable) => variable.name);

  const handleModeChange = (next: RightOperandMode) => onChange(defaultValueForMode(def, next, variableNames));

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
      <ValueControl
        def={def}
        mode={mode}
        value={value}
        hasWarning={hasWarning}
        onChange={onChange}
        variableNames={variableNames}
        valueOf={valueOf}
      />
    </div>
  );
}

interface ValueControlProps {
  def: RightOperandDef | undefined;
  mode: RightOperandMode;
  value: string;
  hasWarning: boolean;
  onChange: (value: string) => void;
  variableNames: readonly string[];
  valueOf: (name: string) => string | undefined;
}

function ValueControl({
  def,
  mode,
  value,
  hasWarning,
  onChange,
  variableNames,
  valueOf,
}: Readonly<ValueControlProps>) {
  if (mode === "variable") {
    return (
      <VariableValueControl
        value={value}
        variableNames={variableNames}
        valueOf={valueOf}
        onChange={onChange}
      />
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

interface VariableValueControlProps {
  value: string;
  variableNames: readonly string[];
  valueOf: (name: string) => string | undefined;
  onChange: (value: string) => void;
}

function VariableValueControl({
  value,
  variableNames,
  valueOf,
  onChange,
}: Readonly<VariableValueControlProps>) {
  const linkedVariableName = envNameFromReference(value);
  const selectedVariableName = linkedVariableName ?? variableNames[0] ?? "";

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedName = event.target.value;
    onChange(selectedName ? envReference(selectedName) : "");
  };

  return (
    <div className="precond-policy__variable-control">
      <select
        className="precond-policy__select precond-policy__select--variable precond-policy__right-value"
        value={selectedVariableName}
        onChange={handleSelectChange}
        disabled={variableNames.length === 0}
      >
        {variableNames.length === 0 && <option value="">No env variables yet</option>}
        {variableNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {selectedVariableName && (
        <VariablePreview name={selectedVariableName} value={valueOf(selectedVariableName)} />
      )}
      {!isVariableValue(value) && value.trim() !== "" && (
        <p className="precond-policy__warning">
          Legacy literal detected. Choose an env variable to link this constraint.
        </p>
      )}
    </div>
  );
}

interface VariablePreviewProps {
  name: string;
  value: string | undefined;
}

/**
 * Read-only preview of the configured env variable. The name is always shown;
 * the configured value appears only when it is actually known, because the
 * operator may reference a variable whose content is resolved elsewhere.
 */
function VariablePreview({ name, value }: Readonly<VariablePreviewProps>) {
  const hasValue = value !== undefined && value.trim() !== "";
  return (
    <div className="precond-policy__variable-preview">
      <p className="precond-policy__variable-hint">
        References {"${{ env." + name + " }}"}
      </p>
      {hasValue ? (
        <p className="precond-policy__variable-preview-value">
          <span className="precond-policy__variable-preview-label">Configured value</span>
          <code className="precond-policy__variable-preview-code">{value}</code>
        </p>
      ) : (
        <p className="precond-policy__variable-preview-unknown">Value configured in the environment.</p>
      )}
    </div>
  );
}
