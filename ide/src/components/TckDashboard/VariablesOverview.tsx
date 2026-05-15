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

import { useMemo } from "react";
import { useProjectStore, type AggregatedVariable } from "../../store/useProjectStore";
import { theme } from "../../theme/tractusxTheme";
import { SectionCard } from "./MetadataSection";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LinkIcon from "@mui/icons-material/Link";

export function VariablesOverview() {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);
  const updateField = useProjectStore((s) => s.updateTckField);

  const variables = useMemo(
    () => useProjectStore.getState().getAggregatedVariables(),
    [tck, tests, testOrder],
  );

  if (variables.length === 0) {
    return (
      <SectionCard title="Variables" extra={<EmptyHint />}>
        <div style={{ fontSize: 12, color: theme.colors.textMuted, padding: "8px 0" }}>
          No variables defined. Variables from tests will auto-appear here.
        </div>
      </SectionCard>
    );
  }

  const handleDefaultChange = (varName: string, newDefault: string) => {
    const current = { ...(tck.variables ?? {}) };
    const existing = current[varName] ?? variables.find((v) => v.name === varName)?.definition;
    if (!existing) return;
    current[varName] = { ...existing, default: newDefault || undefined };
    updateField("variables", current);
  };

  return (
    <SectionCard
      title={`Variables (${variables.length})`}
      extra={<span style={{ fontSize: 10, color: theme.colors.textMuted }}>auto-imported from tests</span>}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Name", "Type", "Default", "Runtime", "Used by"].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variables.map((v) => (
            <VariableRow
              key={v.name}
              variable={v}
              onDefaultChange={(val) => handleDefaultChange(v.name, val)}
            />
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}

/* ── Row ────────────────────────────────────────────────────────────────── */

function VariableRow({ variable, onDefaultChange }: {
  variable: AggregatedVariable;
  onDefaultChange: (value: string) => void;
}) {
  const { name, definition, usedBy, isTckLevel } = variable;

  return (
    <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
      {/* Name */}
      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isTckLevel && (
            <LinkIcon sx={{ fontSize: 13, color: theme.colors.primary, opacity: 0.7 }} titleAccess="Defined at TCK level" />
          )}
          <code style={{ fontSize: 11, color: theme.colors.primaryLight }}>{name}</code>
        </div>
      </td>

      {/* Type */}
      <td style={tdStyle}>
        <span style={{ color: theme.colors.textMuted }}>{definition.type || "string"}</span>
      </td>

      {/* Default — editable */}
      <td style={tdStyle}>
        <input
          type="text"
          value={String(definition.default ?? "")}
          onChange={(e) => onDefaultChange(e.target.value)}
          placeholder="—"
          style={{
            width: "100%",
            fontSize: 11,
            color: theme.colors.text,
            background: "transparent",
            border: `1px solid transparent`,
            borderRadius: 3,
            padding: "2px 4px",
            outline: "none",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
        />
      </td>

      {/* Runtime */}
      <td style={{ ...tdStyle, textAlign: "center" }}>
        {definition.runtime
          ? <CheckCircleIcon sx={{ fontSize: 16, color: theme.colors.primary }} />
          : <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: theme.colors.textMuted, opacity: 0.4 }} />
        }
      </td>

      {/* Used by */}
      <td style={tdStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {usedBy.length > 0 ? usedBy.map((t) => (
            <span key={t} style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 3,
              background: theme.colors.bgLightest,
              color: theme.colors.text,
            }}>
              {t}
            </span>
          )) : (
            <span style={{ fontSize: 10, color: theme.colors.textMuted }}>—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyHint() {
  return (
    <span style={{ fontSize: 10, color: theme.colors.textMuted, fontStyle: "italic" }}>
      auto-imported
    </span>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: 10,
  fontWeight: 600,
  color: theme.colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: `1px solid ${theme.colors.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 8px",
  verticalAlign: "middle",
};
