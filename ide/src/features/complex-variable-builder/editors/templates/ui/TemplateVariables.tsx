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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

// One small named field per template variable. Each field reuses the advanced
// policy editor's right-operand control (mode select text / select / variable +
// matching value input), so a template constraint can bind to an env variable
// via `${{ env.NAME }}` exactly like the advanced editor \u2014 no locked chips.
import type { RightOperandDef } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import type { PolicyTemplate, TemplateVariable } from "../catalog";
import { RightOperandField } from "../../right-operand/RightOperandField";

export interface TemplateVariablesProps {
  template: PolicyTemplate;
  values: Record<string, string>;
  onVariableChange: (token: string, value: string) => void;
}

export function TemplateVariables({ template, values, onVariableChange }: Readonly<TemplateVariablesProps>) {
  return (
    <div className="precond-template-vars">
      {template.variables.map((variable) => {
        const fieldId = `tplvar-${template.id}-${variable.token}`;
        const value = values[variable.token] ?? variable.default ?? "";
        const handleChange = (next: string) => onVariableChange(variable.token, next);
        return (
          <div key={variable.token} className="precond-template-vars__field">
            <label className="precond-template-vars__label" htmlFor={fieldId}>
              {variable.label}
            </label>
            <RightOperandField
              def={operandDefFor(variable)}
              value={value}
              hasWarning={false}
              onChange={handleChange}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Derives the advanced right-operand schema from a template variable so the
 * template editor reuses the same variable-dropdown-or-text control as the
 * advanced policy editor. A `select` variable becomes a dropdown (with an extra
 * "Custom" mode when free text is allowed); a `text` variable becomes a custom
 * text field. Both gain the shared "Variable" mode for free.
 */
function operandDefFor(variable: TemplateVariable): RightOperandDef {
  if (variable.fieldType === "select") {
    return {
      type: variable.allowCustom ? "selectOrCustom" : "select",
      values: variable.options ? [...variable.options] : [],
    };
  }
  return { type: "custom" };
}
