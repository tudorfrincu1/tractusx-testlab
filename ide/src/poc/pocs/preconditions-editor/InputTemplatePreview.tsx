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

import { findInputTemplate } from "./inputTemplates";

export interface InputTemplatePreviewProps {
  templateId: string;
}

/** L3 for Input: a read-only live preview of the form the operator will fill. */
export function InputTemplatePreview({ templateId }: Readonly<InputTemplatePreviewProps>) {
  const template = findInputTemplate(templateId);
  if (!template) {
    return <p className="precond-poc__empty">Unknown form template.</p>;
  }

  return (
    <article className="precond-detail">
      <header className="precond-detail__header">
        <span className="precond-detail__id-static">
          <template.Icon fontSize="inherit" />
          {template.label}
        </span>
        <span className="precond-detail__badge precond-detail__badge--input">
          {template.fields.length} fields
        </span>
      </header>
      <p className="precond-detail__desc">{template.description}</p>

      <div className="precond-editor__group">
        <span className="precond-editor__field-label">Form preview (operator fills this in)</span>
        <div className="precond-form">
          {template.fields.map((field) => (
            <div key={field.key} className="precond-form__field">
              <span className="precond-form__label">
                {field.label}
                <span className="precond-form__class">{field.fieldClass}</span>
              </span>
              <input
                className="precond-editor__input"
                placeholder={field.placeholder}
                readOnly
                aria-label={field.label}
              />
            </div>
          ))}
        </div>
        <p className="precond-editor__hint">
          Read-only preview — these fields appear to the operator before execution.
        </p>
      </div>
    </article>
  );
}
