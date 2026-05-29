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

import { useState, useRef, useEffect } from "react";
import type { ExecutionStep, StepStatus } from "@/models/execution";
import "./StepCard.css";

/* ── Status rendering ───────────────────────────────────────────────────── */

const STATUS_ICONS: Record<StepStatus, string> = {
  pending: "⏳",
  running: "",
  passed: "✅",
  failed: "❌",
  skipped: "⏭",
  waiting: "⏸",
} as const;

function formatDuration(seconds: number): string {
  if (seconds < 0.01) return "<0.01s";
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(1)}s`;
}

function humanizeStepType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Component ──────────────────────────────────────────────────────────── */

export interface StepCardProps {
  step: ExecutionStep;
}

export function StepCard({ step }: StepCardProps) {
  const [showError, setShowError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when this step starts running
  useEffect(() => {
    if (step.status === "running" && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [step.status]);

  const isRunning = step.status === "running";
  const cardClass = `step-card${isRunning ? " step-card--running" : ""}`;
  const statusClass = `step-card__status--${step.status}`;

  return (
    <div ref={cardRef} className={cardClass}>
      <span className={`step-card__status-icon ${statusClass}`}>
        {isRunning ? <span className="step-card__spinner" /> : STATUS_ICONS[step.status]}
      </span>
      <span className="step-card__name">{step.name}</span>
      <span className="step-card__type">{humanizeStepType(step.type)}</span>
      {step.duration_s != null && (
        <span className="step-card__duration">{formatDuration(step.duration_s)}</span>
      )}
      {step.error && (
        <div className="step-card__error-wrapper">
          <button
            className="step-card__error-toggle"
            onClick={() => setShowError((v) => !v)}
          >
            {showError ? "Hide error" : "Show error"}
          </button>
          {showError && (
            <pre className="step-card__error-detail">{step.error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
