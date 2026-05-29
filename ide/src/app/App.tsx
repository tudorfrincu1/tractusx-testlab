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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import "./App.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { TopBar, StatusBar, NotificationBar, EditorPanels, ContextBar, BottomPanel } from "@/layout";
import { NetworkDetailOverlay } from "@/layout/bottom-panel/NetworkDetailOverlay";
import { ProjectExplorer } from "@/features/project-explorer/ProjectExplorer";
import { TckDashboard } from "@/features/tck-dashboard";
import { PreconditionsPanel } from "@/features/preconditions/PreconditionsPanel";
import { EnvironmentEditor } from "@/features/environment-editor";
import { WelcomeScreen } from "@/layout/WelcomeScreen/WelcomeScreen";
import { AppErrorBoundary } from "@/shared/ui/AppErrorBoundary";
import { useEditorStore } from "@/store/editor/useEditorStore";
import { useProjectStore, type ActiveFile } from "@/store/project/useProjectStore";
import { useUiStore } from "@/store";
import type { TckDefinition, ScriptDefinition } from "@/models/schema";

export default function App() {
  const loadFromLocalStorage = useProjectStore((s) => s.loadFromLocalStorage);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const loadModel = useEditorStore((s) => s.loadModel);
  const setOnModelChange = useEditorStore((s) => s.setOnModelChange);
  const activeFile = useProjectStore((s) => s.activeFile);
  const hasProject = useProjectStore((s) => s.hasProject);
  const isGlobalLoading = useUiStore((s) => s.isGlobalLoading);
  const globalLoadingMessage = useUiStore((s) => s.globalLoadingMessage);
  const startGlobalLoading = useUiStore((s) => s.startGlobalLoading);
  const queueHydrationCompletionToken = useUiStore((s) => s.queueHydrationCompletionToken);
  const networkDetailEntry = useEditorStore((s) => s.networkDetailEntry);
  const clearNetworkDetailEntry = useEditorStore((s) => s.clearNetworkDetailEntry);

  const [autoSave, setAutoSave] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(
    () => Number(localStorage.getItem("testlab:explorer-width")) || 240,
  );
  const explorerDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const isTck = activeFile?.type === "tck";

  // Track the active file at the time each model-change originates.
  // This prevents stale debounced callbacks from saving under the wrong file name.
  const activeFileRef = useRef(activeFile);
  activeFileRef.current = activeFile;

  // Wire the model-change callback: editor → project store
  useEffect(() => {
    setOnModelChange((model) => {
      // Use the ref captured at render time — NOT the store's current activeFile —
      // because a stale debounced callback may fire after a file switch, at which
      // point the store's activeFile already points to the new file.
      const file = activeFileRef.current;
      if (!file) return;
      if (file.type === "tck") {
        useProjectStore.getState().updateTck(model as TckDefinition);
      } else if (file.type === "test") {
        useProjectStore.getState().updateTest(file.name, model as ScriptDefinition);
      }
    });
  }, [setOnModelChange]);

  // Load project from localStorage on mount
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    if (!loaded) return;
    const state = useProjectStore.getState();
    const file = state.activeFile ?? { type: "tck" as const, name: "index" };
    const m = state.getActiveModel();
    if (m) loadModel(m);
    if (!state.activeFile) setActiveFile(file);
  }, [loadFromLocalStorage, loadModel, setActiveFile]);

  // Auto-save: persist to localStorage whenever the model changes
  const model = useEditorStore((s) => s.model);
  const lastEditSource = useEditorStore((s) => s.lastEditSource);
  useEffect(() => {
    if (!autoSave || !hasProject) return;
    // Don't trigger auto-save for model loads (file switches) — only user edits
    if (lastEditSource === "load" || lastEditSource === "none") return;

    // Capture the active file NOW (at model-change time, not after debounce)
    const fileAtChange = activeFileRef.current;
    const timer = setTimeout(() => {
      // Verify file hasn't changed during the debounce window
      const currentFile = useProjectStore.getState().activeFile;
      if (currentFile?.name === fileAtChange?.name && currentFile?.type === fileAtChange?.type) {
        useProjectStore.getState().saveToLocalStorage();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [model, autoSave, hasProject, lastEditSource]);

  // Sync editor model when activeFile changes externally (e.g. restored from localStorage on mount).
  // Skip when the change was triggered by handleSelectFile (which already calls loadModel).
  const prevActiveFileRef = useRef<ActiveFile | null>(null);
  useEffect(() => {
    // On first render after mount, prevActiveFileRef is null — the loadFromLocalStorage effect handles that.
    if (prevActiveFileRef.current === null) {
      prevActiveFileRef.current = activeFile;
      return;
    }
    // Only fire if activeFile changed (external mutation, not from handleSelectFile)
    if (
      activeFile &&
      hasProject &&
      (activeFile.name !== prevActiveFileRef.current?.name ||
        activeFile.type !== prevActiveFileRef.current?.type)
    ) {
      const m = useProjectStore.getState().getActiveModel();
      if (m) loadModel(m);
    }
    prevActiveFileRef.current = activeFile;
  }, [activeFile, hasProject, loadModel]);

  const handleSelectFile = useCallback(
    (file: ActiveFile) => {
      const previousFile = useProjectStore.getState().activeFile;
      const isTestToTestSwitch =
        previousFile?.type === "test" &&
        file.type === "test" &&
        previousFile.name !== file.name;

      if (isTestToTestSwitch) {
        const token = startGlobalLoading("Loading selected test...");
        queueHydrationCompletionToken(token);
      }

      setActiveFile(file);
      const m = useProjectStore.getState().getActiveModel();
      if (m) loadModel(m);
    },
    [setActiveFile, loadModel, startGlobalLoading, queueHydrationCompletionToken],
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      explorerDragRef.current = { startX: e.clientX, startW: explorerWidth };
      const onMove = (ev: MouseEvent) => {
        if (!explorerDragRef.current) return;
        const delta = ev.clientX - explorerDragRef.current.startX;
        setExplorerWidth(Math.max(160, Math.min(500, explorerDragRef.current.startW + delta)));
      };
      const onUp = () => {
        explorerDragRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setExplorerWidth((w) => { localStorage.setItem("testlab:explorer-width", String(w)); return w; });
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [explorerWidth],
  );

  return (
    <div className="app">
      <TopBar />
      <ContextBar />
      <AppErrorBoundary>
      <div className="app__container">
        {!hasProject ? (
          <WelcomeScreen />
        ) : (
          <>
            {explorerOpen ? (
              <div className="app__explorer">
                <div className="app__explorer-panel" style={{ width: explorerWidth }}>
                  <ProjectExplorer onSelectFile={handleSelectFile} onCollapse={() => setExplorerOpen(false)} />
                </div>
                <div className="app__drag-handle" onMouseDown={handleDragStart} />
              </div>
            ) : (
              <div
                className="app__explorer-collapsed"
                title="Show Explorer"
                onClick={() => setExplorerOpen(true)}
              >
                Explorer
              </div>
            )}
            <div className="app__content-column">
            {isTck && (
              <div className="app__tck-wrapper">
                <TckDashboard />
              </div>
            )}
            {activeFile?.type === "preconditions" && (
              <div className="app__tck-wrapper">
                <PreconditionsPanel />
              </div>
            )}
            {activeFile?.type === "environment" && (
              <div className="app__tck-wrapper">
                <EnvironmentEditor />
              </div>
            )}
            {!isTck && activeFile?.type !== "preconditions" && activeFile?.type !== "environment" && (
              <EditorPanels autoSave={autoSave} onAutoSaveChange={setAutoSave} />
            )}
            <BottomPanel />
            {networkDetailEntry && (
              <NetworkDetailOverlay entry={networkDetailEntry} onClose={clearNetworkDetailEntry} />
            )}
            </div>
          </>
        )}
      </div>
      </AppErrorBoundary>
      <NotificationBar />
      <StatusBar />
      {isGlobalLoading && (
        <div className="app__loading-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="app__loading-card">{globalLoadingMessage}</div>
        </div>
      )}
    </div>
  );
}


