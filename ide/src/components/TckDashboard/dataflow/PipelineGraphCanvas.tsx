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

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowData } from "./dataFlowBuilder";
import { usePipelineLayout, type LayoutDirection } from "../../../hooks/usePipelineLayout";
import { pipelineNodeTypes } from "./PipelineNode";
import { pipelineEdgeTypes } from "./PipelineEdge";
import { theme } from "../../../theme/tractusxTheme";
import type { PipelineNodeData } from "./types";
import "./PipelineGraph.css";

export interface PipelineGraphCanvasProps {
  flowData: FlowData;
  direction: LayoutDirection;
  onDirectionChange: (dir: LayoutDirection) => void;
  onNodeSelect: (nodeId: string) => void;
}

const nodeTypesMemo = { ...pipelineNodeTypes } as const;
const edgeTypesMemo = { ...pipelineEdgeTypes } as const;

export function PipelineGraphCanvas({
  flowData,
  direction,
  onDirectionChange,
  onNodeSelect,
}: PipelineGraphCanvasProps) {
  const { fitView } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange } = usePipelineLayout(flowData, direction);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 200 }));
  }, [nodes.length, direction, fitView]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const handleToggleDirection = useCallback(() => {
    onDirectionChange(direction === "TB" ? "LR" : "TB");
  }, [direction, onDirectionChange]);

  const miniMapNodeColor = useCallback((node: { data: Record<string, unknown> }) => {
    const data = node.data as unknown as PipelineNodeData;
    if (data.status === "failed") return theme.colors.error;
    if (data.status === "passed") return theme.colors.success;
    if (data.status === "running") return theme.colors.warning;
    return "#555";
  }, []);

  return (
    <div className="pipeline-graph-canvas">
      <button
        className="pipeline-graph-canvas__direction-toggle"
        onClick={handleToggleDirection}
        title={`Switch to ${direction === "TB" ? "horizontal" : "vertical"} layout`}
      >
        {direction === "TB" ? "↔ LR" : "↕ TB"}
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypesMemo}
        edgeTypes={edgeTypesMemo}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="pipeline-graph-canvas__flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={0.5} color="#333" />
        <Controls className="pipeline-graph-canvas__controls" />
        <MiniMap
          className="pipeline-graph-canvas__minimap"
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
