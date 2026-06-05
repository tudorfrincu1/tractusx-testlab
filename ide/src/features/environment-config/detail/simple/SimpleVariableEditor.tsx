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

import { SourceModeToggle } from "./SourceModeToggle";
import { SimpleSourceBody } from "./SimpleSourceBody";
import { SimpleRefinementFields } from "./SimpleRefinementFields";
import { SIMPLE_TYPE_OPTIONS, withSourceMode, withType } from "./simpleVariableEdits";
import { SOURCE_MODE_META } from "../../model";
import type { SimpleVarType, SimpleVariable } from "../../model";

export interface SimpleVariableEditorProps {
  variable: SimpleVariable;
  onChange: (next: SimpleVariable) => void;
}

/** Detail editor for a simple variable: identity fields + source-mode body. */
export function SimpleVariableEditor({ variable, onChange }: Readonly<SimpleVariableEditorProps>) {
  return (
    <article className="vars-detail">
      <div className="vars-detail__grid">
        <label className="vars-field">
          <span className="vars-field__label">Name</span>
          <input
            className="vars-field__input"
            value={variable.name}
            onChange={(event) => onChange({ ...variable, name: event.target.value })}
          />
        </label>
        <label className="vars-field">
          <span className="vars-field__label">Type</span>
          <select
            className="vars-field__input"
            value={variable.type}
            onChange={(event) => onChange(withType(variable, event.target.value as SimpleVarType))}
          >
            {SIMPLE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <SimpleRefinementFields variable={variable} onChange={onChange} />
      </div>

      <label className="vars-field">
        <span className="vars-field__label">Description</span>
        <input
          className="vars-field__input"
          value={variable.description ?? ""}
          placeholder="What this variable represents"
          onChange={(event) => onChange({ ...variable, description: event.target.value })}
        />
      </label>

      <div className="vars-detail__source">
        <span className="vars-field__label">Source</span>
        <SourceModeToggle value={variable.source} onChange={(mode) => onChange(withSourceMode(variable, mode))} />
        <p className="vars-field__hint">{SOURCE_MODE_META[variable.source].hint}</p>
      </div>

      <SimpleSourceBody variable={variable} onChange={onChange} />
    </article>
  );
}
