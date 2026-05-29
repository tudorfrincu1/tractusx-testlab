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

import type { ConsoleEntry } from "../types";
import "./ConsoleTab.css";

const MOCK_ENTRIES: readonly ConsoleEntry[] = [
  { time: "14:32:01", level: "info", message: "Compilation started for ccm-test-01.yaml" },
  { time: "14:32:01", level: "info", message: "Resolving step dependencies..." },
  { time: "14:32:02", level: "warn", message: "Variable @auto_offer_id referenced before assignment in step negotiate_contract" },
  { time: "14:32:02", level: "info", message: "Compilation completed — 3 steps, 1 warning" },
  { time: "14:32:05", level: "info", message: "Execution started: ccm-test-01 [consumer-a ↔ provider-b]" },
  { time: "14:32:06", level: "debug", message: "POST /management/v3/assets — 201 Created (142ms)" },
  { time: "14:32:08", level: "info", message: "Step create_asset completed — asset_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
  { time: "14:32:09", level: "error", message: "Step negotiate_contract failed — 409 Conflict: contract already exists for offer" },
  { time: "14:32:09", level: "info", message: "Executing teardown: delete_asset" },
  { time: "14:32:10", level: "info", message: "Execution finished — 1 passed, 1 failed, 1 skipped (5.2s)" },
] as const;

const LEVEL_LABELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERR",
  debug: "DEBG",
} as const;

export function ConsoleTab() {
  return (
    <div className="console-tab">
      {MOCK_ENTRIES.map((entry) => (
        <div key={`${entry.time}-${entry.message}`} className="console-line">
          <span className="console-line__time">{entry.time}</span>
          <span className={`console-line__level console-line__level--${entry.level}`}>
            {LEVEL_LABELS[entry.level]}
          </span>
          <span className="console-line__msg">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}
