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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { Node, Edge } from "@xyflow/react";
import type { StepDefinition, TckDefinition } from "../../models/schema";
import { isTestRef } from "../../models/schema";
import type { GraphData } from "./modelToGraph";

export function getStepService(step: StepDefinition): string | undefined {
  const svc = step.params?.service;
  return typeof svc === "string" ? svc : undefined;
}

export function collectVariableRefs(params: Record<string, unknown>): Set<string> {
  const refs = new Set<string>();
  const varPattern = /\$\{\{\s*vars\.(\w+)\s*\}\}|@(\w+)|\$\{([^}]+)\}|\{\{([^}]+)\}\}/g;

  function walk(value: unknown): void {
    if (typeof value === "string") {
      let match: RegExpExecArray | null;
      while ((match = varPattern.exec(value)) !== null) {
        refs.add(match[1] || match[2] || match[3] || match[4]);
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

export function getServiceColor(serviceType: string): string {
  const colors: Record<string, string> = {
    CONNECTOR_PROVIDER: "#5C9A6B",
    CONNECTOR_CONSUMER: "#4A90D9",
    DSP_CONSUMER: "#D4A843",
    DSP_PROVIDER: "#C96B7A",
    DTR: "#5EA8A8",
  };
  return colors[serviceType] || "#888";
}

export function buildTckSummaryGraph(model: TckDefinition): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const spacing = 120;
  let y = 0;

  nodes.push({
    id: "tc-root",
    position: { x: 200, y },
    data: { label: model.name, tck: true },
    type: "testcase",
  });
  y += spacing;

  for (let i = 0; i < model.tests.length; i++) {
    const test = model.tests[i];
    const nodeId = `test-${i}`;
    if (typeof test === "string") {
      nodes.push({
        id: nodeId,
        position: { x: 200, y },
        data: { label: test.replace("!include ", ""), include: true },
        type: "include",
      });
    } else if (isTestRef(test)) {
      nodes.push({
        id: nodeId,
        position: { x: 200, y },
        data: { label: test.test, ref: true },
        type: "test",
      });
    } else {
      nodes.push({
        id: nodeId,
        position: { x: 200, y },
        data: { label: test.name, inline: true },
        type: "test",
      });
    }
    edges.push({
      id: `e-tc-${nodeId}`,
      source: "tc-root",
      target: nodeId,
      style: { stroke: "#FFD700" },
    });
    y += spacing;
  }
  return { nodes, edges };
}
