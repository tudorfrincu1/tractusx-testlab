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

import type { TestCaseDefinition, ScriptDefinition, TestRef } from "../models/schema";
import { isTestCase, isTest, isTestRef } from "../models/schema";
import { yamlToModel } from "../sync/yamlToModel";
import type { SchemaFile } from "./useProjectStore";
import type { ImportedProject } from "./projectIO";

/** Fetch a folder-based example from public/examples/ */
export async function importExampleFolder(examplePath: string): Promise<ImportedProject | null> {
  const base = import.meta.env.BASE_URL;
  const baseUrl = `${base}examples/`;
  const folderUrl = examplePath.includes("/")
    ? baseUrl + examplePath.substring(0, examplePath.lastIndexOf("/") + 1)
    : baseUrl;

  const resp = await fetch(`${baseUrl}${examplePath}`);
  if (!resp.ok) return null;

  const indexYaml = await resp.text();
  const tcResult = yamlToModel(indexYaml);
  if (!tcResult.ok) return null;

  // Standalone test — no sub-files to fetch
  if (isTest(tcResult.model)) {
    return {
      projectName: tcResult.model.name,
      testCase: {
        kind: "test-case" as const,
        name: tcResult.model.name,
        version: tcResult.model.version,
        tests: [{ test: tcResult.model.name }],
      } as TestCaseDefinition,
      tests: new Map([[tcResult.model.name, tcResult.model]]),
      schemas: new Map(),
      testOrder: [tcResult.model.name],
    };
  }

  if (!isTestCase(tcResult.model)) return null;
  const tc = tcResult.model;

  // Collect test file paths from test refs
  const testPaths: Array<{ path: string; ref: unknown }> = [];
  for (const entry of tc.tests) {
    if (isTestRef(entry)) {
      testPaths.push({ path: entry.test, ref: entry });
    }
  }

  // Fetch all referenced test files in parallel
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

  // Rewrite test refs in the test case to use clean names
  const cleanTests = tc.tests.map((entry) => {
    if (isTestRef(entry)) {
      const cleanName = pathToName.get(entry.test);
      if (cleanName) return { ...entry, test: cleanName };
    }
    return entry;
  });
  tc.tests = cleanTests;
  const testOrder = deriveTestOrder(tc, tests, loadedOrder);

  // Scan test files for schema references and fetch schemas
  const schemas = new Map<string, SchemaFile>();
  const schemaPathSet = new Set<string>();

  for (const script of tests.values()) {
    for (const phase of [script.setup, script.steps, script.teardown]) {
      if (!phase) continue;
      for (const step of phase) {
        if ("params" in step && step.params) {
          const p = step.params as Record<string, unknown>;
          if (typeof p.path === "string" && p.path.endsWith(".json")) {
            schemaPathSet.add(p.path);
          }
          if (typeof p.schema_path === "string" && p.schema_path.endsWith(".json")) {
            schemaPathSet.add(p.schema_path);
          }
        }
      }
    }
  }

  const schemaFetches = [...schemaPathSet].map(async (schemaPath) => {
    const resolved = schemaPath.startsWith("../")
      ? schemaPath.slice(3)
      : schemaPath;
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

  return {
    projectName: tc.name,
    testCase: tc,
    tests,
    schemas,
    testOrder,
  };
}

function deriveTestOrder(
  testCase: TestCaseDefinition,
  tests: Map<string, ScriptDefinition>,
  fallbackOrder: string[],
): string[] {
  const available = new Set(tests.keys());
  const refs = testCase.tests
    .filter((entry): entry is TestRef => isTestRef(entry))
    .map((entry, index) => ({
      name: entry.test,
      order: typeof entry.order === "number" ? entry.order : Number.POSITIVE_INFINITY,
      index,
    }))
    .filter((entry) => available.has(entry.name));

  if (refs.length === 0) {
    return [...fallbackOrder];
  }

  refs.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.index - b.index;
  });

  const ordered = refs.map((entry) => entry.name);
  for (const name of fallbackOrder) {
    if (!ordered.includes(name)) ordered.push(name);
  }
  return ordered;
}
