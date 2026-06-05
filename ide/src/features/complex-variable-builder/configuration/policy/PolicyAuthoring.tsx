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

// Left-column authoring host for a policy item. In template mode it shows the
// picker, then the chosen template's variable fields; in advanced mode it
// hands off to the existing full hand-build PolicyEditor. Every edit flows
// through the authoring controller, so the JSON column stays in sync.
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { PolicyEditor } from "../../editors";
import { TemplatePicker, TemplateVariables } from "../../editors/templates";
import type { PolicyPayload } from "../../model";
import type { TemplateAuthoring } from "./useTemplateAuthoring";

export interface PolicyAuthoringProps {
  id: string;
  name: string;
  policy: PolicyPayload;
  authoring: TemplateAuthoring;
  onPolicyChange: (next: PolicyPayload) => void;
}

export function PolicyAuthoring({ id, name, policy, authoring, onPolicyChange }: Readonly<PolicyAuthoringProps>) {
  if (authoring.mode === "advanced") {
    return <PolicyEditor id={id} name={name} policy={policy} onChange={onPolicyChange} />;
  }

  if (!authoring.template) {
    return <TemplatePicker policyType={policy.policyType} onSelect={authoring.selectTemplate} />;
  }

  return (
    <div className="precond-template-authoring">
      <div className="precond-template-chosen">
        <span className="precond-template-chosen__text">
          <span className="precond-template-chosen__eyebrow">
            <CheckCircleOutlinedIcon fontSize="inherit" />
            Active template
          </span>
          <span className="precond-template-chosen__label">{authoring.template.label}</span>
          <span className="precond-template-chosen__desc">{authoring.template.description}</span>
        </span>
        <button
          type="button"
          className="precond-template-chosen__switch"
          onClick={authoring.clearTemplate}
        >
          <SwapHorizOutlinedIcon fontSize="inherit" />
          Switch template
        </button>
      </div>
      <TemplateVariables
        template={authoring.template}
        values={authoring.variableValues}
        onVariableChange={authoring.setVariable}
      />
    </div>
  );
}
