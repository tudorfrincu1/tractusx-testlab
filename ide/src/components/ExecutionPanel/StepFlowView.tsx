/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

import type { ExecutionStep, StepStatus } from "../../models/execution";
import "./StepFlowView.css";

/* ── Status icon map ────────────────────────────────────────────────────── */

const STATUS_ICONS: Record<StepStatus, string> = {
  pending: "⏳",
  running: "▶",
  passed: "✓",
  failed: "✗",
  skipped: "⏭",
  waiting: "⏳",
} as const;

/* ── Props ──────────────────────────────────────────────────────────────── */

export interface StepFlowViewProps {
  readonly steps: readonly ExecutionStep[];
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function StepFlowView({ steps }: StepFlowViewProps) {
  if (steps.length === 0) {
    return (
      <div className="execution-panel__empty">
        No steps in this phase yet
      </div>
    );
  }

  return (
    <div className="step-flow">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const cardClass = `step-flow__card step-flow__card--${step.status}`;
        const connectorClass = `step-flow__connector step-flow__connector--${step.status}`;

        return (
          <div className="step-flow__item" key={step.index}>
            <div className={cardClass} title={step.name}>
              {step.error && <span className="step-flow__error-dot" />}
              <div className="step-flow__icon">
                {STATUS_ICONS[step.status]}
              </div>
              <div className="step-flow__name">{step.name}</div>
            </div>
            {!isLast && <div className={connectorClass} />}
          </div>
        );
      })}
    </div>
  );
}
