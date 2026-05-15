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
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { PipelineEdgeData, PipelineStageStatus } from "./types";
import "./PipelineGraph.css";

/** Determines edge visual class based on connected node statuses. */
export type PipelineEdgeStatus = "idle" | "active" | "error";

export interface PipelineEdgeExtraProps {
  /** Status of the source node — used to derive edge appearance. */
  sourceStatus?: PipelineStageStatus;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const EDGE_COLORS: Record<PipelineEdgeStatus, string> = {
  idle: "#4a4a4a",
  active: "#42a5f5",
  error: "#ff6b6b",
} as const;

function deriveEdgeStatus(sourceStatus?: PipelineStageStatus): PipelineEdgeStatus {
  if (sourceStatus === "failed") return "error";
  if (sourceStatus === "running" || sourceStatus === "passed") return "active";
  return "idle";
}

function formatLabel(variables: string[]): string {
  return `${variables.length} var${variables.length !== 1 ? "s" : ""}`;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export const PipelineEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
  } = props;

  const edgeData = data as unknown as (PipelineEdgeData & PipelineEdgeExtraProps) | undefined;
  const variables = edgeData?.variables ?? [];
  const edgeStatus = deriveEdgeStatus(edgeData?.sourceStatus);
  const statusClass = edgeStatus !== "idle" ? `pipeline-edge--${edgeStatus}` : "";

  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <g
      className={statusClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: EDGE_COLORS[edgeStatus],
          strokeWidth: edgeStatus === "idle" ? 1.5 : 2,
        }}
      />

      {variables.length > 0 && (
        <EdgeLabelRenderer>
          <div
            className="pipeline-edge__label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            {formatLabel(variables)}
          </div>

          {isHovered && variables.length > 0 && (
            <div
              className="pipeline-edge__tooltip"
              style={{
                transform: `translate(-50%, -120%) translate(${labelX}px,${labelY}px)`,
              }}
            >
              {variables.join(", ")}
            </div>
          )}
        </EdgeLabelRenderer>
      )}
    </g>
  );
});

/** Edge type registry entry for React Flow. */
export const pipelineEdgeTypes = {
  pipeline: PipelineEdge,
} as const;
