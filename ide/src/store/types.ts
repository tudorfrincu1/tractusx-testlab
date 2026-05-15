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

import type {
  TckDefinition,
  ScriptDefinition,
  TestLabDocument,
} from "../models/schema";
import type { AggregatedVariable, TestSummary } from "./selectors";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ActiveFile {
  type: "tck" | "test" | "schema";
  name: string;
}

export interface SchemaFile {
  name: string;
  content: string;
}

/* ── Store interface ────────────────────────────────────────────────────── */

export interface ProjectState {
  hasProject: boolean;
  projectName: string;
  projectGeneration: number;
  tck: TckDefinition;
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
  updateTck: (model: TckDefinition) => void;
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
  updateTckField: <K extends keyof TckDefinition>(field: K, value: TckDefinition[K]) => void;
  exportZip: () => Promise<void>;
  exportFile: (name: string, type: "test" | "schema" | "tck") => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  loadFromDocument: (doc: TestLabDocument, name?: string) => void;
  setWorkspaceState: (fileName: string, state: object) => void;
  getWorkspaceState: (fileName: string) => object | null;
}
