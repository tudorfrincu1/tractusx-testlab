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

import type { ScriptDefinition, Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface FlowNode {
  id: string;
  name: string;
  variables: string[];
  outputs: string[];
  services: string[];
  stepCount: number;
  stepNames: string[];
}

export type FlowEdgeType = "sequential" | "variable";

export interface FlowEdge {
  from: string;
  to: string;
  variables: string[];
  type: FlowEdgeType;
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
  tckVariables: Record<string, unknown> | undefined,
): FlowData {
  const nodes: FlowNode[] = [];
  const producerMap = new Map<string, string>();
  const sourceEdges = new Map<string, Set<string>>();

  for (const name of testOrder) {
    const script = tests.get(name);
    if (!script) continue;

    const vars = script.variables ? Object.keys(script.variables) : [];

    // Collect exported variables from teardown export_variable steps
    const exportedVars: string[] = [];
    for (const step of script.teardown ?? []) {
      if (!isTemplateStep(step) && step.uses === "export_variable" && step.with?.name) {
        exportedVars.push(String(step.with.name));
      }
    }

    const memoryKeys = new Set<string>();
    for (const phase of [script.setup, script.steps, script.teardown]) {
      for (const step of phase ?? []) {
        if (!isTemplateStep(step) && step.returns) {
          for (const key of Object.keys(step.returns)) {
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
    const stepNames = collectStepNames(script);
    const stepCount = stepNames.length;

    nodes.push({ id: name, name, variables: vars, outputs: allOutputs, services, stepCount, stepNames });
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

    /* Also scan step params for implicit @variable references */
    const script = tests.get(node.id);
    if (script) {
      const consumed = collectConsumedVarRefs(script);
      for (const varName of consumed) {
        const producer = producerMap.get(varName);
        if (producer && producer !== node.id) {
          const key = `${producer}→${node.id}`;
          if (!edgeMap.has(key)) edgeMap.set(key, new Set());
          edgeMap.get(key)!.add(varName);
        }
      }
    }
  }

  for (const [key, vars] of sourceEdges) {
    if (!edgeMap.has(key)) edgeMap.set(key, new Set());
    for (const variableName of vars) {
      edgeMap.get(key)?.add(variableName);
    }
  }

  // Track sequential edge keys
  const sequentialKeys = new Set<string>();
  for (let i = 0; i < testOrder.length - 1; i++) {
    const from = testOrder[i];
    const to = testOrder[i + 1];
    if (!tests.has(from) || !tests.has(to)) continue;
    sequentialKeys.add(`${from}→${to}`);
  }

  for (const [key, vars] of edgeMap) {
    const [from, to] = key.split("→");
    const isSequential = sequentialKeys.has(key);
    edges.push({ from, to, variables: [...vars], type: isSequential ? "sequential" : "variable" });
  }

  // Add sequential edges that have no variable data yet
  for (const key of sequentialKeys) {
    if (!edgeMap.has(key)) {
      const [from, to] = key.split("→");
      edges.push({ from, to, variables: [], type: "sequential" });
    }
  }

  const sharedVariables = tckVariables ? Object.keys(tckVariables) : [];

  return { nodes, edges, sharedVariables };
}

function stepDisplayName(step: Step): string {
  if (isTemplateStep(step)) return step.description ?? step.template;
  return step.name ?? step.uses;
}

function collectStepNames(script: ScriptDefinition): string[] {
  const names: string[] = [];
  for (const step of script.setup ?? []) names.push(stepDisplayName(step));
  for (const step of script.steps ?? []) names.push(stepDisplayName(step));
  for (const step of script.teardown ?? []) names.push(stepDisplayName(step));
  return names;
}

const VAR_REF_PATTERN = /\$\{\{\s*vars\.(\w+)\s*\}\}|@([a-zA-Z_][a-zA-Z0-9_]*)/g;

/** Recursively scan a value for `@variable_name` references. */
function extractVarRefs(value: unknown, out: Set<string>): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(VAR_REF_PATTERN)) out.add(match[1] || match[2]);
  } else if (Array.isArray(value)) {
    for (const item of value) extractVarRefs(item, out);
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) extractVarRefs(v, out);
  }
}

/** Collect all `@variable` references from all step params in a script. */
function collectConsumedVarRefs(script: ScriptDefinition): Set<string> {
  const refs = new Set<string>();
  for (const phase of [script.setup, script.steps, script.teardown]) {
    for (const step of phase ?? []) {
      const params = isTemplateStep(step) ? step.params : step.with;
      if (params) extractVarRefs(params, refs);
    }
  }
  return refs;
}
