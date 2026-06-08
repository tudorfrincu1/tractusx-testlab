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

import { AddVariableMenu } from "./AddVariableMenu";
import { VariableListItem } from "./VariableListItem";
import { groupVariables } from "../model";
import type { ComplexBuilderChoice, Variable } from "../model";

export interface VariableListProps {
  variables: readonly Variable[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddSimple: () => void;
  onAddComplex: (choice: ComplexBuilderChoice) => void;
}

/** The left-hand variable list with the "+ Add variable" control on top. */
export function VariableList({
  variables,
  activeId,
  onSelect,
  onAddSimple,
  onAddComplex,
}: Readonly<VariableListProps>) {
  const groups = groupVariables(variables);
  return (
    <aside className="vars-list">
      <div className="vars-list__head">
        <h2 className="vars-list__title">Variables</h2>
        <AddVariableMenu onAddSimple={onAddSimple} onAddComplex={onAddComplex} />
      </div>
      {variables.length === 0 ? (
        <p className="vars-list__empty">No variables yet. Add one to get started.</p>
      ) : (
        groups.map(({ group, variables: groupVars }) => (
          <section key={group} className="vars-list__group">
            <span className="vars-list__group-label">{group}</span>
            <ul className="vars-list__items">
              {groupVars.map((variable) => (
                <VariableListItem
                  key={variable.id}
                  variable={variable}
                  isActive={variable.id === activeId}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </aside>
  );
}
