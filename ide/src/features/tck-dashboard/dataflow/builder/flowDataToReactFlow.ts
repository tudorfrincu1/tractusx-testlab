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

import type { Node, Edge } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { FlowData, FlowEdge, FlowNode } from "./dataFlowBuilder";
import type { PipelineNodeData, PipelineEdgeData, PipelineStageStatus } from "./pipelineGraph.types";

/** Status map keyed by test/node name — injected from execution state. */
export interface StageStatusMap {
  [nodeId: string]: {
    status: PipelineStageStatus;
    completedSteps: number;
  };
}

/** Result of converting FlowData to React Flow elements. */
export interface ReactFlowPipelineData {
  nodes: Node<PipelineNodeData>[];
  edges: Edge<PipelineEdgeData>[];
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function buildInputsForNode(
  node: FlowNode,
  edges: FlowEdge[],
): Array<{ variable: string; source: string }> {
  const inputs: Array<{ variable: string; source: string }> = [];
  for (const edge of edges) {
    if (edge.to !== node.id) continue;
    for (const variable of edge.variables) {
      inputs.push({ variable, source: edge.from });
    }
  }
  return inputs;
}

function toReactFlowNode(
  node: FlowNode,
  index: number,
  inputs: Array<{ variable: string; source: string }>,
  statusMap: StageStatusMap,
): Node<PipelineNodeData> {
  const stageStatus = statusMap[node.id];
  return {
    id: node.id,
    type: "pipeline",
    position: { x: 0, y: 0 },
    data: {
      name: node.name,
      stageIndex: index + 1,
      stepCount: node.stepCount,
      completedSteps: stageStatus?.completedSteps ?? 0,
      status: stageStatus?.status ?? "idle",
      outputs: node.outputs,
      inputs,
      services: node.services,
      stepNames: node.stepNames,
    },
  };
}

const SEQUENTIAL_ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  color: "#666",
  width: 20,
  height: 20,
} as const;

function toReactFlowEdge(edge: FlowEdge): Edge<PipelineEdgeData> {
  return {
    id: `${edge.from}→${edge.to}`,
    source: edge.from,
    target: edge.to,
    type: "pipeline",
    markerEnd: SEQUENTIAL_ARROW_MARKER,
    data: { variables: edge.variables },
  };
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Converts a `FlowData` model (from `buildDataFlow()`) into React Flow
 * nodes and edges suitable for the pipeline graph view.
 *
 * Positions are set to (0, 0) — apply `layoutPipelineGraph()` afterwards.
 */
export function flowDataToReactFlow(
  flowData: FlowData,
  statusMap: StageStatusMap = {},
): ReactFlowPipelineData {
  const nodes = flowData.nodes.map((node, index) => {
    const inputs = buildInputsForNode(node, flowData.edges);
    return toReactFlowNode(node, index, inputs, statusMap);
  });

  // Only render sequential edges — variable-only edges are shown in the detail panel
  const sequentialEdges = flowData.edges.filter((e) => e.type === "sequential");
  const edges = sequentialEdges.map(toReactFlowEdge);

  return { nodes, edges };
}
