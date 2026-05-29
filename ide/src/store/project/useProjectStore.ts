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

import { create } from "zustand";
import type { TckDefinition, ScriptDefinition } from "@/models/schema";
import { createEmptyTck } from "@/models/schema";
import { exportProjectZip } from "./projectIO";
import { buildTckTestsArray } from "../selectors/helpers";
import { getAggregatedVariables as computeAggregatedVariables, getTestSummaries as computeTestSummaries } from "../selectors/selectors";
import type { AggregatedVariable, TestSummary } from "../selectors/selectors";
import { saveProjectToLocalStorage, loadProjectFromLocalStorage, loadDocumentIntoStore } from "./persistence";
import type { ActiveFile, SchemaFile, TestdataFile, ProjectState } from "../types";
import { createTestActions } from "./projectTestActions";
import { createAssetActions } from "./projectAssetActions";

export type { AggregatedVariable, TestSummary, ActiveFile, SchemaFile, TestdataFile, ProjectState };

const INDEX_FILE = "index";

export const useProjectStore = create<ProjectState>((set, get) => {

  function syncTckArray() {
    const { tck, testOrder } = get();
    const updated: TckDefinition = {
      ...tck,
      tests: buildTckTestsArray(testOrder),
    };
    set({ tck: updated });
  }

  const testActions = createTestActions(set, get, syncTckArray);
  const assetActions = createAssetActions(set, get);

  return {
  hasProject: false,
  projectName: "new-tck",
  projectGeneration: 0,
  tck: createEmptyTck(),
  tests: new Map(),
  schemas: new Map(),
  testdata: new Map(),
  testOrder: [],
  activeFile: null,
  dirty: new Map(),
  workspaceStates: {},
  lastSavedAt: null,

  createProject: (name) => {
    const projectName = name ?? "new-tck";
    const tc = createEmptyTck();
    tc.name = projectName;
    set({
      hasProject: true,
      projectName,
      projectGeneration: get().projectGeneration + 1,
      tck: tc,
      tests: new Map(),
      schemas: new Map(),
      testdata: new Map(),
      testOrder: [],
      activeFile: { type: "tck", name: INDEX_FILE },
      dirty: new Map(),
      workspaceStates: {},
      lastSavedAt: null,
    });
    get().saveToLocalStorage();
  },

  ...testActions,
  ...assetActions,

  updateTest: (name: string, model: ScriptDefinition) => {
    const { tests } = get();
    const next = new Map(tests);
    next.set(name, model);
    set({ tests: next });
    get().markDirty(name);
    get().saveToLocalStorage();
  },
  updateTck: (model) => {
    set({ tck: model, projectName: model.name });
    get().markDirty(INDEX_FILE);
    get().saveToLocalStorage();
  },
  setActiveFile: (file) => {
    set({ activeFile: file });
  },

  markDirty: (name) => { const next = new Map(get().dirty); next.set(name, true); set({ dirty: next }); },
  markClean: (name) => { const next = new Map(get().dirty); next.delete(name); set({ dirty: next }); },
  isDirty: (name) => get().dirty.has(name),
  isAnyDirty: () => get().dirty.size > 0,
  getTestNames: () => [...get().testOrder],
  getSchemaNames: () => [...get().schemas.keys()],

  getActiveModel: () => {
    const { activeFile, tck, tests, testdata } = get();
    if (!activeFile) return null;
    if (activeFile.type === "tck") {
      if (testdata.size === 0) return tck;
      const tdEnv: Record<string, { file: string; type: string }> = {};
      for (const [key, entry] of testdata) {
        const ext = entry.type === "application/json" ? ".json" : "";
        const filename = key.endsWith(ext) || ext === "" ? key : `${key}${ext}`;
        tdEnv[key] = { file: `testdata/${filename}`, type: entry.type };
      }
      return { ...tck, env: { ...(tck.env ?? {}), testdata: tdEnv } };
    }
    if (activeFile.type === "test") return tests.get(activeFile.name) ?? null;
    return null;
  },
  getAggregatedVariables: () => computeAggregatedVariables(get().tck, get().tests, get().testOrder),
  getTestSummaries: () => computeTestSummaries(get().tck, get().tests, get().testOrder),
  updateTckField: (field, value) => {
    const tck = { ...get().tck, [field]: value };
    const patch: Partial<ProjectState> = { tck };
    if (field === "name" && typeof value === "string") {
      patch.projectName = value;
    }
    set(patch);
    syncTckArray();
    get().markDirty(INDEX_FILE);
    get().saveToLocalStorage();
  },
  exportZip: async () => {
    window.dispatchEvent(new Event("testlab:force-sync"));
    return exportProjectZip(get().projectName, get().tck, get().tests, get().schemas, get().testdata, get().testOrder);
  },

  saveToLocalStorage: () => saveProjectToLocalStorage(get, set),
  loadFromLocalStorage: () => loadProjectFromLocalStorage(set, get),
  loadFromDocument: (doc, name) => loadDocumentIntoStore(doc, name, set, get),

  setWorkspaceState: (fileName, state) => {
    set({ workspaceStates: { ...get().workspaceStates, [fileName]: state } });
  },
  getWorkspaceState: (fileName) => get().workspaceStates[fileName] ?? null,
  };
});
