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
 * https://www.apache.org/licenses/LICENSE-2.0
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

import { useState, useCallback } from "react";
import type { ServiceDefinition, ServiceAuthDefinition, ServiceReturnField } from "@/models/schema";
import { useServiceStore } from "@/store/environment/useServiceStore";
import "./ServiceCard.css";

export interface ServiceCardProps {
  service: ServiceDefinition;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const updateService = useServiceStore((s) => s.updateService);
  const removeService = useServiceStore((s) => s.removeService);
  const [isExpanded, setIsExpanded] = useState(true);

  const withFields = extractWithFields(service.with);
  const auth = service.with?.auth;
  const returns = service.returns;

  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const updated: ServiceDefinition = {
        ...service,
        with: { ...service.with, [fieldName]: value },
      };
      updateService(service.name, updated);
    },
    [service, updateService],
  );

  const handleAuthFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const currentAuth = service.with?.auth ?? { type: "api_key" };
      const updated: ServiceDefinition = {
        ...service,
        with: {
          ...service.with,
          auth: { ...currentAuth, [fieldName]: value },
        },
      };
      updateService(service.name, updated);
    },
    [service, updateService],
  );

  const handleNameChange = useCallback(
    (newName: string) => {
      const updated: ServiceDefinition = { ...service, name: newName };
      updateService(service.name, updated);
    },
    [service, updateService],
  );

  return (
    <div className="svc-card">
      <div className="svc-card-header">
        <div className="svc-card-title" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="svc-collapse-icon">{isExpanded ? "▼" : "▶"}</span>
          <input
            type="text"
            className="mono svc-name-input"
            value={service.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="svc-uses-badge">{service.uses}</span>
        </div>
        <button type="button" className="svc-remove-btn" onClick={() => removeService(service.name)}>
          ×
        </button>
      </div>

      {isExpanded && (
        <div className="svc-card-body">
          <WithFieldsSection fields={withFields} onChange={handleFieldChange} />
          {auth && <AuthSection auth={auth} onChange={handleAuthFieldChange} />}
          {returns && <ReturnsSection returns={returns} />}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WithFieldsSection({
  fields,
  onChange,
}: {
  fields: Array<[string, string]>;
  onChange: (key: string, value: string) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="svc-section">
      <div className="svc-section-label">Configuration</div>
      <div className="form-grid">
        {fields.map(([key, value]) => (
          <div className="form-group" key={key}>
            <label>{formatLabel(key)}</label>
            <input
              type="text"
              className="mono"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthSection({
  auth,
  onChange,
}: {
  auth: ServiceAuthDefinition;
  onChange: (key: string, value: string) => void;
}) {
  const authFields = Object.entries(auth).filter(
    ([key]) => key !== "type",
  ) as Array<[string, unknown]>;

  return (
    <div className="svc-section">
      <div className="svc-section-label">
        Auth <span className="svc-auth-type-badge">{auth.type}</span>
      </div>
      <div className="form-grid">
        {authFields.map(([key, value]) => (
          <div className="form-group" key={key}>
            <label>{formatLabel(key)}</label>
            <input
              type={isSecretField(key) ? "password" : "text"}
              className="mono"
              value={String(value ?? "")}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReturnsSection({ returns }: { returns: Record<string, ServiceReturnField> }) {
  const entries = Object.entries(returns);
  if (entries.length === 0) return null;
  return (
    <div className="svc-section">
      <div className="svc-section-label">Returns</div>
      <div className="svc-returns-list">
        {entries.map(([name, field]) => (
          <div className="svc-return-item" key={name}>
            <span className="mono">{name}</span>
            <span className="svc-return-type">{field.class ?? field.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractWithFields(
  withObj?: Record<string, unknown>,
): Array<[string, string]> {
  if (!withObj) return [];
  return Object.entries(withObj)
    .filter(([key]) => key !== "auth")
    .map(([key, value]) => [key, String(value ?? "")]);
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isSecretField(key: string): boolean {
  return key.includes("secret") || key.includes("key") || key.includes("password");
}
