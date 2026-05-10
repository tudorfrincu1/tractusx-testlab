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

import type {
  TestCaseDefinition,
  ScriptDefinition,
  VariableDefinition,
} from "../models/schema";

/* ── Types ──────────────────────────────────────────────────────────────── */

/** A variable merged from all tests + test-case level */
export interface AggregatedVariable {
  name: string;
  definition: VariableDefinition;
  usedBy: string[];
  isTestCaseLevel: boolean;
}

/** Summary of a test for the pipeline table */
export interface TestSummary {
  name: string;
  description?: string;
  stepCount: number;
  serviceNames: string[];
  overrides?: Record<string, unknown>;
}

/* ── Selector functions ─────────────────────────────────────────────────── */

/** Derive aggregated variables from test-case + all tests. */
export function getAggregatedVariables(
  testCase: TestCaseDefinition,
  tests: Map<string, ScriptDefinition>,
  testOrder: string[],
): AggregatedVariable[] {
  const merged = new Map<string, AggregatedVariable>();

  // Collect from test-case level first (these are the "source of truth")
  if (testCase.variables) {
    for (const [name, def] of Object.entries(testCase.variables)) {
      merged.set(name, { name, definition: def, usedBy: [], isTestCaseLevel: true });
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
        merged.set(varName, { name: varName, definition: def, usedBy: [testName], isTestCaseLevel: false });
      }
    }
  }

  return [...merged.values()];
}

/** Derive test summaries from the test map and order. */
export function getTestSummaries(
  testCase: TestCaseDefinition,
  tests: Map<string, ScriptDefinition>,
  testOrder: string[],
): TestSummary[] {
  return testOrder.map((name) => {
    const script = tests.get(name);
    const ref = testCase.tests.find(
      (t) => typeof t === "object" && "test" in t && (t as { test: string }).test === name
    ) as { with?: Record<string, unknown> } | undefined;

    return {
      name,
      description: script?.description,
      stepCount: (script?.setup?.length ?? 0) + (script?.steps?.length ?? 0) + (script?.teardown?.length ?? 0),
      serviceNames: script?.services?.map((s) => s.name) ?? [],
      overrides: ref?.with,
    };
  });
}
