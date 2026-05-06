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

/**
 * Parses a YAML string into a TestLabDocument model.
 */

import yaml from "js-yaml";
import type { TestLabDocument, ScriptDefinition, TestCaseDefinition, TestRef, StandardRef } from "../models/schema";
import { ScriptKind } from "../models/schema";

export type ParseResult =
  | { ok: true; model: TestLabDocument }
  | { ok: false; error: string };

export function yamlToModel(yamlStr: string): ParseResult {
  try {
    const raw = yaml.load(yamlStr) as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "YAML must be a mapping (object)" };
    }

    const kind = (raw.kind as string) ?? detectKind(raw);

    if (kind === ScriptKind.TEST_CASE) {
      return { ok: true, model: parseTestCase(raw) };
    }
    return { ok: true, model: parseScript(raw) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `YAML parse error: ${msg}` };
  }
}

function detectKind(raw: Record<string, unknown>): ScriptKind {
  if ("tests" in raw && !("steps" in raw)) return ScriptKind.TEST_CASE;
  return ScriptKind.TEST;
}

function parseScript(raw: Record<string, unknown>): ScriptDefinition {
  return {
    kind: ScriptKind.TEST,
    name: String(raw.name ?? ""),
    version: raw.version != null ? String(raw.version) : "1.0",
    dataspace_version: raw.dataspace_version != null ? String(raw.dataspace_version) : "saturn",
    description: raw.description != null ? String(raw.description) : undefined,
    import_from: raw.import_from != null ? String(raw.import_from) : undefined,
    preconditions: raw.preconditions as ScriptDefinition["preconditions"],
    variables: raw.variables as ScriptDefinition["variables"],
    services: raw.services as ScriptDefinition["services"],
    listen: raw.listen as ScriptDefinition["listen"],
    depends_on: raw.depends_on as ScriptDefinition["depends_on"],
    outputs: raw.outputs as ScriptDefinition["outputs"],
    setup: (raw.setup as ScriptDefinition["setup"]) ?? [],
    steps: (raw.steps as ScriptDefinition["steps"]) ?? [],
    cleanup: (raw.cleanup as ScriptDefinition["cleanup"]) ?? [],
  };
}

function parseTestCase(raw: Record<string, unknown>): TestCaseDefinition {
  const tests = Array.isArray(raw.tests)
    ? raw.tests.map((t: unknown) => {
        if (typeof t === "string") return t;
        if (typeof t === "object" && t !== null) {
          const obj = t as Record<string, unknown>;
          if ("test" in obj && typeof obj.test === "string" && !("kind" in obj)) {
            const ref: TestRef = { test: obj.test as string };
            if (obj.with && typeof obj.with === "object") {
              ref.with = obj.with as Record<string, unknown>;
            }
            if (obj.description && typeof obj.description === "string") {
              ref.description = obj.description;
            }
            return ref;
          }
          return parseScript(obj);
        }
        return String(t);
      })
    : [];

  return {
    kind: ScriptKind.TEST_CASE,
    name: String(raw.name ?? ""),
    version: raw.version != null ? String(raw.version) : "1.0",
    dataspace_version: raw.dataspace_version != null ? String(raw.dataspace_version) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    author: raw.author != null ? String(raw.author) : undefined,
    standards: parseStandards(raw.standards),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
    preconditions: raw.preconditions as TestCaseDefinition["preconditions"],
    variables: raw.variables as TestCaseDefinition["variables"],
    tests,
    imports: raw.imports as TestCaseDefinition["imports"],
  };
}

function parseStandards(raw: unknown): StandardRef[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((item: unknown) => {
    if (typeof item === "string") return { id: item };
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        id: String(obj.id ?? ""),
        version: obj.version != null ? String(obj.version) : undefined,
      };
    }
    return { id: String(item) };
  });
}
