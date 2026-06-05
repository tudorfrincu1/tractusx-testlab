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

import { useCallback } from "react";
import type { OptionalUsagePurpose, PolicyVersion } from "../../model";
import {
  USAGE_PURPOSE_CUSTOM,
  createOptionalUsagePurpose,
  getKnownUsagePurposes,
} from "./usagePurposes";

export interface OptionalUsagePurposeSectionProps {
  version: PolicyVersion;
  purposes: OptionalUsagePurpose[];
  onChange: (next: OptionalUsagePurpose[]) => void;
}

/**
 * Lets the operator attach optional UsagePurpose constraints to a policy.
 * Mirrors the required PolicySection card UX but marks every row as optional.
 */
export function OptionalUsagePurposeSection({
  version,
  purposes,
  onChange,
}: Readonly<OptionalUsagePurposeSectionProps>) {
  const known = getKnownUsagePurposes(version);

  const handleAdd = useCallback(() => {
    onChange([...purposes, createOptionalUsagePurpose(version)]);
  }, [purposes, version, onChange]);

  const handleUpdate = useCallback(
    (id: string, patch: Partial<OptionalUsagePurpose>) => {
      onChange(purposes.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [purposes, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => onChange(purposes.filter((p) => p.id !== id)),
    [purposes, onChange],
  );

  return (
    <div className="policy-section">
      <h4 className="policy-section__title">
        Optional usage purposes
        <span className="policy-section__optional-tag">optional</span>
      </h4>
      <div className="policy-section__rows">
        {purposes.length === 0 && (
          <div className="policy-section__empty">No optional usage purposes</div>
        )}
        {purposes.map((purpose) => (
          <UsagePurposeRow
            key={purpose.id}
            purpose={purpose}
            known={known}
            onUpdate={(patch) => handleUpdate(purpose.id, patch)}
            onRemove={() => handleRemove(purpose.id)}
          />
        ))}
      </div>
      <button className="policy-section__add-btn" onClick={handleAdd}>
        + Add optional usage purpose
      </button>
    </div>
  );
}

interface UsagePurposeRowProps {
  purpose: OptionalUsagePurpose;
  known: readonly string[];
  onUpdate: (patch: Partial<OptionalUsagePurpose>) => void;
  onRemove: () => void;
}

function UsagePurposeRow({ purpose, known, onUpdate, onRemove }: Readonly<UsagePurposeRowProps>) {
  const handleSelect = (value: string) => {
    if (value === USAGE_PURPOSE_CUSTOM) {
      onUpdate({ custom: true, value: "" });
    } else {
      onUpdate({ custom: false, value });
    }
  };

  return (
    <div className="constraint-row">
      <span className="constraint-row__locked">UsagePurpose</span>
      <span className="constraint-row__locked">isAnyOf</span>
      <span className="constraint-row__optional-badge">optional</span>
      {purpose.custom ? (
        <input
          className="constraint-row__input"
          value={purpose.value}
          placeholder="Custom purpose..."
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      ) : (
        <select
          className="constraint-row__select"
          value={purpose.value}
          onChange={(e) => handleSelect(e.target.value)}
        >
          {known.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
          <option value={USAGE_PURPOSE_CUSTOM}>Custom...</option>
        </select>
      )}
      <button
        className="constraint-row__delete-btn"
        onClick={onRemove}
        title="Remove optional usage purpose"
      >
        x
      </button>
    </div>
  );
}
