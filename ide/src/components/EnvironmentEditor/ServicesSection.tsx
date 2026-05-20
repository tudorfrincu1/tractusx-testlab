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
import type { AdditionalServiceConfig } from "../../models/environment";
import { InternalServiceCard } from "./InternalServiceCard";
import { ExternalServiceCard } from "./ExternalServiceCard";
import { FieldWithToggle } from "./FieldWithToggle";
import "./ServiceCard.css";

export function ServicesSection() {
  const {
    internal,
    external,
    additional,
    variables,
    addAdditionalService,
    updateAdditionalService,
    deleteAdditionalService,
  } = useEnvironmentStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const enabledVars = variables.filter((v) => v.enabled).map((v) => ({ name: v.name }));
  const totalEnabled =
    internal.filter((s) => s.enabled).length +
    external.filter((s) => s.enabled).length +
    additional.filter((s) => s.enabled).length;

  return (
    <div className="section">
      <div className="section-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{isCollapsed ? "▶" : "▼"} Services</span>
        <span className="count-badge">{totalEnabled}</span>
      </div>

      {!isCollapsed && (
        <>
          <div className="services-subheader">Internal</div>
          {internal.map((svc, i) => (
            <InternalServiceCard key={i} service={svc} index={i} variables={enabledVars} />
          ))}

          <div className="services-subheader">External</div>
          {external.map((svc, i) => (
            <ExternalServiceCard key={i} service={svc} index={i} variables={enabledVars} />
          ))}

          <div className="services-subheader">
            Additional
            <button type="button" className="add-btn" onClick={addAdditionalService}>
              + Add Service
            </button>
          </div>
          {additional.length === 0 && (
            <p className="additional-hint">No additional services configured.</p>
          )}
          {additional.map((svc) => (
            <AdditionalCard key={svc.id} service={svc} variables={enabledVars} onDelete={deleteAdditionalService} onUpdate={updateAdditionalService} />
          ))}
        </>
      )}
    </div>
  );
}

// ── Additional Service Card (inline — simple) ────────────────────────────────

interface AdditionalCardProps {
  service: AdditionalServiceConfig;
  variables: ReadonlyArray<{ name: string }>;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AdditionalServiceConfig>) => void;
}

function AdditionalCard({ service, variables, onDelete, onUpdate }: AdditionalCardProps) {
  return (
    <div className={`svc-card${service.enabled ? "" : " disabled"}`}>
      <div className="svc-card-header">
        <input
          type="text"
          className="mono"
          value={service.name}
          onChange={(e) => onUpdate(service.id, { name: e.target.value })}
          placeholder="service_name"
        />
        <div className="svc-card-toggle">
          <label>Enabled</label>
          <div
            className={`svc-toggle${service.enabled ? " active" : ""}`}
            onClick={() => onUpdate(service.id, { enabled: !service.enabled })}
            role="switch"
            aria-checked={service.enabled}
          />
          <button type="button" className="add-btn" onClick={() => onDelete(service.id)}>
            ✕
          </button>
        </div>
      </div>
      <div className="svc-card-body">
        <div className="form-grid">
          <div className="form-group">
            <label>Type</label>
            <select
              value={service.type}
              onChange={(e) => onUpdate(service.id, { type: e.target.value })}
            >
              <option value="">Select type…</option>
              <option value="dtr">Digital Twin Registry</option>
              <option value="discovery">Discovery Finder</option>
              <option value="http">HTTP Service</option>
              <option value="connector">Connector</option>
            </select>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={service.role ?? ""}
              onChange={(e) =>
                onUpdate(service.id, {
                  role: (e.target.value || undefined) as "provider" | "consumer" | undefined,
                })
              }
            >
              <option value="">None</option>
              <option value="provider">Provider</option>
              <option value="consumer">Consumer</option>
            </select>
          </div>
          <FieldWithToggle
            label="URL"
            value={service.url}
            variables={variables}
            onChange={(value) => onUpdate(service.id, { url: value })}
            placeholder="https://service.example.com"
          />
        </div>
      </div>
    </div>
  );
}
