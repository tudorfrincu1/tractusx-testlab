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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import "./ServiceCard.css";

export interface FieldWithToggleProps {
  label: string;
  value: string;
  variables: ReadonlyArray<{ name: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

export function FieldWithToggle({
  label,
  value,
  variables,
  onChange,
  placeholder,
  hint,
}: FieldWithToggleProps) {
  const isVariableMode = value.startsWith("${{") || value.startsWith("@");

  function handleToggle() {
    if (isVariableMode) {
      const varsMatch = /^\$\{\{\s*vars\.(.+?)\s*\}\}$/.exec(value);
      onChange(varsMatch ? varsMatch[1] : value.startsWith("@") ? value.slice(1) : value);
    } else {
      const firstVar = variables[0]?.name ?? "";
      onChange(`\${{ vars.${firstVar} }}`);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(`\${{ vars.${e.target.value} }}`);
  }

  return (
    <div className="form-group full-width">
      <label>{label}</label>
      <div className="field-with-toggle">
        {isVariableMode ? (
          <select value={(() => { const m = /^\$\{\{\s*vars\.(.+?)\s*\}\}$/.exec(value); return m ? m[1] : value.startsWith("@") ? value.slice(1) : value; })()} onChange={handleSelectChange}>
            {variables.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="mono"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
        )}
        <div className="field-toggle-wrapper">
          <span className="field-toggle-label">VAR</span>
          <div
            className={`toggle-switch${isVariableMode ? " active" : ""}`}
            onClick={handleToggle}
            role="switch"
            aria-checked={isVariableMode}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleToggle();
            }}
          />
        </div>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}
