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
import { useServiceStore, SERVICE_SCHEMAS } from "../../store/useServiceStore";
import type { ServiceDefinition, ServiceType } from "../../models/schema";
import { theme } from "../../theme/tractusxTheme";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import { ServiceForm } from "./ServiceForm";
import { SectionLabel, ListItem, AddButton } from "./ServiceListPanel";

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
