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

import type { TestLabDocument } from "@/models/schema";
import {
  STORAGE_KEY,
  OLD_STORAGE_KEY,
  serializeProject,
  deserializeProject,
  deserializeOldFormat,
  parseTestLabDocument,
} from "@/services/project";
import { useEditorStore } from "../editor/useEditorStore";
import { useServiceStore } from "../environment/useServiceStore";
import { buildTckTestsArray } from "../selectors/storeBuilders";
import type { ProjectState } from "../store.types";

export { STORAGE_KEY, OLD_STORAGE_KEY };
export type { SerializedProject } from "@/services/project";

/* ── Persistence functions (store-coupled wrappers) ─────────────────────── */

/** Serialize the current project state into localStorage. */
export function saveProjectToLocalStorage(
  get: () => ProjectState,
  set: (state: Partial<ProjectState>) => void,
): void {
  try {
    const { projectName, tck, tests, schemas, testdata, testOrder, activeFile, workspaceStates } = get();
    const json = serializeProject(
      { projectName, tck, tests, schemas, testdata, testOrder, activeFile, workspaceStates },
    );
    localStorage.setItem(STORAGE_KEY, json);
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
  const result = deserializeProject(raw);
  if (!result) return false;

  set({
    hasProject: true,
    projectName: result.projectName,
    tck: result.tck,
    tests: result.tests,
    schemas: result.schemas,
    testdata: result.testdata,
    testOrder: result.testOrder,
    activeFile: result.activeFile,
    dirty: new Map(),
    workspaceStates: result.workspaceStates,
  });

  const services = result.tck.env?.services ?? [];
  useServiceStore.getState().setServices(services);

  get().saveToLocalStorage();
  return true;
}

/** Attempt to migrate from old single-document storage format. */
export function migrateOldStorage(
  raw: string,
  get: () => ProjectState,
): boolean {
  const parsed = deserializeOldFormat(raw);
  if (!parsed) return false;
  get().loadFromDocument(parsed.model as TestLabDocument, parsed.projectName);
  return true;
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
  const parsed = parseTestLabDocument(doc, name, buildTckTestsArray);
  if (!parsed) return;

  set({
    hasProject: true,
    projectName: parsed.projectName,
    projectGeneration: get().projectGeneration + 1,
    tck: parsed.tck,
    tests: parsed.tests,
    testOrder: parsed.testOrder,
    schemas: parsed.schemas,
    testdata: new Map(),
    activeFile: parsed.activeFile,
    dirty: new Map(),
    workspaceStates: {},
  });

  if (parsed.services.length > 0) {
    useServiceStore.getState().setServices(parsed.services);
  }

  const activeModel = get().getActiveModel();
  if (activeModel) {
    useEditorStore.getState().loadModel(activeModel);
  }
  get().saveToLocalStorage();
}
