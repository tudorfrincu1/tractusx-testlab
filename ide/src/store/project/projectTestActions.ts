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

import { createEmptyTest } from "@/models/schema";
import { uniqueName } from "../selectors/storeBuilders";
import type { ProjectState } from "../store.types";

type Get = () => ProjectState;
type Set = (partial: Partial<ProjectState>) => void;

const INDEX_FILE = "index";

export function createTestActions(set: Set, get: Get, syncTckArray: () => void) {
  return {
    addTest: (name?: string): string => {
      const { tests, testOrder } = get();
      const existing = new Set(tests.keys());
      const testName = uniqueName(name ?? "new-test", existing);
      const model = createEmptyTest();
      model.name = testName;

      const next = new Map(tests);
      next.set(testName, model);
      const nextOrder = [...testOrder, testName];

      set({ tests: next, testOrder: nextOrder });
      syncTckArray();
      get().saveToLocalStorage();
      return testName;
    },

    removeTest: (name: string): void => {
      const { tests, testOrder, activeFile } = get();
      const next = new Map(tests);
      next.delete(name);
      const nextOrder = testOrder.filter((n) => n !== name);
      const nextActive =
        activeFile?.type === "test" && activeFile.name === name
          ? { type: "tck" as const, name: INDEX_FILE }
          : activeFile;

      set({ tests: next, testOrder: nextOrder, activeFile: nextActive });
      syncTckArray();
      get().saveToLocalStorage();
    },

    renameTest: (oldName: string, newName: string): void => {
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
      syncTckArray();
      get().saveToLocalStorage();
    },

    duplicateTest: (name: string): string => {
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
      syncTckArray();
      get().saveToLocalStorage();
      return copyName;
    },

    reorderTest: (name: string, newIndex: number): void => {
      const { testOrder } = get();
      const current = testOrder.indexOf(name);
      if (current === -1 || newIndex < 0 || newIndex >= testOrder.length) return;

      const next = [...testOrder];
      next.splice(current, 1);
      next.splice(newIndex, 0, name);

      set({ testOrder: next });
      syncTckArray();
      get().saveToLocalStorage();
    },
  };
}
