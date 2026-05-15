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

import { useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useProjectStore } from "../../../store/slices/useProjectStore";
import { buildDataFlow } from "./dataFlowBuilder";
import { PipelineGraphCanvas } from "./PipelineGraphCanvas";
import { StageListSidebar } from "./StageListSidebar";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { AnnotationsBar } from "./AnnotationsBar";
import type { LayoutDirection } from "../../../hooks/usePipelineLayout";
import type { PipelineNodeData } from "./types";
import { theme } from "../../../theme/tractusxTheme";
import "./PipelineGraphView.css";

export function PipelineGraphView() {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);

  const flowData = useMemo(
    () => buildDataFlow(testOrder, tests, tck.variables),
    [testOrder, tests, tck.variables],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [direction, setDirection] = useState<LayoutDirection>("TB");

  const selectedNodeData = useMemo((): PipelineNodeData | null => {
    if (!selectedNodeId) return null;
    const node = flowData.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const inputs: Array<{ variable: string; source: string }> = [];
    for (const edge of flowData.edges) {
      if (edge.to !== node.id) continue;
      for (const v of edge.variables) {
        inputs.push({ variable: v, source: edge.from });
      }
    }
    return {
      name: node.name,
      stepCount: node.stepCount,
      completedSteps: 0,
      status: "idle",
      outputs: node.outputs,
      inputs,
      services: node.services,
      stepNames: node.stepNames,
      direction,
    };
  }, [selectedNodeId, flowData, direction]);

  if (flowData.nodes.length === 0) {
    return (
      <div className="pipeline-graph-view--empty">
        No tests in the pipeline. Add tests to see the graph.
      </div>
    );
  }

  const failedNodes = flowData.nodes.filter(() => false);

  return (
    <ReactFlowProvider>
      <div className="pipeline-graph-view">
        <StageListSidebar
          nodes={flowData.nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />

        <PipelineGraphCanvas
          flowData={flowData}
          direction={direction}
          onDirectionChange={setDirection}
          onNodeSelect={setSelectedNodeId}
        />

        {selectedNodeData && (
          <NodeDetailPanel
            data={selectedNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        <AnnotationsBar
          annotations={failedNodes.map((n) => ({
            nodeId: n.id,
            stageName: n.name,
            message: "Stage failed",
          }))}
          onSelectAnnotation={setSelectedNodeId}
        />
      </div>
    </ReactFlowProvider>
  );
}
