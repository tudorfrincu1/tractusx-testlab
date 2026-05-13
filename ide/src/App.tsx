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
import { TopBar } from "./components/Layout/TopBar";
import { StatusBar } from "./components/Layout/StatusBar";
import { EditorPanels } from "./components/Layout/EditorPanels";
import { ProjectExplorer } from "./components/ProjectExplorer/ProjectExplorer";
import { TckDashboard } from "./components/TckDashboard/TckDashboard";
import { WelcomeScreen } from "./components/WelcomeScreen/WelcomeScreen";
import { useTestLabStore } from "./store/useTestLabStore";
import { useProjectStore, type ActiveFile } from "./store/useProjectStore";
import type { TckDefinition, ScriptDefinition } from "./models/schema";

export default function App() {
  const loadFromLocalStorage = useProjectStore((s) => s.loadFromLocalStorage);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const loadModel = useTestLabStore((s) => s.loadModel);
  const setOnModelChange = useTestLabStore((s) => s.setOnModelChange);
  const activeFile = useProjectStore((s) => s.activeFile);
  const hasProject = useProjectStore((s) => s.hasProject);

  const [autoSave, setAutoSave] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(240);
  const explorerDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const isTck = activeFile?.type === "tck";

  // Wire the model-change callback: editor → project store
  useEffect(() => {
    setOnModelChange((model) => {
      const file = useProjectStore.getState().activeFile;
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
  const model = useTestLabStore((s) => s.model);
  useEffect(() => {
    if (!autoSave || !hasProject) return;
    const timer = setTimeout(() => {
      useProjectStore.getState().saveToLocalStorage();
    }, 1000);
    return () => clearTimeout(timer);
  }, [model, autoSave, hasProject]);

  // Sync editor model whenever activeFile changes
  useEffect(() => {
    if (!activeFile || !hasProject) return;
    const m = useProjectStore.getState().getActiveModel();
    if (m) loadModel(m);
  }, [activeFile, hasProject, loadModel]);

  const handleSelectFile = useCallback(
    (file: ActiveFile) => {
      setActiveFile(file);
      const m = useProjectStore.getState().getActiveModel();
      if (m) loadModel(m);
    },
    [setActiveFile, loadModel],
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
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [explorerWidth],
  );

  return (
    <div className="app">
      <TopBar />
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
            {isTck ? (
              <div className="app__tck-wrapper">
                <TckDashboard onSelectFile={handleSelectFile} />
              </div>
            ) : (
              <EditorPanels autoSave={autoSave} onAutoSaveChange={setAutoSave} />
            )}
          </>
        )}
      </div>
      <StatusBar />
    </div>
  );
}


