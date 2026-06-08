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
import { useProjectStore } from "@/store";
import type { BlockCatalog } from "../catalogLoader";
import {
  sortedUnique,
  collectVarsFromSteps,
  collectVarsFromEnvBlocks,
  collectVarsFromCatalog,
  gatherAllServices,
  collectSetupStepOutputs,
} from "./variableCollectionHelpers";

/** Variables organized by domain category for the toolbox sidebar. */
export interface CategorizedVariables {
  readonly environment: readonly string[];
  readonly service: readonly string[];
  readonly metadata: readonly string[];
  readonly execution: readonly string[];
}

/** Collects variables grouped by domain category for the toolbox. */
export function collectCategorizedVariables(workspace: Workspace): CategorizedVariables {
  return {
    environment: collectEnvironmentVariables(workspace),
    service: collectServiceVariables(workspace),
    metadata: collectMetadataVariables(workspace),
    execution: collectExecutionVariables(workspace),
  };
}

export function collectWorkspaceVariables(workspace: Workspace, catalog?: BlockCatalog): string[] {
  const vars = new Set<string>();
  const { tck, tests } = useProjectStore.getState();

  if (tck?.variables) {
    for (const varName of Object.keys(tck.variables)) vars.add(varName);
  }

  if (tests) {
    for (const script of tests.values()) {
      if (script.variables) {
        for (const varName of Object.keys(script.variables)) vars.add(varName);
      }
      collectVarsFromSteps(script.setup, vars);
      collectVarsFromSteps(script.steps, vars);
      collectVarsFromSteps(script.teardown, vars);
      collectExportVarsFromTeardown(script.teardown, vars);
    }
  }

  collectVarsFromEnvBlocks(workspace, vars);
  if (catalog) collectVarsFromCatalog(workspace, catalog, vars);

  return sortedUnique(vars);
}

/** Collects export_variable names from teardown steps. */
function collectExportVarsFromTeardown(teardown: unknown[] | undefined, vars: Set<string>): void {
  if (!teardown) return;
  for (const step of teardown as Array<{ uses?: string; with?: Record<string, unknown> }>) {
    if (step.uses === "export_variable" && typeof step.with?.name === "string") {
      vars.add(step.with.name);
    }
  }
}

/**
 * Collects only environment/TCK variables — excludes step outputs.
 * Returns variables from: TCK variables, test variables, import_variable blocks.
 */
export function collectEnvironmentVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();
  const { tck, tests, testdata } = useProjectStore.getState();

  collectEnvVarsFromTck(tck, vars);
  collectEnvVarsFromTests(tests, vars);
  collectEnvVarsFromBlocks(workspace, vars);

  if (testdata) {
    for (const key of testdata.keys()) vars.add(`testdata.${key}`);
  }

  return sortedUnique(vars);
}

/** Adds TCK-level environment variables. */
function collectEnvVarsFromTck(
  tck: ReturnType<typeof useProjectStore.getState>["tck"],
  vars: Set<string>,
): void {
  if (tck?.variables) {
    for (const varName of Object.keys(tck.variables)) vars.add(varName);
  }
  if (tck?.env?.variables) {
    for (const varName of Object.keys(tck.env.variables)) vars.add(varName);
  }
}

/** Adds test-script-level variables (ScriptDefinition.variables). */
function collectEnvVarsFromTests(
  tests: ReturnType<typeof useProjectStore.getState>["tests"],
  vars: Set<string>,
): void {
  if (!tests) return;
  for (const script of tests.values()) {
    if (script.variables) {
      for (const varName of Object.keys(script.variables)) vars.add(varName);
    }
  }
}

/** Adds variables from import_variable and var_env workspace blocks. */
function collectEnvVarsFromBlocks(workspace: Workspace, vars: Set<string>): void {
  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }
  collectVarsFromEnvBlocks(workspace, vars);
}

/** Collects service variable references: `service_name.return_key` */
export function collectServiceVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();
  const { tck, tests } = useProjectStore.getState();
  const allServices = gatherAllServices(tck?.env?.services, tests);

  for (const svc of allServices) {
    if (svc.returns) {
      for (const key of Object.keys(svc.returns)) vars.add(`${svc.name}.${key}`);
    }
  }

  for (const b of workspace.getBlocksByType("var_services", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") vars.add(ref);
  }

  return sortedUnique(vars);
}

/** Collects metadata field names from the TCK definition. */
export function collectMetadataVariables(_workspace: Workspace): string[] {
  return [];
}

/** Collects setup step output references: `setup_step_id.return_key` */
export function collectSetupVariables(_workspace: Workspace): string[] {
  const { tests } = useProjectStore.getState();
  const results = collectSetupStepOutputs(tests);
  return Array.from(new Set(results)).sort((a, b) => a.localeCompare(b));
}

/** Collects execution runtime variables auto-generated by the backend. */
export function collectExecutionVariables(_workspace: Workspace): string[] {
  return ["test_execution_id", "test_run_id", "timestamp"];
}


