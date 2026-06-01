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
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

/**
 * Builders for individual React Flow step nodes and the dataflow/terminal edges
 * used by the step-graph layout.
 */

import type { Node, Edge } from "@xyflow/react";
import type { Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import { getStepColor } from "@/shared/theme/tractusxTheme";
import type { GraphMode } from "@/store/editor/useEditorStore";
import { getStepService, collectVariableRefs } from "./dependencyGraphNodeBuilders";

/** Build a single step node from the step definition. */
export function buildStepNode(nodeId: string, step: Step, y: number, mode: GraphMode): Node {
  if (isTemplateStep(step)) {
    return {
      id: nodeId,
      position: { x: 200, y },
      data: {
        label: step.description || `⟪ ${step.template} ⟫`,
        stepType: `template:${step.template}`,
        color: getStepColor("template"),
        hasAssertions: false,
        storesMemory: false,
        conditional: false,
      },
      type: "step",
    };
  }
  return {
    id: nodeId,
    position: { x: 200, y },
    data: {
      label: step.name || step.uses,
      stepType: step.uses,
      color: getStepColor(step.uses),
      hasAssertions: (step.validate?.length ?? 0) > 0,
      storesMemory: !!step.returns,
      conditional: !!step.if,
      serviceName: mode === "dataflow" ? getStepService(step) : undefined,
    },
    type: "step",
  };
}

/** Add dataflow-specific edges: service connections and memory store edges. */
export function addDataflowEdges(
  nodeId: string,
  step: Step & { uses: string },
  nodes: Node[],
  edges: Edge[],
  serviceNodeIds: Map<string, string>,
  memoryProducers: Map<string, string>,
  y: number,
): void {
  const svcName = getStepService(step);
  if (svcName && serviceNodeIds.has(svcName)) {
    edges.push({
      id: `e-svc-${nodeId}-${svcName}`,
      source: nodeId,
      target: serviceNodeIds.get(svcName)!,
      style: { stroke: "#5EA8A8", strokeDasharray: "4,4" },
      label: "uses",
      animated: false,
    });
  }

  if (step.returns) {
    for (const [key] of Object.entries(step.returns)) {
      const memNodeId = `mem-${key}`;
      if (!nodes.find((n) => n.id === memNodeId)) {
        nodes.push({
          id: memNodeId,
          position: { x: 450, y },
          data: { label: key, variable: true },
          type: "variable",
        });
      }
      edges.push({
        id: `e-store-${nodeId}-${memNodeId}`,
        source: nodeId,
        target: memNodeId,
        style: { stroke: "#FFD700", strokeDasharray: "5,5" },
        label: "stores",
      });
      memoryProducers.set(key, nodeId);
    }
  }
}

/** Add edges for steps that read variables produced by earlier steps. */
export function addVariableReadEdges(
  stepEntries: { nodeId: string; step: Step }[],
  edges: Edge[],
  memoryProducers: Map<string, string>,
): void {
  for (const { nodeId, step } of stepEntries) {
    const params = isTemplateStep(step) ? (step.params ?? {}) : step.with;
    const refs = collectVariableRefs(params);
    for (const varName of refs) {
      const memNodeId = `mem-${varName}`;
      if (memoryProducers.has(varName)) {
        edges.push({
          id: `e-read-${memNodeId}-${nodeId}`,
          source: memNodeId,
          target: nodeId,
          style: { stroke: "#9B8EC4", strokeDasharray: "3,3" },
          label: "reads",
          animated: true,
        });
      }
    }
  }
}

/** Append the terminal "End" node and its edge. */
export function appendEndNode(
  nodes: Node[],
  edges: Edge[],
  prevNodeId: string | null,
  y: number,
  hasTeardown: boolean,
): void {
  const endId = "flow-end";
  const endLabel = hasTeardown ? "End" : "Auto Cleanup & End";
  nodes.push({
    id: endId,
    position: { x: 200, y },
    data: { label: endLabel, autoCleanup: !hasTeardown },
    type: "end",
  });
  if (prevNodeId) {
    edges.push({
      id: `e-${prevNodeId}-${endId}`,
      source: prevNodeId,
      target: endId,
      animated: !hasTeardown,
      style: { stroke: hasTeardown ? "#3d3d3d" : "#C96B7A", strokeDasharray: hasTeardown ? undefined : "4,4" },
    });
  }
}
