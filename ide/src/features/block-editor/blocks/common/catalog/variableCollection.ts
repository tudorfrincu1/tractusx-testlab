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
import type { Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import { useProjectStore } from "@/store/project/useProjectStore";
import type { BlockCatalog } from "./catalogLoader";
import { findCatalogEntry } from "./catalogLoader";

/** Variables organized by domain category for the toolbox sidebar. */
export interface CategorizedVariables {
  readonly environment: readonly string[];
  readonly precondition: readonly string[];
  readonly service: readonly string[];
  readonly metadata: readonly string[];
  readonly execution: readonly string[];
}

/** Collects variables grouped by domain category for the toolbox. */
export function collectCategorizedVariables(workspace: Workspace): CategorizedVariables {
  return {
    environment: collectEnvironmentVariables(workspace),
    precondition: collectPreconditionVariables(workspace),
    service: collectServiceVariables(workspace),
    metadata: collectMetadataVariables(workspace),
    execution: collectExecutionVariables(workspace),
  };
}

export function collectWorkspaceVariables(workspace: Workspace, catalog?: BlockCatalog): string[] {
  const vars = new Set<string>();

  const collectFromSteps = (steps?: Step[]) => {
    if (!steps) return;
    for (const step of steps) {
      if (isTemplateStep(step)) {
        continue;
      }

      if (step.returns) {
        for (const varName of Object.keys(step.returns)) {
          if (varName) vars.add(varName);
        }
      }

      for (const val of Object.values(step.with ?? {})) {
        if (!Array.isArray(val)) continue;
        const nested = val.filter((item): item is Step => (
          typeof item === "object" &&
          item !== null &&
          ("template" in item || "uses" in item)
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

          if (step.uses === "export_variable" && typeof step.with?.name === "string") {
            vars.add(step.with.name);
          }
        }
      }
    }
  }

  for (const b of workspace.getBlocksByType("var_env", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") {
      const name = ref.startsWith("env.") ? ref.slice(4) : ref;
      if (name) vars.add(name);
    }
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
 * Returns variables from: TCK variables, test variables, import_variable blocks.
 */
export function collectEnvironmentVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();

  const { tck, tests, testdata } = useProjectStore.getState();
  if (tck?.variables) {
    for (const varName of Object.keys(tck.variables)) {
      vars.add(varName);
    }
  }
  if (tck?.env?.variables) {
    for (const varName of Object.keys(tck.env.variables)) {
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
      if (script.env?.variables) {
        for (const varName of Object.keys(script.env.variables)) {
          vars.add(varName);
        }
      }
    }
  }

  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }

  for (const b of workspace.getBlocksByType("var_env", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") {
      const name = ref.startsWith("env.") ? ref.slice(4) : ref;
      if (name) vars.add(name);
    }
  }

  if (testdata) {
    for (const key of testdata.keys()) {
      vars.add(`testdata.${key}`);
    }
  }

  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}

/** Collects service variable references: `service_name.return_key` */
export function collectServiceVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();
  const { tck, tests } = useProjectStore.getState();
  const allServices = [...(tck?.env?.services ?? [])];
  if (tests) {
    for (const script of tests.values()) {
      if (script.env?.services) allServices.push(...script.env.services);
      if (script.services) allServices.push(...script.services);
    }
  }
  for (const svc of allServices) {
    if (svc.returns) {
      for (const key of Object.keys(svc.returns)) {
        vars.add(`${svc.name}.${key}`);
      }
    }
  }

  for (const b of workspace.getBlocksByType("var_services", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") vars.add(ref);
  }

  return Array.from(vars).sort();
}

/** Collects precondition output references: `precondition_id.return_key` */
export function collectPreconditionVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();
  const { tck, tests } = useProjectStore.getState();
  const allPreconditions = [...(tck?.preconditions ?? [])];
  if (tests) {
    for (const script of tests.values()) {
      if (script.preconditions) allPreconditions.push(...script.preconditions);
    }
  }
  for (const pre of allPreconditions) {
    if (pre.returns) {
      for (const key of Object.keys(pre.returns)) {
        vars.add(`${pre.id}.${key}`);
      }
    }
  }

  for (const b of workspace.getBlocksByType("var_preconditions", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") vars.add(ref);
  }

  return Array.from(vars).sort();
}

/** Collects metadata field names from the TCK definition. */
export function collectMetadataVariables(_workspace: Workspace): string[] {
  const { tck } = useProjectStore.getState();
  if (!tck?.metadata) return [];
  return Object.keys(tck.metadata).sort();
}

/** Collects setup step output references: `setup_step_id.return_key` */
export function collectSetupVariables(_workspace: Workspace): string[] {
  const results: string[] = [];
  const { tests } = useProjectStore.getState();
  if (tests) {
    for (const script of tests.values()) {
      if (script.setup) {
        for (const step of script.setup) {
          if (isTemplateStep(step)) continue;
          if (step.returns) {
            for (const key of Object.keys(step.returns)) {
              results.push(`${step.id}.${key}`);
            }
          }
        }
      }
    }
  }
  return Array.from(new Set(results)).sort();
}

/** Collects execution runtime variables auto-generated by the backend. */
export function collectExecutionVariables(_workspace: Workspace): string[] {
  return ["test_execution_id", "test_run_id", "timestamp"];
}


