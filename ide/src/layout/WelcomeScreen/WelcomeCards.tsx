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

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isPrimary?: boolean;
}

export function ActionCard({ icon, title, description, onClick, isPrimary }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "24px 32px",
        background: isPrimary ? "rgba(255, 215, 0, 0.08)" : theme.colors.bgLight,
        border: `1px solid ${isPrimary ? theme.colors.primaryDark : theme.colors.border}`,
        borderRadius: 10,
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        minWidth: 180,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
        e.currentTarget.style.background = isPrimary
          ? "rgba(255, 215, 0, 0.14)"
          : theme.colors.bgLighter;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isPrimary
          ? theme.colors.primaryDark
          : theme.colors.border;
        e.currentTarget.style.background = isPrimary
          ? "rgba(255, 215, 0, 0.08)"
          : theme.colors.bgLight;
      }}
    >
      {icon}
      <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textBright }}>{title}</span>
      <span style={{ fontSize: 11, color: theme.colors.textMuted }}>{description}</span>
    </button>
  );
}

export interface ExampleCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  category: "test" | "tck";
  onClick: () => void;
}

export function ExampleCard({ icon, label, description, category, onClick }: ExampleCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: theme.colors.bgLight,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.borderLight;
        e.currentTarget.style.background = theme.colors.bgLighter;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
        e.currentTarget.style.background = theme.colors.bgLight;
      }}
    >
      <div style={{ color: theme.colors.textMuted, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{label}</span>
          <span style={{
            fontSize: 9,
            fontWeight: 500,
            padding: "1px 5px",
            borderRadius: 3,
            background: category === "tck" ? "rgba(255, 215, 0, 0.12)" : theme.colors.bgLightest,
            color: category === "tck" ? theme.colors.primary : theme.colors.textMuted,
            textTransform: "uppercase",
          }}>
            {category === "tck" ? "tck" : "template"}
          </span>
        </div>
        <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>{description}</div>
      </div>
    </button>
  );
}
