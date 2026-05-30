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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { InlineValidation } from "@/models/schema";

/** Extract inline validate assertions from a step and emit them as standalone v2 assertion steps. */
export function flattenValidateToSteps(step: Record<string, unknown>): Record<string, unknown>[] {
  const validate = step.validate as InlineValidation[] | undefined;
  if (!validate || validate.length === 0) return [];
  const stepId = String(step.id ?? "");
  const result: Record<string, unknown>[] = [];
  let counter = 1;
  for (const iv of validate) {
    const w = (iv as { with?: Record<string, unknown> }).with;
    if (!w) continue;
    const outputName = String(w.input ?? "");
    const operator = String(w.operator ?? "");
    const assertId = `assert_${outputName || "check"}_${counter++}`;
    const withBlock: Record<string, unknown> = {
      input: `\${{ steps.${stepId}.${outputName} }}`,
      operator,
    };
    if (w.value !== undefined) withBlock.value = w.value;
    if (w.schema !== undefined) withBlock.schema = w.schema;
    if (w.min !== undefined) withBlock.min = w.min;
    if (w.max !== undefined) withBlock.max = w.max;
    if (w.path !== undefined) withBlock.path = w.path;
    if (w.json_path !== undefined) withBlock.json_path = w.json_path;
    if (w.store_in_variable !== undefined) withBlock.store_in_variable = w.store_in_variable;
    result.push({
      id: assertId,
      uses: "validate/assert",
      name: `Assert ${operator}: ${outputName}`,
      with: withBlock,
    });
  }
  // Remove inline validate from the parent step since we've flattened them
  step.validate = undefined;
  return result;
}
