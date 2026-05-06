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

/**
 * Real-time validation engine for TestLab YAML documents.
 */

import {
  type TestLabDocument,
  type ScriptDefinition,
  type TestCaseDefinition,
  type StepDefinition,
  ScriptKind,
  AssertionType,
  AssertionSeverity,
  FailurePolicy,
  ServiceType,
  ValueSource,
  isTestCase,
  isTestRef,
} from "./schema";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
  line?: number;
}

const VALID_STEP_TYPES = new Set([
  "create_asset",
  "delete_asset",
  "create_policy",
  "delete_policy",
  "create_contract_definition",
  "delete_contract_definition",
  "query_catalog_by_asset_id",
  "query_catalog",
  "dsp_catalog_request",
  "negotiate_contract",
  "transfer_data",
  "get_edr",
  "dataplane_call",
  "http_request",
  "do_dsp",
  "do_dsp_with_bpnl",
  "upload_backend_data",
  "sdk_call",
  "init_service",
  "stop_service",
  "await_callback",
]);

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

  if (isTestCase(doc)) {
    validateTestCase(doc, errors);
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
    ...(script.cleanup ?? []).map((s, i) => ({ step: s, path: `cleanup[${i}]` })),
  ];

  for (const { step, path } of allSteps) {
    validateStep(step, path, definedVars, memoryVars, errors);
  }

  for (const svc of script.services ?? []) {
    if (!svc.name) {
      errors.push({ path: "services", message: "Service name is required", severity: "error" });
    }
    if (!svc.type || !Object.values(ServiceType).includes(svc.type)) {
      errors.push({
        path: `services.${svc.name}`,
        message: `Invalid service type: ${svc.type}`,
        severity: "error",
      });
    }
    if (!svc.base_url) {
      errors.push({
        path: `services.${svc.name}`,
        message: "Service base_url is required",
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
  if (!step.type) {
    errors.push({ path, message: "Step type is required", severity: "error" });
  } else if (!VALID_STEP_TYPES.has(step.type)) {
    errors.push({
      path: `${path}.type`,
      message: `Unknown step type: "${step.type}"`,
      severity: "warning",
    });
  }

  if (!step.name) {
    errors.push({ path: `${path}.name`, message: "Step name is required", severity: "warning" });
  }

  if (step.on_failure && !Object.values(FailurePolicy).includes(step.on_failure)) {
    errors.push({
      path: `${path}.on_failure`,
      message: `Invalid on_failure: ${step.on_failure}`,
      severity: "error",
    });
  }

  for (const assertion of step.expect ?? []) {
    if (!Object.values(AssertionType).includes(assertion.type)) {
      errors.push({
        path: `${path}.expect`,
        message: `Invalid assertion type: ${assertion.type}`,
        severity: "error",
      });
    }
    if (assertion.severity && !Object.values(AssertionSeverity).includes(assertion.severity)) {
      errors.push({
        path: `${path}.expect`,
        message: `Invalid assertion severity: ${assertion.severity}`,
        severity: "error",
      });
    }
    if (assertion.source && !Object.values(ValueSource).includes(assertion.source)) {
      errors.push({
        path: `${path}.expect`,
        message: `Invalid assertion source: ${assertion.source}`,
        severity: "error",
      });
    }
  }

  const paramStr = JSON.stringify(step.params ?? {});
  const varRefs = paramStr.match(/\$\{([^}]+)\}/g) ?? [];
  for (const ref of varRefs) {
    const varName = ref.slice(2, -1);
    if (varName.startsWith("!")) continue;
    if (!definedVars.has(varName) && !memoryVars.has(varName)) {
      errors.push({
        path: `${path}.params`,
        message: `Undefined variable reference: \${${varName}}`,
        severity: "warning",
      });
    }
  }

  if (step.store_in_memory) {
    for (const key of Object.keys(step.store_in_memory)) {
      memoryVars.add(key);
    }
  }
}

function validateTestCase(tc: TestCaseDefinition, errors: ValidationError[]) {
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
