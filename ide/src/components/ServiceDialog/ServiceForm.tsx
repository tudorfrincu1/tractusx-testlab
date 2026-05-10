/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

import type { ServiceDefinition } from "../../models/schema";
import type { ServiceFieldDef } from "../../store/useServiceStore";
import { theme } from "../../theme/tractusxTheme";
import { SERVICE_SCHEMAS } from "../../store/useServiceStore";

/* ── Service Form ──────────────────────────────────────────────────────────── */

interface ServiceFormProps {
  service: ServiceDefinition;
  isCreating: boolean;
  onChange: (service: ServiceDefinition) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ServiceForm({ service, isCreating, onChange, onSave, onCancel }: ServiceFormProps) {
  const schema = SERVICE_SCHEMAS.find((s) => s.type === service.type);
  if (!schema) return null;

  const updateField = (fieldName: string, value: string) => {
    onChange({ ...service, config: { ...service.config, [fieldName]: value } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textBright }}>
        {isCreating ? `New ${schema.label}` : `Edit: ${service.name}`}
      </div>

      <FieldRow label="Service Name" required>
        <input
          type="text"
          value={service.name}
          onChange={(e) => onChange({ ...service, name: e.target.value })}
          placeholder="e.g., saturn-connector"
          disabled={!isCreating}
          style={inputStyle}
        />
      </FieldRow>

      {schema.fields.map((field) => (
        <SchemaFieldInput
          key={field.name}
          field={field}
          value={(service.config[field.name] as string) ?? ""}
          onChange={(v) => updateField(field.name, v)}
        />
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onSave} style={primaryBtnStyle} disabled={!service.name.trim()}>
          {isCreating ? "Add Service" : "Save Changes"}
        </button>
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Shared field components ───────────────────────────────────────────────── */

interface SchemaFieldInputProps {
  field: ServiceFieldDef;
  value: string;
  onChange: (value: string) => void;
}

function SchemaFieldInput({ field, value, onChange }: SchemaFieldInputProps) {
  if (field.type === "dropdown" && field.options) {
    return (
      <FieldRow label={field.label} required={field.required}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </FieldRow>
    );
  }

  return (
    <FieldRow label={field.label} required={field.required}>
      <input
        type={field.secret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? field.default ?? ""}
        style={inputStyle}
      />
    </FieldRow>
  );
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: theme.colors.primary, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  background: theme.colors.bg,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 4,
  padding: "6px 10px",
  fontSize: 12,
  color: theme.colors.textBright,
  outline: "none",
  width: "100%",
};

const primaryBtnStyle: React.CSSProperties = {
  background: theme.colors.primary,
  color: "#000",
  border: "none",
  borderRadius: 4,
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "transparent",
  color: theme.colors.textMuted,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 4,
  padding: "6px 14px",
  fontSize: 12,
  cursor: "pointer",
};
