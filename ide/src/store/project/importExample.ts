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

import type { TckDefinition, ScriptDefinition, TestRef } from "@/models/schema";
import { isTck, isTest, isTestRef } from "@/models/schema";
import { yamlToModel } from "@/services";
import type { ImportedProject } from "./projectIO";
import { fetchSchemas, fetchTestdata } from "./importHelpers";

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
      tck: {
        kind: "tck" as const,
        name: tcResult.model.name,
        version: tcResult.model.version,
        tests: [{ test: tcResult.model.name }],
      } as TckDefinition,
      tests: new Map([[tcResult.model.name, tcResult.model]]),
      schemas: new Map(),
      testOrder: [tcResult.model.name],
    };
  }

  if (!isTck(tcResult.model)) return null;
  const tc = tcResult.model;

  // Collect test file paths from test refs or plain strings
  const testPaths: Array<{ path: string; ref: unknown }> = [];
  for (const entry of tc.tests) {
    if (typeof entry === "string") {
      testPaths.push({ path: entry, ref: entry });
    } else if (isTestRef(entry)) {
      testPaths.push({ path: entry.test, ref: entry });
    }
  }

  // Fetch all referenced test files in parallel
  const tests = new Map<string, ScriptDefinition>();
  const loadedOrder: string[] = [];
  const pathToName = new Map<string, string>();

  const fetches = testPaths.map(async ({ path }) => {
    // Try tests/ prefix first (known file structure), fallback to direct path
    let url = path.includes("/")
      ? `${folderUrl}${path}`
      : `${folderUrl}tests/${path}`;
    let r = await fetch(url);
    const contentType = r.headers.get("content-type") ?? "";

    // SPA fallback returns 200 with text/html for missing files — treat as failure
    if (!r.ok || contentType.includes("text/html")) {
      if (!path.includes("/")) {
        url = `${folderUrl}${path}`;
        r = await fetch(url);
        const fallbackType = r.headers.get("content-type") ?? "";
        if (!r.ok || fallbackType.includes("text/html")) return null;
      } else {
        return null;
      }
    }
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

  // Rewrite test refs in the TCK to use clean names
  const cleanTests = tc.tests.map((entry) => {
    if (typeof entry === "string") {
      const cleanName = pathToName.get(entry);
      return { test: cleanName ?? entry.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "") };
    }
    if (isTestRef(entry)) {
      const cleanName = pathToName.get(entry.test);
      if (cleanName) return { ...entry, test: cleanName };
    }
    return entry;
  });
  tc.tests = cleanTests;
  const testOrder = deriveTestOrder(tc, tests, loadedOrder);

  // Fetch schemas from env.schemas and test step references
  const schemas = await fetchSchemas(tc, tests, folderUrl);

  // Fetch testdata from env.testdata
  const testdata = await fetchTestdata(tc, folderUrl);

  return {
    projectName: tc.name,
    tck: tc,
    tests,
    schemas,
    testdata,
    testOrder,
  };
}

function deriveTestOrder(
  tck: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  fallbackOrder: string[],
): string[] {
  const available = new Set(tests.keys());
  const refs = tck.tests
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
