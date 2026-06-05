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

// The template picker: one card per ready-made policy whose kind matches the
// locked policy type of the item. Reuses the POC card visual language so it
// reads as part of the same surface; selecting a card adopts that template.
import type { PolicyType } from "../../../model";
import { templatesForKind } from "../catalog";

export interface TemplatePickerProps {
  policyType: PolicyType;
  onSelect: (templateId: string) => void;
}

export function TemplatePicker({ policyType, onSelect }: Readonly<TemplatePickerProps>) {
  const templates = templatesForKind(policyType);

  return (
    <div className="precond-template-picker">
      <p className="precond-template-picker__lead">
        Start from a ready-made policy, then fill in the values it needs.
      </p>
      <div className="precond-template-picker__grid">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="precond-template-card"
            onClick={() => onSelect(template.id)}
          >
            <span className="precond-template-card__label">{template.label}</span>
            <span className="precond-template-card__desc">{template.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
