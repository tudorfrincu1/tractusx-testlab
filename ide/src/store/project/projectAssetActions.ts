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

import { modelToYaml } from "@/services";
import { uniqueName } from "../selectors/helpers";
import { downloadFile } from "./projectIO";
import type { ProjectState } from "../types";

type Get = () => ProjectState;
type Set = (partial: Partial<ProjectState>) => void;

const INDEX_FILE = "index";

export function createAssetActions(set: Set, get: Get) {
  return {
    addSchema: (name: string, content: string): void => {
      const { schemas } = get();
      const existing = new Set(schemas.keys());
      const schemaName = uniqueName(name, existing);
      const next = new Map(schemas);
      next.set(schemaName, { name: schemaName, content });
      set({ schemas: next });
      get().saveToLocalStorage();
    },

    removeSchema: (name: string): void => {
      const { schemas, activeFile } = get();
      const next = new Map(schemas);
      next.delete(name);
      const nextActive =
        activeFile?.type === "schema" && activeFile.name === name
          ? { type: "tck" as const, name: INDEX_FILE }
          : activeFile;
      set({ schemas: next, activeFile: nextActive });
      get().saveToLocalStorage();
    },

    renameSchema: (oldName: string, newName: string): void => {
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

    addTestdata: (name: string, content: string, type: string): void => {
      const { testdata } = get();
      const existing = new Set(testdata.keys());
      const tdName = uniqueName(name, existing);
      const next = new Map(testdata);
      next.set(tdName, { name: tdName, content, type });
      set({ testdata: next });
      get().saveToLocalStorage();
    },

    removeTestdata: (name: string): void => {
      const { testdata, activeFile } = get();
      const next = new Map(testdata);
      next.delete(name);
      const nextActive =
        activeFile?.type === "testdata" && activeFile.name === name
          ? { type: "tck" as const, name: INDEX_FILE }
          : activeFile;
      set({ testdata: next, activeFile: nextActive });
      get().saveToLocalStorage();
    },

    renameTestdata: (oldName: string, newName: string): void => {
      const { testdata } = get();
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName || testdata.has(trimmed)) return;
      const td = testdata.get(oldName);
      if (!td) return;

      const next = new Map(testdata);
      next.delete(oldName);
      next.set(trimmed, { ...td, name: trimmed });
      set({ testdata: next });
      get().saveToLocalStorage();
    },

    updateTestdataContent: (name: string, content: string): void => {
      const { testdata } = get();
      const td = testdata.get(name);
      if (!td) return;
      const next = new Map(testdata);
      next.set(name, { ...td, content });
      set({ testdata: next });
      get().saveToLocalStorage();
    },

    getTestdataNames: (): string[] => [...get().testdata.keys()],

    exportFile: (name: string, type: "test" | "schema" | "tck"): void => {
      window.dispatchEvent(new Event("testlab:force-sync"));
      const { tck, tests, schemas, testdata } = get();
      if (type === "tck") downloadFile(`${INDEX_FILE}.yaml`, modelToYaml(tck), "application/x-yaml");
      else if (type === "test") { const m = tests.get(name); if (m) downloadFile(`${name}.yaml`, modelToYaml(m), "application/x-yaml"); }
      else if (type === "schema") { const s = schemas.get(name); if (s) downloadFile(`${name}.json`, s.content, "application/json"); }
      else if ((type as string) === "testdata") { const td = testdata.get(name); if (td) downloadFile(`${name}.json`, td.content, td.type === "application/json" ? "application/json" : "text/plain"); }
    },
  };
}
