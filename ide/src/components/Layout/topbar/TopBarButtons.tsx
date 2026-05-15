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

import { theme } from "../../../theme/tractusxTheme";

export function ToolbarButton({
  label,
  icon,
  onClick,
  active = false,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  const activeBackground = `rgba(255, 215, 0, 0.15)`;
  const activeBorder = theme.colors.primary;
  const activeColor = theme.colors.primary;

  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: active ? activeColor : theme.colors.text,
        background: active ? activeBackground : theme.colors.bgLighter,
        border: `1px solid ${active ? activeBorder : theme.colors.border}`,
        borderRadius: 4,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = theme.colors.bgLightest;
          e.currentTarget.style.borderColor = theme.colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = theme.colors.bgLighter;
          e.currentTarget.style.borderColor = theme.colors.border;
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function DropdownItem({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 14px",
        background: "transparent",
        border: "none",
        color: theme.colors.text,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.colors.bgLightest;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: theme.colors.primary, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{description}</div>
      </div>
    </button>
  );
}
