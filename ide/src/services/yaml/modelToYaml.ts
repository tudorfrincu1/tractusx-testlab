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
import type { TestLabDocument, ScriptDefinition, TckDefinition, StepDefinition, PreconditionDefinition } from "@/models/schema";
import { isTck, isTestRef } from "@/models/schema";

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
  const obj: Record<string, unknown> = { kind: "test" };
  if (model.testlab) obj.testlab = model.testlab;
  if (model.id) obj.id = model.id;
  if (model.namespace) obj.namespace = model.namespace;
  if (model.metadata) obj.metadata = model.metadata;
  if (model.env) obj.env = model.env;
  if (model.preconditions) obj.preconditions = model.preconditions.map(buildPrecondition);
  if (model.setup && model.setup.length > 0) obj.setup = model.setup.map(buildStep);
  obj.steps = model.steps.map(buildStep);
  if (model.teardown && model.teardown.length > 0) obj.teardown = model.teardown.map(buildStep);
  return obj;
}

function buildTckObject(model: TckDefinition): Record<string, unknown> {
  const obj: Record<string, unknown> = { kind: "tck" };
  if (model.testlab) obj.testlab = model.testlab;
  if (model.id) obj.id = model.id;
  if (model.namespace) obj.namespace = model.namespace;
  if (model.metadata) obj.metadata = model.metadata;
  if (model.env) obj.env = model.env;
  if (model.preconditions) obj.preconditions = model.preconditions.map(buildPrecondition);
  obj.tests = model.tests.map((t) => {
    if (typeof t === "string") return t;
    if (isTestRef(t)) return t;
    return buildTestObject(t);
  });
  return obj;
}

function buildStep(step: StepDefinition): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  obj.id = step.id;
  obj.uses = step.uses;
  if (step.name) obj.name = step.name;
  if (step.with && Object.keys(step.with).length > 0) obj.with = step.with;
  if (step.returns) obj.returns = step.returns;
  if (step.validate && step.validate.length > 0) obj.validate = step.validate;
  if (step.on_failure) obj.on_failure = step.on_failure;
  if (step.timeout_s != null) obj.timeout_s = step.timeout_s;
  if (step.if) obj.if = step.if;
  return obj;
}

function buildPrecondition(pre: PreconditionDefinition): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  obj.id = pre.id;
  obj.uses = pre.uses;
  if (pre.name) obj.name = pre.name;
  if ("with" in pre && pre.with) obj.with = pre.with;
  if (pre.returns) obj.returns = pre.returns;
  if ("validate" in pre && pre.validate && pre.validate.length > 0) obj.validate = pre.validate;
  return obj;
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
