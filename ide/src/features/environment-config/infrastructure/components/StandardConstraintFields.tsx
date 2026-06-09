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

import { STANDARDS_CATALOG, type CapabilityKey, type Standard } from "../model";

export interface StandardConstraintFieldsProps {
  capability: CapabilityKey;
  standard: Standard;
  onStandardChange: (patch: Partial<Standard>) => void;
}

/**
 * The dependent Standard ID / Version dropdowns for a capability constraint.
 * The version options derive from the selected standard; changing the standard
 * resets the version to the first valid one (or clears it) so the model and
 * Infrastructure YAML preview stay consistent.
 */
export function StandardConstraintFields({
  capability,
  standard,
  onStandardChange,
}: Readonly<StandardConstraintFieldsProps>) {
  const entries = STANDARDS_CATALOG[capability];
  const selectedEntry = entries.find((entry) => entry.id === standard.id);
  const versionOptions = selectedEntry?.versions ?? [];

  const handleIdChange = (id: string) => {
    if (id === "") {
      onStandardChange({ id: "", version: undefined });
      return;
    }
    const versions = entries.find((entry) => entry.id === id)?.versions ?? [];
    const keepsVersion = standard.version !== undefined && versions.includes(standard.version);
    onStandardChange({ id, version: keepsVersion ? standard.version : versions[0] });
  };

  const handleVersionChange = (version: string) => {
    onStandardChange({ version: version === "" ? undefined : version });
  };

  const versionDisabled = versionOptions.length === 0;

  return (
    <div className="infra-cap__standard">
      <label className="vars-field">
        <span className="vars-field__label">Standard ID</span>
        <select
          className="vars-field__input"
          value={standard.id}
          onChange={(event) => handleIdChange(event.target.value)}
        >
          <option value="">Select a standard…</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label ?? entry.id}
            </option>
          ))}
        </select>
      </label>
      <label className="vars-field">
        <span className="vars-field__label">Version</span>
        <select
          className="vars-field__input"
          value={standard.version ?? ""}
          disabled={versionDisabled}
          onChange={(event) => handleVersionChange(event.target.value)}
        >
          <option value="">{versionDisabled ? "Select a standard first" : "Select a version…"}</option>
          {versionOptions.map((version) => (
            <option key={version} value={version}>
              {version}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
