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

import { useMemo } from "react";
import { useProjectStore } from "@/store";
import { useEnvironmentStore } from "@/store";
import type { Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";

export interface VariableEntry {
  label: string;
  expression: string;
}

export interface StepWithReturns {
  stepId: string;
  stepName: string;
  returns: string[];
}

export interface TestSteps {
  testName: string;
  steps: StepWithReturns[];
  setupSteps: StepWithReturns[];
}

export interface VariableScopes {
  env: VariableEntry[];
  metadata: VariableEntry[];
  testSteps: TestSteps[];
}

function extractReturns(step: Step): StepWithReturns | null {
  if (isTemplateStep(step)) return null;
  if (!step.returns || Object.keys(step.returns).length === 0) return null;
  return {
    stepId: step.id,
    stepName: step.name ?? step.id,
    returns: Object.keys(step.returns),
  };
}

function collectEnvVariables(envVariables: { enabled: boolean; name: string }[]): VariableEntry[] {
  return envVariables
    .filter((v) => v.enabled)
    .map((v) => ({
      label: `env.${v.name}`,
      expression: `\${{ env.${v.name} }}`,
    }));
}

function collectMetadata(tck: { metadata?: { name?: string; version?: string; description?: string }; dataspace_version?: string }): VariableEntry[] {
  const metadata: VariableEntry[] = [];
  if (tck.metadata) {
    const meta = tck.metadata;
    if (meta.name) metadata.push({ label: "metadata.name", expression: "${{ metadata.name }}" });
    if (meta.version) metadata.push({ label: "metadata.version", expression: "${{ metadata.version }}" });
    if (meta.description) metadata.push({ label: "metadata.description", expression: "${{ metadata.description }}" });
  }
  if (tck.dataspace_version) {
    metadata.push({ label: "metadata.dataspace_version", expression: "${{ metadata.dataspace_version }}" });
  }
  return metadata;
}

function extractReturnsFromSteps(steps: Step[]): StepWithReturns[] {
  const result: StepWithReturns[] = [];
  for (const step of steps) {
    const entry = extractReturns(step);
    if (entry) result.push(entry);
  }
  return result;
}

function collectTestSteps(tests: Map<string, { steps?: Step[]; setup?: Step[] }>): TestSteps[] {
  const testSteps: TestSteps[] = [];
  for (const [testName, script] of tests.entries()) {
    const steps = script.steps ? extractReturnsFromSteps(script.steps) : [];
    const setupSteps = script.setup ? extractReturnsFromSteps(script.setup) : [];

    if (steps.length > 0 || setupSteps.length > 0) {
      testSteps.push({ testName, steps, setupSteps });
    }
  }
  return testSteps;
}

export function useVariableScopes(): VariableScopes {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const envVariables = useEnvironmentStore((s) => s.variables);

  return useMemo(() => ({
    env: collectEnvVariables(envVariables),
    metadata: collectMetadata(tck),
    testSteps: collectTestSteps(tests),
  }), [tck, tests, envVariables]);
}
