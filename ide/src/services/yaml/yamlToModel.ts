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
 * Parses a YAML string into a TestLabDocument model.
 * Field names and order reference the canonical yamlFieldMap.
 */

import yaml from "js-yaml";
import type {
  TestLabDocument, ScriptDefinition, TckDefinition, TestRef,
  StandardRef, StepDefinition, PreconditionDefinition, InlineValidation,
  ServiceDefinition, VariableDefinition,
} from "@/models/schema";
import { ScriptKind } from "@/models/schema";
import type { StepFieldKey, PreconditionFieldKey } from "./yamlFieldMap";

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

    if (kind === ScriptKind.TCK) {
      return { ok: true, model: parseTck(raw) };
    }
    return { ok: true, model: parseScript(raw) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `YAML parse error: ${msg}` };
  }
}

function detectKind(raw: Record<string, unknown>): ScriptKind {
  if ("tests" in raw && !("steps" in raw)) return ScriptKind.TCK;
  return ScriptKind.TEST;
}

function parseScript(raw: Record<string, unknown>): ScriptDefinition {
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  const env = raw.env as Record<string, unknown> | undefined;

  const name = metadata?.name
    ? String(metadata.name)
    : (raw.name ? String(raw.name) : String(raw.id ?? ""));

  return {
    kind: ScriptKind.TEST,
    id: raw.id != null ? String(raw.id) : undefined,
    namespace: raw.namespace != null ? String(raw.namespace) : undefined,
    testlab: raw.testlab != null ? String(raw.testlab) : undefined,
    metadata: metadata ? {
      name: metadata.name != null ? String(metadata.name) : undefined,
      version: metadata.version != null ? String(metadata.version) : undefined,
      description: metadata.description != null ? String(metadata.description) : undefined,
    } : undefined,
    name,
    version: metadata?.version != null ? String(metadata.version) : (raw.version != null ? String(raw.version) : undefined),
    dataspace_version: metadata?.dataspace_version != null
      ? String(metadata.dataspace_version)
      : (raw.dataspace_version != null ? String(raw.dataspace_version) : undefined),
    description: metadata?.description != null
      ? String(metadata.description)
      : (raw.description != null ? String(raw.description) : undefined),
    env: env ? {
      variables: env.variables as ScriptDefinition["variables"],
      services: parseServices(env.services),
      schemas: env.schemas as Record<string, unknown> | undefined,
      testdata: env.testdata as Record<string, { file: string; type: string }> | undefined,
    } : undefined,
    variables: env?.variables as ScriptDefinition["variables"] ?? raw.variables as ScriptDefinition["variables"],
    services: parseServices(env?.services ?? raw.services),
    preconditions: parsePreconditions(raw.preconditions),
    setup: parseSteps(raw.setup),
    steps: parseSteps(raw.steps) ?? [],
    teardown: parseSteps(raw.teardown),
  };
}

function parseTck(raw: Record<string, unknown>): TckDefinition {
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  const env = raw.env as Record<string, unknown> | undefined;

  const name = metadata?.name
    ? String(metadata.name)
    : (raw.name ? String(raw.name) : String(raw.id ?? ""));

  const tests = Array.isArray(raw.tests)
    ? raw.tests.map((t: unknown) => {
        if (typeof t === "string") return t;
        if (typeof t === "object" && t !== null) {
          const obj = t as Record<string, unknown>;
          if ("test" in obj && typeof obj.test === "string" && !("kind" in obj)) {
            const ref: TestRef = { test: obj.test };
            if (obj.order != null) ref.order = Number(obj.order);
            if (Array.isArray(obj.prerequisite_tests)) {
              ref.prerequisite_tests = obj.prerequisite_tests.map(String);
            }
            if (obj.with && typeof obj.with === "object") {
              ref.with = obj.with as Record<string, unknown>;
            }
            if (obj.description) ref.description = String(obj.description);
            return ref;
          }
          if ("file" in obj && typeof obj.file === "string" && !("kind" in obj)) {
            const ref: TestRef = { test: obj.file };
            if (obj.order != null) ref.order = Number(obj.order);
            if (Array.isArray(obj.prerequisite_tests)) {
              ref.prerequisite_tests = obj.prerequisite_tests.map(String);
            }
            if (obj.description) ref.description = String(obj.description);
            return ref;
          }
          return parseScript(obj);
        }
        return String(t);
      })
    : [];

  return {
    kind: ScriptKind.TCK,
    id: raw.id != null ? String(raw.id) : undefined,
    namespace: raw.namespace != null ? String(raw.namespace) : undefined,
    testlab: raw.testlab != null ? String(raw.testlab) : undefined,
    metadata: metadata ? {
      name: metadata.name != null ? String(metadata.name) : undefined,
      version: metadata.version != null ? String(metadata.version) : undefined,
      description: metadata.description != null ? String(metadata.description) : undefined,
      authors: Array.isArray(metadata.authors) ? metadata.authors as Array<{ name: string }> : undefined,
      copyright_holders: Array.isArray(metadata.copyright_holders) ? metadata.copyright_holders.map(String) : undefined,
      license: metadata.license != null ? String(metadata.license) : undefined,
      standards: parseStandards(metadata.standards),
      tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : undefined,
      dataspace_version: metadata.dataspace_version != null ? String(metadata.dataspace_version) : undefined,
    } : undefined,
    name,
    version: metadata?.version != null ? String(metadata.version) : (raw.version != null ? String(raw.version) : undefined),
    dataspace_version: metadata?.dataspace_version != null
      ? String(metadata.dataspace_version)
      : (raw.dataspace_version != null ? String(raw.dataspace_version) : undefined),
    description: metadata?.description != null
      ? String(metadata.description)
      : (raw.description != null ? String(raw.description) : undefined),
    standards: parseStandards(metadata?.standards ?? raw.standards),
    tags: Array.isArray(metadata?.tags ?? raw.tags) ? (metadata?.tags ?? raw.tags as unknown[]).map(String) : undefined,
    env: env ? {
      variables: env.variables as TckDefinition["variables"],
      services: parseServices(env.services),
      schemas: env.schemas as Record<string, unknown> | undefined,
      testdata: env.testdata as Record<string, { file: string; type: string }> | undefined,
    } : undefined,
    variables: env?.variables as TckDefinition["variables"] ?? raw.variables as TckDefinition["variables"],
    preconditions: parsePreconditions(raw.preconditions),
    tests,
  };
}

function parseSteps(raw: unknown): StepDefinition[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((s: unknown): StepDefinition => {
    const obj = s as Record<StepFieldKey, unknown>;
    return {
      id: String(obj.id ?? ""),
      uses: String(obj.uses ?? ""),
      name: obj.name != null ? String(obj.name) : undefined,
      with: (obj.with as Record<string, unknown>) ?? {},
      returns: obj.returns as Record<string, unknown> | undefined,
      validate: parseValidations(obj.validate),
      on_failure: obj.on_failure as StepDefinition["on_failure"],
      timeout_s: obj.timeout_s != null ? Number(obj.timeout_s) : undefined,
      if: obj.if != null ? String(obj.if) : undefined,
    };
  });
}

function parsePreconditions(raw: unknown): PreconditionDefinition[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((p: unknown): PreconditionDefinition => {
    const obj = p as Record<PreconditionFieldKey, unknown>;
    return {
      id: String(obj.id ?? ""),
      uses: String(obj.uses ?? ""),
      name: obj.name != null ? String(obj.name) : undefined,
      with: obj.with as Record<string, unknown> | undefined,
      returns: obj.returns as Record<string, unknown> | undefined,
      validate: parseValidations(obj.validate),
    } as PreconditionDefinition;
  });
}

function parseValidations(raw: unknown): InlineValidation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((v: unknown): InlineValidation => {
    const obj = v as Record<string, unknown>;
    return {
      uses: String(obj.uses ?? ""),
      with: (obj.with as Record<string, unknown>) ?? {},
    };
  });
}

function parseServices(raw: unknown): ServiceDefinition[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw as ServiceDefinition[];
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
