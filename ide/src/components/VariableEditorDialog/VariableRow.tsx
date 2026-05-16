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

import type { VariableDefinition } from "../../models/schema";
import type { AggregatedVariable } from "../../store/selectors/selectors";

const VARIABLE_TYPES = ["string", "number", "boolean", "object", "array"] as const;

export interface VariableRowProps {
  variable: AggregatedVariable;
  onUpdateTck: (oldName: string, newName: string, def: VariableDefinition) => void;
  onUpdateTest: (varName: string, def: VariableDefinition, sourceTests: string[]) => void;
  onPromote: (varName: string, def: VariableDefinition) => void;
  onDelete: (name: string) => void;
}

export function VariableRow({ variable, onUpdateTck, onUpdateTest, onPromote, onDelete }: VariableRowProps) {
  const { name, definition, usedBy, isTckLevel } = variable;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTckLevel) return;
    onUpdateTck(name, e.target.value.trim() || name, definition);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = { ...definition, type: e.target.value };
    if (isTckLevel) {
      onUpdateTck(name, name, updated);
    } else {
      onUpdateTest(name, updated, usedBy);
    }
  };

  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const updated = { ...definition, default: val || undefined };
    if (isTckLevel) {
      onUpdateTck(name, name, updated);
    } else {
      onUpdateTest(name, updated, usedBy);
    }
  };

  const handleRuntimeToggle = () => {
    const updated = { ...definition, runtime: !definition.runtime };
    if (isTckLevel) {
      onUpdateTck(name, name, updated);
    } else {
      onUpdateTest(name, updated, usedBy);
    }
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const updated = { ...definition, description: val || undefined };
    if (isTckLevel) {
      onUpdateTck(name, name, updated);
    } else {
      onUpdateTest(name, updated, usedBy);
    }
  };

  return (
    <tr className={isTckLevel ? "" : "var-table__row--test-level"}>
      <td>
        {isTckLevel ? (
          <input
            className="var-table__input var-table__input--name"
            type="text"
            defaultValue={name}
            onBlur={handleNameChange}
          />
        ) : (
          <span className="var-table__input--name">@{name}</span>
        )}
      </td>
      <td>
        {isTckLevel ? (
          <span className="var-table__source-badge var-table__source-badge--tck">TCK</span>
        ) : (
          <span className="var-table__source-badge var-table__source-badge--test" title={usedBy.join(", ")}>
            {usedBy.length === 1 ? usedBy[0] : `${usedBy.length} tests`}
          </span>
        )}
      </td>
      <td>
        <select
          className="var-table__select"
          value={definition.type || "string"}
          onChange={handleTypeChange}
        >
          {VARIABLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="var-table__input"
          type="text"
          value={String(definition.default ?? "")}
          onChange={handleDefaultChange}
          placeholder="—"
        />
      </td>
      <td>
        <button
          className={`var-table__toggle ${definition.runtime ? "var-table__toggle--on" : "var-table__toggle--off"}`}
          onClick={handleRuntimeToggle}
          title={definition.runtime ? "Runtime: ON" : "Runtime: OFF"}
        >
          {definition.runtime ? "●" : "○"}
        </button>
      </td>
      <td>
        <input
          className="var-table__input"
          type="text"
          value={definition.description ?? ""}
          onChange={handleDescChange}
          placeholder="—"
        />
      </td>
      <td>
        {isTckLevel ? (
          <button
            className="var-table__delete-btn"
            onClick={() => onDelete(name)}
            title="Delete variable"
          >
            ✕
          </button>
        ) : (
          <button
            className="var-table__promote-btn"
            onClick={() => onPromote(name, definition)}
            title="Promote to TCK-level"
          >
            ↑
          </button>
        )}
      </td>
    </tr>
  );
}
