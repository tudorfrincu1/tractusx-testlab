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
import type { EnvironmentVariable } from "../../models/environment";
import { useEnvironmentStore } from "../../store/slices";
import { VariableRow } from "./VariableRow";
import "./VariablesTable.css";

const EMPTY_VARIABLE: EnvironmentVariable = {
  name: "",
  type: "input",
  value: "",
  description: "",
  enabled: true,
  secret: false,
};

export function VariablesSection() {
  const { variables, addVariable } = useEnvironmentStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  function handleCommitEmpty(variable: EnvironmentVariable) {
    addVariable(variable);
  }

  return (
    <div className="section">
      <div className="section-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{isCollapsed ? "▶" : "▼"} Variables</span>
        <span className="count-badge">{variables.length}</span>
      </div>

      {!isCollapsed && (
        <div className="section-body">
          <table className="variables-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {variables.map((variable, i) => (
                <VariableRow key={i} variable={variable} index={i} />
              ))}
              <VariableRow
                variable={EMPTY_VARIABLE}
                index={variables.length}
                isEmptyRow
                onCommitEmpty={handleCommitEmpty}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
