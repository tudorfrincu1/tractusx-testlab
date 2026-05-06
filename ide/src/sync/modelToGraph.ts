/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

/**
 * Converts a TestLabDocument model into React Flow nodes and edges
 * for the dependency graph visualization.
 */

import type { Node, Edge } from "@xyflow/react";
import type { TestLabDocument, ScriptDefinition, StepDefinition } from "../models/schema";
import { isTestCase, isTestRef } from "../models/schema";
import { getStepColor } from "../theme/tractusxTheme";
import type { GraphMode } from "../store/useTestLabStore";

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export function modelToGraph(model: TestLabDocument, mode: GraphMode): GraphData {
  if (isTestCase(model)) {
    const firstInline = model.tests.find((t) => typeof t !== "string" && !isTestRef(t));
    if (firstInline && typeof firstInline !== "string" && !isTestRef(firstInline)) {
      return buildStepGraph(firstInline, mode);
    }
    return buildTestCaseSummaryGraph(model);
  }

  return buildStepGraph(model as ScriptDefinition, mode);
}

function buildStepGraph(script: ScriptDefinition, mode: GraphMode): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;
  const spacing = 100;
  const hasCleanup = (script.cleanup?.length ?? 0) > 0;

  const allPhases: { label: string; steps: StepDefinition[] }[] = [
    { label: "Setup", steps: script.setup ?? [] },
    { label: "Steps", steps: script.steps ?? [] },
    { label: "Cleanup", steps: script.cleanup ?? [] },
  ];

  // Start node
  nodes.push({
    id: "flow-start",
    position: { x: 200, y },
    data: { label: "Start" },
    type: "start",
  });
  let prevNodeId: string | null = "flow-start";
  y += spacing;

  const serviceNodeIds = new Map<string, string>();
  if (mode === "dataflow" && script.services) {
    for (const svc of script.services) {
      const svcNodeId = `svc-${svc.name}`;
      serviceNodeIds.set(svc.name, svcNodeId);
      nodes.push({
        id: svcNodeId,
        position: { x: 0, y },
        data: { label: svc.name, serviceType: svc.type, color: getServiceColor(svc.type) },
        type: "service",
      });
    }
  }

  const memoryProducers = new Map<string, string>();
  const stepEntries: { nodeId: string; step: StepDefinition }[] = [];

  for (const phase of allPhases) {
    if (phase.steps.length === 0) continue;

    const phaseId = `phase-${phase.label.toLowerCase()}`;
    nodes.push({
      id: phaseId,
      position: { x: 200, y },
      data: { label: `▸ ${phase.label}`, phase: true },
      type: "phase",
    });

    if (prevNodeId) {
      edges.push({
        id: `e-${prevNodeId}-${phaseId}`,
        source: prevNodeId,
        target: phaseId,
        animated: true,
        style: { stroke: "#4a4a4a" },
      });
    }
    prevNodeId = phaseId;
    y += spacing;

    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i];
      const nodeId = `${phase.label.toLowerCase()}-${i}`;

      nodes.push({
        id: nodeId,
        position: { x: 200, y },
        data: {
          label: step.name || step.type,
          stepType: step.type,
          color: getStepColor(step.type),
          hasAssertions: (step.expect?.length ?? 0) > 0,
          storesMemory: !!step.store_in_memory,
          conditional: !!step.if,
          serviceName: mode === "dataflow" ? getStepService(step) : undefined,
        },
        type: "step",
      });

      edges.push({
        id: `e-${prevNodeId}-${nodeId}`,
        source: prevNodeId!,
        target: nodeId,
        animated: false,
        style: { stroke: "#3d3d3d" },
      });

      if (mode === "dataflow") {
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

        if (step.store_in_memory) {
          for (const [key] of Object.entries(step.store_in_memory)) {
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

        stepEntries.push({ nodeId, step });
      }

      prevNodeId = nodeId;
      y += spacing;
    }
  }

  if (mode === "dataflow" && memoryProducers.size > 0) {
    for (const { nodeId, step } of stepEntries) {
      const refs = collectVariableRefs(step.params);
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

  // End node
  const endId = "flow-end";
  const endLabel = hasCleanup ? "End" : "Auto Cleanup & End";
  nodes.push({
    id: endId,
    position: { x: 200, y },
    data: { label: endLabel, autoCleanup: !hasCleanup },
    type: "end",
  });
  if (prevNodeId) {
    edges.push({
      id: `e-${prevNodeId}-${endId}`,
      source: prevNodeId,
      target: endId,
      animated: !hasCleanup,
      style: { stroke: hasCleanup ? "#3d3d3d" : "#C96B7A", strokeDasharray: hasCleanup ? undefined : "4,4" },
    });
  }

  return { nodes, edges };
}

function getStepService(step: StepDefinition): string | undefined {
  const svc = step.params?.service;
  return typeof svc === "string" ? svc : undefined;
}

function collectVariableRefs(params: Record<string, unknown>): Set<string> {
  const refs = new Set<string>();
  const varPattern = /\$\{([^}]+)\}|\{\{([^}]+)\}\}/g;

  function walk(value: unknown): void {
    if (typeof value === "string") {
      let match: RegExpExecArray | null;
      while ((match = varPattern.exec(value)) !== null) {
        refs.add(match[1] || match[2]);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) walk(item);
    } else if (value && typeof value === "object") {
      for (const v of Object.values(value)) walk(v);
    }
  }

  walk(params);
  return refs;
}

function getServiceColor(serviceType: string): string {
  const colors: Record<string, string> = {
    CONNECTOR_PROVIDER: "#5C9A6B",
    CONNECTOR_CONSUMER: "#4A90D9",
    DSP_CONSUMER: "#D4A843",
    DSP_PROVIDER: "#C96B7A",
    DTR: "#5EA8A8",
  };
  return colors[serviceType] || "#888";
}

function buildTestDependencyGraph(model: import("../models/schema").TestCaseDefinition): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const spacing = 120;
  let y = 0;

  nodes.push({ id: "tc-root", position: { x: 200, y }, data: { label: model.name, testCase: true }, type: "testcase" });
  y += spacing;

  for (let i = 0; i < model.tests.length; i++) {
    const test = model.tests[i];
    const nodeId = `test-${i}`;
    if (typeof test === "string") {
      nodes.push({ id: nodeId, position: { x: 200, y }, data: { label: test.replace("!include ", ""), include: true }, type: "include" });
    } else if (isTestRef(test)) {
      nodes.push({ id: nodeId, position: { x: 200, y }, data: { label: test.test, ref: true }, type: "test" });
    } else {
      nodes.push({ id: nodeId, position: { x: 200, y }, data: { label: test.name, inline: true }, type: "test" });
    }
    edges.push({ id: `e-tc-${nodeId}`, source: "tc-root", target: nodeId, style: { stroke: "#FFD700" } });
    y += spacing;
  }
  return { nodes, edges };
}

function buildTestCaseSummaryGraph(model: import("../models/schema").TestCaseDefinition): GraphData {
  return buildTestDependencyGraph(model);
}
