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

import { SOURCE_MODE_META, SOURCE_MODE_ORDER } from "../../model";
import type { SourceMode } from "../../model";

export interface SourceModeToggleProps {
  value: SourceMode;
  onChange: (next: SourceMode) => void;
}

/** A 3-segment toggle (Value | Input | Generated) for a simple variable. */
export function SourceModeToggle({ value, onChange }: Readonly<SourceModeToggleProps>) {
  return (
    <div className="vars-toggle" role="radiogroup" aria-label="Source mode">
      {SOURCE_MODE_ORDER.map((mode) => {
        const meta = SOURCE_MODE_META[mode];
        const Icon = meta.Icon;
        const active = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? "vars-toggle__seg vars-toggle__seg--active" : "vars-toggle__seg"}
            onClick={() => onChange(mode)}
          >
            <Icon fontSize="small" />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
