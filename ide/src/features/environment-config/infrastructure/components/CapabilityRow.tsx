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

import type { CapabilityDescriptor, CapabilityRequirement, Standard } from "../model";

export interface CapabilityRowProps {
  descriptor: CapabilityDescriptor;
  requirement: CapabilityRequirement;
  onRequiredChange: (required: boolean) => void;
  onStandardToggle: (enabled: boolean) => void;
  onStandardChange: (patch: Partial<Standard>) => void;
}

const REQUIRED_SEGMENTS: readonly { value: boolean; label: string }[] = [
  { value: true, label: "Required" },
  { value: false, label: "Optional" },
] as const;

/**
 * One capability requirement row: a required/optional segmented control plus an
 * optional `standard` constraint (id + version). Reuses the variables detail
 * field/toggle classes so the controls read identically across the view.
 */
export function CapabilityRow({
  descriptor,
  requirement,
  onRequiredChange,
  onStandardToggle,
  onStandardChange,
}: Readonly<CapabilityRowProps>) {
  const standard = requirement.standard;
  return (
    <article className="infra-cap">
      <div className="infra-cap__head">
        <div className="infra-cap__identity">
          <span className="infra-cap__label">{descriptor.label}</span>
          <span className="infra-cap__desc">{descriptor.description}</span>
        </div>
        <fieldset className="vars-bool" aria-label={`${descriptor.label} requirement`}>
          {REQUIRED_SEGMENTS.map((segment) => (
            <button
              key={String(segment.value)}
              type="button"
              className={segmentClass(requirement.required === segment.value)}
              onClick={() => onRequiredChange(segment.value)}
            >
              {segment.label}
            </button>
          ))}
        </fieldset>
      </div>

      <label className="vars-switch infra-cap__standard-toggle">
        <input
          type="checkbox"
          checked={standard !== undefined}
          onChange={(event) => onStandardToggle(event.target.checked)}
        />
        <span>Constrain to a standard</span>
      </label>

      {standard && (
        <div className="infra-cap__standard">
          <label className="vars-field">
            <span className="vars-field__label">Standard ID</span>
            <input
              className="vars-field__input"
              value={standard.id}
              placeholder="CX-0018"
              onChange={(event) => onStandardChange({ id: event.target.value })}
            />
          </label>
          <label className="vars-field">
            <span className="vars-field__label">Version</span>
            <input
              className="vars-field__input"
              value={standard.version ?? ""}
              placeholder="inherits dataspace version"
              onChange={(event) => onStandardChange({ version: event.target.value })}
            />
          </label>
        </div>
      )}
    </article>
  );
}

function segmentClass(active: boolean): string {
  return active ? "vars-bool__seg vars-bool__seg--active" : "vars-bool__seg";
}
