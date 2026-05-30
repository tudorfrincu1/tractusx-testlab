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

import { memo, useState, useCallback, useMemo } from "react";
import { useProjectStore } from "@/store";
import { MetadataEditor } from "./MetadataEditor";

const DATASPACE_COLORS: Record<string, string> = {
  saturn: "#fbbf24",
  jupiter: "#fbbf24",
} as const;

export interface MetadataSummaryProps {
  onEditingChange?: (isEditing: boolean) => void;
}

/**
 * Prominent TCK metadata display with inline expandable editor.
 * Collapsed: shows TCK identity prominently. Expanded: full edit form.
 */
export const MetadataSummary = memo(function MetadataSummary({
  onEditingChange,
}: MetadataSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDescCollapsed, setIsDescCollapsed] = useState(false);

  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);

  const variableCount = useMemo(() => {
    const tckVars = Object.keys(tck.variables ?? {}).length;
    let testVars = 0;
    for (const test of tests.values()) {
      testVars += Object.keys(test.variables ?? {}).length;
    }
    return tckVars + testVars;
  }, [tck.variables, tests]);

  const standards = tck.standards ?? [];
  const dataspaceColor = DATASPACE_COLORS[tck.dataspace_version ?? ""] ?? "#999";

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    onEditingChange?.(true);
  }, [onEditingChange]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onEditingChange?.(false);
  }, [onEditingChange]);

  if (isEditing) {
    return (
      <section className="metadata-summary metadata-summary--editing">
        <MetadataEditor onClose={handleClose} />
      </section>
    );
  }

  return (
    <section className="metadata-summary">
      <div className="metadata-summary__display">
        {/* Row 1: Name + version + dataspace badges */}
        <div className="metadata-summary__header-row">
          <span className="metadata-summary__name">
            {tck.name || "untitled"}
          </span>
          {tck.version && (
            <span className="metadata-summary__badge metadata-summary__badge--version">
              v{tck.version.replace(/^v/i, "")}
            </span>
          )}
          {tck.dataspace_version && (
            <span
              className="metadata-summary__badge metadata-summary__badge--dataspace"
              style={{ color: dataspaceColor, borderColor: dataspaceColor }}
            >
              {tck.dataspace_version}
            </span>
          )}
        </div>

        {/* Row 2: Description */}
        {tck.description && (
          <div className="metadata-summary__desc-wrap">
            <span
              className={
                isDescCollapsed
                  ? "metadata-summary__description metadata-summary__description--clamped"
                  : "metadata-summary__description"
              }
            >
              {tck.description}
            </span>
            {tck.description.length > 100 && (
              <button
                className="metadata-summary__desc-toggle"
                onClick={() => setIsDescCollapsed((prev) => !prev)}
              >
                {isDescCollapsed ? "Show more" : "Show less"}
              </button>
            )}
          </div>
        )}

        {/* Row 3: Standard chips */}
        {standards.length > 0 && (
          <div className="metadata-summary__standards">
            {standards.map((std) => (
              <span key={std.id} className="metadata-summary__standard-chip">
                {std.id}
                {std.version && (
                  <span className="metadata-summary__standard-version">
                    {std.version}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Row 4: Author + variables + edit button */}
        <div className="metadata-summary__footer-row">
          {tck.author && (
            <span className="metadata-summary__author">{tck.author}</span>
          )}
          <span className="metadata-summary__var-count">
            {variableCount} variable{variableCount !== 1 ? "s" : ""}
          </span>
          <button
            className="metadata-summary__edit-btn"
            onClick={handleEditClick}
            title="Edit metadata"
          >
            ✎ Edit
          </button>
        </div>
      </div>
    </section>
  );
});
