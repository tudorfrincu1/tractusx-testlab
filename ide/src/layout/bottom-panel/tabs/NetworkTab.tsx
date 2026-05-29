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

import { useState } from "react";
import { useEditorStore } from "@/store/editor/useEditorStore";
import type { NetworkEntry, NetworkFilter } from "../types";
import "./NetworkTab.css";

const MOCK_ENTRIES: readonly NetworkEntry[] = [
  {
    id: "n1", type: "ext", direction: "outbound", method: "POST",
    url: "/management/v3/assets", status: 201, duration: "142ms",
    requestHeaders: { "Content-Type": "application/json", "Authorization": "Bearer ****" },
    responseHeaders: { "Content-Type": "application/json", "X-Request-Id": "req-abc-123" },
    requestBody: JSON.stringify({ "@id": "asset-1", properties: { type: "data.core.digitalTwin" } }, null, 2),
    responseBody: JSON.stringify({ "@id": "asset-1", createdAt: 1716825600000 }, null, 2),
  },
  {
    id: "n2", type: "ext", direction: "outbound", method: "POST",
    url: "/management/v3/contractnegotiations", status: 409, duration: "67ms",
    requestHeaders: { "Content-Type": "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    requestBody: JSON.stringify({ connectorId: "provider-b", offerId: "offer-1" }, null, 2),
    responseBody: JSON.stringify({ error: "Contract already exists for offer" }, null, 2),
  },
  {
    id: "n3", type: "int", direction: "outbound", method: "POST",
    url: "/compile", status: 200, duration: "34ms",
    requestHeaders: { "Content-Type": "application/yaml" },
    responseHeaders: { "Content-Type": "application/json" },
    requestBody: "name: ccm-test-01\nversion: \"1.0\"",
    responseBody: JSON.stringify({ success: true, steps: 3 }, null, 2),
  },
  {
    id: "n4", type: "ext", direction: "inbound", method: "GET",
    url: "/mock/dtr/shell-descriptors", status: 200, duration: "18ms",
    requestHeaders: { "Accept": "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: JSON.stringify({ result: [] }, null, 2),
  },
  {
    id: "n5", type: "ext", direction: "outbound", method: "GET",
    url: "/management/v3/transferprocesses/tp-99f/state", status: 200, duration: "51ms",
    requestHeaders: { "Authorization": "Bearer ****" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: JSON.stringify({ state: "COMPLETED" }, null, 2),
  },
] as const;

const FILTER_BUTTONS: readonly { value: NetworkFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "int", label: "Internal" },
  { value: "ext", label: "External" },
] as const;

export interface NetworkTabProps {
  readonly selectedEntryId?: string | null;
}

export function NetworkTab({ selectedEntryId }: NetworkTabProps) {
  const [filter, setFilter] = useState<NetworkFilter>("all");
  const setNetworkDetailEntry = useEditorStore((s) => s.setNetworkDetailEntry);

  const filtered = filter === "all"
    ? MOCK_ENTRIES
    : MOCK_ENTRIES.filter((e) => e.type === filter);

  const handleRowClick = (entry: NetworkEntry) => {
    setNetworkDetailEntry(entry);
  };

  const statusClass = (status: number) => {
    if (status >= 400) return "network-status--error";
    if (status >= 300) return "network-status--redirect";
    return "network-status--ok";
  };

  return (
    <div className="network-tab">
      <div className="network-filters">
        {FILTER_BUTTONS.map((btn) => (
          <button
            key={btn.value}
            className={`network-filter-btn${filter === btn.value ? " network-filter-btn--active" : ""}`}
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <table className="network-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Dir</th>
            <th>Method</th>
            <th>URL</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => (
            <tr
              key={entry.id}
              className={`network-row${selectedEntryId === entry.id ? " network-row--selected" : ""}`}
              onClick={() => handleRowClick(entry)}
            >
              <td><span className={`network-badge network-badge--${entry.type}`}>{entry.type.toUpperCase()}</span></td>
              <td className="network-dir">{entry.direction === "outbound" ? "\u2192" : "\u2190"}</td>
              <td className="network-method">{entry.method}</td>
              <td>{entry.url}</td>
              <td className={statusClass(entry.status)}>{entry.status}</td>
              <td className="network-duration">{entry.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
