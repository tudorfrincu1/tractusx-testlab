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

import { memo } from "react";
import { useProjectStore } from "../../../store/slices/useProjectStore";
import "./GraphInfoPanel.css";

export interface GraphInfoDisplayProps {
  onEdit: () => void;
}

/**
 * Read-only metadata display for the graph info panel.
 * Shows author, description, standards, and tags.
 */
export const GraphInfoDisplay = memo(function GraphInfoDisplay({
  onEdit,
}: GraphInfoDisplayProps) {
  const tck = useProjectStore((s) => s.tck);

  const standards = tck.standards ?? [];
  const tags = tck.tags ?? [];
  const hasContent = !!(tck.author || tck.description || standards.length > 0 || tags.length > 0);

  return (
    <div className="graph-info-panel__content">
      {tck.author && (
        <div className="graph-info-panel__row">
          <span className="graph-info-panel__label">Author</span>
          <span className="graph-info-panel__value">{tck.author}</span>
        </div>
      )}

      {tck.description && (
        <div className="graph-info-panel__row">
          <span className="graph-info-panel__label">Description</span>
          <span className="graph-info-panel__value graph-info-panel__value--description">{tck.description}</span>
        </div>
      )}

      {standards.length > 0 && (
        <div className="graph-info-panel__row">
          <span className="graph-info-panel__label">Standards</span>
          <span className="graph-info-panel__value">
            {standards.map((std) => (
              <span key={std.id} className="graph-info-panel__chip graph-info-panel__chip--standard">
                {std.id}
                {std.version && (
                  <span className="graph-info-panel__chip-version"> {std.version}</span>
                )}
              </span>
            ))}
          </span>
        </div>
      )}

      {tags.length > 0 && (
        <div className="graph-info-panel__row">
          <span className="graph-info-panel__label">Tags</span>
          <span className="graph-info-panel__value">
            {tags.map((tag) => (
              <span key={tag} className="graph-info-panel__chip graph-info-panel__chip--tag">
                {tag}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="graph-info-panel__edit-row">
        <button className="graph-info-panel__edit-btn" onClick={onEdit} title="Edit metadata">
          ✎ Edit
        </button>
      </div>

      {!hasContent && (
        <div className="graph-info-panel__empty">
          No metadata set.{" "}
          <button className="graph-info-panel__edit-btn" onClick={onEdit}>
            Add metadata
          </button>
        </div>
      )}
    </div>
  );
});
