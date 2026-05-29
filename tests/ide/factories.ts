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

/**
 * Test factories and helpers for IDE regression tests.
 * Provides common setup utilities for creating test fixtures.
 */

import { ScriptKind } from "../../ide/src/models/schema";
import type { ScriptDefinition, TckDefinition, StepDefinition } from "../../ide/src/models/schema";

export function createTestScript(overrides?: Partial<ScriptDefinition>): ScriptDefinition {
  return {
    kind: ScriptKind.TEST,
    name: "test-fixture",
    version: "1.0",
    steps: [],
    ...overrides,
  };
}

export function createTckFixture(overrides?: Partial<TckDefinition>): TckDefinition {
  return {
    kind: ScriptKind.TCK,
    name: "tck-fixture",
    version: "1.0",
    tests: [],
    ...overrides,
  };
}

export function createStep(overrides?: Partial<StepDefinition>): StepDefinition {
  return {
    id: `step-${Math.random().toString(36).slice(2, 8)}`,
    uses: "http/request",
    with: { url: "https://example.com" },
    ...overrides,
  };
}

export function createTestWithSteps(stepCount: number): ScriptDefinition {
  const steps: StepDefinition[] = Array.from({ length: stepCount }, (_, i) =>
    createStep({ id: `step-${i + 1}`, uses: "http/request", with: { url: `https://example.com/${i}` } })
  );
  return createTestScript({ steps });
}

export function createProjectFixture(testNames: string[]): {
  tck: TckDefinition;
  tests: Map<string, ScriptDefinition>;
  testOrder: string[];
} {
  const tests = new Map<string, ScriptDefinition>();
  for (const name of testNames) {
    tests.set(name, createTestScript({ name }));
  }
  return {
    tck: createTckFixture({
      tests: testNames.map((t) => ({ test: t })),
    }),
    tests,
    testOrder: testNames,
  };
}
