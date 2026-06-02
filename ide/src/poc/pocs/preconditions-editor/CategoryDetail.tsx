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

import { CATEGORY_META } from "./categories";
import { CheckEditor, GenerateEditor, InputEditor, PolicyEditor, TemplateEditor } from "./editors";
import type { PocPrecondition, PolicyPayload } from "./types";

export interface CategoryDetailProps {
  precondition: PocPrecondition;
  onPolicyChange: (next: PolicyPayload) => void;
}

/** Renders the category-aware header plus the matching editor body. */
export function CategoryDetail({ precondition, onPolicyChange }: Readonly<CategoryDetailProps>) {
  const meta = CATEGORY_META[precondition.category];

  return (
    <article className="precond-detail">
      <header className="precond-detail__header">
        <input className="precond-detail__id" value={precondition.id} readOnly />
        <span className={`precond-detail__badge precond-detail__badge--${meta.tone}`}>
          <meta.Icon fontSize="inherit" />
          {meta.label}
        </span>
        <span className="precond-detail__direction">{meta.direction}</span>
      </header>
      <p className="precond-detail__desc">{precondition.description}</p>
      {meta.actionLabel && (
        <div className={`precond-detail__action precond-detail__action--${meta.tone}`}>
          <meta.Icon fontSize="inherit" />
          {meta.actionLabel}
        </div>
      )}
      <div className="precond-detail__schema-note">
        <meta.Icon fontSize="inherit" />
        {meta.description}
      </div>

      <EditorBody precondition={precondition} onPolicyChange={onPolicyChange} />
    </article>
  );
}

function EditorBody({ precondition, onPolicyChange }: Readonly<CategoryDetailProps>) {
  switch (precondition.category) {
    case "register":
      if (precondition.policy) {
        return (
          <PolicyEditor id={precondition.id} policy={precondition.policy} onChange={onPolicyChange} />
        );
      }
      if (precondition.provide) {
        return <TemplateEditor provide={precondition.provide} />;
      }
      return null;
    case "generate":
      return <GenerateEditor generate={precondition.generate} />;
    case "input":
      return <InputEditor input={precondition.input} />;
    case "check":
      return <CheckEditor check={precondition.check} />;
  }
}
