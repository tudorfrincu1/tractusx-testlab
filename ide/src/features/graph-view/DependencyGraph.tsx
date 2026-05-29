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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "@/store/editor/useEditorStore";
import { theme } from "@/shared/theme/tractusxTheme";
import { modelToGraph } from "@/services";
import { applyDagreLayout } from "./layoutEngine";
import { nodeTypes } from "./nodeTypes";
import type { GraphMode } from "@/store/editor/useEditorStore";
import "./DependencyGraph.css";

const MODE_LABELS: { mode: GraphMode; label: string }[] = [
  { mode: "execution", label: "Execution Flow" },
  { mode: "dataflow", label: "Data Flow" },
];

export function DependencyGraph() {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner />
    </ReactFlowProvider>
  );
}

function DependencyGraphInner() {
  const { fitView } = useReactFlow();
  const model = useEditorStore((s) => s.model);
  const graphMode = useEditorStore((s) => s.graphMode);
  const setGraphMode = useEditorStore((s) => s.setGraphMode);
  const selectNode = useEditorStore((s) => s.selectNode);

  const graphData = useMemo(() => {
    const raw = modelToGraph(model, graphMode);
    return applyDagreLayout(raw.nodes, raw.edges);
  }, [model, graphMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  // Sync internal state when graph data changes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  // Re-center graph when data changes
  useEffect(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 200 }));
  }, [graphData, fitView]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  return (
    <div className="dependency-graph">
      {/* Mode toggle */}
      <div
        className="dependency-graph__mode-toggle"
        style={{
          background: theme.colors.bgLighter,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {MODE_LABELS.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setGraphMode(mode)}
            className="dependency-graph__mode-btn"
            style={{
              color: graphMode === mode ? "#000" : theme.colors.textMuted,
              background:
                graphMode === mode ? theme.colors.primary : "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: theme.colors.bg }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.5}
          color="#333"
        />
        <Controls
          style={{
            background: theme.colors.bgLighter,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
          }}
        />
        <MiniMap
          style={{
            background: theme.colors.bgLight,
            border: `1px solid ${theme.colors.border}`,
          }}
          nodeColor={(node) => {
            const data = node.data as { color?: string };
            return data?.color || theme.colors.primary;
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
