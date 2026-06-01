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

import type { TckDefinition, ScriptDefinition } from "@/models/schema";

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

    const prerequisiteTests = ref?.prerequisite_tests ?? [];

    const outputCount = 0;

    return {
      name,
      description: script?.description,
      stepCount: (script?.setup?.length ?? 0) + (script?.steps?.length ?? 0) + (script?.teardown?.length ?? 0),
      serviceNames: script?.services?.map((s) => s.name) ?? [],
      order: ref?.order ?? testOrder.indexOf(name) + 1,
      prerequisiteTests,
      inputCount: 0,
      outputCount,
      overrides: ref?.with,
    };
  });
}
