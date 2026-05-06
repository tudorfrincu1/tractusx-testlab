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
import type {
  TestCaseDefinition,
  ScriptDefinition,
  TestLabDocument,
  VariableDefinition,
} from "../models/schema";
import {
  createEmptyTestCase,
  createEmptyTest,
  isTestCase,
  isTest,
  isTestRef,
  ScriptKind,
} from "../models/schema";
import { modelToYaml } from "../sync/modelToYaml";
import { yamlToModel } from "../sync/yamlToModel";
import { exportProjectZip, downloadFile } from "./projectIO";
import { useTestLabStore } from "./useTestLabStore";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ActiveFile {
  type: "test-case" | "test" | "schema";
  name: string;
}

export interface SchemaFile {
  name: string;
  content: string;
}

/** A variable merged from all tests + test-case level */
export interface AggregatedVariable {
  name: string;
  definition: VariableDefinition;
  usedBy: string[];
  isTestCaseLevel: boolean;
}

/** Summary of a test for the pipeline table */
export interface TestSummary {
  name: string;
  description?: string;
  stepCount: number;
  serviceNames: string[];
  overrides?: Record<string, unknown>;
}

interface SerializedProject {
  projectName: string;
  testCaseYaml: string;
  tests: Record<string, string>;
  schemas: Record<string, string>;
  testOrder: string[];
  activeFile: ActiveFile | null;
  workspaceStates?: Record<string, object>;
}

/* ── Store interface ────────────────────────────────────────────────────── */

interface ProjectState {
  hasProject: boolean;
  projectName: string;
  projectGeneration: number;
  testCase: TestCaseDefinition;
  tests: Map<string, ScriptDefinition>;
  schemas: Map<string, SchemaFile>;
  testOrder: string[];
  activeFile: ActiveFile | null;
  dirty: Map<string, boolean>;
  workspaceStates: Record<string, object>;

  createProject: (name?: string) => void;
  addTest: (name?: string) => string;
  removeTest: (name: string) => void;
  renameTest: (oldName: string, newName: string) => void;
  duplicateTest: (name: string) => string;
  reorderTest: (name: string, newIndex: number) => void;
  updateTest: (name: string, model: ScriptDefinition) => void;
  updateTestCase: (model: TestCaseDefinition) => void;
  setActiveFile: (file: ActiveFile | null) => void;
  addSchema: (name: string, content: string) => void;
  removeSchema: (name: string) => void;
  renameSchema: (oldName: string, newName: string) => void;
  markDirty: (name: string) => void;
  markClean: (name: string) => void;
  isDirty: (name: string) => boolean;
  isAnyDirty: () => boolean;
  getTestNames: () => string[];
  getSchemaNames: () => string[];
  getActiveModel: () => TestLabDocument | null;
  getAggregatedVariables: () => AggregatedVariable[];
  getTestSummaries: () => TestSummary[];
  updateTestCaseField: <K extends keyof TestCaseDefinition>(field: K, value: TestCaseDefinition[K]) => void;
  exportZip: () => Promise<void>;
  exportFile: (name: string, type: "test" | "schema" | "test-case") => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  loadFromDocument: (doc: TestLabDocument, name?: string) => void;
  setWorkspaceState: (fileName: string, state: object) => void;
  getWorkspaceState: (fileName: string) => object | null;
}

const STORAGE_KEY = "testlab-project";
const OLD_STORAGE_KEY = "testlab-ide-state";
const INDEX_FILE = "index";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function uniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 1;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function buildTestCaseTestsArray(
  testOrder: string[],
): { test: string }[] {
  return testOrder.map((name) => ({ test: name }));
}

/* ── Store ──────────────────────────────────────────────────────────────── */

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
    const merged = new Map<string, AggregatedVariable>();

    // Collect from test-case level first (these are the "source of truth")
    if (testCase.variables) {
      for (const [name, def] of Object.entries(testCase.variables)) {
        merged.set(name, { name, definition: def, usedBy: [], isTestCaseLevel: true });
      }
    }

    // Scan each test for variables
    for (const testName of testOrder) {
      const script = tests.get(testName);
      if (!script?.variables) continue;
      for (const [varName, def] of Object.entries(script.variables)) {
        const existing = merged.get(varName);
        if (existing) {
          existing.usedBy.push(testName);
        } else {
          merged.set(varName, { name: varName, definition: def, usedBy: [testName], isTestCaseLevel: false });
        }
      }
    }

    return [...merged.values()];
  },

  getTestSummaries: () => {
    const { tests, testOrder, testCase } = get();
    return testOrder.map((name) => {
      const script = tests.get(name);
      const ref = testCase.tests.find(
        (t) => typeof t === "object" && "test" in t && (t as { test: string }).test === name
      ) as { with?: Record<string, unknown> } | undefined;

      return {
        name,
        description: script?.description,
        stepCount: (script?.setup?.length ?? 0) + (script?.steps?.length ?? 0) + (script?.cleanup?.length ?? 0),
        serviceNames: script?.services?.map((s) => s.name) ?? [],
        overrides: ref?.with,
      };
    });
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
    try {
      const { projectName, testCase, tests, schemas, testOrder, activeFile, workspaceStates } = get();
      const serialized: SerializedProject = {
        projectName,
        testCaseYaml: modelToYaml(testCase),
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
  },

  loadFromLocalStorage: () => {
    try {
      // Try new project format first
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return loadSerializedProject(raw, set, get);

      // Migrate from old single-document format
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        const migrated = migrateOldStorage(oldRaw);
        if (migrated) {
          localStorage.removeItem(OLD_STORAGE_KEY);
          return migrated;
        }
      }
    } catch {
      // corrupted localStorage
    }
    return false;

    function migrateOldStorage(raw: string): boolean {
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
  },

  loadFromDocument: (doc, name) => {
    if (isTestCase(doc)) {
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

      // Build a clean test case with TestRef entries
      const cleanTc: TestCaseDefinition = {
        ...tc,
        name: projectName,
        tests: buildTestCaseTestsArray(order),
      };

      set({
        hasProject: true,
        projectName,
        projectGeneration: get().projectGeneration + 1,
        testCase: cleanTc,
        tests: testsMap,
        testOrder: order,
        schemas: new Map(),
        activeFile: { type: "test-case", name: INDEX_FILE },
        dirty: new Map(),
        workspaceStates: {},
      });
    } else if (isTest(doc)) {
      // Wrap a standalone test in a new test case
      const script = doc as ScriptDefinition;
      const projectName = name ?? script.name ?? "Untitled";
      const tc = createEmptyTestCase();
      tc.name = projectName;
      tc.tests = [{ test: script.name }];

      set({
        hasProject: true,
        projectName,
        projectGeneration: get().projectGeneration + 1,
        testCase: tc,
        tests: new Map([[script.name, script]]),
        testOrder: [script.name],
        schemas: new Map(),
        activeFile: { type: "test", name: script.name },
        dirty: new Map(),
        workspaceStates: {},
      });
    }
    // Sync editor store so blocks render the correct model immediately
    const activeModel = get().getActiveModel();
    if (activeModel) {
      useTestLabStore.getState().loadModel(activeModel);
    }
    get().saveToLocalStorage();
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

/* ── Internal helper — kept outside the store to avoid circular get() ───── */

function loadSerializedProject(
  raw: string,
  set: (state: Partial<ProjectState>) => void,
  get: () => ProjectState,
): boolean {
  try {
    const data: SerializedProject = JSON.parse(raw);
    const tcResult = yamlToModel(data.testCaseYaml);
    if (!tcResult.ok || !isTestCase(tcResult.model)) return false;

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
      testCase: tcResult.model,
      tests: testsMap,
      schemas: schemasMap,
      testOrder: data.testOrder ?? [],
      activeFile: data.activeFile ?? { type: "test-case", name: INDEX_FILE },
      dirty: new Map(),
      workspaceStates: data.workspaceStates ?? {},
    });
    get().saveToLocalStorage();
    return true;
  } catch {
    return false;
  }
}
