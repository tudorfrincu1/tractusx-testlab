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

import { useState } from "react";
import { CategoryCards } from "./CategoryCards";
import { PreconditionList } from "./PreconditionList";
import { CategoryDetail } from "./CategoryDetail";
import { RegisterTargetGrid } from "./RegisterTargetGrid";
import { GeneratorCatalog } from "./GeneratorCatalog";
import { GeneratorDetail } from "./GeneratorDetail";
import { InputTemplateGrid } from "./InputTemplateGrid";
import { InputTemplatePreview } from "./InputTemplatePreview";
import { Topbar } from "./Topbar";
import { TARGET_META } from "./registerTargets";
import { subTypesForTarget } from "./categories";
import { landingEntryView, parentView, type PocView } from "./navigation";
import { createPrecondition } from "./preconditionFactory";
import { MOCK_PRECONDITIONS } from "./mockData";
import type { PocPrecondition, PolicyPayload, PreconditionSubType } from "./types";
import "./preconditions-editor.scss";

/**
 * POC: a modern, schema-aware precondition editor. Uniform depth across all
 * categories — Landing (L1) → sub-card grid (L2) → detail/list (L3) — with a
 * back affordance at every level. All state is local to the POC.
 */
export function PreconditionEditorPoc() {
  const [items, setItems] = useState<PocPrecondition[]>(MOCK_PRECONDITIONS);
  const [view, setView] = useState<PocView>({ level: "landing" });
  const [query, setQuery] = useState("");

  const activeId = view.level === "register-detail" ? view.id : null;
  const active = activeId ? (items.find((item) => item.id === activeId) ?? null) : null;

  const handlePolicyChange = (next: PolicyPayload) => {
    if (view.level !== "register-detail") return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === view.id && item.category === "register" && item.policy
          ? { ...item, policy: next }
          : item,
      ),
    );
  };

  const handleBack = () => {
    setQuery("");
    setView(parentView(view));
  };

  const handleAdd = (subType: PreconditionSubType) => {
    if (view.level !== "register-list") return;
    const created = createPrecondition(subType);
    setItems((prev) => [...prev, created]);
    setView({ level: "register-detail", target: view.target, id: created.id });
  };

  return (
    <div className="precond-poc">
      <Topbar view={view} active={active} onBack={handleBack} />
      <div className="precond-poc__main">
        {view.level === "landing" && (
          <CategoryCards
            items={items}
            onSelect={(category) => setView(landingEntryView(category))}
          />
        )}

        {view.level === "register-targets" && (
          <RegisterTargetGrid
            items={items}
            onSelect={(target) => setView({ level: "register-list", target })}
          />
        )}

        {view.level === "register-list" && (
          <section className="precond-poc__category">
            <div className="precond-poc__search">
              <input
                className="precond-poc__search-input"
                placeholder={`Search ${TARGET_META[view.target].label} artifacts…`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <PreconditionList
              category="register"
              items={items}
              query={query}
              subTypes={subTypesForTarget(view.target)}
              onSelect={(id) => setView({ level: "register-detail", target: view.target, id })}
              onAdd={handleAdd}
            />
          </section>
        )}

        {view.level === "register-detail" && active && (
          <section className="precond-poc__stage">
            <CategoryDetail precondition={active} onPolicyChange={handlePolicyChange} />
          </section>
        )}

        {view.level === "generate-catalog" && (
          <GeneratorCatalog
            onSelect={(generatorId) => setView({ level: "generate-detail", generatorId })}
          />
        )}

        {view.level === "generate-detail" && (
          <section className="precond-poc__stage">
            <GeneratorDetail generatorId={view.generatorId} />
          </section>
        )}

        {view.level === "input-templates" && (
          <InputTemplateGrid
            onSelect={(templateId) => setView({ level: "input-preview", templateId })}
          />
        )}

        {view.level === "input-preview" && (
          <section className="precond-poc__stage">
            <InputTemplatePreview templateId={view.templateId} />
          </section>
        )}
      </div>
    </div>
  );
}

