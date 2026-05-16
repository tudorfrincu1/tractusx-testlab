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

/**
 * Active-editor Zustand store — manages the currently open document.
 *
 * Project-level concerns (file tree, persistence, navigation) live in
 * useProjectStore. This store only handles the model ↔ YAML ↔ blocks
 * synchronisation for whichever file is currently open in the editor.
 */

import { create } from "zustand";
import type { TestLabDocument } from "../../models/schema";
import { createEmptyTck } from "../../models/schema";
import type { ValidationError } from "../../models/validator";
import { validate } from "../../models/validator";
import { modelToYaml, yamlToModel } from "../../sync";

export type GraphMode = "execution" | "dataflow";

/** Callback invoked whenever the editor model changes (blocks or YAML). */
export type OnModelChange = (model: TestLabDocument) => void;

interface TestLabState {
  model: TestLabDocument;
  yaml: string;
  errors: ValidationError[];
  lastEditSource: "blocks" | "yaml" | "load" | "none";
  selectedNodeId: string | null;
  selectedStepType: string | null;
  graphMode: GraphMode;

  /** Register a listener called on every model change. */
  onModelChange: OnModelChange | null;
  setOnModelChange: (cb: OnModelChange | null) => void;

  setModelFromBlocks: (model: TestLabDocument) => void;
  setModelFromYaml: (yaml: string) => void;
  loadModel: (model: TestLabDocument) => void;
  showValidation: boolean;
  toggleValidation: () => void;
  setShowValidation: (show: boolean) => void;
  setGraphMode: (mode: GraphMode) => void;
  selectNode: (nodeId: string | null) => void;
  selectStep: (stepType: string | null) => void;
}

export const useTestLabStore = create<TestLabState>((set, get) => {
  const emptyModel = createEmptyTck();
  const emptyYaml = modelToYaml(emptyModel);

  return {
    model: emptyModel,
    yaml: emptyYaml,
    errors: [],
    lastEditSource: "none",
    selectedNodeId: null,
    selectedStepType: null,
    graphMode: "execution",
    onModelChange: null,

    setOnModelChange: (cb) => set({ onModelChange: cb }),

    setModelFromBlocks: (model) => {
      let yaml: string;
      let errors: ValidationError[];
      try {
        yaml = modelToYaml(model);
        errors = validate(model);
      } catch {
        yaml = get().yaml;
        errors = [{ path: "", message: "YAML generation failed — block tree may be incomplete", severity: "error" }];
      }
      set({ model, yaml, errors, lastEditSource: "blocks" });
      get().onModelChange?.(model);
    },

    setModelFromYaml: (yaml) => {
      const result = yamlToModel(yaml);
      if (result.ok) {
        const errors = validate(result.model);
        set({ model: result.model, yaml, errors, lastEditSource: "yaml" });
        get().onModelChange?.(result.model);
      } else {
        set({
          yaml,
          errors: [{ path: "", message: result.error, severity: "error" }],
          lastEditSource: "yaml",
        });
      }
    },

    loadModel: (model) => {
      let yaml: string;
      let errors: ValidationError[];
      try {
        yaml = modelToYaml(model);
        errors = validate(model);
      } catch {
        yaml = "";
        errors = [{ path: "", message: "YAML generation failed during load", severity: "error" }];
      }
      set({
        model,
        yaml,
        errors,
        lastEditSource: "load",
      });
    },

    showValidation: false,
    toggleValidation: () => set((s) => ({ showValidation: !s.showValidation })),
    setShowValidation: (show) => set({ showValidation: show }),
    setGraphMode: (mode) => set({ graphMode: mode }),
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    selectStep: (stepType) => set({ selectedStepType: stepType }),
  };
});
