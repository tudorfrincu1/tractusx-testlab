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
 * Converts a TestLabDocument JSON model into a YAML string.
 */

import yaml from "js-yaml";
import type { TestLabDocument, ScriptDefinition, TckDefinition, Step, PreconditionDefinition } from "@/models/schema";
import { isTck, isTestRef, isTemplateStep } from "@/models/schema";
import { STEP_FIELDS, PRECONDITION_FIELDS, TEST_ROOT_FIELDS, TCK_ROOT_FIELDS, buildOrderedRecord } from "./yamlFieldMap";

export function modelToYaml(model: TestLabDocument): string {
  const obj = isTck(model) ? buildTckObject(model) : buildTestObject(model);
  const clean = stripEmpty(obj);

  return yaml.dump(clean, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
}

function buildTestObject(model: ScriptDefinition): Record<string, unknown> {
  return buildOrderedRecord(TEST_ROOT_FIELDS, {
    kind: "test",
    testlab: model.testlab || undefined,
    id: model.id || undefined,
    namespace: model.namespace || undefined,
    metadata: model.metadata || undefined,
    env: model.env || undefined,
    preconditions: model.preconditions ? model.preconditions.map(buildPrecondition) : undefined,
    setup: model.setup && model.setup.length > 0 ? model.setup.map(buildStep) : undefined,
    steps: model.steps.map(buildStep),
    teardown: model.teardown && model.teardown.length > 0 ? model.teardown.map(buildStep) : undefined,
  });
}

function buildTckObject(model: TckDefinition): Record<string, unknown> {
  const tests = model.tests.map((t) => {
    if (typeof t === "string") return t;
    if (isTestRef(t)) return t;
    return buildTestObject(t);
  });

  return buildOrderedRecord(TCK_ROOT_FIELDS, {
    kind: "tck",
    testlab: model.testlab || undefined,
    id: model.id || undefined,
    namespace: model.namespace || undefined,
    metadata: model.metadata || undefined,
    env: model.env || undefined,
    preconditions: model.preconditions ? model.preconditions.map(buildPrecondition) : undefined,
    tests,
  });
}

function buildStep(step: Step): Record<string, unknown> {
  // Template steps have no canonical YAML field map and were historically not
  // emitted; preserve that by skipping them (stripEmpty removes empty records).
  if (isTemplateStep(step)) return {};
  return buildOrderedRecord(STEP_FIELDS, {
    id: step.id,
    uses: step.uses,
    name: step.name || undefined,
    with: step.with && Object.keys(step.with).length > 0 ? step.with : undefined,
    returns: step.returns || undefined,
    validate: step.validate && step.validate.length > 0 ? step.validate : undefined,
    on_failure: step.on_failure || undefined,
    timeout_s: step.timeout_s ?? undefined,
    if: step.if || undefined,
  });
}

function buildPrecondition(pre: PreconditionDefinition): Record<string, unknown> {
  return buildOrderedRecord(PRECONDITION_FIELDS, {
    id: pre.id,
    uses: pre.uses,
    name: pre.name || undefined,
    with: "with" in pre && pre.with ? pre.with : undefined,
    returns: pre.returns || undefined,
    validate: "validate" in pre && pre.validate && pre.validate.length > 0 ? pre.validate : undefined,
  });
}

function stripEmpty(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const filtered = obj.map(stripEmpty).filter((v) => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = stripEmpty(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
}
