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

import { useState, useCallback } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { defineTractusDarkTheme } from "../../features/yaml-editor/monacoSetup";
import type { NetworkEntry, NetworkDetailTab } from "./bottomPanel.types";

export interface NetworkDetailOverlayProps {
  readonly entry: NetworkEntry;
  readonly onClose: () => void;
}

const DETAIL_TABS: readonly { value: NetworkDetailTab; label: string }[] = [
  { value: "headers", label: "Headers" },
  { value: "request", label: "Request" },
  { value: "response", label: "Response" },
] as const;

function HeadersSection({ entry }: Readonly<{ entry: NetworkEntry }>) {
  return (
    <div className="network-detail__kv-groups">
      {entry.requestHeaders && (
        <div className="network-detail__kv-group">
          <div className="network-detail__kv-group-title">Request Headers</div>
          <table className="network-detail__kv-table">
            <tbody>
              {Object.entries(entry.requestHeaders).map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {entry.responseHeaders && (
        <div className="network-detail__kv-group">
          <div className="network-detail__kv-group-title">Response Headers</div>
          <table className="network-detail__kv-table">
            <tbody>
              {Object.entries(entry.responseHeaders).map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ content }: Readonly<{ content?: string }>) {
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    defineTractusDarkTheme(monaco);
  }, []);

  if (!content) {
    return <div className="network-detail__empty">No body content</div>;
  }

  return (
    <div className="network-detail__editor-wrapper">
      <Editor
        height="100%"
        language="json"
        theme="tractus-x-dark"
        value={content}
        beforeMount={handleBeforeMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          automaticLayout: true,
          renderLineHighlight: "none",
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}

export function NetworkDetailOverlay({ entry, onClose }: NetworkDetailOverlayProps) {
  const [activeTab, setActiveTab] = useState<NetworkDetailTab>("headers");

  return (
    <div
      className="network-detail-overlay network-detail-overlay--open"
    >
      <div className="network-detail__header">
        <button className="network-detail__back" onClick={onClose} title="Go back">
          {"\u2190 Back"}
        </button>
        <span className="network-detail__title">
          <span className="network-detail__title-method">{entry.method}</span>
          {entry.url}
        </span>
        <button className="network-detail__close" onClick={onClose} title="Close">
          {"\u2715"}
        </button>
      </div>
      <div className="network-detail__tabs">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`network-detail__tab${activeTab === tab.value ? " network-detail__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="network-detail__body">
        {activeTab === "headers" && <HeadersSection entry={entry} />}
        {activeTab === "request" && <CodeBlock content={entry.requestBody} />}
        {activeTab === "response" && <CodeBlock content={entry.responseBody} />}
      </div>
    </div>
  );
}
