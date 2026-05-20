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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useEnvironmentStore } from "../../store/slices";
import type { ExternalServiceConfig, ConnectorVersion } from "../../models/environment";
import { DSP_PATHS } from "../../models/environment";
import { FieldWithToggle } from "./FieldWithToggle";
import "./ServiceCard.css";

export interface ExternalServiceCardProps {
  service: ExternalServiceConfig;
  index: number;
  variables: ReadonlyArray<{ name: string }>;
}

export function ExternalServiceCard({ service, index, variables }: ExternalServiceCardProps) {
  const { updateExternalService, toggleExternalEnabled } = useEnvironmentStore();

  function handleVersionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const version = e.target.value as ConnectorVersion;
    updateExternalService(index, { version, dsp_path: DSP_PATHS[version] });
  }

  function handleBaseUrlChange(value: string) {
    updateExternalService(index, { base_url: value });
  }

  function handleDspPathChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateExternalService(index, { dsp_path: e.target.value });
  }

  return (
    <div className={`svc-card${service.enabled ? "" : " disabled"}`}>
      <div className="svc-card-header">
        <div className="svc-card-info">
          <span className="svc-card-name">{service.name}</span>
          <span className="svc-card-desc">Connector controlled by the application/service under test (SUT)</span>
        </div>
        <div className="svc-card-toggle">
          <label>Enabled</label>
          <div
            className={`svc-toggle${service.enabled ? " active" : ""}`}
            onClick={() => toggleExternalEnabled(index)}
            role="switch"
            aria-checked={service.enabled}
          />
        </div>
      </div>
      <div className="svc-card-body">
        <div className="form-grid">
          <div className="form-group">
            <label>Dataspace Version</label>
            <select value={service.version} onChange={handleVersionChange}>
              <option value="saturn">Saturn (EDC 0.11+)</option>
              <option value="jupiter">Jupiter (EDC 0.8–0.10)</option>
            </select>
          </div>
          <div className="form-group">
            <label>DSP Path</label>
            <input
              type="text"
              className="mono"
              value={service.dsp_path}
              onChange={handleDspPathChange}
            />
            <span className="auto-hint">
              Auto-configured from version. Override if needed.
            </span>
          </div>
          <FieldWithToggle
            label="Base URL"
            value={service.base_url}
            variables={variables}
            onChange={handleBaseUrlChange}
            placeholder="https://counter-party.example.com"
          />
        </div>
      </div>
    </div>
  );
}
