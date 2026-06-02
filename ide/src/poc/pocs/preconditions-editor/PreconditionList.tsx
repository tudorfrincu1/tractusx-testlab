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

import { useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import { groupCategorySubTypes } from "./categories";
import type { PocPrecondition, PreconditionCategory, PreconditionSubType } from "./types";

export interface PreconditionListProps {
  category: PreconditionCategory;
  items: PocPrecondition[];
  query: string;
  onSelect: (id: string) => void;
  onAdd: (subType: PreconditionSubType) => void;
  /** Optional scope: only these sub-type sections are shown (e.g. per target). */
  subTypes?: readonly PreconditionSubType[];
}

/**
 * Level 3 (artifact list): every sub-type in scope renders as a predefined
 * section — header, its items, and an inline "+ Add <sub-type>" button — even
 * when empty, so operators discover what they can add. When `subTypes` is an
 * empty list (e.g. a placeholder target) a friendly empty state is shown.
 */
export function PreconditionList({
  category,
  items,
  query,
  onSelect,
  onAdd,
  subTypes,
}: Readonly<PreconditionListProps>) {
  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const inCategory = items.filter((item) => {
      if (item.category !== category) return false;
      if (subTypes && !subTypes.includes(item.subType)) return false;
      if (!term) return true;
      return `${item.id} ${item.name} ${item.description}`.toLowerCase().includes(term);
    });
    return groupCategorySubTypes(inCategory, category, subTypes);
  }, [items, category, query, subTypes]);

  if (subTypes?.length === 0) {
    return (
      <div className="precond-catview precond-catview--empty">
        <p className="precond-catview__empty">
          Nothing to configure here yet — this target is reserved for a future release.
        </p>
      </div>
    );
  }

  return (
    <div className="precond-catview">
      {groups.map((group) => (
        <section key={group.subType} className="precond-catview__group">
          <h3 className="precond-catview__group-title">
            <span className={`precond-catview__group-icon precond-catview__group-icon--${group.meta.tone}`}>
              <group.meta.Icon fontSize="inherit" />
            </span>
            {group.meta.label}
            <span className="precond-catview__group-count">{group.items.length}</span>
          </h3>
          <div className="precond-catview__rows">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="precond-catview__row"
                onClick={() => onSelect(item.id)}
              >
                <span className="precond-catview__row-text">
                  <span className="precond-catview__row-name">{item.name}</span>
                  <span className="precond-catview__row-desc">{item.description}</span>
                </span>
                <span className="precond-catview__row-id">{item.id}</span>
              </button>
            ))}
            <button
              type="button"
              className="precond-catview__add"
              onClick={() => onAdd(group.subType)}
            >
              <AddIcon fontSize="small" />
              Add {group.meta.addLabel}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
