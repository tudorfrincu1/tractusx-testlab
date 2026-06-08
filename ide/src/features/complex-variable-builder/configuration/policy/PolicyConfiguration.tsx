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

// Side-by-side host for ONE policy Configuration item. The left column drives
// the template-first authoring flow (picker → variables, or the advanced
// hand-build form) and is the single editable source of truth. The right JSON
// column renders the resolved, copy-only EDC ODRL PolicyDefinition — exactly
// what the operator pastes into their connector — switched by the version pill.
// A collapsed drawer below shows the variable YAML this policy contributes.
import { useCallback, useMemo } from "react";
import { PolicyAuthoring } from "./PolicyAuthoring";
import { ConfigHeader } from "../header/ConfigHeader";
import { JsonTab } from "../json/JsonTab";
import { PolicyYamlDrawer } from "../yaml/PolicyYamlDrawer";
import { policyToOdrlJson, parseOdrlJson } from "../odrl";
import { validateJsonText } from "../json/jsonCodec";
import { useTemplateAuthoring } from "./useTemplateAuthoring";
import {
  applyTemplate,
  defaultVariableValues,
  findTemplate,
  matchTemplate,
} from "../../editors/templates";
import type { ComplexVariableItem, PolicyPayload } from "../../model";

export interface PolicyConfigurationProps {
  item: ComplexVariableItem;
  policy: PolicyPayload;
  onPolicyChange: (next: PolicyPayload) => void;
  /** Show the collapsed variable YAML drawer. Defaults to `true`. */
  showYamlPreview?: boolean;
}

export function PolicyConfiguration({
  item,
  policy,
  onPolicyChange,
  showYamlPreview = true,
}: Readonly<PolicyConfigurationProps>) {
  // Any structured edit (template, variable, advanced form) resumes live
  // serialization, so a previously hand-edited raw document never sticks.
  const handleStructuredChange = useCallback(
    (next: PolicyPayload) =>
      onPolicyChange(next.rawOdrlJson ? { ...next, rawOdrlJson: undefined } : next),
    [onPolicyChange],
  );
  const authoring = useTemplateAuthoring(policy, handleStructuredChange);
  const isAdvanced = authoring.mode === "advanced";
  // Auto-generated, stable per item: the operator never types the @id, and it
  // must not churn on every keystroke, so derive it once from the item id.
  const policyId = useMemo(() => crypto.randomUUID(), [item.id]);
  // Preserve hand-edited text the parser could not map (advanced custom);
  // otherwise serialize the logical model live into real EDC ODRL.
  const resolvedJson = policy.rawOdrlJson ?? policyToOdrlJson(policy, policyId);

  // Reconcile operator-edited ODRL: keep template mode when the shape still
  // matches a template (updating only the variable value), otherwise fall back
  // to advanced/custom — carrying parsed constraints, or the raw text when the
  // edit is not even parseable as ODRL, so the operator's input is never lost.
  const handleApplyJson = useCallback(
    (text: string) => {
      const parsed = parseOdrlJson(text, policy.policyType);
      if (!parsed.ok) {
        onPolicyChange({
          ...policy,
          authoringMode: "advanced",
          templateId: undefined,
          templateVariables: undefined,
          rawOdrlJson: text,
        });
        return;
      }
      const match = matchTemplate(parsed.policy);
      const template = match ? findTemplate(match.templateId) : undefined;
      if (match && template) {
        const values = { ...defaultVariableValues(template), ...match.variableValues };
        onPolicyChange(applyTemplate(template, values, policy.version));
        return;
      }
      onPolicyChange({
        ...policy,
        policyType: parsed.policy.policyType,
        permissions: parsed.policy.permissions,
        authoringMode: "advanced",
        templateId: undefined,
        templateVariables: undefined,
        rawOdrlJson: undefined,
      });
    },
    [policy, onPolicyChange],
  );

  return (
    <article className="precond-detail">
      <ConfigHeader
        item={item}
        trailing={
          <button
            type="button"
            className={modeToggleClass(isAdvanced)}
            aria-pressed={isAdvanced}
            onClick={() => authoring.setMode(isAdvanced ? "template" : "advanced")}
          >
            {isAdvanced ? "Use a template" : "Advanced"}
          </button>
        }
      />
      <div className="precond-split">
        <div className="precond-split__form">
          <PolicyAuthoring
            id={item.id}
            name={item.name}
            policy={policy}
            authoring={authoring}
            onPolicyChange={handleStructuredChange}
          />
        </div>
        <div className="precond-split__json">
          <JsonTab
            key={`${item.id}-policy`}
            sourceText={resolvedJson}
            showAssetIds={false}
            validate={validateJsonText}
            readOnly
            onApply={handleApplyJson}
          />
        </div>
      </div>
      {showYamlPreview && <PolicyYamlDrawer id={item.id} name={item.name} policy={policy} />}
    </article>
  );
}

function modeToggleClass(active: boolean): string {
  return active ? "precond-mode-toggle precond-mode-toggle--active" : "precond-mode-toggle";
}

