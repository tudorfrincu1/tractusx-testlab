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

import { useState } from "react";
import { useEnvironmentStore } from "../../store/slices";
import type { InternalServiceConfig, AuthType, ConnectorVersion } from "../../models/environment";
import { FieldWithToggle } from "./FieldWithToggle";
import "./ServiceCard.css";

export interface InternalServiceCardProps {
  service: InternalServiceConfig;
  index: number;
  variables: ReadonlyArray<{ name: string }>;
}

export function InternalServiceCard({ service, index, variables }: InternalServiceCardProps) {
  const { updateInternalService, updateInternalAuth, toggleInternalEnabled } = useEnvironmentStore();
  const [showSecret, setShowSecret] = useState(false);

  function handleVersionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateInternalService(index, { version: e.target.value as ConnectorVersion });
  }

  function handleBaseUrlChange(value: string) {
    updateInternalService(index, { base_url: value });
  }

  function handleManagementPathChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateInternalService(index, { management_path: e.target.value });
  }

  function handleAuthTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const authType = e.target.value as AuthType;
    if (authType === "oauth2") {
      updateInternalAuth(index, { type: "oauth2", token_url: "", client_id: "", client_secret: "" });
    } else {
      updateInternalAuth(index, { type: "api_key", auth_header: "X-Api-Key", api_key: "" });
    }
  }

  function handleAuthFieldChange(field: string, value: string) {
    updateInternalAuth(index, { ...service.auth, [field]: value });
  }

  return (
    <div className={`svc-card${service.enabled ? "" : " disabled"}`}>
      <div className="svc-card-header">
        <div className="svc-card-info">
          <span className="svc-card-name">{service.name}</span>
          <span className="svc-card-desc">TestLab internal connector used for test orchestration and data exchange</span>
        </div>
        <div className="svc-card-toggle">
          <label>Enabled</label>
          <div
            className={`svc-toggle${service.enabled ? " active" : ""}`}
            onClick={() => toggleInternalEnabled(index)}
            role="switch"
            aria-checked={service.enabled}
          />
        </div>
      </div>
      <div className="svc-card-body">
        <div className="form-grid">
          <div className="form-group">
            <label>Version</label>
            <select value={service.version} onChange={handleVersionChange}>
              <option value="saturn">Saturn (EDC 0.11+)</option>
              <option value="jupiter">Jupiter (EDC 0.8–0.10)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Management Path</label>
            <input
              type="text"
              className="mono"
              value={service.management_path}
              onChange={handleManagementPathChange}
              placeholder="/management"
            />
          </div>
          <FieldWithToggle
            label="Base URL"
            value={service.base_url}
            variables={variables}
            onChange={handleBaseUrlChange}
            placeholder="https://connector.example.com"
          />
          <div className="form-group">
            <label>Auth Type</label>
            <select value={service.auth.type} onChange={handleAuthTypeChange}>
              <option value="oauth2">OAuth2</option>
              <option value="api_key">API Key</option>
            </select>
          </div>
        </div>

        <div className="auth-section">
          <div className="form-grid">
            {service.auth.type === "oauth2" ? (
              <>
                <div className="form-group full-width">
                  <label>Token URL</label>
                  <input
                    type="text"
                    className="mono"
                    value={service.auth.token_url}
                    onChange={(e) => handleAuthFieldChange("token_url", e.target.value)}
                    placeholder="https://auth.example.com/token"
                  />
                </div>
                <div className="form-group">
                  <label>Client ID</label>
                  <input
                    type="text"
                    value={service.auth.client_id}
                    onChange={(e) => handleAuthFieldChange("client_id", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Client Secret</label>
                  <div className="field-with-toggle">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={service.auth.client_secret}
                      onChange={(e) => handleAuthFieldChange("client_secret", e.target.value)}
                    />
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Auth Header</label>
                  <input
                    type="text"
                    value={service.auth.auth_header}
                    onChange={(e) => handleAuthFieldChange("auth_header", e.target.value)}
                    placeholder="X-Api-Key"
                  />
                </div>
                <div className="form-group">
                  <label>API Key</label>
                  <div className="field-with-toggle">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={service.auth.api_key}
                      onChange={(e) => handleAuthFieldChange("api_key", e.target.value)}
                    />
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
