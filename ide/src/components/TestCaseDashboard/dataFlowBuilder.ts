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

import type { ScriptDefinition } from "../../models/schema";
import { isTemplateStep } from "../../models/schema";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface FlowNode {
  id: string;
  name: string;
  variables: string[];
  outputs: string[];
  services: string[];
  stepCount: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  variables: string[];
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  sharedVariables: string[];
}

/* ── Builder ────────────────────────────────────────────────────────────── */

export function buildDataFlow(
  testOrder: string[],
  tests: Map<string, ScriptDefinition>,
  testCaseVariables: Record<string, unknown> | undefined,
): FlowData {
  const nodes: FlowNode[] = [];
  const producerMap = new Map<string, string>();

  for (const name of testOrder) {
    const script = tests.get(name);
    if (!script) continue;

    const vars = script.variables ? Object.keys(script.variables) : [];

    // Collect exported variables from teardown export_variable steps
    const exportedVars: string[] = [];
    for (const step of script.teardown ?? []) {
      if (!isTemplateStep(step) && step.type === "export_variable" && step.params?.name) {
        exportedVars.push(String(step.params.name));
      }
    }

    const memoryKeys = new Set<string>();
    for (const phase of [script.setup, script.steps, script.teardown]) {
      for (const step of phase ?? []) {
        if (!isTemplateStep(step) && step.store_in_memory) {
          for (const key of Object.keys(step.store_in_memory)) {
            memoryKeys.add(key);
          }
        }
      }
    }

    const allOutputs = [...new Set([...exportedVars, ...memoryKeys])];
    for (const out of allOutputs) {
      producerMap.set(out, name);
    }

    const services = script.services?.map((s) => s.name) ?? [];
    const stepCount = (script.setup?.length ?? 0) + (script.steps?.length ?? 0) + (script.teardown?.length ?? 0);

    nodes.push({ id: name, name, variables: vars, outputs: allOutputs, services, stepCount });
  }

  const edges: FlowEdge[] = [];
  const edgeMap = new Map<string, Set<string>>();

  for (const node of nodes) {
    for (const varName of node.variables) {
      const producer = producerMap.get(varName);
      if (producer && producer !== node.id) {
        const key = `${producer}→${node.id}`;
        if (!edgeMap.has(key)) edgeMap.set(key, new Set());
        edgeMap.get(key)!.add(varName);
      }
    }
  }

  for (const [key, vars] of edgeMap) {
    const [from, to] = key.split("→");
    edges.push({ from, to, variables: [...vars] });
  }

  const sharedVariables = testCaseVariables ? Object.keys(testCaseVariables) : [];

  return { nodes, edges, sharedVariables };
}
