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

import { useState } from "react";
import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import { VariablesSection } from "./VariablesSection";
import { InfrastructureSection } from "./infrastructure";

type Section = "variables" | "infrastructure";

const SECTIONS: readonly { id: Section; label: string; Icon: ComponentType<SvgIconProps> }[] = [
  { id: "variables", label: "Variables", Icon: DataObjectOutlinedIcon },
  { id: "infrastructure", label: "Infrastructure", Icon: LanOutlinedIcon },
] as const;

/**
 * The Environment Configuration shell. A thin top-level tab bar switches between
 * the Variables surface (ADR-0018) and the Infrastructure surface (ADR-0019 §1);
 * each section owns its own state, sub-tabs and YAML preview.
 */
export function EnvironmentConfigView() {
  const [section, setSection] = useState<Section>("variables");

  return (
    <div className="vars-poc">
      <header className="vars-poc__bar">
        <nav className="vars-poc__tabs" role="tablist" aria-label="Environment configuration sections">
          {SECTIONS.map((entry) => {
            const isActive = section === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`vars-poc-tab-${entry.id}`}
                aria-selected={isActive}
                aria-controls={`vars-poc-panel-${entry.id}`}
                className={isActive ? "vars-poc__tab vars-poc__tab--active" : "vars-poc__tab"}
                onClick={() => setSection(entry.id)}
              >
                <entry.Icon className="vars-poc__tab-icon" fontSize="small" />
                <span>{entry.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div
        role="tabpanel"
        id={`vars-poc-panel-${section}`}
        aria-labelledby={`vars-poc-tab-${section}`}
        className="vars-poc__panel"
      >
        {section === "variables" ? <VariablesSection /> : <InfrastructureSection />}
      </div>
    </div>
  );
}
