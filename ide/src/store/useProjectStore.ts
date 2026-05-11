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

import { create } from "zustand";
import type { TestCaseDefinition } from "../models/schema";
import { createEmptyTestCase, createEmptyTest } from "../models/schema";
import { modelToYaml } from "../sync/modelToYaml";
import { exportProjectZip, downloadFile } from "./projectIO";
import { uniqueName, buildTestCaseTestsArray } from "./helpers";
import { getAggregatedVariables as computeAggregatedVariables, getTestSummaries as computeTestSummaries } from "./selectors";
import type { AggregatedVariable, TestSummary } from "./selectors";
import { saveProjectToLocalStorage, loadProjectFromLocalStorage, loadDocumentIntoStore } from "./persistence";
import type { ActiveFile, SchemaFile, ProjectState } from "./types";

export type { AggregatedVariable, TestSummary, ActiveFile, SchemaFile, ProjectState };

const INDEX_FILE = "index";

export const useProjectStore = create<ProjectState>((set, get) => {

  function syncTestCaseArray() {
    const { testCase, testOrder } = get();
    const updated: TestCaseDefinition = {
      ...testCase,
      tests: buildTestCaseTestsArray(testOrder),
    };
    set({ testCase: updated });
  }

  return {
  hasProject: false,
  projectName: "new-test-case",
  projectGeneration: 0,
  testCase: createEmptyTestCase(),
  tests: new Map(),
  schemas: new Map(),
  testOrder: [],
  activeFile: null,
  dirty: new Map(),
  workspaceStates: {},

  createProject: (name) => {
    const projectName = name ?? "new-test-case";
    const tc = createEmptyTestCase();
    tc.name = projectName;
    set({
      hasProject: true,
      projectName,
      projectGeneration: get().projectGeneration + 1,
      testCase: tc,
      tests: new Map(),
      schemas: new Map(),
      testOrder: [],
      activeFile: { type: "test-case", name: INDEX_FILE },
      dirty: new Map(),
      workspaceStates: {},
    });
    get().saveToLocalStorage();
  },

  addTest: (name) => {
    const { tests, testOrder } = get();
    const existing = new Set(tests.keys());
    const testName = uniqueName(name ?? "new-test", existing);
    const model = createEmptyTest();
    model.name = testName;

    const next = new Map(tests);
    next.set(testName, model);
    const nextOrder = [...testOrder, testName];

    set({ tests: next, testOrder: nextOrder });
    syncTestCaseArray();
    get().saveToLocalStorage();
    return testName;
  },

  removeTest: (name) => {
    const { tests, testOrder, activeFile } = get();
    const next = new Map(tests);
    next.delete(name);
    const nextOrder = testOrder.filter((n) => n !== name);
    const nextActive =
      activeFile?.type === "test" && activeFile.name === name
        ? { type: "test-case" as const, name: INDEX_FILE }
        : activeFile;

    set({ tests: next, testOrder: nextOrder, activeFile: nextActive });
    syncTestCaseArray();
    get().saveToLocalStorage();
  },

  renameTest: (oldName, newName) => {
    const { tests, testOrder, activeFile } = get();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || tests.has(trimmed)) return;

    const model = tests.get(oldName);
    if (!model) return;

    const renamed = { ...model, name: trimmed };
    const next = new Map(tests);
    next.delete(oldName);
    next.set(trimmed, renamed);
    const nextOrder = testOrder.map((n) => (n === oldName ? trimmed : n));
    const nextActive =
      activeFile?.type === "test" && activeFile.name === oldName
        ? { type: "test" as const, name: trimmed }
        : activeFile;
    const dirtyMap = new Map(get().dirty);
    if (dirtyMap.has(oldName)) {
      dirtyMap.set(trimmed, dirtyMap.get(oldName)!);
      dirtyMap.delete(oldName);
    }

    set({ tests: next, testOrder: nextOrder, activeFile: nextActive, dirty: dirtyMap });
    syncTestCaseArray();
    get().saveToLocalStorage();
  },

  duplicateTest: (name) => {
    const { tests } = get();
    const original = tests.get(name);
    if (!original) return name;

    const existing = new Set(tests.keys());
    const copyName = uniqueName(`${name}-copy`, existing);
    const copy = structuredClone(original);
    copy.name = copyName;

    const next = new Map(tests);
    next.set(copyName, copy);
    const nextOrder = [...get().testOrder, copyName];

    set({ tests: next, testOrder: nextOrder });
    syncTestCaseArray();
    get().saveToLocalStorage();
    return copyName;
  },

  reorderTest: (name, newIndex) => {
    const { testOrder } = get();
    const current = testOrder.indexOf(name);
    if (current === -1 || newIndex < 0 || newIndex >= testOrder.length) return;

    const next = [...testOrder];
    next.splice(current, 1);
    next.splice(newIndex, 0, name);

    set({ testOrder: next });
    syncTestCaseArray();
    get().saveToLocalStorage();
  },

  updateTest: (name, model) => {
    const { tests } = get();
    const next = new Map(tests);
    next.set(name, model);
    set({ tests: next });
    get().markDirty(name);
    get().saveToLocalStorage();
  },
  updateTestCase: (model) => {
    set({ testCase: model, projectName: model.name });
    get().markDirty(INDEX_FILE);
    get().saveToLocalStorage();
  },
  setActiveFile: (file) => {
    set({ activeFile: file });
    get().saveToLocalStorage();
  },
  addSchema: (name, content) => {
    const { schemas } = get();
    const existing = new Set(schemas.keys());
    const schemaName = uniqueName(name, existing);
    const next = new Map(schemas);
    next.set(schemaName, { name: schemaName, content });
    set({ schemas: next });
    get().saveToLocalStorage();
  },
  removeSchema: (name) => {
    const { schemas, activeFile } = get();
    const next = new Map(schemas);
    next.delete(name);
    const nextActive =
      activeFile?.type === "schema" && activeFile.name === name
        ? { type: "test-case" as const, name: INDEX_FILE }
        : activeFile;
    set({ schemas: next, activeFile: nextActive });
    get().saveToLocalStorage();
  },
  renameSchema: (oldName, newName) => {
    const { schemas } = get();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || schemas.has(trimmed)) return;
    const schema = schemas.get(oldName);
    if (!schema) return;

    const next = new Map(schemas);
    next.delete(oldName);
    next.set(trimmed, { ...schema, name: trimmed });
    set({ schemas: next });
    get().saveToLocalStorage();
  },

  markDirty: (name) => {
    const next = new Map(get().dirty);
    next.set(name, true);
    set({ dirty: next });
  },
  markClean: (name) => {
    const next = new Map(get().dirty);
    next.delete(name);
    set({ dirty: next });
  },
  isDirty: (name) => get().dirty.has(name),
  isAnyDirty: () => get().dirty.size > 0,
  getTestNames: () => [...get().testOrder],
  getSchemaNames: () => [...get().schemas.keys()],

  getActiveModel: () => {
    const { activeFile, testCase, tests } = get();
    if (!activeFile) return null;
    if (activeFile.type === "test-case") return testCase;
    if (activeFile.type === "test") return tests.get(activeFile.name) ?? null;
    return null;
  },

  getAggregatedVariables: () => {
    const { testCase, tests, testOrder } = get();
    return computeAggregatedVariables(testCase, tests, testOrder);
  },
  getTestSummaries: () => {
    const { testCase, tests, testOrder } = get();
    return computeTestSummaries(testCase, tests, testOrder);
  },
  updateTestCaseField: (field, value) => {
    const testCase = { ...get().testCase, [field]: value };
    set({ testCase });
    syncTestCaseArray();
    get().markDirty(INDEX_FILE);
    get().saveToLocalStorage();
  },
  exportZip: async () => {
    const { projectName, testCase, tests, schemas, testOrder } = get();
    await exportProjectZip(projectName, testCase, tests, schemas, testOrder);
  },
  exportFile: (name, type) => {
    const { testCase, tests, schemas } = get();
    if (type === "test-case") {
      downloadFile(`${INDEX_FILE}.yaml`, modelToYaml(testCase), "application/x-yaml");
    } else if (type === "test") {
      const model = tests.get(name);
      if (model) downloadFile(`${name}.yaml`, modelToYaml(model), "application/x-yaml");
    } else if (type === "schema") {
      const schema = schemas.get(name);
      if (schema) downloadFile(`${name}.json`, schema.content, "application/json");
    }
  },

  saveToLocalStorage: () => {
    saveProjectToLocalStorage(get, set);
  },
  loadFromLocalStorage: () => {
    return loadProjectFromLocalStorage(set, get);
  },
  loadFromDocument: (doc, name) => {
    loadDocumentIntoStore(doc, name, set, get);
  },

  setWorkspaceState: (fileName, state) => {
    const { workspaceStates } = get();
    set({ workspaceStates: { ...workspaceStates, [fileName]: state } });
  },
  getWorkspaceState: (fileName) => {
    return get().workspaceStates[fileName] ?? null;
  },
  };
});
