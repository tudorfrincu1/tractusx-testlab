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

import { ConfigurationDetail } from "@/features/complex-variable-builder";
import type { PolicyPayload, ProvidePayload } from "@/features/complex-variable-builder";
import type { ComplexVariable } from "../../model";

export interface ComplexVariableEditorProps {
  variable: ComplexVariable;
  onChange: (next: ComplexVariable) => void;
}

const SOURCES: readonly { value: "value" | "input"; label: string }[] = [
  { value: "value", label: "Provide now" },
  { value: "input", label: "Ask operator" },
] as const;

/**
 * Detail editor for a complex variable. Identity + source live here; the body
 * mounts the EXISTING complex-variable builder (left logical formula / right
 * canonical JSON) unchanged via {@link ConfigurationDetail}.
 */
export function ComplexVariableEditor({ variable, onChange }: Readonly<ComplexVariableEditorProps>) {
  const handlePolicyChange = (policy: PolicyPayload) => {
    if (variable.value.category === "register") {
      onChange({ ...variable, value: { ...variable.value, policy } });
    }
  };

  const handleProvideChange = (provide: ProvidePayload) => {
    if (variable.value.category === "register") {
      onChange({ ...variable, value: { ...variable.value, provide } });
    }
  };

  return (
    <article className="vars-detail vars-detail--complex">
      <div className="vars-detail__grid">
        <label className="vars-field">
          <span className="vars-field__label">Name</span>
          <input
            className="vars-field__input"
            value={variable.name}
            onChange={(event) => onChange({ ...variable, name: event.target.value })}
          />
        </label>
        <div className="vars-detail__source">
          <span className="vars-field__label">Source</span>
          <div className="vars-toggle vars-toggle--dual" role="radiogroup" aria-label="Source">
            {SOURCES.map((source) => (
              <button
                key={source.value}
                type="button"
                role="radio"
                aria-checked={variable.source === source.value}
                className={
                  variable.source === source.value
                    ? "vars-toggle__seg vars-toggle__seg--active"
                    : "vars-toggle__seg"
                }
                onClick={() => onChange({ ...variable, source: source.value })}
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="vars-detail__builder">
        <ConfigurationDetail
          item={variable.value}
          onPolicyChange={handlePolicyChange}
          onProvideChange={handleProvideChange}
          showYamlPreview={false}
        />
      </div>
    </article>
  );
}
