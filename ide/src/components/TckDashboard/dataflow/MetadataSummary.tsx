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
import { useProjectStore } from "../../../store/slices/useProjectStore";
import "./MetadataSummary.css";

/**
 * Compact, collapsible TCK metadata summary for the sidebar.
 * Shows name, version, variable count. Collapsed by default.
 */
export const MetadataSummary = memo(function MetadataSummary() {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setIsExpanded((v) => !v), []);

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

  const tagCount = (tck.tags ?? []).length;
  const standardCount = (tck.standards ?? []).length;

  return (
    <section className="metadata-summary">
      <button
        className="metadata-summary__toggle"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <span className="metadata-summary__chevron" data-expanded={isExpanded}>
          ▶
        </span>
        <span className="metadata-summary__title">TCK Metadata</span>
      </button>

      {/* Collapsed: compact info row */}
      {!isExpanded && (
        <div className="metadata-summary__compact">
          <span className="metadata-summary__chip" title="TCK name">
            {tck.name || "untitled"}
          </span>
          {tck.version && (
            <span className="metadata-summary__chip" title="Version">
              v{tck.version}
            </span>
          )}
          {variableCount > 0 && (
            <span className="metadata-summary__chip" title="Variables">
              {variableCount} var{variableCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Expanded: full detail list */}
      {isExpanded && (
        <div className="metadata-summary__details">
          <DetailRow label="Name" value={tck.name || "—"} />
          <DetailRow label="Version" value={tck.version || "—"} />
          <DetailRow label="Dataspace" value={tck.dataspace_version || "—"} />
          <DetailRow label="Author" value={tck.author || "—"} />
          {tck.description && (
            <DetailRow label="Description" value={tck.description} />
          )}
          <DetailRow label="Variables" value={String(variableCount)} />
          {standardCount > 0 && (
            <DetailRow label="Standards" value={String(standardCount)} />
          )}
          {tagCount > 0 && (
            <div className="metadata-summary__tags">
              {(tck.tags ?? []).map((tag) => (
                <span key={tag} className="metadata-summary__tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
});

/* ── Detail row ─────────────────────────────────────────────────────────── */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="metadata-summary__row">
      <span className="metadata-summary__label">{label}</span>
      <span className="metadata-summary__value">{value}</span>
    </div>
  );
}
