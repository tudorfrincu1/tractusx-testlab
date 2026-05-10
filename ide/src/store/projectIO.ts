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

import JSZip from "jszip";
import type { TestCaseDefinition, ScriptDefinition } from "../models/schema";
import { isTestCase, isTest, isTestRef } from "../models/schema";
import { modelToYaml } from "../sync/modelToYaml";
import { yamlToModel } from "../sync/yamlToModel";
import type { SchemaFile } from "./useProjectStore";

const INDEX_FILE = "index.yaml";

/* ── Export ──────────────────────────────────────────────────────────────── */

export async function exportProjectZip(
  projectName: string,
  testCase: TestCaseDefinition,
  tests: Map<string, ScriptDefinition>,
  schemas: Map<string, SchemaFile>,
  testOrder: string[],
): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder(projectName);
  if (!root) return;

  // index.yaml — the test case root
  root.file(INDEX_FILE, modelToYaml(testCase));

  // tests/ folder
  const testsFolder = root.folder("tests");
  if (testsFolder) {
    for (const name of testOrder) {
      const model = tests.get(name);
      if (model) {
        testsFolder.file(`${name}.yaml`, modelToYaml(model));
      }
    }
  }

  // schemas/ folder
  if (schemas.size > 0) {
    const schemasFolder = root.folder("schemas");
    if (schemasFolder) {
      for (const [name, schema] of schemas) {
        schemasFolder.file(`${name}.json`, schema.content);
      }
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${projectName}.zip`);
}

/* ── Import ─────────────────────────────────────────────────────────────── */

export interface ImportedProject {
  projectName: string;
  testCase: TestCaseDefinition;
  tests: Map<string, ScriptDefinition>;
  schemas: Map<string, SchemaFile>;
  testOrder: string[];
}

export async function importProjectZip(file: File): Promise<ImportedProject | null> {
  const zip = await JSZip.loadAsync(file);

  // Find the root folder (first directory entry)
  const entries = Object.keys(zip.files);
  const rootPrefix = findRootPrefix(entries);
  const projectName = rootPrefix.replace(/\/$/, "") || file.name.replace(/\.zip$/, "");

  // Read index.yaml
  const indexPath = `${rootPrefix}${INDEX_FILE}`;
  const indexFile = zip.file(indexPath);
  if (!indexFile) return null;

  const indexYaml = await indexFile.async("text");
  const tcResult = yamlToModel(indexYaml);
  if (!tcResult.ok || !isTestCase(tcResult.model)) return null;

  // Read tests/ folder
  const tests = new Map<string, ScriptDefinition>();
  const testOrder: string[] = [];
  const testPrefix = `${rootPrefix}tests/`;

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!path.startsWith(testPrefix)) continue;
    if (!/\.(yaml|yml)$/.test(path)) continue;

    const content = await entry.async("text");
    const result = yamlToModel(content);
    if (result.ok && isTest(result.model)) {
      const name = path
        .slice(testPrefix.length)
        .replace(/\.(yaml|yml)$/, "");
      result.model.name = name;
      tests.set(name, result.model);
      testOrder.push(name);
    }
  }

  // Preserve order from testCase.tests[] if available
  const orderedFromTc = extractOrderFromTestCase(tcResult.model, tests);
  const finalOrder = orderedFromTc.length > 0 ? orderedFromTc : testOrder;

  // Read schemas/ folder
  const schemas = new Map<string, SchemaFile>();
  const schemaPrefix = `${rootPrefix}schemas/`;

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!path.startsWith(schemaPrefix)) continue;

    const content = await entry.async("text");
    const name = path
      .slice(schemaPrefix.length)
      .replace(/\.json$/, "");
    schemas.set(name, { name, content });
  }

  return {
    projectName,
    testCase: tcResult.model,
    tests,
    schemas,
    testOrder: finalOrder,
  };
}

/* ── Fetch a folder-based example from public/examples/ ─────────────────── */

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
      testCase: { kind: "test-case" as const, name: tcResult.model.name, version: tcResult.model.version, tests: [{ test: tcResult.model.name }] } as TestCaseDefinition,
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
  const testOrder: string[] = [];
  const pathToName = new Map<string, string>();

  const fetches = testPaths.map(async ({ path }) => {
    const url = `${folderUrl}${path}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    const result = yamlToModel(text);
    if (!result.ok || !isTest(result.model)) return null;
    // Use basename without extension as key (matching zip import convention)
    const name = path.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
    result.model.name = name;
    return { name, path, model: result.model };
  });

  const results = await Promise.all(fetches);
  for (const entry of results) {
    if (entry) {
      tests.set(entry.name, entry.model);
      testOrder.push(entry.name);
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
    // Schema paths are relative to the test file (e.g., "../schemas/foo.json")
    // Resolve relative to tests/ folder
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

/* ── Single file download ───────────────────────────────────────────────── */

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/* ── Internal helpers ───────────────────────────────────────────────────── */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function findRootPrefix(entries: string[]): string {
  if (entries.length === 0) return "";
  const first = entries[0];
  const slash = first.indexOf("/");
  if (slash === -1) return "";
  const prefix = first.slice(0, slash + 1);
  const allMatch = entries.every((e) => e.startsWith(prefix));
  return allMatch ? prefix : "";
}

function extractOrderFromTestCase(
  tc: TestCaseDefinition,
  available: Map<string, ScriptDefinition>,
): string[] {
  const order: string[] = [];
  for (const entry of tc.tests) {
    if (typeof entry === "string") {
      const name = entry.replace(/^!include\s+/, "").replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
      if (available.has(name)) order.push(name);
    } else if (typeof entry === "object" && entry !== null) {
      if ("test" in entry && typeof (entry as { test: string }).test === "string") {
        const name = (entry as { test: string }).test;
        if (available.has(name)) order.push(name);
      } else if ("name" in entry) {
        const name = (entry as { name: string }).name;
        if (available.has(name)) order.push(name);
      }
    }
  }
  // Add any tests not referenced in test case
  for (const name of available.keys()) {
    if (!order.includes(name)) order.push(name);
  }
  return order;
}
