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
 * Builds React Flow nodes and edges for a single script (setup / steps / teardown
 * phases), including the optional dataflow overlay of services and variables.
 */

import type { Node, Edge } from "@xyflow/react";
import type { ScriptDefinition, Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import type { GraphMode } from "@/store/editor/useEditorStore";
import { getServiceColor } from "./dependencyGraphNodeBuilders";
import { buildStepNode, addDataflowEdges, addVariableReadEdges, appendEndNode } from "./stepGraphEdges";

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const SPACING = 100;

interface PhaseBuildContext {
  allPhases: { label: string; steps: Step[] }[];
  mode: GraphMode;
  nodes: Node[];
  edges: Edge[];
  serviceNodeIds: Map<string, string>;
  memoryProducers: Map<string, string>;
  stepEntries: { nodeId: string; step: Step }[];
  startY: number;
  startPrevNodeId: string | null;
}

interface StepNodeContext {
  nodeId: string;
  step: Step;
  prevNodeId: string | null;
  y: number;
  mode: GraphMode;
  nodes: Node[];
  edges: Edge[];
  serviceNodeIds: Map<string, string>;
  memoryProducers: Map<string, string>;
  stepEntries: { nodeId: string; step: Step }[];
}

export function buildStepGraph(script: ScriptDefinition, mode: GraphMode): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const hasTeardown = (script.teardown?.length ?? 0) > 0;

  const allPhases: { label: string; steps: Step[] }[] = [
    { label: "Setup", steps: script.setup ?? [] },
    { label: "Steps", steps: script.steps ?? [] },
    { label: "Teardown", steps: script.teardown ?? [] },
  ];

  let y = 0;
  nodes.push({
    id: "flow-start",
    position: { x: 200, y },
    data: { label: "Start" },
    type: "start",
  });
  y += SPACING;

  const serviceNodeIds = buildServiceNodes(script, mode, y, nodes);
  const memoryProducers = new Map<string, string>();
  const stepEntries: { nodeId: string; step: Step }[] = [];

  const { y: endY, prevNodeId } = buildPhaseNodes({
    allPhases,
    mode,
    nodes,
    edges,
    serviceNodeIds,
    memoryProducers,
    stepEntries,
    startY: y,
    startPrevNodeId: "flow-start",
  });

  if (mode === "dataflow" && memoryProducers.size > 0) {
    addVariableReadEdges(stepEntries, edges, memoryProducers);
  }

  appendEndNode(nodes, edges, prevNodeId, endY, hasTeardown);

  return { nodes, edges };
}

/** Create one service node per declared service (dataflow mode only). */
function buildServiceNodes(
  script: ScriptDefinition,
  mode: GraphMode,
  y: number,
  nodes: Node[],
): Map<string, string> {
  const serviceNodeIds = new Map<string, string>();
  if (mode === "dataflow" && script.services) {
    for (const svc of script.services) {
      const svcNodeId = `svc-${svc.name}`;
      serviceNodeIds.set(svc.name, svcNodeId);
      nodes.push({
        id: svcNodeId,
        position: { x: 0, y },
        data: { label: svc.name, serviceType: svc.uses, color: getServiceColor(svc.uses) },
        type: "service",
      });
    }
  }
  return serviceNodeIds;
}

/** Build phase header nodes and their step nodes, tracking layout position. */
function buildPhaseNodes(ctx: PhaseBuildContext): { y: number; prevNodeId: string | null } {
  let y = ctx.startY;
  let prevNodeId = ctx.startPrevNodeId;

  for (const phase of ctx.allPhases) {
    if (phase.steps.length === 0) continue;

    const phaseId = `phase-${phase.label.toLowerCase()}`;
    ctx.nodes.push({
      id: phaseId,
      position: { x: 200, y },
      data: { label: `▸ ${phase.label}`, phase: true },
      type: "phase",
    });

    if (prevNodeId) {
      ctx.edges.push({
        id: `e-${prevNodeId}-${phaseId}`,
        source: prevNodeId,
        target: phaseId,
        animated: true,
        style: { stroke: "#4a4a4a" },
      });
    }
    prevNodeId = phaseId;
    y += SPACING;

    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i];
      const nodeId = `${phase.label.toLowerCase()}-${i}`;
      appendStepNode({
        nodeId,
        step,
        prevNodeId,
        y,
        mode: ctx.mode,
        nodes: ctx.nodes,
        edges: ctx.edges,
        serviceNodeIds: ctx.serviceNodeIds,
        memoryProducers: ctx.memoryProducers,
        stepEntries: ctx.stepEntries,
      });
      prevNodeId = nodeId;
      y += SPACING;
    }
  }

  return { y, prevNodeId };
}

/** Append a single step node plus its sequential and dataflow edges. */
function appendStepNode(ctx: StepNodeContext): void {
  const { nodeId, step, prevNodeId, y, mode, nodes, edges } = ctx;

  nodes.push(buildStepNode(nodeId, step, y, mode));

  edges.push({
    id: `e-${prevNodeId}-${nodeId}`,
    source: prevNodeId!,
    target: nodeId,
    animated: false,
    style: { stroke: "#3d3d3d" },
  });

  if (mode === "dataflow" && !isTemplateStep(step)) {
    addDataflowEdges(nodeId, step, nodes, edges, ctx.serviceNodeIds, ctx.memoryProducers, y);
  }

  if (!isTemplateStep(step)) {
    ctx.stepEntries.push({ nodeId, step });
  }
}
