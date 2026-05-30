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

import { useMemo, useEffect, useRef } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { FlowData } from "@/features/tck-dashboard/dataflow/builder/dataFlowBuilder";
import { flowDataToReactFlow, type StageStatusMap } from "@/features/tck-dashboard/dataflow/builder/flowDataToReactFlow";
import { layoutPipelineGraph } from "@/features/tck-dashboard/dataflow/graph/pipelineLayout";

export type LayoutDirection = "TB" | "LR";

const EMPTY_STATUS_MAP: StageStatusMap = {};

/**
 * Hook that converts FlowData into layouted React Flow nodes/edges.
 * Re-runs layout when flowData, direction, or statusMap changes.
 */
export function usePipelineLayout(
  flowData: FlowData,
  direction: LayoutDirection,
  statusMap: StageStatusMap = EMPTY_STATUS_MAP,
) {
  const layouted = useMemo(() => {
    const { nodes: rfNodes, edges: rfEdges } = flowDataToReactFlow(flowData, statusMap);
    // Inject direction into each node's data so PipelineNode can set Handle positions
    const nodesWithDirection = rfNodes.map((node) => ({
      ...node,
      data: { ...node.data, direction },
    }));
    return layoutPipelineGraph(nodesWithDirection, rfEdges, direction);
  }, [flowData, direction, statusMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  const prevLayoutRef = useRef(layouted);
  useEffect(() => {
    if (prevLayoutRef.current !== layouted) {
      prevLayoutRef.current = layouted;
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, [layouted, setNodes, setEdges]);

  return { nodes, edges, onNodesChange, onEdgesChange } as const;
}
