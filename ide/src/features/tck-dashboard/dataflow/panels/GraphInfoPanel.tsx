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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { memo, useState, useCallback } from "react";
import { useProjectStore } from "@/store";
import type { LayoutDirection } from "@/shared/hooks/usePipelineLayout";
import { GraphInfoDisplay } from "./GraphInfoDisplay";
import { GraphInfoEditForm } from "./GraphInfoEditForm";

const DATASPACE_COLORS: Record<string, string> = {
  saturn: "#fbbf24",
  jupiter: "#fbbf24",
} as const;

export interface GraphInfoPanelProps {
  direction: LayoutDirection;
  onDirectionChange: (dir: LayoutDirection) => void;
}

/**
 * Expandable project info panel in the graph header bar.
 * Shows project metadata; expanded by default. Edit mode reuses existing form fields.
 */
export const GraphInfoPanel = memo(function GraphInfoPanel({
  direction,
  onDirectionChange,
}: GraphInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const tck = useProjectStore((s) => s.tck);

  const dataspaceColor = DATASPACE_COLORS[tck.dataspace_version ?? ""] ?? "#999";

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    if (!isExpanded) return; // collapsing — keep editing state
    setIsEditing(false); // collapse also exits edit mode
  }, [isExpanded]);

  const handleToggleDirection = useCallback(() => {
    onDirectionChange(direction === "TB" ? "LR" : "TB");
  }, [direction, onDirectionChange]);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="graph-info-panel">
      {/* Header row — always visible */}
      <div className="graph-info-panel__header">
        <button
          className="graph-info-panel__toggle"
          onClick={handleToggleExpand}
          title={isExpanded ? "Collapse project info" : "Expand project info"}
        >
          <span
            className={
              isExpanded
                ? "graph-info-panel__toggle-icon graph-info-panel__toggle-icon--expanded"
                : "graph-info-panel__toggle-icon"
            }
          >
            ▶
          </span>
          {isExpanded ? "Hide project info" : "Show project info"}
        </button>

        <span className="graph-info-panel__name">
          {tck.name || "untitled"}
        </span>

        {tck.version && (
          <span className="graph-info-panel__badge graph-info-panel__badge--version">
            v{tck.version.replace(/^v/i, "")}
          </span>
        )}
        {tck.dataspace_version && (
          <span
            className="graph-info-panel__badge graph-info-panel__badge--dataspace"
            style={{ color: dataspaceColor, borderColor: dataspaceColor }}
          >
            {tck.dataspace_version}
          </span>
        )}

        <span className="graph-info-panel__spacer" />

        <button
          className="graph-info-panel__direction-toggle"
          onClick={handleToggleDirection}
          title={`Switch to ${direction === "TB" ? "horizontal" : "vertical"} layout`}
        >
          {direction === "TB" ? "↔ LR" : "↕ TB"}
        </button>
      </div>

      {/* Expandable body */}
      <div
        className={
          isExpanded
            ? "graph-info-panel__body-wrapper graph-info-panel__body-wrapper--expanded"
            : "graph-info-panel__body-wrapper"
        }
      >
        <div className="graph-info-panel__body">
          {isEditing ? (
            <GraphInfoEditForm onClose={handleCancelEdit} />
          ) : (
            <GraphInfoDisplay onEdit={handleEditClick} />
          )}
        </div>
      </div>
    </div>
  );
});
