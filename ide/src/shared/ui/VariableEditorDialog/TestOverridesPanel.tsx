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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useState, useCallback, useMemo } from "react";
import { useProjectStore } from "@/store/project/useProjectStore";
import { isTestRef } from "@/models/schema";
import type { TestRef, TckDefinition } from "@/models/schema";

export function TestOverridesPanel() {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);
  const updateField = useProjectStore((s) => s.updateTckField);

  /** All variable names available for overrides (TCK-level + per-test). */
  const allVarNames = useMemo(() => {
    const names = new Set<string>();
    for (const key of Object.keys(tck.variables ?? {})) names.add(key);
    for (const script of tests.values()) {
      for (const key of Object.keys(script.variables ?? {})) names.add(key);
    }
    return [...names].sort();
  }, [tck.variables, tests]);

  const updateTestWith = useCallback(
    (testName: string, varName: string, value: string) => {
      const updatedTests = tck.tests.map((entry) => {
        if (isTestRef(entry) && entry.test === testName) {
          const currentWith = { ...(entry.with ?? {}) };
          if (value) {
            currentWith[varName] = value;
          } else {
            delete currentWith[varName];
          }
          return { ...entry, with: Object.keys(currentWith).length > 0 ? currentWith : undefined };
        }
        return entry;
      });
      updateField("tests", updatedTests);
    },
    [tck.tests, updateField],
  );

  if (testOrder.length === 0) {
    return (
      <div>
        <h4 className="var-dialog__section-title">Per-Test Overrides</h4>
        <p className="overrides__no-tests">No tests in this TCK.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="var-dialog__section-title">Per-Test Overrides</h4>
      <div className="overrides__list">
        {testOrder.map((name) => (
          <TestOverrideSection
            key={name}
            testName={name}
            tck={tck}
            varNames={allVarNames}
            onUpdateWith={updateTestWith}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Collapsible section per test ───────────────────────────────────────── */

function TestOverrideSection({ testName, tck, varNames, onUpdateWith }: {
  testName: string;
  tck: TckDefinition;
  varNames: string[];
  onUpdateWith: (testName: string, varName: string, value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const ref = tck.tests.find(
    (t) => isTestRef(t) && t.test === testName,
  ) as TestRef | undefined;

  const currentWith = ref?.with ?? {};
  const overrideCount = Object.keys(currentWith).length;

  if (varNames.length === 0) return null;

  return (
    <div className="overrides__section">
      <button
        className="overrides__header"
        onClick={() => setIsOpen((p) => !p)}
      >
        <span className={`overrides__chevron ${isOpen ? "overrides__chevron--open" : ""}`}>
          ▶
        </span>
        <span>{testName}</span>
        {overrideCount > 0 && (
          <span className="metadata-summary__badge metadata-summary__badge--version">
            {overrideCount} override{overrideCount !== 1 ? "s" : ""}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="overrides__body">
          {varNames.map((varName) => (
            <div key={varName} className="overrides__row">
              <span className="overrides__var-name">@{varName}</span>
              <input
                className="overrides__var-input"
                type="text"
                placeholder="default"
                value={String(currentWith[varName] ?? "")}
                onChange={(e) => onUpdateWith(testName, varName, e.target.value)}
              />
            </div>
          ))}
          {varNames.length === 0 && (
            <p className="overrides__empty">No variables to override.</p>
          )}
        </div>
      )}
    </div>
  );
}
