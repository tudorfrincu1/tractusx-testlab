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
import type { PreconditionDefinition } from "../../models/schema";

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
}: PreconditionsListProps) {
  const filtered = useMemo(() => {
    if (!searchQuery) return preconditions.map((p, i) => ({ def: p, index: i }));
    const q = searchQuery.toLowerCase();
    return preconditions
      .map((p, i) => ({ def: p, index: i }))
      .filter(({ def }) => def.description.toLowerCase().includes(q) || def.type.includes(q));
  }, [preconditions, searchQuery]);

  const policies = filtered.filter(({ def }) => def.type === "precondition_policy_config");
  const assets = filtered.filter(({ def }) => def.type === "precondition_asset_config");
  const contracts = filtered.filter(({ def }) => def.type === "precondition_contract_def_config");

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
        <div className="preconditions-list__group-header">
          Policies ({policies.length})
        </div>
        {policies.map(({ def, index }) => (
          <div
            key={index}
            className={`preconditions-list__item ${index === activeIndex ? "preconditions-list__item--active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <div className="preconditions-list__icon preconditions-list__icon--policy">P</div>
            <div className="preconditions-list__item-content">
              <div className="preconditions-list__item-id">
                {def.description.slice(0, 40) || `Policy ${index + 1}`}
              </div>
              <div className="preconditions-list__item-meta">
                <span className={`preconditions-list__badge preconditions-list__badge--${def.type === "precondition_policy_config" ? def.params.policy_type : "access"}`}>
                  {def.type === "precondition_policy_config" ? def.params.policy_type : "policy"}
                </span>
                <span className="preconditions-list__item-desc">
                  {def.type === "precondition_policy_config" ? def.params.version : ""}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="preconditions-list__group-header">Assets ({assets.length})</div>
        {assets.map(({ def, index }) => (
          <div
            key={index}
            className={`preconditions-list__item ${index === activeIndex ? "preconditions-list__item--active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <div className="preconditions-list__icon preconditions-list__icon--asset">A</div>
            <div className="preconditions-list__item-content">
              <div className="preconditions-list__item-id">
                {def.description.slice(0, 40) || `Asset ${index + 1}`}
              </div>
              <div className="preconditions-list__item-meta">
                <span className="preconditions-list__badge preconditions-list__badge--access">asset</span>
                <span className="preconditions-list__item-desc">
                  {def.params.version}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="preconditions-list__group-header">Contract Definitions ({contracts.length})</div>
        {contracts.map(({ def, index }) => (
          <div
            key={index}
            className={`preconditions-list__item ${index === activeIndex ? "preconditions-list__item--active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <div className="preconditions-list__icon preconditions-list__icon--contract">CD</div>
            <div className="preconditions-list__item-content">
              <div className="preconditions-list__item-id">
                {def.description.slice(0, 40) || `Contract Def ${index + 1}`}
              </div>
              <div className="preconditions-list__item-meta">
                <span className="preconditions-list__badge preconditions-list__badge--usage">contract</span>
                <span className="preconditions-list__item-desc">
                  {def.params.version}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
