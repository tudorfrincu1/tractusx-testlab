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
import type { Step, ServiceDefinition, PreconditionDefinition } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import type { BlockCatalog } from "../catalogLoader";
import { findCatalogEntry } from "../catalogLoader";

/** Sorts a string array alphabetically using locale comparison. */
export function sortedUnique(vars: Set<string>): string[] {
  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}

/** Collects variable names from step `returns` fields, recursing into nested steps. */
export function collectVarsFromSteps(steps: Step[] | undefined, vars: Set<string>): void {
  if (!steps) return;
  for (const step of steps) {
    if (isTemplateStep(step)) continue;
    addReturnsKeys(step, vars);
    collectNestedStepVars(step, vars);
  }
}

/** Adds keys from a step's `returns` to the variable set. */
function addReturnsKeys(step: Step & { returns?: Record<string, unknown> }, vars: Set<string>): void {
  if (!step.returns) return;
  for (const varName of Object.keys(step.returns)) {
    if (varName) vars.add(varName);
  }
}

/** Recurses into nested steps within `with` array values. */
function collectNestedStepVars(step: Step & { with?: Record<string, unknown> }, vars: Set<string>): void {
  if (!step.with) return;
  for (const val of Object.values(step.with)) {
    if (!Array.isArray(val)) continue;
    const nested = val.filter((item): item is Step => (
      typeof item === "object" &&
      item !== null &&
      ("template" in item || "uses" in item)
    ));
    if (nested.length > 0) collectVarsFromSteps(nested, vars);
  }
}

/** Collects variable names from var_env blocks in the workspace. */
export function collectVarsFromEnvBlocks(workspace: Workspace, vars: Set<string>): void {
  for (const b of workspace.getBlocksByType("var_env", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") {
      const name = ref.startsWith("env.") ? ref.slice(4) : ref;
      if (name) vars.add(name);
    }
  }
}

/** Collects variable names from catalog block outputs in the workspace. */
export function collectVarsFromCatalog(workspace: Workspace, catalog: BlockCatalog, vars: Set<string>): void {
  for (const b of workspace.getAllBlocks(false)) {
    if (!b.type.startsWith("step_")) continue;
    const stepType = b.type.slice(5);
    const entry = findCatalogEntry(stepType, catalog);
    if (!entry?.outputs) continue;
    for (const output of entry.outputs) {
      if (output.name) vars.add(output.name);
    }
  }
}

/** Gathers all services from TCK env and test scripts. */
export function gatherAllServices(
  tckServices: ServiceDefinition[] | undefined,
  tests: Map<string, { services?: ServiceDefinition[] }> | undefined,
): ServiceDefinition[] {
  const all = [...(tckServices ?? [])];
  if (!tests) return all;
  for (const script of tests.values()) {
    if (script.services) all.push(...script.services);
  }
  return all;
}

/** Gathers all preconditions from TCK and test scripts. */
export function gatherAllPreconditions(
  tckPreconditions: PreconditionDefinition[] | undefined,
  tests: Map<string, { preconditions?: PreconditionDefinition[] }> | undefined,
): PreconditionDefinition[] {
  const all = [...(tckPreconditions ?? [])];
  if (!tests) return all;
  for (const script of tests.values()) {
    if (script.preconditions) all.push(...script.preconditions);
  }
  return all;
}

/** Collects setup step output vars from all test scripts. */
export function collectSetupStepOutputs(
  tests: Map<string, { setup?: Step[] }> | undefined,
): string[] {
  const results: string[] = [];
  if (!tests) return results;
  for (const script of tests.values()) {
    if (!script.setup) continue;
    for (const step of script.setup) {
      if (isTemplateStep(step)) continue;
      if (!step.returns) continue;
      for (const key of Object.keys(step.returns)) {
        results.push(`${step.id}.${key}`);
      }
    }
  }
  return results;
}
