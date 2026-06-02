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

import { CATEGORY_CTA_LABEL, CATEGORY_META, CATEGORY_ORDER } from "./categories";
import type { PocPrecondition, PreconditionCategory } from "./types";

export interface CategoryCardsProps {
  items: PocPrecondition[];
  onSelect: (category: PreconditionCategory) => void;
}

/**
 * Level 1 (landing): one tile per user-facing category. The tile itself is not
 * clickable — only the bottom CTA button navigates, removing card-vs-button
 * ambiguity.
 */
export function CategoryCards({ items, onSelect }: Readonly<CategoryCardsProps>) {
  return (
    <div className="precond-landing">
      <header className="precond-landing__head">
        <h2 className="precond-landing__question">What do you need to set up?</h2>
        <p className="precond-landing__sub">
          Pick a category to review and edit its preconditions.
        </p>
      </header>
      <div className="precond-landing__grid">
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const count = items.filter((item) => item.category === category).length;
          return (
            <article key={category} className="precond-card precond-card--static">
              <span className={`precond-card__icon precond-card__icon--${meta.tone}`}>
                <meta.Icon fontSize="inherit" />
              </span>
              <span className="precond-card__body">
                <span className="precond-card__label">{meta.tileLabel}</span>
                <span className="precond-card__desc">{meta.description}</span>
              </span>
              <span className={`precond-card__count precond-card__count--${meta.tone}`}>
                {count} configured
              </span>
              <button
                type="button"
                className={`precond-card__cta precond-card__cta--${meta.tone}`}
                onClick={() => onSelect(category)}
              >
                {CATEGORY_CTA_LABEL}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

