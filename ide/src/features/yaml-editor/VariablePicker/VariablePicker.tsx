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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useCallback, useEffect, useState } from "react";
import { useVariableScopes } from "./useVariableScopes";
import type { VariableEntry, StepWithReturns } from "./useVariableScopes";

type Scope = "env" | "metadata" | "preconditions" | "steps" | "setup";

const SCOPE_TABS: { id: Scope; label: string }[] = [
  { id: "env", label: "Env" },
  { id: "metadata", label: "Metadata" },
  { id: "preconditions", label: "Preconditions" },
  { id: "steps", label: "Steps" },
  { id: "setup", label: "Setup" },
] as const;

export interface VariablePickerProps {
  readonly onInsert: (expression: string) => void;
  readonly onClose: () => void;
}

export function VariablePicker({ onInsert, onClose }: VariablePickerProps) {
  const scopes = useVariableScopes();
  const [activeScope, setActiveScope] = useState<Scope>("env");
  const [selectedTest, setSelectedTest] = useState("");
  const [selectedStep, setSelectedStep] = useState("");
  const [selectedExpression, setSelectedExpression] = useState("");

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleSelect = useCallback(
    (entry: VariableEntry) => {
      setSelectedExpression(entry.expression);
    },
    [],
  );

  const handleAdd = useCallback(() => {
    if (selectedExpression) {
      onInsert(selectedExpression);
      onClose();
    }
  }, [selectedExpression, onInsert, onClose]);

  const handleScopeChange = useCallback((scope: Scope) => {
    setActiveScope(scope);
    setSelectedTest("");
    setSelectedStep("");
    setSelectedExpression("");
  }, []);

  const renderFlatList = (items: VariableEntry[]) => {
    if (items.length === 0) {
      return <div className="variable-picker__empty">No variables available</div>;
    }
    return (
      <ul className="variable-picker__list">
        {items.map((item) => (
          <li key={item.expression} className="variable-picker__item">
            <button
              className={`variable-picker__item-btn${selectedExpression === item.expression ? " variable-picker__item-btn--selected" : ""}`}
              onClick={() => handleSelect(item)}
              type="button"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderStepScope = (mode: "steps" | "setup") => {
    const tests = scopes.testSteps;
    if (tests.length === 0) {
      return <div className="variable-picker__empty">No tests with returns</div>;
    }

    const currentTest = tests.find((t) => t.testName === selectedTest);
    const stepsToShow = mode === "steps" ? currentTest?.steps : currentTest?.setupSteps;
    const stepsForTest: StepWithReturns[] = stepsToShow ?? [];
    const currentStepData = stepsForTest.find((s) => s.stepId === selectedStep);

    return (
      <>
        <select
          className="variable-picker__dropdown"
          value={selectedTest}
          onChange={(e) => { setSelectedTest(e.target.value); setSelectedStep(""); setSelectedExpression(""); }}
          aria-label="Select test"
        >
          <option value="">— Select test —</option>
          {tests.map((t) => (
            <option key={t.testName} value={t.testName}>{t.testName}</option>
          ))}
        </select>
        {selectedTest && stepsForTest.length > 0 && (
          <select
            className="variable-picker__dropdown"
            value={selectedStep}
            onChange={(e) => { setSelectedStep(e.target.value); setSelectedExpression(""); }}
            aria-label="Select step"
          >
            <option value="">— Select step —</option>
            {stepsForTest.map((s) => (
              <option key={s.stepId} value={s.stepId}>{s.stepName}</option>
            ))}
          </select>
        )}
        {selectedTest && stepsForTest.length === 0 && (
          <div className="variable-picker__empty">
            No {mode === "setup" ? "setup " : ""}steps with returns
          </div>
        )}
        {currentStepData && (
          <ul className="variable-picker__list">
            {currentStepData.returns.map((ret) => {
              const prefix = mode === "setup" ? "setup" : "steps";
              const expr = `\${{ ${prefix}.${currentStepData.stepId}.${ret} }}`;
              return (
                <li key={ret} className="variable-picker__item">
                  <button
                    className={`variable-picker__item-btn${selectedExpression === expr ? " variable-picker__item-btn--selected" : ""}`}
                    onClick={() => setSelectedExpression(expr)}
                    type="button"
                  >
                    {prefix}.{currentStepData.stepId}.{ret}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  };

  const renderContent = () => {
    switch (activeScope) {
      case "env": return renderFlatList(scopes.env);
      case "metadata": return renderFlatList(scopes.metadata);
      case "preconditions": return renderFlatList(scopes.preconditions);
      case "steps": return renderStepScope("steps");
      case "setup": return renderStepScope("setup");
    }
  };

  return (
    <div className="variable-picker__overlay" onMouseDown={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Insert Variable">
      <div className="variable-picker">
        <div className="variable-picker__header">
          <span className="variable-picker__title">Insert Variable</span>
          <button className="variable-picker__close" onClick={onClose} type="button" aria-label="Close variable picker" title="Close variable picker">×</button>
        </div>
        <div className="variable-picker__tabs">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`variable-picker__tab${activeScope === tab.id ? " variable-picker__tab--active" : ""}`}
              onClick={() => handleScopeChange(tab.id)}
              aria-label={`Show ${tab.label} variables`}
              aria-pressed={activeScope === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="variable-picker__content">
          {renderContent()}
        </div>
        <div className="variable-picker__footer">
          <button
            className={`variable-picker__add-btn${selectedExpression ? " variable-picker__add-btn--active" : ""}`}
            disabled={!selectedExpression}
            onClick={handleAdd}
            type="button"
          >
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );
}
