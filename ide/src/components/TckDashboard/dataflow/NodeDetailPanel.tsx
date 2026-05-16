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
import type { PipelineNodeData, PipelineStageStatus } from "./types";
import "./PipelineDetailPanel.css";

export interface NodeDetailPanelProps {
  data: PipelineNodeData;
  onClose: () => void;
}

const STATUS_LABELS: Record<PipelineStageStatus, string> = {
  idle: "Idle",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
} as const;

export const NodeDetailPanel = memo(function NodeDetailPanel({
  data,
  onClose,
}: NodeDetailPanelProps) {
  const progressLabel = `${data.completedSteps}/${data.stepCount} steps · ${STATUS_LABELS[data.status]}`;

  return (
    <aside className="node-detail-panel">
      <div className="node-detail-panel__header">
        <div className="node-detail-panel__title">
          <span className="node-detail-panel__name">{data.name}</span>
          <span className={`node-detail-panel__badge node-detail-panel__badge--${data.status}`}>
            {STATUS_LABELS[data.status]}
          </span>
        </div>
        <button className="node-detail-panel__close" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="node-detail-panel__progress">{progressLabel}</div>

      {data.services.length > 0 && (
        <DetailSection title="Services">
          <div className="node-detail-panel__chips">
            {data.services.map((s) => (
              <span key={s} className="node-detail-panel__chip node-detail-panel__chip--service">
                {s}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {data.inputs.length > 0 && (
        <DetailSection title="Inputs (from Chain)">
          <ul className="node-detail-panel__var-list">
            {data.inputs.map((inp) => (
              <li key={inp.variable} className="node-detail-panel__var-item">
                <span className="node-detail-panel__var-name">@{inp.variable}</span>
                <span className="node-detail-panel__var-source">← {inp.source}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="Steps">
        <ul className="node-detail-panel__step-list">
          {data.stepNames.map((name, i) => {
            const stepStatus = resolveStepStatus(i, data);
            return (
              <li key={i} className="node-detail-panel__step-item">
                <span className="node-detail-panel__step-number">{i + 1}.</span>
                <span className="node-detail-panel__step-name">{name}</span>
                <span className={`node-detail-panel__step-dot node-detail-panel__step-dot--${stepStatus}`} />
              </li>
            );
          })}
        </ul>
      </DetailSection>

      {data.outputs.length > 0 && (
        <DetailSection title="Outputs">
          <div className="node-detail-panel__chips">
            {data.outputs.map((o) => (
              <span key={o} className="node-detail-panel__chip node-detail-panel__chip--output">
                @{o}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </aside>
  );
});

/* ── Helpers ────────────────────────────────────────────────────────────── */

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="node-detail-panel__section">
      <div className="node-detail-panel__section-title">{title}</div>
      {children}
    </div>
  );
}

function resolveStepStatus(index: number, data: PipelineNodeData): PipelineStageStatus {
  if (data.status === "idle" || data.status === "skipped") return data.status;
  if (index < data.completedSteps) return "passed";
  if (index === data.completedSteps && data.status === "failed") return "failed";
  if (index === data.completedSteps && data.status === "running") return "running";
  return "idle";
}
