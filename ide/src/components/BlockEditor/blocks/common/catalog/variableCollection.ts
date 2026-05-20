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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { Workspace } from "blockly";
import type { Step } from "../../../../../models/schema";
import { isTemplateStep } from "../../../../../models/schema";
import { useProjectStore } from "../../../../../store/slices/useProjectStore";
import type { BlockCatalog } from "./catalogLoader";
import { findCatalogEntry } from "./catalogLoader";

export function collectWorkspaceVariables(workspace: Workspace, catalog?: BlockCatalog): string[] {
  const vars = new Set<string>();

  const collectFromSteps = (steps?: Step[]) => {
    if (!steps) return;
    for (const step of steps) {
      if (isTemplateStep(step)) {
        continue;
      }

      if (step.type === "import_variable") {
        const importedVar = step.params?.store_in_variable || step.params?.variable;
        if (typeof importedVar === "string" && importedVar) {
          vars.add(importedVar);
        }
      }

      if (step.store_in_memory) {
        for (const varName of Object.keys(step.store_in_memory)) {
          if (varName) vars.add(varName);
        }
      }

      for (const val of Object.values(step.params ?? {})) {
        if (!Array.isArray(val)) continue;
        const nested = val.filter((item): item is Step => (
          typeof item === "object" &&
          item !== null &&
          ("template" in item || "type" in item)
        ));
        if (nested.length > 0) collectFromSteps(nested);
      }
    }
  };

  const { tck, tests } = useProjectStore.getState();
  if (tck?.variables) {
    for (const varName of Object.keys(tck.variables)) {
      vars.add(varName);
    }
  }

  if (tests) {
    for (const script of tests.values()) {
      if (script.variables) {
        for (const varName of Object.keys(script.variables)) {
          vars.add(varName);
        }
      }

      collectFromSteps(script.setup);
      collectFromSteps(script.steps);
      collectFromSteps(script.teardown);

      if (script.teardown) {
        for (const step of script.teardown) {
          if (isTemplateStep(step)) {
            continue;
          }

          if (step.type === "export_variable" && typeof step.params?.name === "string") {
            vars.add(step.params.name);
          }
        }
      }
    }
  }

  for (const b of workspace.getBlocksByType("variable_def", false)) {
    const name = b.getFieldValue("VAR_NAME");
    if (name) vars.add(name);
  }

  for (const b of workspace.getBlocksByType("variable_get", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") vars.add(ref);
  }

  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }

  if (catalog) {
    for (const b of workspace.getAllBlocks(false)) {
      if (!b.type.startsWith("step_")) continue;
      const stepType = b.type.slice(5);
      const entry = findCatalogEntry(stepType, catalog);
      if (entry?.outputs) {
        for (const output of entry.outputs) {
          if (output.name) vars.add(output.name);
        }
      }
    }
  }

  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}

/**
 * Collects only environment/TCK variables — excludes step outputs.
 * Returns variables from: TCK variables, test variables, import_variable blocks, variable_def blocks.
 */
export function collectEnvironmentVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();

  const { tck, tests } = useProjectStore.getState();
  if (tck?.variables) {
    for (const varName of Object.keys(tck.variables)) {
      vars.add(varName);
    }
  }

  if (tests) {
    for (const script of tests.values()) {
      if (script.variables) {
        for (const varName of Object.keys(script.variables)) {
          vars.add(varName);
        }
      }
    }
  }

  for (const b of workspace.getBlocksByType("variable_def", false)) {
    const name = b.getFieldValue("VAR_NAME");
    if (name) vars.add(name);
  }

  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }

  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}
