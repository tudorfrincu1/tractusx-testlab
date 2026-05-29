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

import type { ScriptDefinition, TckDefinition, TestLabDocument } from "@/models/schema";
import {
  isTck,
  isTest,
  isTestRef,
  createEmptyTck,
  createEmptyTest,
  ScriptKind,
} from "@/models/schema";
import { useEditorStore } from "../editor/useEditorStore";
import { buildTckTestsArray } from "../selectors/helpers";
import type { ProjectState } from "../types";

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
      testdata: new Map(),
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
      testdata: new Map(),
      activeFile: { type: "test", name: script.name },
      dirty: new Map(),
      workspaceStates: {},
    });
  }

  const activeModel = get().getActiveModel();
  if (activeModel) {
    useEditorStore.getState().loadModel(activeModel);
  }
  get().saveToLocalStorage();
}
