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

import { useState, useCallback, useMemo } from "react";
import type { VariableDefinition } from "@/models/schema";
import { useProjectStore } from "@/store/project/useProjectStore";
import { getAggregatedVariables as computeAggregatedVariables } from "@/store/selectors/variableSelectors";
import { VariableRow } from "./VariableRow";

export function TckVariableTable() {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);
  const updateField = useProjectStore((s) => s.updateTckField);
  const updateTest = useProjectStore((s) => s.updateTest);

  const [newName, setNewName] = useState("");

  const variables = useMemo(
    () => computeAggregatedVariables(tck, tests, testOrder),
    [tck, tests, testOrder],
  );

  const updateTckVariable = useCallback(
    (oldName: string, newName: string, def: VariableDefinition) => {
      const current = { ...(tck.variables ?? {}) };
      if (oldName !== newName) delete current[oldName];
      current[newName] = def;
      updateField("variables", current);
    },
    [tck.variables, updateField],
  );

  const updateTestVariable = useCallback(
    (varName: string, def: VariableDefinition, sourceTests: string[]) => {
      for (const testName of sourceTests) {
        const script = tests.get(testName);
        if (!script) continue;
        const vars = { ...(script.variables ?? {}) };
        vars[varName] = def;
        updateTest(testName, { ...script, variables: vars });
      }
    },
    [tests, updateTest],
  );

  const promoteTckVariable = useCallback(
    (varName: string, def: VariableDefinition) => {
      const current = { ...(tck.variables ?? {}) };
      if (!current[varName]) {
        current[varName] = { ...def };
        updateField("variables", current);
      }
    },
    [tck.variables, updateField],
  );

  const deleteTckVariable = useCallback(
    (name: string) => {
      const current = { ...(tck.variables ?? {}) };
      delete current[name];
      updateField("variables", current);
    },
    [tck.variables, updateField],
  );

  const addVariable = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const current = { ...(tck.variables ?? {}) };
    if (current[trimmed]) return;
    current[trimmed] = { type: "string" };
    updateField("variables", current);
    setNewName("");
  }, [newName, tck.variables, updateField]);

  const handleAddKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") addVariable();
    },
    [addVariable],
  );

  return (
    <div>
      <h4 className="var-dialog__section-title">
        All Variables
        {variables.length > 0 && (
          <span className="var-table__count">{variables.length}</span>
        )}
      </h4>
      <table className="var-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Type</th>
            <th>Default</th>
            <th>Runtime</th>
            <th>Description</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {variables.map((v) => (
            <VariableRow
              key={v.name}
              variable={v}
              onUpdateTck={updateTckVariable}
              onUpdateTest={updateTestVariable}
              onPromote={promoteTckVariable}
              onDelete={deleteTckVariable}
            />
          ))}
          {variables.length === 0 && (
            <tr>
              <td colSpan={7} className="var-table__empty">
                No variables defined yet. Add TCK-level variables below, or they will appear here from tests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="overrides__row">
        <input
          className="var-table__input var-table__input--name"
          type="text"
          placeholder="new_variable_name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleAddKeyDown}
        />
        <button
          className="var-table__add-btn"
          onClick={addVariable}
          disabled={!newName.trim()}
        >
          + Add TCK Variable
        </button>
      </div>
    </div>
  );
}
