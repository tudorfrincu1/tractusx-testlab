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
 * Real-time validation engine for TestLab YAML documents.
 */

import {
  type TestLabDocument,
  type ScriptDefinition,
  type TckDefinition,
  type StepDefinition,
  ScriptKind,
  FailurePolicy,
  isTck,
  isTestRef,
  isTemplateStep,
} from "@/models/schema";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
  line?: number;
}

/** Step types are catalog-driven — no hardcoded set needed. */
let knownStepTypes: Set<string> | null = null;

/** Register known step types from the loaded block catalog. */
export function setKnownStepTypes(types: string[]) {
  knownStepTypes = new Set(types);
}

export function validate(doc: TestLabDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!doc.name || doc.name.trim() === "") {
    errors.push({ path: "name", message: "Name is required", severity: "error" });
  }

  if (!doc.kind) {
    errors.push({ path: "kind", message: "Kind is required", severity: "error" });
  } else if (!Object.values(ScriptKind).includes(doc.kind)) {
    errors.push({ path: "kind", message: `Invalid kind: ${doc.kind}`, severity: "error" });
  }

  if (isTck(doc)) {
    validateTck(doc, errors);
  } else {
    validateScript(doc as ScriptDefinition, errors);
  }

  return errors;
}

function validateScript(script: ScriptDefinition, errors: ValidationError[]) {
  if (!script.steps || script.steps.length === 0) {
    errors.push({ path: "steps", message: "At least one step is required", severity: "warning" });
  }

  const definedVars = new Set(Object.keys(script.variables ?? {}));
  const memoryVars = new Set<string>();

  const allSteps = [
    ...(script.setup ?? []).map((s, i) => ({ step: s, path: `setup[${i}]` })),
    ...(script.steps ?? []).map((s, i) => ({ step: s, path: `steps[${i}]` })),
    ...(script.teardown ?? []).map((s, i) => ({ step: s, path: `teardown[${i}]` })),
  ];

  for (const { step, path } of allSteps) {
    if (isTemplateStep(step)) {
      if (!step.template) {
        errors.push({ path, message: "Template name is required", severity: "error" });
      }
    } else {
      validateStep(step, path, definedVars, memoryVars, errors);
    }
  }

  for (const svc of script.services ?? []) {
    if (!svc.name) {
      errors.push({ path: "services", message: "Service name is required", severity: "error" });
    }
    if (!svc.uses) {
      errors.push({
        path: `services.${svc.name}`,
        message: "Service type is required",
        severity: "error",
      });
    }
    if (!svc.with || Object.keys(svc.with).length === 0) {
      errors.push({
        path: `services.${svc.name}`,
        message: "Service config is required",
        severity: "error",
      });
    }
  }
}

function validateStep(
  step: StepDefinition,
  path: string,
  definedVars: Set<string>,
  memoryVars: Set<string>,
  errors: ValidationError[]
) {
  validateStepRequiredFields(step, path, errors);
  validateStepValidations(step, path, errors);
  validateStepVarRefs(step, path, definedVars, memoryVars, errors);

  if (step.returns) {
    for (const key of Object.keys(step.returns)) {
      memoryVars.add(key);
    }
  }
}

function validateStepRequiredFields(
  step: StepDefinition,
  path: string,
  errors: ValidationError[],
): void {
  if (!step.uses) {
    errors.push({ path, message: "Step 'uses' is required", severity: "error" });
  } else if (knownStepTypes && !knownStepTypes.has(step.uses)) {
    errors.push({
      path: `${path}.uses`,
      message: `Unknown step type: "${step.uses}"`,
      severity: "error",
    });
  }

  if (!step.id) {
    errors.push({ path, message: "Step 'id' is required", severity: "error" });
  }

  if (step.on_failure && !Object.values(FailurePolicy).includes(step.on_failure)) {
    errors.push({
      path: `${path}.on_failure`,
      message: `Invalid on_failure: ${step.on_failure}`,
      severity: "error",
    });
  }
}

function validateStepValidations(
  step: StepDefinition,
  path: string,
  errors: ValidationError[],
): void {
  for (const validation of step.validate ?? []) {
    if (!validation.uses) {
      errors.push({
        path: `${path}.validate`,
        message: "Validation must specify a 'uses' field",
        severity: "error",
      });
    }
  }
}

function validateStepVarRefs(
  step: StepDefinition,
  path: string,
  definedVars: Set<string>,
  memoryVars: Set<string>,
  errors: ValidationError[],
): void {
  const paramStr = JSON.stringify(step.with ?? {});
  const allRefs = extractVarRefsFromParams(paramStr);
  for (const varName of allRefs) {
    if (varName.startsWith("!")) continue;
    if (!definedVars.has(varName) && !memoryVars.has(varName)) {
      errors.push({
        path: `${path}.with`,
        message: `Undefined variable reference: \${{ vars.${varName} }}`,
        severity: "warning",
      });
    }
  }
}

function extractVarRefsFromParams(paramStr: string): string[] {
  const newVarRefs = paramStr.match(/\$\{\{\s*vars\.(\w+)\s*\}\}/g) ?? [];
  const atVarRefs = paramStr.match(/@(\w+)/g) ?? [];
  return [
    ...newVarRefs.map((r) => { const m = /vars\.(\w+)/.exec(r); return m ? m[1] : ""; }).filter(Boolean),
    ...atVarRefs.map((r) => r.slice(1)),
  ];
}

function validateTck(tc: TckDefinition, errors: ValidationError[]) {
  if (!tc.tests || tc.tests.length === 0) {
    errors.push({ path: "tests", message: "At least one test is required", severity: "warning" });
  }

  for (let i = 0; i < (tc.tests ?? []).length; i++) {
    const test = tc.tests[i];
    if (typeof test === "string") {
      if (!test.startsWith("!include ")) {
        errors.push({
          path: `tests[${i}]`,
          message: `String test entry must start with "!include "`,
          severity: "error",
        });
      }
    } else if (isTestRef(test)) {
      if (!test.test || test.test.trim() === "") {
        errors.push({
          path: `tests[${i}].test`,
          message: "Test reference name is required",
          severity: "error",
        });
      }
    } else {
      validateScript(test, errors);
    }
  }
}
