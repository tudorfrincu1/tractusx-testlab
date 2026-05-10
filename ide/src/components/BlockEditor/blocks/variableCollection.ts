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
import type { Step } from "../../../models/schema";
import { isTemplateStep } from "../../../models/schema";
import { useProjectStore } from "../../../store/useProjectStore";

/**
 * Static map of template names → the variable names they produce.
 * Used by collectWorkspaceVariables to expose template outputs in the variable dropdown.
 */
export const TEMPLATE_OUTPUTS: Record<string, string[]> = {
  "catalog-negotiation": ["contract_agreement_id", "data_address", "edr_token"],
  "transfer-dataplane-access": ["data_address", "edr_token"],
  "dtr-shell-lookup": ["shell_descriptors"],
};

export function collectWorkspaceVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();

  const collectFromSteps = (steps?: Step[]) => {
    if (!steps) return;
    for (const step of steps) {
      if (isTemplateStep(step)) {
        const produced = TEMPLATE_OUTPUTS[step.template];
        if (produced) {
          for (const v of produced) vars.add(v);
        }
        continue;
      }

      if (step.type === "import_variable") {
        const importedVar = step.params?.variable;
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

  const { testCase, tests } = useProjectStore.getState();
  if (testCase?.variables) {
    for (const varName of Object.keys(testCase.variables)) {
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
          if ("type" in step && step.type === "export_variable" && step.params?.name) {
            vars.add(String(step.params.name));
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

  for (const b of workspace.getBlocksByType("step_template", false)) {
    const templateName = b.getFieldValue("PARAM_TEMPLATE");
    if (templateName && TEMPLATE_OUTPUTS[templateName]) {
      for (const v of TEMPLATE_OUTPUTS[templateName]) {
        vars.add(v);
      }
    }
  }

  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }

  return Array.from(vars).sort();
}
