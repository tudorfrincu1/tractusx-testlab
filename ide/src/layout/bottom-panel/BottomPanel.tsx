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

import { useEffect } from "react";
import { useEditorStore } from "@/store/editor/useEditorStore";
import { useResizablePanel } from "@/shared/hooks/useResizablePanel";
import { ConsoleTab, NetworkTab, PerformanceTab } from "./tabs";
import type { BottomPanelTab } from "./types";
import Close from "@mui/icons-material/Close";
import "./BottomPanel.css";

const TAB_CONFIG: readonly { value: BottomPanelTab; icon: string; label: string }[] = [
  { value: "console", icon: "\u25B6", label: "Console" },
  { value: "network", icon: "\u21C4", label: "Network" },
  { value: "performance", icon: "\u23F1", label: "Performance" },
] as const;

export function BottomPanel() {
  const isOpen = useEditorStore((s) => s.bottomPanelOpen);
  const activeTab = useEditorStore((s) => s.bottomPanelTab);
  const togglePanel = useEditorStore((s) => s.toggleBottomPanel);
  const setTab = useEditorStore((s) => s.setBottomPanelTab);
  const networkDetailEntry = useEditorStore((s) => s.networkDetailEntry);

  const { height, handleMouseDown } = useResizablePanel({
    minHeight: 100,
    maxHeightVh: 50,
    defaultHeight: 200,
  });

  // Keyboard shortcut: Cmd+J / Ctrl+J
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        togglePanel();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePanel]);

  if (!isOpen) {
    return (
      <button
        className="bottom-panel__collapsed-bar"
        onClick={togglePanel}
        title="Open panel (⌘J)"
      >
        {TAB_CONFIG.find((t) => t.value === activeTab)?.label.toUpperCase() ?? "CONSOLE"}
      </button>
    );
  }

  return (
    <div className="bottom-panel" style={{ height }}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <hr className="bottom-panel__drag-handle" onMouseDown={handleMouseDown} title="Drag to resize" aria-orientation="horizontal" />
      <div className="bottom-panel__tabs">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`bottom-panel__tab${activeTab === tab.value ? " bottom-panel__tab--active" : ""}`}
            onClick={() => setTab(tab.value)}
          >
            <span className="bottom-panel__tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div className="bottom-panel__actions">
          <button className="bottom-panel__action-btn" onClick={togglePanel} title="Close panel">
            <Close sx={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
      <div className="bottom-panel__content">
        {activeTab === "console" && <ConsoleTab />}
        {activeTab === "network" && <NetworkTab selectedEntryId={networkDetailEntry?.id ?? null} />}
        {activeTab === "performance" && <PerformanceTab />}
      </div>
    </div>
  );
}
