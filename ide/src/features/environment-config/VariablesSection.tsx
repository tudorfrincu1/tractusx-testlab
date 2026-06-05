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

import { useCallback, useMemo, useState } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import { EnvVariableProvider } from "@/features/complex-variable-builder";
import { VariableList } from "./list";
import { VariableDetail } from "./detail";
import { RunConfiguration } from "./run";
import {
  MOCK_VARIABLES,
  createComplexVariable,
  createSimpleVariable,
  toEnvVariables,
  type ComplexBuilderChoice,
  type Variable,
} from "./model";

type SubTab = "manage" | "run";

/**
 * View switcher entries. "manage" is the list-driven variable editor, so it
 * reads as a bullet list; "run" is the configured-buckets overview, so it reads
 * as a card/module grid. Both are icon-only — the label only feeds the tooltip
 * and the accessible name.
 */
const SUB_TABS: readonly { id: SubTab; label: string; Icon: SvgIconComponent }[] = [
  { id: "manage", label: "Manage variables", Icon: FormatListBulletedIcon },
  { id: "run", label: "Run configuration", Icon: ViewModuleOutlinedIcon },
] as const;

/**
 * The Variables surface (ADR-0018) — unchanged in behavior, lifted out of the
 * view shell so the shell can host the top-level Variables | Infrastructure
 * tabs. A list + detail panel manages every variable; the "Run configuration"
 * sub-tab derives the run buckets via a pure selector. Complex-variable editing
 * is delegated to the complex-variable builder engine.
 */
export function VariablesSection() {
  const [variables, setVariables] = useState<Variable[]>(MOCK_VARIABLES);
  const [activeId, setActiveId] = useState<string | null>(MOCK_VARIABLES[0]?.id ?? null);
  const [subTab, setSubTab] = useState<SubTab>("manage");

  const active = useMemo(
    () => variables.find((variable) => variable.id === activeId) ?? null,
    [variables, activeId],
  );

  const envVariables = useMemo(() => toEnvVariables(variables), [variables]);

  const addVariable = useCallback((created: Variable) => {
    setVariables((prev) => [...prev, created]);
    setActiveId(created.id);
    setSubTab("manage");
  }, []);

  const handleAddSimple = useCallback(() => addVariable(createSimpleVariable()), [addVariable]);

  const handleAddComplex = useCallback(
    (choice: ComplexBuilderChoice) => addVariable(createComplexVariable(choice)),
    [addVariable],
  );

  const handleChange = useCallback((next: Variable) => {
    setVariables((prev) => prev.map((variable) => (variable.id === next.id ? next : variable)));
  }, []);

  return (
    <EnvVariableProvider variables={envVariables}>
      <nav className="vars-poc__subbar">
        <div className="vars-poc__switch" role="group" aria-label="Variables view">
          {SUB_TABS.map((entry) => {
            const isActive = subTab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                className={isActive ? "vars-poc__switch-btn vars-poc__switch-btn--active" : "vars-poc__switch-btn"}
                onClick={() => setSubTab(entry.id)}
                aria-pressed={isActive}
                aria-label={entry.label}
                title={entry.label}
              >
                <entry.Icon fontSize="small" aria-hidden />
              </button>
            );
          })}
        </div>
      </nav>

      {subTab === "manage" ? (
        <div className="vars-poc__manage">
          <VariableList
            variables={variables}
            activeId={activeId}
            onSelect={setActiveId}
            onAddSimple={handleAddSimple}
            onAddComplex={handleAddComplex}
          />
          <main className="vars-poc__detail">
            <VariableDetail variable={active} onChange={handleChange} />
          </main>
        </div>
      ) : (
        <main className="vars-poc__run">
          <RunConfiguration variables={variables} />
        </main>
      )}
    </EnvVariableProvider>
  );
}
