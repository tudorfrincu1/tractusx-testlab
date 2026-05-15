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

import { theme } from "../../theme/tractusxTheme";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import ScienceIcon from "@mui/icons-material/Science";
import DataObjectIcon from "@mui/icons-material/DataObject";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface FileNode {
  path: string;
  type: "tck" | "test" | "schema";
  name: string;
  size: number;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

export function nodeIcon(type: FileNode["type"]) {
  switch (type) {
    case "tck": return <DescriptionIcon sx={{ fontSize: 14, color: theme.colors.primary }} />;
    case "test": return <ScienceIcon sx={{ fontSize: 14, color: "#66bb6a" }} />;
    case "schema": return <DataObjectIcon sx={{ fontSize: 14, color: "#42a5f5" }} />;
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

export function FileTreeRow({ icon, label, depth, isBold, isSelected, size, onClick, onExport }: {
  icon: React.ReactNode;
  label: string;
  depth: number;
  isBold?: boolean;
  isSelected?: boolean;
  size?: string;
  onClick?: () => void;
  onExport?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: `3px 10px 3px ${12 + depth * 14}px`,
        cursor: onClick ? "pointer" : "default",
        background: isSelected ? theme.colors.bgLighter : "transparent",
        fontSize: 12,
        fontWeight: isBold ? 600 : 400,
        color: isSelected ? theme.colors.textBright : theme.colors.text,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = theme.colors.bgLighter; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {size && <span style={{ fontSize: 9, color: theme.colors.textMuted }}>{size}</span>}
      {onExport && (
        <button
          onClick={(e) => { e.stopPropagation(); onExport(); }}
          title="Export this file"
          style={{ ...iconBtnStyle, opacity: 0.4, padding: 2 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  );
}

export function ExportButton({ icon, label, onClick, isPrimary }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 600,
        color: isPrimary ? "#000" : theme.colors.text,
        background: isPrimary ? theme.colors.primary : theme.colors.bgLight,
        border: `1px solid ${isPrimary ? theme.colors.primary : theme.colors.border}`,
        borderRadius: 6,
        cursor: "pointer",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      {icon}
      {label}
    </button>
  );
}

export const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  borderRadius: 4,
  padding: 4,
};
