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

import type { ScriptDefinition, TckDefinition, TestLabDocument } from "../models/schema";
import {
  isTck,
  isTest,
  isTestRef,
  createEmptyTck,
  createEmptyTest,
  ScriptKind,
} from "../models/schema";
import { yamlToModel } from "../sync/yamlToModel";
import { modelToYaml } from "../sync/modelToYaml";
import { useTestLabStore } from "./useTestLabStore";
import { buildTckTestsArray } from "./helpers";
import type { ActiveFile, SchemaFile, ProjectState } from "./types";

/* ── Constants ──────────────────────────────────────────────────────────── */

export const STORAGE_KEY = "testlab-project";
export const OLD_STORAGE_KEY = "testlab-ide-state";

/* ── Serialized project shape ───────────────────────────────────────────── */

export interface SerializedProject {
  projectName: string;
  tckYaml: string;
  tests: Record<string, string>;
  schemas: Record<string, string>;
  testOrder: string[];
  activeFile: ActiveFile | null;
  workspaceStates?: Record<string, object>;
}

/* ── Persistence functions ──────────────────────────────────────────────── */

/** Serialize the current project state into localStorage. */
export function saveProjectToLocalStorage(
  get: () => ProjectState,
  set: (state: Partial<ProjectState>) => void,
): void {
  try {
    const { projectName, tck, tests, schemas, testOrder, activeFile, workspaceStates } = get();
    const serialized: SerializedProject = {
      projectName,
      tckYaml: modelToYaml(tck),
      tests: Object.fromEntries(
        [...tests.entries()].map(([k, v]) => [k, modelToYaml(v)])
      ),
      schemas: Object.fromEntries(
        [...schemas.entries()].map(([k, v]) => [k, v.content])
      ),
      testOrder,
      activeFile,
      workspaceStates,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    set({ dirty: new Map() });
  } catch {
    // localStorage may be full or unavailable
  }
}

/** Load a serialized project from a raw JSON string. */
export function loadSerializedProject(
  raw: string,
  set: (state: Partial<ProjectState>) => void,
  get: () => ProjectState,
): boolean {
  try {
    const data: SerializedProject = JSON.parse(raw);
    const tcResult = yamlToModel(data.tckYaml);
    if (!tcResult.ok || !isTck(tcResult.model)) return false;

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

    set({
      hasProject: true,
      projectName: data.projectName,
      tck: tcResult.model,
      tests: testsMap,
      schemas: schemasMap,
      testOrder: data.testOrder ?? [],
      activeFile: data.activeFile ?? { type: "tck", name: "index" },
      dirty: new Map(),
      workspaceStates: data.workspaceStates ?? {},
    });
    get().saveToLocalStorage();
    return true;
  } catch {
    return false;
  }
}

/** Attempt to migrate from old single-document storage format. */
export function migrateOldStorage(
  raw: string,
  get: () => ProjectState,
): boolean {
  try {
    const { yaml, projectName } = JSON.parse(raw);
    if (!yaml) return false;
    const result = yamlToModel(yaml);
    if (!result.ok) return false;
    get().loadFromDocument(result.model, projectName);
    return true;
  } catch {
    return false;
  }
}

/** Load project from localStorage, trying new format first then migrating old. */
export function loadProjectFromLocalStorage(
  set: (state: Partial<ProjectState>) => void,
  get: () => ProjectState,
): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return loadSerializedProject(raw, set, get);

    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const migrated = migrateOldStorage(oldRaw, get);
      if (migrated) {
        localStorage.removeItem(OLD_STORAGE_KEY);
        return migrated;
      }
    }
  } catch {
    // corrupted localStorage
  }
  return false;
}

/** Load a TestLabDocument (tck or standalone test) into the store. */
export function loadDocumentIntoStore(
  doc: TestLabDocument,
  name: string | undefined,
  set: (state: Partial<ProjectState>) => void,
  get: () => ProjectState,
): void {
  if (isTck(doc)) {
    const tc = doc;
    const projectName = name ?? tc.name ?? "Untitled";
    const testsMap = new Map<string, ScriptDefinition>();
    const order: string[] = [];

    for (const entry of tc.tests) {
      if (typeof entry === "object" && entry !== null && "kind" in entry && entry.kind === ScriptKind.TEST) {
        const script = entry as ScriptDefinition;
        testsMap.set(script.name, script);
        order.push(script.name);
      } else if (isTestRef(entry)) {
        const testName = entry.test;
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

    const cleanTc: TckDefinition = {
      ...tc,
      name: projectName,
      tests: buildTckTestsArray(order),
    };

    set({
      hasProject: true,
      projectName,
      projectGeneration: get().projectGeneration + 1,
      tck: cleanTc,
      tests: testsMap,
      testOrder: order,
      schemas: new Map(),
      activeFile: { type: "tck", name: "index" },
      dirty: new Map(),
      workspaceStates: {},
    });
  } else if (isTest(doc)) {
    const script = doc as ScriptDefinition;
    const projectName = name ?? script.name ?? "Untitled";
    const tc = createEmptyTck();
    tc.name = projectName;
    tc.tests = [{ test: script.name }];

    set({
      hasProject: true,
      projectName,
      projectGeneration: get().projectGeneration + 1,
      tck: tc,
      tests: new Map([[script.name, script]]),
      testOrder: [script.name],
      schemas: new Map(),
      activeFile: { type: "test", name: script.name },
      dirty: new Map(),
      workspaceStates: {},
    });
  }

  const activeModel = get().getActiveModel();
  if (activeModel) {
    useTestLabStore.getState().loadModel(activeModel);
  }
  get().saveToLocalStorage();
}
