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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { Step, StepDefinition } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";

export interface StepGroup {
  step: Step;
  assertions: StepDefinition[];
}

/**
 * Group steps so that consecutive `validate/assert` steps are attached
 * to the preceding non-assertion step's EXPECT chain.
 */
export function groupStepsWithAssertions(steps: Step[]): StepGroup[] {
  const groups: StepGroup[] = [];
  for (const step of steps) {
    const isAssertion = !isTemplateStep(step) && step.uses?.startsWith("validate/");
    if (isAssertion && groups.length > 0) {
      groups[groups.length - 1].assertions.push(step as StepDefinition);
    } else {
      groups.push({ step, assertions: [] });
    }
  }
  return groups;
}

/** Convert a v2 assertion step into the InlineValidation format that populateAssertions accepts. */
export function assertionStepToInlineValidation(step: StepDefinition): { uses: string; with: Record<string, unknown> } {
  const w = { ...step.with } as Record<string, unknown>;
  // Strip ${{ steps.X.Y }} → just "Y" so the OUTPUT dropdown gets the output name
  if (typeof w.input === "string") {
    const stepsRef = /^\$\{\{\s*steps\.\w+\.([^{}]+?)\s*\}\}$/.exec(w.input as string);
    if (stepsRef) {
      w.input = stepsRef[1];
    }
  }
  return { uses: "validate/assert", with: w };
}
