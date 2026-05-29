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
import { isTest } from "@/models/schema";
import { yamlToModel } from "@/services";
import type { SchemaFile, TestdataFile } from "./useProjectStore";

/** Fetch and parse all referenced test files from a TCK */
export async function fetchTests(
  testPaths: Array<{ path: string }>,
  folderUrl: string,
): Promise<{ tests: Map<string, ScriptDefinition>; loadedOrder: string[]; pathToName: Map<string, string> }> {
  const tests = new Map<string, ScriptDefinition>();
  const loadedOrder: string[] = [];
  const pathToName = new Map<string, string>();

  const fetches = testPaths.map(async ({ path }) => {
    const url = `${folderUrl}${path}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    const result = yamlToModel(text);
    if (!result.ok || !isTest(result.model)) return null;
    const name = path.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
    result.model.name = name;
    return { name, path, model: result.model };
  });

  const results = await Promise.all(fetches);
  for (const entry of results) {
    if (entry) {
      tests.set(entry.name, entry.model);
      loadedOrder.push(entry.name);
      pathToName.set(entry.path, entry.name);
    }
  }

  return { tests, loadedOrder, pathToName };
}

/** Collect schema paths referenced in test scripts and TCK env */
/** Extract JSON schema paths referenced in a step's `with` params */
function extractSchemaRefsFromStep(p: Record<string, unknown>): string[] {
  const refs: string[] = [];
  for (const key of ["path", "schema_path", "schema"] as const) {
    const val = p[key];
    if (typeof val === "string" && val.endsWith(".json")) {
      refs.push(val);
    }
  }
  return refs;
}

/** Extract schema paths from TCK env.schemas entries */
function extractSchemaRefsFromEnv(tc: TckDefinition): string[] {
  if (!tc.env?.schemas) return [];
  const schemaEntries = tc.env.schemas as Record<string, { file?: string }>;
  const refs: string[] = [];
  for (const [, schemaDef] of Object.entries(schemaEntries)) {
    if (schemaDef?.file) {
      refs.push(schemaDef.file);
    }
  }
  return refs;
}

function extractSchemaRefsFromScript(script: ScriptDefinition): string[] {
  const refs: string[] = [];
  for (const phase of [script.setup, script.steps, script.teardown]) {
    if (!phase) continue;
    for (const step of phase) {
      if ("with" in step && step.with) {
        refs.push(...extractSchemaRefsFromStep(step.with));
      }
    }
  }
  return refs;
}

function collectSchemaPaths(tc: TckDefinition, tests: Map<string, ScriptDefinition>): Set<string> {
  const schemaPathSet = new Set<string>(extractSchemaRefsFromEnv(tc));
  for (const script of tests.values()) {
    for (const ref of extractSchemaRefsFromScript(script)) {
      schemaPathSet.add(ref);
    }
  }
  return schemaPathSet;
}

/** Fetch schema files from the given paths */
export async function fetchSchemas(
  tc: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  folderUrl: string,
): Promise<Map<string, SchemaFile>> {
  const schemas = new Map<string, SchemaFile>();
  const schemaPathSet = collectSchemaPaths(tc, tests);

  const schemaFetches = [...schemaPathSet].map(async (schemaPath) => {
    const resolved = schemaPath.startsWith("../") ? schemaPath.slice(3)
      : schemaPath.startsWith("schemas/") ? schemaPath : `schemas/${schemaPath}`;
    const url = `${folderUrl}${resolved}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const content = await r.text();
    const name = resolved.replace(/^schemas\//, "").replace(/\.json$/, "");
    return { name, content };
  });

  const schemaResults = await Promise.all(schemaFetches);
  for (const entry of schemaResults) {
    if (entry) {
      schemas.set(entry.name, { name: entry.name, content: entry.content });
    }
  }

  return schemas;
}

/** Fetch testdata files referenced in TCK env.testdata */
export async function fetchTestdata(
  tc: TckDefinition,
  folderUrl: string,
): Promise<Map<string, TestdataFile>> {
  const testdata = new Map<string, TestdataFile>();
  if (!tc.env?.testdata) return testdata;

  const testdataEntries = tc.env.testdata as Record<string, { file?: string; type?: string }>;
  const testdataFetches = Object.entries(testdataEntries).map(async ([key, def]) => {
    if (!def?.file || typeof def.file !== "string") return null;
    const resolved = def.file.startsWith("../") ? def.file.slice(3) : `testdata/${def.file}`;
    const url = `${folderUrl}${resolved}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const content = await r.text();
    const type = def.type ?? "application/json";
    return { key, content, type };
  });

  const testdataResults = await Promise.all(testdataFetches);
  for (const entry of testdataResults) {
    if (entry) {
      testdata.set(entry.key, { name: entry.key, content: entry.content, type: entry.type });
    }
  }

  return testdata;
}
