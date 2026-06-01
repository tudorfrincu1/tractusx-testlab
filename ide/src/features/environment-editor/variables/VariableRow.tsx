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
import type { EnvironmentVariable } from "@/models/environment";
import { GENERATOR_FUNCTIONS } from "@/models/environment";
import { useEnvironmentStore } from "@/store";

export interface VariableRowProps {
  variable: EnvironmentVariable;
  index: number;
  isEmptyRow?: boolean;
  onCommitEmpty?: (variable: EnvironmentVariable) => void;
}

const TYPE_OPTIONS = ["input", "manual", "function"] as const;

type DisplayType = (typeof TYPE_OPTIONS)[number];

function resolveDisplayType(type: string): DisplayType {
  if (type === "input" || type === "manual") return type;
  return "function";
}

function getBadgeClass(displayType: DisplayType): string {
  if (displayType === "function") return "var-badge generated";
  return `var-badge ${displayType}`;
}

export function VariableRow({ variable, index, isEmptyRow, onCommitEmpty }: Readonly<VariableRowProps>) {
  const { updateVariable, toggleVariableEnabled, deleteVariable } =
    useEnvironmentStore();

  const [localName, setLocalName] = useState(variable.name);
  const [localValue, setLocalValue] = useState(variable.value);
  const [localDesc, setLocalDesc] = useState(variable.description);
  const [isRevealed, setIsRevealed] = useState(false);

  const displayType = resolveDisplayType(variable.type);
  const isEditable = displayType === "input";

  function handleNameBlur() {
    if (isEmptyRow) {
      if (localName.trim()) {
        onCommitEmpty?.({ ...variable, name: localName.trim() });
        setLocalName("");
      }
      return;
    }
    if (localName !== variable.name) {
      updateVariable(index, { name: localName });
    }
  }

  function handleValueBlur() {
    if (isEmptyRow) return;
    if (localValue !== variable.value) {
      updateVariable(index, { value: localValue });
    }
  }

  function handleDescBlur() {
    if (isEmptyRow) return;
    if (localDesc !== variable.description) {
      updateVariable(index, { description: localDesc });
    }
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value as DisplayType;
    if (selected === "function") {
      updateVariable(index, { type: GENERATOR_FUNCTIONS[0].value });
    } else {
      updateVariable(index, { type: selected });
    }
  }

  function handleFunctionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateVariable(index, { type: e.target.value });
  }

  const rowClass = isEmptyRow ? "empty-row" : variable.enabled ? "" : "disabled";

  return (
    <tr className={rowClass}>
      <td>
        <input
          type="checkbox"
          className="var-checkbox"
          checked={isEmptyRow ? false : variable.enabled}
          disabled={isEmptyRow}
          onChange={() => toggleVariableEnabled(index)}
        />
      </td>
      <td>
        <input
          className="var-input name-input"
          value={localName}
          placeholder="variable_name"
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
        />
      </td>
      <td>
        <div className="type-cell">
          <div className="type-badge-wrapper">
            <span className={getBadgeClass(displayType)}>{displayType}</span>
            <select
              className="var-type-select"
              value={displayType}
              onChange={handleTypeChange}
              disabled={isEmptyRow}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {displayType === "function" && !isEmptyRow && (
            <select
              className="var-func-select"
              value={variable.type}
              onChange={handleFunctionChange}
            >
              {GENERATOR_FUNCTIONS.map((fn) => (
                <option key={fn.value} value={fn.value}>{fn.label}</option>
              ))}
            </select>
          )}
        </div>
      </td>
      <td>
        <div className="value-cell">
          {isEditable || isEmptyRow ? (
            <>
              <input
                className="var-input value-input"
                value={variable.secret && !isRevealed && !isEmptyRow ? "••••••••" : localValue}
                placeholder="value"
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleValueBlur}
                readOnly={variable.secret && !isRevealed && !isEmptyRow}
              />
              {!isEmptyRow && variable.secret && (
                <button
                  type="button"
                  className={`secret-toggle${isRevealed ? " active" : ""}`}
                  onClick={() => setIsRevealed(!isRevealed)}
                  title={isRevealed ? "Hide value" : "Reveal value"}
                >
                  {isRevealed ? "Hide" : "Show"}
                </button>
              )}
            </>
          ) : (
            <input className="var-input value-input not-editable" value="—" readOnly />
          )}
        </div>
      </td>
      <td>
        <input
          className="var-input desc-input"
          value={localDesc}
          placeholder="Add description..."
          onChange={(e) => setLocalDesc(e.target.value)}
          onBlur={handleDescBlur}
        />
      </td>
      <td>
        {!isEmptyRow && (
          <button type="button" className="var-delete" onClick={() => deleteVariable(index)}>
            ×
          </button>
        )}
      </td>
    </tr>
  );
}
