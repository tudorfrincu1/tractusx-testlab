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
import { isTck, isTest } from "@/models/schema";
import { yamlToModel, modelToYaml } from "@/services/yaml";
import type { ActiveFile, SchemaFile, TestdataFile } from "@/models/project";

/* ── Constants ──────────────────────────────────────────────────────────── */

export const STORAGE_KEY = "testlab-project";
export const OLD_STORAGE_KEY = "testlab-ide-state";

/* ── Serialized project shape ───────────────────────────────────────────── */

export interface SerializedProject {
  projectName: string;
  tckYaml: string;
  tests: Record<string, string>;
  schemas: Record<string, string>;
  testdata?: Record<string, { content: string; type: string }>;
  testOrder: string[];
  activeFile: ActiveFile | null;
  workspaceStates?: Record<string, object>;
}

/* ── Deserialized project data ──────────────────────────────────────────── */

export interface DeserializedProject {
  projectName: string;
  tck: TckDefinition;
  tests: Map<string, ScriptDefinition>;
  schemas: Map<string, SchemaFile>;
  testdata: Map<string, TestdataFile>;
  testOrder: string[];
  activeFile: ActiveFile | null;
  workspaceStates: Record<string, object>;
}

/* ── Pure serialization ─────────────────────────────────────────────────── */

/** Serialize project state into a JSON string for localStorage. */
export function serializeProject(
  projectName: string,
  tck: TckDefinition,
  tests: Map<string, ScriptDefinition>,
  schemas: Map<string, SchemaFile>,
  testdata: Map<string, TestdataFile>,
  testOrder: string[],
  activeFile: ActiveFile | null,
  workspaceStates: Record<string, object>,
): string {
  const serialized: SerializedProject = {
    projectName,
    tckYaml: modelToYaml(tck),
    tests: Object.fromEntries(
      [...tests.entries()].map(([k, v]) => [k, modelToYaml(v)])
    ),
    schemas: Object.fromEntries(
      [...schemas.entries()].map(([k, v]) => [k, v.content])
    ),
    testdata: Object.fromEntries(
      [...testdata.entries()].map(([k, v]) => [k, { content: v.content, type: v.type }])
    ),
    testOrder,
    activeFile,
    workspaceStates,
  };
  return JSON.stringify(serialized);
}

/** Deserialize a raw JSON string into project data. Returns null on failure. */
export function deserializeProject(raw: string): DeserializedProject | null {
  try {
    const data: SerializedProject = JSON.parse(raw);
    const tcResult = yamlToModel(data.tckYaml);
    if (!tcResult.ok || !isTck(tcResult.model)) return null;

    const testsMap = new Map<string, ScriptDefinition>();
    for (const [name, yaml] of Object.entries(data.tests)) {
      const result = yamlToModel(yaml);
      if (result.ok && isTest(result.model)) {
        testsMap.set(name, result.model);
      }
    }

    const schemasMap = new Map<string, SchemaFile>();
    for (const [name, content] of Object.entries(data.schemas ?? {})) {
      schemasMap.set(name, { name, content });
    }

    const testdataMap = new Map<string, TestdataFile>();
    for (const [name, entry] of Object.entries(data.testdata ?? {})) {
      testdataMap.set(name, { name, content: entry.content, type: entry.type });
    }

    return {
      projectName: data.projectName,
      tck: tcResult.model,
      tests: testsMap,
      schemas: schemasMap,
      testdata: testdataMap,
      testOrder: data.testOrder ?? [],
      activeFile: data.activeFile ?? { type: "tck", name: "index" },
      workspaceStates: data.workspaceStates ?? {},
    };
  } catch {
    return null;
  }
}

/** Parse the old single-document storage format. Returns model or null. */
export function deserializeOldFormat(raw: string): { model: unknown; projectName: string } | null {
  try {
    const { yaml, projectName } = JSON.parse(raw);
    if (!yaml) return null;
    const result = yamlToModel(yaml);
    if (!result.ok) return null;
    return { model: result.model, projectName };
  } catch {
    return null;
  }
}
