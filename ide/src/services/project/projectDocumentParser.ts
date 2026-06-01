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

import type { TckDefinition, ScriptDefinition, TestLabDocument } from "@/models/schema";
import {
  isTck,
  isTest,
  isTestRef,
  createEmptyTck,
  createEmptyTest,
  ScriptKind,
} from "@/models/schema";
import type { ActiveFile, SchemaFile } from "@/models/project";

/* ── Parsed document result ─────────────────────────────────────────────── */

export interface ParsedProjectData {
  projectName: string;
  tck: TckDefinition;
  tests: Map<string, ScriptDefinition>;
  testOrder: string[];
  schemas: Map<string, SchemaFile>;
  activeFile: ActiveFile;
  services: unknown[];
}

/* ── Pure document parsing ──────────────────────────────────────────────── */

/**
 * Parse a TestLabDocument into project data without any store interaction.
 * Returns null if the document type is unrecognized.
 */
export function parseTestLabDocument(
  doc: TestLabDocument,
  name: string | undefined,
  buildTckTestsArray: (order: string[]) => unknown[],
  currentGeneration?: number,
): ParsedProjectData | null {
  if (isTck(doc)) {
    return parseTckDocument(doc, name, buildTckTestsArray);
  }

  if (isTest(doc)) {
    return parseTestDocument(doc as ScriptDefinition, name);
  }

  return null;
}

function parseTckDocument(
  tc: TckDefinition,
  name: string | undefined,
  buildTckTestsArray: (order: string[]) => unknown[],
): ParsedProjectData {
  const projectName = name ?? tc.name ?? "Untitled";
  const testsMap = new Map<string, ScriptDefinition>();
  const order: string[] = [];

  for (const entry of tc.tests) {
    parseTckEntry(entry, testsMap, order);
  }

  const cleanTc: TckDefinition = {
    ...tc,
    name: projectName,
    tests: buildTckTestsArray(order) as TckDefinition["tests"],
  };

  return {
    projectName,
    tck: cleanTc,
    tests: testsMap,
    testOrder: order,
    schemas: new Map(),
    activeFile: { type: "tck", name: "index" },
    services: tc.env?.services ?? [],
  };
}

function parseTckEntry(
  entry: unknown,
  testsMap: Map<string, ScriptDefinition>,
  order: string[],
): void {
  if (typeof entry === "object" && entry !== null && "kind" in entry && (entry as { kind: string }).kind === ScriptKind.TEST) {
    const script = entry as ScriptDefinition;
    testsMap.set(script.name, script);
    order.push(script.name);
  } else if (isTestRef(entry)) {
    const testName = (entry as { test: string }).test;
    order.push(testName);
    if (!testsMap.has(testName)) {
      const empty = createEmptyTest();
      empty.name = testName;
      testsMap.set(testName, empty);
    }
  } else if (typeof entry === "string") {
    const path = entry.replace(/^!include\s+/, "");
    const baseName = path.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
    order.push(baseName);
    if (!testsMap.has(baseName)) {
      const empty = createEmptyTest();
      empty.name = baseName;
      testsMap.set(baseName, empty);
    }
  }
}

function parseTestDocument(
  script: ScriptDefinition,
  name: string | undefined,
): ParsedProjectData {
  const projectName = name ?? script.name ?? "Untitled";
  const tc = createEmptyTck();
  tc.name = projectName;
  tc.tests = [{ test: script.name }];

  return {
    projectName,
    tck: tc,
    tests: new Map([[script.name, script]]),
    testOrder: [script.name],
    schemas: new Map(),
    activeFile: { type: "test", name: script.name },
    services: [],
  };
}
