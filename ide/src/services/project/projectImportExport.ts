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

import JSZip from "jszip";
import type { TckDefinition, ScriptDefinition } from "@/models/schema";
import { isTck, isTest } from "@/models/schema";
import { modelToYaml, yamlToModel } from "@/services/yaml";
import type { SchemaFile, TestdataFile } from "@/models/project";

const INDEX_FILE = "index.yaml";

// Re-export for backward compatibility
export { importExampleFolder } from "./exampleProjectLoader";

/* ── Export ──────────────────────────────────────────────────────────────── */

export async function exportProjectZip(
  projectName: string,
  tck: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  schemas: Map<string, SchemaFile>,
  testdata: Map<string, TestdataFile>,
  testOrder: string[],
): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder(projectName);
  if (!root) return;

  // index.yaml — the TCK root
  root.file(INDEX_FILE, modelToYaml(tck));

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
  tck: TckDefinition;
  tests: Map<string, ScriptDefinition>;
  schemas: Map<string, SchemaFile>;
  testdata?: Map<string, TestdataFile>;
  testOrder: string[];
}

async function readTestsFromZip(
  zip: JSZip,
  testPrefix: string,
): Promise<{ tests: Map<string, ScriptDefinition>; testOrder: string[] }> {
  const tests = new Map<string, ScriptDefinition>();
  const testOrder: string[] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !path.startsWith(testPrefix) || !/\.(yaml|yml)$/.test(path)) continue;
    const content = await entry.async("text");
    const result = yamlToModel(content);
    if (result.ok && isTest(result.model)) {
      const name = path.slice(testPrefix.length).replace(/\.(yaml|yml)$/, "");
      result.model.name = name;
      tests.set(name, result.model);
      testOrder.push(name);
    }
  }
  return { tests, testOrder };
}

async function readSchemasFromZip(
  zip: JSZip,
  schemaPrefix: string,
): Promise<Map<string, SchemaFile>> {
  const schemas = new Map<string, SchemaFile>();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !path.startsWith(schemaPrefix)) continue;
    const content = await entry.async("text");
    const name = path.slice(schemaPrefix.length).replace(/\.json$/, "");
    schemas.set(name, { name, content });
  }
  return schemas;
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
  if (!tcResult.ok || !isTck(tcResult.model)) return null;

  // Read tests/ folder
  const testPrefix = `${rootPrefix}tests/`;
  const { tests, testOrder } = await readTestsFromZip(zip, testPrefix);

  // Preserve order from tck.tests[] if available
  const orderedFromTc = extractOrderFromTck(tcResult.model, tests);
  const finalOrder = orderedFromTc.length > 0 ? orderedFromTc : testOrder;

  // Read schemas/ folder
  const schemaPrefix = `${rootPrefix}schemas/`;
  const schemas = await readSchemasFromZip(zip, schemaPrefix);

  return {
    projectName,
    tck: tcResult.model,
    tests,
    schemas,
    testOrder: finalOrder,
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

function extractNameFromEntry(entry: unknown): string | null {
  if (typeof entry === "string") {
    return entry.replace(/^!include\s+/, "").replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
  }
  if (typeof entry === "object" && entry !== null) {
    if ("test" in entry && typeof (entry as { test: string }).test === "string") {
      return (entry as { test: string }).test;
    }
    if ("name" in entry) {
      return (entry as { name: string }).name;
    }
  }
  return null;
}

function extractOrderFromTck(
  tc: TckDefinition,
  available: Map<string, ScriptDefinition>,
): string[] {
  const order: string[] = [];
  for (const entry of tc.tests) {
    const name = extractNameFromEntry(entry);
    if (name && available.has(name)) order.push(name);
  }
  for (const name of available.keys()) {
    if (!order.includes(name)) order.push(name);
  }
  return order;
}
