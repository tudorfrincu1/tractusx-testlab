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

import { SOURCE_MODE_META } from "../model";
import type { Variable } from "../model";

export interface VariableListItemProps {
  variable: Variable;
  isActive: boolean;
  onSelect: (id: string) => void;
}

/** A single row in the variable list: name chip, type badge, source icon, flag. */
export function VariableListItem({ variable, isActive, onSelect }: Readonly<VariableListItemProps>) {
  const sourceMeta = SOURCE_MODE_META[variable.source];
  const SourceIcon = sourceMeta.Icon;

  return (
    <li>
      <button
        type="button"
        className={isActive ? "vars-list__item vars-list__item--active" : "vars-list__item"}
        onClick={() => onSelect(variable.id)}
      >
        <span className={`vars-list__source vars-list__source--${sourceMeta.tone}`} aria-label={sourceMeta.label}>
          <SourceIcon fontSize="inherit" />
        </span>
        <span className="vars-list__body">
          <span className="vars-list__name">{variable.name}</span>
          <span className="vars-list__meta">
            <span className={`vars-list__type vars-list__type--${variable.kind}`}>{typeLabel(variable)}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function typeLabel(variable: Variable): string {
  return variable.kind === "simple" ? variable.type : variable.type.replace("connector_", "");
}
