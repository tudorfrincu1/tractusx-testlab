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

import { useState, useCallback } from "react";
import { useProjectStore } from "@/store/project/useProjectStore";
import { theme } from "@/shared/theme/tractusxTheme";
import { PipelineGraphView } from "./dataflow/PipelineGraphView";
import { GraphInfoDisplay } from "./dataflow/GraphInfoDisplay";
import { GraphInfoEditForm } from "./dataflow/GraphInfoEditForm";
import { DATASPACE_OPTIONS } from "./dataflow/constants";
import { VersionField } from "./forms/FormFields";

import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import "./TckDashboard.css";

export function TckDashboard() {

  return (
    <div className="tck-dashboard" style={{ background: theme.colors.bg }}>
      {/* ── Header with expandable info ────────────────────── */}
      <DashboardHeader />

      {/* ── Pipeline Graph (unified view) ──────────────────── */}
      <div className="tck-dashboard__content">
        <PipelineGraphView />
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DashboardHeader() {
  const tck = useProjectStore((s) => s.tck);
  const updateField = useProjectStore((s) => s.updateTckField);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    if (isExpanded) setIsEditing(false);
  }, [isExpanded]);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="dashboard-header">
      {/* ── Bar row ──────────────────────────────────────── */}
      <div className="dashboard-header__bar">
        <PlaylistAddIcon sx={{ fontSize: 20, color: theme.colors.primary }} />

        {isEditing ? (
          <input
            className="dashboard-header__inline-input dashboard-header__inline-input--name"
            value={tck.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Project name"
            autoFocus
          />
        ) : (
          <span className="dashboard-header__name">{tck.name}</span>
        )}

        {isEditing ? (
          <VersionField
            value={tck.version ?? ""}
            onChange={(v) => updateField("version", v || undefined)}
            compact
            className="dashboard-header__version-field"
            inputClassName="dashboard-header__inline-input dashboard-header__inline-input--version"
          />
        ) : (
          tck.version && (
            <Badge
              label={`v${tck.version.replace(/^v/i, "")}`}
              color={theme.colors.textMuted}
              bg={theme.colors.bgLighter}
            />
          )
        )}

        {isEditing ? (
          <select
            className="dashboard-header__inline-select"
            value={tck.dataspace_version ?? ""}
            onChange={(e) => updateField("dataspace_version", e.target.value || undefined)}
          >
            <option value="">— version —</option>
            {DATASPACE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          tck.dataspace_version && (
            <Badge
              label={tck.dataspace_version}
              color={theme.colors.primary}
              bg="rgba(255, 215, 0, 0.12)"
            />
          )
        )}

        <button
          className="dashboard-header__info-toggle"
          onClick={handleToggleExpand}
          title={isExpanded ? "Hide project info" : "Show project info"}
        >
          <span className={`dashboard-header__toggle-icon${isExpanded ? " dashboard-header__toggle-icon--expanded" : ""}`}>
            ▶
          </span>
          {isExpanded ? "Hide project info" : "Show project info"}
        </button>
      </div>

      {/* ── Expandable metadata ──────────────────────────── */}
      <div className={`dashboard-header__body${isExpanded ? " dashboard-header__body--expanded" : ""}`}>
        <div className="dashboard-header__body-inner">
          {isEditing ? (
            <GraphInfoEditForm onClose={handleCancelEdit} />
          ) : (
            <GraphInfoDisplay onEdit={handleEditClick} />
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="tck-dashboard__badge" style={{
      color,
      background: bg,
    }}>
      {label}
    </span>
  );
}
