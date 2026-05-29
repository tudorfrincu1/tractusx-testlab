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

import type {
  TckDefinition,
  ScriptDefinition,
  VariableDefinition,
} from "@/models/schema";

/* ── Types ──────────────────────────────────────────────────────────────── */

/** A variable merged from all tests + TCK level */
export interface AggregatedVariable {
  name: string;
  definition: VariableDefinition;
  usedBy: string[];
  isTckLevel: boolean;
}

/** Summary of a test for the pipeline table */
export interface TestSummary {
  name: string;
  description?: string;
  stepCount: number;
  serviceNames: string[];
  order: number;
  prerequisiteTests: string[];
  inputCount: number;
  outputCount: number;
  overrides?: Record<string, unknown>;
}

/* ── Selector functions ─────────────────────────────────────────────────── */

/** Derive aggregated variables from TCK + all tests. */
export function getAggregatedVariables(
  tck: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  testOrder: string[],
): AggregatedVariable[] {
  const merged = new Map<string, AggregatedVariable>();

  // Collect from TCK level first (these are the "source of truth")
  if (tck.variables) {
    for (const [name, def] of Object.entries(tck.variables)) {
      merged.set(name, { name, definition: def, usedBy: [], isTckLevel: true });
    }
  }

  // Scan each test for variables
  for (const testName of testOrder) {
    const script = tests.get(testName);
    if (!script?.variables) continue;
    for (const [varName, def] of Object.entries(script.variables)) {
      const existing = merged.get(varName);
      if (existing) {
        existing.usedBy.push(testName);
      } else {
        merged.set(varName, { name: varName, definition: def, usedBy: [testName], isTckLevel: false });
      }
    }
  }

  return [...merged.values()];
}

/** Derive test summaries from the test map and order. */
export function getTestSummaries(
  tck: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  testOrder: string[],
): TestSummary[] {
  return testOrder.map((name) => {
    const script = tests.get(name);
    const ref = tck.tests.find(
      (t) => typeof t === "object" && "test" in t && (t as { test: string }).test === name
    ) as { with?: Record<string, unknown>; prerequisite_tests?: string[]; order?: number } | undefined;

    const prerequisiteTests = ref?.prerequisite_tests
      ?? script?.prerequisites?.map((entry) => entry.test)
      ?? [];

    const outputCount = script?.output_definitions?.length
      ?? 0;

    return {
      name,
      description: script?.description,
      stepCount: (script?.setup?.length ?? 0) + (script?.steps?.length ?? 0) + (script?.teardown?.length ?? 0),
      serviceNames: script?.services?.map((s) => s.name) ?? [],
      order: ref?.order ?? testOrder.indexOf(name) + 1,
      prerequisiteTests,
      inputCount: script?.inputs?.length ?? 0,
      outputCount,
      overrides: ref?.with,
    };
  });
}
