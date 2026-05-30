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

import type { PerformanceEntry } from "../types";

const MAX_DURATION_MS = 2500;

const MOCK_ENTRIES: readonly PerformanceEntry[] = [
  { label: "create_asset", durationMs: 142, durationLabel: "142ms" },
  { label: "create_policy", durationMs: 89, durationLabel: "89ms" },
  { label: "create_contract_definition", durationMs: 104, durationLabel: "104ms" },
  { label: "request_catalog", durationMs: 312, durationLabel: "312ms" },
  { label: "negotiate_contract", durationMs: 2100, durationLabel: "2.1s" },
  { label: "delete_asset (teardown)", durationMs: 56, durationLabel: "56ms" },
] as const;

function barSpeedClass(ms: number): string {
  if (ms < 200) return "perf-step__bar-fill--fast";
  if (ms < 500) return "perf-step__bar-fill--medium";
  return "perf-step__bar-fill--slow";
}

export function PerformanceTab() {
  return (
    <div className="performance-tab">
      {MOCK_ENTRIES.map((entry) => {
        const widthPct = Math.min(100, (entry.durationMs / MAX_DURATION_MS) * 100);
        return (
          <div key={entry.label} className="perf-step">
            <span className="perf-step__label">{entry.label}</span>
            <div className="perf-step__bar-track">
              <div
                className={`perf-step__bar-fill ${barSpeedClass(entry.durationMs)}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="perf-step__time">{entry.durationLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
