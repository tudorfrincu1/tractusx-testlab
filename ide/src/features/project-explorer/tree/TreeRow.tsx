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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

export interface TreeRowProps {
  depth: number;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDirty?: boolean;
  isBold?: boolean;
  isFolder?: boolean;
  isOpen?: boolean;
  badge?: string;
  draggable?: boolean;
  isDragOver?: "top" | "bottom";
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function TreeRow({
  depth,
  icon,
  label,
  isActive,
  isDirty,
  isBold,
  isFolder,
  badge,
  draggable: isDraggable,
  isDragOver,
  onClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: Readonly<TreeRowProps>) {
  const paddingLeft = 4 + depth * 12;

  return (
    <div
      className={`pe-row ${isDragOver === "top" ? "pe-drag-over" : ""} ${isDragOver === "bottom" ? "pe-drag-over-bottom" : ""}`}
      draggable={isDraggable}
      style={{
        padding: `4px 10px 4px ${paddingLeft}px`,
        cursor: onClick ? "pointer" : "default",
        background: isActive ? theme.colors.bgLighter : "transparent",
        borderLeft: isActive
          ? `3px solid ${theme.colors.primary}`
          : "3px solid transparent",
        fontWeight: isBold ? 600 : 400,
        color: isActive ? theme.colors.textBright : theme.colors.text,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={(e) => {
        if (isDraggable && onDragStart) {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDraggable ? (
        <span className="pe-drag">
          <DragIndicatorIcon sx={{ fontSize: 14, color: theme.colors.textMuted }} />
        </span>
      ) : (
        !isFolder && depth >= 2 && <span className="pe-spacer" />
      )}
      {icon}
      <span
        className="pe-row__label"
        title={label}
      >
        {label}
      </span>
      {isDirty && (
        <span
          className="pe-row__dirty"
          style={{ background: theme.colors.primary }}
        />
      )}
      {badge && (
        <span
          className="pe-row__badge"
          style={{
            color: theme.colors.textMuted,
            background: theme.colors.bgLighter,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
