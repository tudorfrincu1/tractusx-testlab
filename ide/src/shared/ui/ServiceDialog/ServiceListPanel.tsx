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

import { theme } from "@/shared/theme/tractusxTheme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export function SectionLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
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

export function ListItem({ name, subtitle, isActive, onEdit, onDelete }: ListItemProps) {
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

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
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

const iconBtnSmallStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  padding: 2,
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
};
