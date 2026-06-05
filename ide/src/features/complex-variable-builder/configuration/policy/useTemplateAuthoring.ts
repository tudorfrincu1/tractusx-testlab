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

// Authoring controller for one policy item. Owns the three template-first
// transitions — switch mode, pick a template, edit a variable — and projects
// each onto the SAME PolicyPayload the form and codec consume, so the JSON
// column stays live no matter which control the operator touched.
import { useCallback, useMemo } from "react";
import {
  applyTemplate,
  defaultVariableValues,
  findTemplate,
} from "../../editors/templates";
import type { PolicyTemplate } from "../../editors/templates";
import type { PolicyAuthoringMode, PolicyPayload } from "../../model";

export interface TemplateAuthoring {
  mode: PolicyAuthoringMode;
  template: PolicyTemplate | undefined;
  variableValues: Record<string, string>;
  setMode: (mode: PolicyAuthoringMode) => void;
  selectTemplate: (templateId: string) => void;
  clearTemplate: () => void;
  setVariable: (token: string, value: string) => void;
}

export function useTemplateAuthoring(
  policy: PolicyPayload,
  onChange: (next: PolicyPayload) => void,
): TemplateAuthoring {
  const mode: PolicyAuthoringMode = policy.authoringMode ?? "template";
  const template = useMemo(
    () => (policy.templateId ? findTemplate(policy.templateId) : undefined),
    [policy.templateId],
  );
  const variableValues = policy.templateVariables ?? {};

  const setMode = useCallback(
    (next: PolicyAuthoringMode) => onChange({ ...policy, authoringMode: next }),
    [policy, onChange],
  );

  const selectTemplate = useCallback(
    (templateId: string) => {
      const picked = findTemplate(templateId);
      if (!picked) {
        return;
      }
      onChange(applyTemplate(picked, defaultVariableValues(picked), policy.version));
    },
    [policy.version, onChange],
  );

  const clearTemplate = useCallback(
    () => onChange({ ...policy, templateId: undefined, templateVariables: undefined, permissions: [] }),
    [policy, onChange],
  );

  const setVariable = useCallback(
    (token: string, value: string) => {
      if (!template) {
        return;
      }
      const nextValues = { ...defaultVariableValues(template), ...variableValues, [token]: value };
      onChange(applyTemplate(template, nextValues, policy.version));
    },
    [template, variableValues, policy.version, onChange],
  );

  return { mode, template, variableValues, setMode, selectTemplate, clearTemplate, setVariable };
}
