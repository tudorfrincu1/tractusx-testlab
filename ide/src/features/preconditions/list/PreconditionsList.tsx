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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useMemo } from "react";
import type { PreconditionDefinition } from "@/models/schema";

type PreconditionCategory = "generated" | "provided" | "inputs" | "checks";

function categorizePrecondition(uses: string): PreconditionCategory {
  if (uses === "precondition/generate") return "generated";
  if (uses === "precondition/provide") return "provided";
  if (uses === "precondition/input") return "inputs";
  return "checks";
}

const CATEGORY_META: Record<PreconditionCategory, { label: string; letter: string; cssClass: string }> = {
  generated: { label: "GENERATED", letter: "G", cssClass: "generated" },
  provided: { label: "PROVIDED", letter: "P", cssClass: "provided" },
  inputs: { label: "INPUTS", letter: "I", cssClass: "input" },
  checks: { label: "CHECKS", letter: "C", cssClass: "check" },
} as const;

const CATEGORY_ORDER: PreconditionCategory[] = ["generated", "provided", "inputs", "checks"];

export interface PreconditionsListProps {
  preconditions: PreconditionDefinition[];
  activeIndex: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (index: number) => void;
}

export function PreconditionsList({
  preconditions,
  activeIndex,
  searchQuery,
  onSearchChange,
  onSelect,
}: Readonly<PreconditionsListProps>) {
  const filtered = useMemo(() => {
    if (!searchQuery) return preconditions.map((p, i) => ({ def: p, index: i }));
    const q = searchQuery.toLowerCase();
    return preconditions
      .map((p, i) => ({ def: p, index: i }))
      .filter(({ def }) => def.name.toLowerCase().includes(q) || def.id.toLowerCase().includes(q));
  }, [preconditions, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<PreconditionCategory, { def: PreconditionDefinition; index: number }[]> = {
      generated: [],
      provided: [],
      inputs: [],
      checks: [],
    };
    for (const item of filtered) {
      const category = categorizePrecondition(item.def.uses);
      groups[category].push(item);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="preconditions-left">
      <div className="preconditions-search">
        <input
          type="text"
          className="preconditions-search__input"
          placeholder="Search preconditions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="preconditions-list">
        {CATEGORY_ORDER.map((category) => {
          const items = grouped[category];
          const meta = CATEGORY_META[category];
          return (
            <div key={category}>
              <div className="preconditions-list__group-header">
                {meta.label} ({items.length})
              </div>
              {items.map(({ def, index }) => (
                <button
                  type="button"
                  key={index}
                  className={`preconditions-list__item ${index === activeIndex ? "preconditions-list__item--active" : ""}`}
                  onClick={() => onSelect(index)}
                >
                  <div className={`preconditions-list__icon preconditions-list__icon--${meta.cssClass}`}>
                    {meta.letter}
                  </div>
                  <div className="preconditions-list__item-content">
                    <div className="preconditions-list__item-id">
                      {def.name}
                    </div>
                    <div className="preconditions-list__item-meta">
                      <span className={`preconditions-list__badge preconditions-list__badge--${meta.cssClass}`}>
                        {meta.label.toLowerCase()}
                      </span>
                      <span className="preconditions-list__item-desc">
                        {def.id}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
