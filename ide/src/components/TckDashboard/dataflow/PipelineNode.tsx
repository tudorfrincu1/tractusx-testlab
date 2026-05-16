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
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PipelineDirection, PipelineNodeData, PipelineStageStatus } from "./types";
import "./PipelineGraph.css";

/* ── Status icons (plain Unicode — no icon library needed) ──────────────── */

const STATUS_ICONS: Record<PipelineStageStatus, string> = {
  idle: "○",
  running: "◉",
  passed: "✓",
  failed: "✗",
  skipped: "⊘",
} as const;

/* ── Progress calculation ───────────────────────────────────────────────── */

function computeProgressPercent(data: PipelineNodeData): number {
  if (data.status === "passed") return 100;
  if (data.status === "skipped" || data.status === "idle") return 0;
  if (data.stepCount === 0) return 0;
  return Math.round((data.completedSteps / data.stepCount) * 100);
}

/* ── Component ──────────────────────────────────────────────────────────── */

function getHandlePositions(direction: PipelineDirection): {
  source: Position;
  target: Position;
} {
  return direction === "TB"
    ? { source: Position.Bottom, target: Position.Top }
    : { source: Position.Right, target: Position.Left };
}

export const PipelineNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as PipelineNodeData;
  const progress = computeProgressPercent(d);
  const statusClass = `pipeline-node--${d.status}`;
  const { source, target } = getHandlePositions(d.direction ?? "TB");

  return (
    <div className={`pipeline-node ${statusClass}`}>
      <Handle type="target" position={target} />

      <span className="pipeline-node__icon">{STATUS_ICONS[d.status]}</span>

      <span className="pipeline-node__name">
        <span className="pipeline-node__index">{d.stageIndex}.</span>
        {d.name}
      </span>

      <span className="pipeline-node__meta">
        <span>
          {d.completedSteps}/{d.stepCount}
        </span>
      </span>

      <div
        className="pipeline-node__progress-bar"
        style={{ width: `${progress}%` }}
      />

      <Handle type="source" position={source} />
    </div>
  );
});

/** Node type registry entry for React Flow. */
export const pipelineNodeTypes = {
  pipeline: PipelineNode,
} as const;
