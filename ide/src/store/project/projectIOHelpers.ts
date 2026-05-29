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

import type JSZip from "jszip";
import type { ScriptDefinition } from "@/models/schema";
import { isTest } from "@/models/schema";
import { modelToYaml, yamlToModel } from "@/services";
import type { SchemaFile, TestdataFile } from "./useProjectStore";

/* ── Export helpers ──────────────────────────────────────────────────────── */

export function writeTestsFolder(
  root: JSZip,
  tests: Map<string, ScriptDefinition>,
  testOrder: string[],
): void {
  const testsFolder = root.folder("tests");
  if (!testsFolder) return;
  for (const name of testOrder) {
    const model = tests.get(name);
    if (model) {
      testsFolder.file(`${name}.yaml`, modelToYaml(model));
    }
  }
}

export function writeSchemasFolder(root: JSZip, schemas: Map<string, SchemaFile>): void {
  if (schemas.size === 0) return;
  const schemasFolder = root.folder("schemas");
  if (!schemasFolder) return;
  for (const [name, schema] of schemas) {
    schemasFolder.file(`${name}.json`, schema.content);
  }
}

export function writeTestdataFolder(root: JSZip, testdata: Map<string, TestdataFile>): void {
  if (testdata.size === 0) return;
  const testdataFolder = root.folder("testdata");
  if (!testdataFolder) return;
  for (const [name, entry] of testdata) {
    const ext = entry.type === "application/json" ? ".json" : "";
    const filename = name.endsWith(ext) || ext === "" ? name : `${name}${ext}`;
    testdataFolder.file(filename, entry.content);
  }
}

/* ── Import helpers ─────────────────────────────────────────────────────── */

export async function readTestsFromZip(
  zip: JSZip,
  testPrefix: string,
): Promise<{ tests: Map<string, ScriptDefinition>; testOrder: string[] }> {
  const tests = new Map<string, ScriptDefinition>();
  const testOrder: string[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!path.startsWith(testPrefix)) continue;
    if (!/\.(yaml|yml)$/.test(path)) continue;

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

export async function readSchemasFromZip(
  zip: JSZip,
  schemaPrefix: string,
): Promise<Map<string, SchemaFile>> {
  const schemas = new Map<string, SchemaFile>();

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!path.startsWith(schemaPrefix)) continue;

    const content = await entry.async("text");
    const name = path.slice(schemaPrefix.length).replace(/\.json$/, "");
    schemas.set(name, { name, content });
  }

  return schemas;
}

export async function readTestdataFromZip(
  zip: JSZip,
  testdataPrefix: string,
): Promise<Map<string, TestdataFile>> {
  const testdata = new Map<string, TestdataFile>();

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!path.startsWith(testdataPrefix)) continue;

    const content = await entry.async("text");
    const filename = path.slice(testdataPrefix.length);
    const name = filename.replace(/\.[^.]+$/, "");
    const type = filename.endsWith(".json") ? "application/json" : "text/plain";
    testdata.set(name, { name, content, type });
  }

  return testdata;
}
