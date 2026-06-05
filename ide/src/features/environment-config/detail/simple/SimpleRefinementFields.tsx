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

import { useFormatCatalog } from "../../catalog";
import type { SimpleVariable } from "../../model";

export interface SimpleRefinementFieldsProps {
  variable: SimpleVariable;
  onChange: (next: SimpleVariable) => void;
}

/**
 * Option D refinement controls for a simple variable: a friendly Format
 * dropdown (sourced from the format catalog, never a hardcoded list) shown by
 * default, plus an Advanced disclosure exposing a raw validation-only regex
 * pattern. Keeping the regex behind the disclosure keeps the default UX
 * non-technical.
 */
export function SimpleRefinementFields({ variable, onChange }: Readonly<SimpleRefinementFieldsProps>) {
  const { formats } = useFormatCatalog();
  const selectedFormat = formats.find((entry) => entry.id === variable.format);

  return (
    <div className="vars-refine">
      <label className="vars-field">
        <span className="vars-field__label">Format</span>
        <select
          className="vars-field__input"
          value={variable.format ?? ""}
          onChange={(event) => onChange({ ...variable, format: event.target.value || undefined })}
        >
          <option value="">Any</option>
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.label}
            </option>
          ))}
        </select>
        {selectedFormat && (
          <span className="vars-field__hint">
            Validates against <code>{selectedFormat.validation_regex}</code>
          </span>
        )}
      </label>

      <details className="vars-advanced">
        <summary className="vars-advanced__summary">Advanced</summary>
        <label className="vars-field vars-advanced__body">
          <span className="vars-field__label">Validation pattern (regex)</span>
          <input
            className="vars-field__input"
            value={variable.pattern ?? ""}
            placeholder="^[A-Z]{3}\\d+$"
            spellCheck={false}
            onChange={(event) => onChange({ ...variable, pattern: event.target.value || undefined })}
          />
          <span className="vars-field__hint">
            Validation only — overrides the format regex and never affects generator matching.
          </span>
        </label>
      </details>
    </div>
  );
}
