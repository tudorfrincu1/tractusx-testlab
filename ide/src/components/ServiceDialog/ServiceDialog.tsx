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

import { useState } from "react";
import { useServiceStore, SERVICE_SCHEMAS } from "../../store/useServiceStore";
import type { ServiceFieldDef } from "../../store/useServiceStore";
import type { ServiceDefinition, ServiceType } from "../../models/schema";
import { theme } from "../../theme/tractusxTheme";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";

interface EditTarget {
  data: ServiceDefinition;
  isCreating: boolean;
}

interface ServiceDialogProps {
  onClose: () => void;
}

export function ServiceDialog({ onClose }: ServiceDialogProps) {
  const services = useServiceStore((s) => s.services);
  const addService = useServiceStore((s) => s.addService);
  const updateService = useServiceStore((s) => s.updateService);
  const removeService = useServiceStore((s) => s.removeService);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const handleStartCreate = (type: ServiceType) => {
    const schema = SERVICE_SCHEMAS.find((s) => s.type === type);
    if (!schema) return;
    const config: Record<string, string> = {};
    for (const field of schema.fields) {
      config[field.name] = field.default ?? "";
    }
    // Auto-generate a unique name from the schema default
    const baseName = schema.defaultName;
    const existingNames = new Set(services.map((s) => s.name));
    let name = baseName;
    let counter = 2;
    while (existingNames.has(name)) {
      name = `${baseName}-${counter}`;
      counter++;
    }
    setEditTarget({ data: { name, type, config }, isCreating: true });
  };

  const handleEdit = (service: ServiceDefinition) => {
    setEditTarget({ data: { ...service, config: { ...service.config } }, isCreating: false });
  };

  const handleSave = () => {
    if (!editTarget) return;
    const svc = editTarget.data;
    if (!svc.name.trim()) return;
    if (editTarget.isCreating) {
      addService(svc);
    } else {
      updateService(svc.name, svc);
    }
    setEditTarget(null);
  };

  const handleDelete = (name: string) => {
    removeService(name);
    if (editTarget?.data.name === name) {
      setEditTarget(null);
    }
  };

  const handleCancel = () => setEditTarget(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 760,
          maxHeight: "85vh",
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SettingsIcon sx={{ fontSize: 18, color: theme.colors.primary }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textBright }}>
              Manage Services
            </span>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {services.length} service{services.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left panel */}
          <div style={{
            width: 280,
            borderRight: `1px solid ${theme.colors.border}`,
            overflow: "auto",
            padding: "8px 0",
          }}>
            <SectionLabel text="Services" icon={<SettingsIcon sx={{ fontSize: 11 }} />} />
            {services.map((svc) => (
              <ListItem
                key={svc.name}
                name={svc.name}
                subtitle={SERVICE_SCHEMAS.find((s) => s.type === svc.type)?.label ?? svc.type}
                isActive={editTarget?.data.name === svc.name && !editTarget.isCreating}
                onEdit={() => handleEdit(svc)}
                onDelete={() => handleDelete(svc.name)}
              />
            ))}
            {SERVICE_SCHEMAS.map((schema) => (
              <AddButton key={schema.type} label={schema.label} onClick={() => handleStartCreate(schema.type)} />
            ))}
          </div>

          {/* Right: Edit form */}
          <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
            {editTarget ? (
              <ServiceForm
                service={editTarget.data}
                isCreating={editTarget.isCreating}
                onChange={(data) => setEditTarget({ ...editTarget, data })}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: theme.colors.textMuted,
                fontSize: 12,
              }}>
                Select a service to edit or add a new one
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      padding: "8px 14px 4px",
      fontSize: 10,
      fontWeight: 600,
      color: theme.colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}>
      {icon}
      {text}
    </div>
  );
}

interface ListItemProps {
  name: string;
  subtitle: string;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ListItem({ name, subtitle, isActive, onEdit, onDelete }: ListItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 14px",
        background: isActive ? theme.colors.bgLighter : "transparent",
        borderLeft: isActive ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
        cursor: "pointer",
      }}
      onClick={onEdit}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          color: theme.colors.textBright,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {name}
        </div>
        <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={iconBtnSmallStyle}>
          <EditIcon sx={{ fontSize: 13 }} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={iconBtnSmallStyle}>
          <DeleteIcon sx={{ fontSize: 13, color: theme.colors.error }} />
        </button>
      </div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "6px 14px",
        border: "none",
        background: "transparent",
        color: theme.colors.text,
        fontSize: 12,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgLighter; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <AddIcon sx={{ fontSize: 14, color: theme.colors.primary }} />
      {label}
    </button>
  );
}

// ── Service Form ──────────────────────────────────────────────────────────────

interface ServiceFormProps {
  service: ServiceDefinition;
  isCreating: boolean;
  onChange: (service: ServiceDefinition) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ServiceForm({ service, isCreating, onChange, onSave, onCancel }: ServiceFormProps) {
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

// ── Shared field components ───────────────────────────────────────────────────

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

// ── Styles ────────────────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  padding: 4,
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
};

const iconBtnSmallStyle: React.CSSProperties = {
  ...iconBtnStyle,
  padding: 2,
};

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
