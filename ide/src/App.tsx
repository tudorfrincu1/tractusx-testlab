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

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { TopBar } from "./components/Layout/TopBar";
import { StatusBar } from "./components/Layout/StatusBar";
import { BlocklyWorkspace } from "./components/BlockEditor/BlocklyWorkspace";
import { BlockEditorErrorBoundary } from "./components/BlockEditor/BlockEditorErrorBoundary";
import { ProjectExplorer } from "./components/ProjectExplorer/ProjectExplorer";
import { YamlEditor } from "./components/YamlEditor/MonacoEditor";
import { SchemaEditor } from "./components/YamlEditor/SchemaEditor";
import { DependencyGraph } from "./components/GraphView/DependencyGraph";
import { TestCaseDashboard } from "./components/TestCaseDashboard/TestCaseDashboard";
import { WelcomeScreen } from "./components/WelcomeScreen/WelcomeScreen";
import { useTestLabStore } from "./store/useTestLabStore";
import { useProjectStore, type ActiveFile } from "./store/useProjectStore";
import { theme } from "./theme/tractusxTheme";
import ExtensionIcon from "@mui/icons-material/Extension";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LockIcon from "@mui/icons-material/Lock";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import * as Blockly from "blockly";
import { ServiceDialog } from "./components/ServiceDialog/ServiceDialog";

export default function App() {
  const loadFromLocalStorage = useProjectStore((s) => s.loadFromLocalStorage);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const loadModel = useTestLabStore((s) => s.loadModel);
  const setOnModelChange = useTestLabStore((s) => s.setOnModelChange);
  const activeFile = useProjectStore((s) => s.activeFile);
  const hasProject = useProjectStore((s) => s.hasProject);

  // Panel visibility — only one secondary panel at a time
  const [rightPanel, setRightPanel] = useState<"yaml" | "graph" | "none">("yaml");
  const [yamlReadOnly, setYamlReadOnly] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [trashHasItems, setTrashHasItems] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(240);
  const explorerDragRef = useRef<{ startX: number; startW: number } | null>(null);

  // Whether the active file is a schema (show Monaco-only)
  const isSchema = activeFile?.type === "schema";
  const isTestCase = activeFile?.type === "test-case";

  // Wire the model-change callback: editor → project store
  useEffect(() => {
    setOnModelChange((model) => {
      const file = useProjectStore.getState().activeFile;
      if (!file) return;
      if (file.type === "test-case") {
        useProjectStore.getState().updateTestCase(model as import("./models/schema").TestCaseDefinition);
      } else if (file.type === "test") {
        useProjectStore.getState().updateTest(file.name, model as import("./models/schema").ScriptDefinition);
      }
    });
  }, [setOnModelChange]);

  // Load project from localStorage on mount
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    if (!loaded) return;
    // After loading, open the active file in editor
    const state = useProjectStore.getState();
    const file = state.activeFile ?? { type: "test-case" as const, name: "index" };
    const m = state.getActiveModel();
    if (m) {
      loadModel(m);
    }
    if (!state.activeFile) {
      setActiveFile(file);
    }
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

  // Sync editor model whenever activeFile changes (covers loadFromDocument,
  // handleSelectFile, and any other path that sets activeFile)
  useEffect(() => {
    if (!activeFile || !hasProject) return;
    const m = useProjectStore.getState().getActiveModel();
    if (m) {
      loadModel(m);
    }
  }, [activeFile, hasProject, loadModel]);

  // When activeFile changes, load the corresponding model into the editor
  const handleSelectFile = useCallback(
    (file: ActiveFile) => {
      setActiveFile(file);
      const m = useProjectStore.getState().getActiveModel();
      if (m) {
        loadModel(m);
      }
    },
    [setActiveFile, loadModel]
  );



  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: theme.colors.bg,
        color: theme.colors.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <TopBar />
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {!hasProject ? (
          <WelcomeScreen />
        ) : (
        <>
        {/* Project Explorer sidebar — collapsible & resizable */}
        {explorerOpen ? (
          <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
            <div style={{ width: explorerWidth, overflow: "hidden" }}>
              <ProjectExplorer onSelectFile={handleSelectFile} onCollapse={() => setExplorerOpen(false)} />
            </div>
            {/* Drag handle */}
            <div
              style={{
                width: 4, cursor: "col-resize", background: theme.colors.border,
                flexShrink: 0, transition: "background 0.1s",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                explorerDragRef.current = { startX: e.clientX, startW: explorerWidth };
                const onMove = (ev: MouseEvent) => {
                  if (!explorerDragRef.current) return;
                  const delta = ev.clientX - explorerDragRef.current.startX;
                  const newW = Math.max(160, Math.min(500, explorerDragRef.current.startW + delta));
                  setExplorerWidth(newW);
                };
                const onUp = () => {
                  explorerDragRef.current = null;
                  document.removeEventListener("mousemove", onMove);
                  document.removeEventListener("mouseup", onUp);
                };
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.border; }}
            />
          </div>
        ) : (
          <div
            title="Show Explorer"
            onClick={() => setExplorerOpen(true)}
            style={{
              width: 28, flexShrink: 0, writingMode: "vertical-rl", textOrientation: "mixed",
              cursor: "pointer", padding: "10px 6px",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase", color: theme.colors.textMuted,
              userSelect: "none", borderRight: `1px solid ${theme.colors.border}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
          >
            Explorer
          </div>
        )}
        {isTestCase ? (
          <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
            <TestCaseDashboard onSelectFile={handleSelectFile} />
          </div>
        ) : (
        <Group orientation="horizontal" style={{ flex: 1, height: "100%" }}>
          {!isSchema && (
            <Panel defaultSize={rightPanel === "none" ? 100 : 50} minSize={20}>
              <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <PanelHeader title="Block Editor" icon={<ExtensionIcon sx={{ fontSize: 16 }} />}
                  afterTitle={
                    <button
                      title="Add/Remove Services"
                      onClick={() => setShowServiceDialog(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: theme.colors.bgLighter, border: `1px solid ${theme.colors.border}`,
                        borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                        color: theme.colors.text, fontSize: 10, fontWeight: 500,
                        textTransform: "none",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.color = theme.colors.textBright; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.color = theme.colors.text; }}
                    >
                      <TuneIcon sx={{ fontSize: 13 }} />
                      Add/Remove Services
                    </button>
                  }
                  extra={
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <IconBtn
                        title="Save"
                        onClick={() => useProjectStore.getState().saveToLocalStorage()}
                      >
                        <SaveIcon sx={{ fontSize: 16 }} />
                      </IconBtn>
                      <div
                        title={autoSave ? "Auto-save ON — click to disable" : "Auto-save OFF — click to enable"}
                        onClick={() => setAutoSave((v) => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "0 6px", cursor: "pointer", userSelect: "none",
                        }}
                      >
                        <span style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: autoSave ? theme.colors.primary : theme.colors.textMuted,
                          transition: "color 0.15s",
                        }}>
                          Auto
                        </span>
                        <div style={{
                          position: "relative", width: 26, height: 14, borderRadius: 7,
                          background: autoSave ? theme.colors.primary : theme.colors.border,
                          transition: "background 0.2s", flexShrink: 0,
                        }}>
                          <div style={{
                            position: "absolute", top: 2, width: 10, height: 10,
                            borderRadius: "50%", background: "#fff",
                            left: autoSave ? 14 : 2,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          }} />
                        </div>
                      </div>
                      <div style={{ width: 1, height: 16, background: theme.colors.border, margin: "0 2px" }} />
                      <IconBtn
                        title="Empty Trash"
                        onClick={() => {
                          const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
                          ws?.trashcan?.emptyContents();
                          setTrashHasItems(false);
                          // Save canvas state so emptied trash persists across file switches
                          if (ws) {
                            const file = useProjectStore.getState().activeFile;
                            const key = file?.name ?? "index";
                            const state = Blockly.serialization.workspaces.save(ws);
                            const { blocks, variables } = state as Record<string, unknown>;
                            useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
                          }
                        }}
                      >
                        <DeleteForeverIcon sx={{ fontSize: 16, color: trashHasItems ? "#e53935" : undefined }} />
                      </IconBtn>
                      <IconBtn
                        title={rightPanel === "none" ? "Show panel" : "Hide panel"}
                        isActive={rightPanel !== "none"}
                        onClick={() => setRightPanel((c) => c === "none" ? "yaml" : "none")}
                      >
                        <VerticalSplitIcon sx={{ fontSize: 16 }} />
                        {rightPanel === "none"
                          ? <ChevronLeftIcon sx={{ fontSize: 14 }} />
                          : <ChevronRightIcon sx={{ fontSize: 14 }} />}
                      </IconBtn>
                    </div>
                  }
                />
                <div style={{ flex: 1, minHeight: 0 }}>
                  <BlockEditorErrorBoundary>
                    <BlocklyWorkspace key={activeFile?.name ?? "index"} onTrashChange={setTrashHasItems} />
                  </BlockEditorErrorBoundary>
                </div>
                {showServiceDialog && <ServiceDialog onClose={() => setShowServiceDialog(false)} />}
              </div>
            </Panel>
          )}
          {(rightPanel !== "none" || isSchema) && (
            <>
              <Separator style={{ width: 4, background: theme.colors.border, cursor: "col-resize" }} />
              <Panel defaultSize={isSchema ? 100 : 50} minSize={20}>
                <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {isSchema ? (
                    <PanelHeader title="Schema Editor" icon={<EditNoteIcon sx={{ fontSize: 16 }} />} />
                  ) : (
                    <PanelTabBar
                      activeTab={rightPanel as "yaml" | "graph"}
                      onTabChange={setRightPanel}
                      isReadOnly={yamlReadOnly}
                      onToggleReadOnly={() => setYamlReadOnly((v) => !v)}
                    />
                  )}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    {isSchema && <SchemaEditor />}
                    {!isSchema && rightPanel === "yaml" && <YamlEditor readOnly={yamlReadOnly} />}
                    {rightPanel === "graph" && !isSchema && <DependencyGraph />}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </Group>
        )}
        </>
        )}
      </div>
      <StatusBar />
    </div>
  );
}

function PanelHeader({ title, icon, afterTitle, extra }: { title: string; icon: ReactNode; afterTitle?: ReactNode; extra?: ReactNode }) {
  return (
    <div style={{
      height: 32, display: "flex", alignItems: "center", padding: "0 12px", gap: 6,
      background: theme.colors.bgLight, borderBottom: `1px solid ${theme.colors.border}`,
      fontSize: 12, fontWeight: 600, letterSpacing: "0.03em",
      color: theme.colors.textMuted, textTransform: "uppercase", userSelect: "none",
    }}>
      <span style={{ marginRight: 6 }}>{icon}</span>
      {title}
      {afterTitle}
      <div style={{ flex: 1 }} />
      {extra}
    </div>
  );
}

const ICON_BTN_STYLE: React.CSSProperties = {
  minWidth: 28, height: 28, padding: "0 4px", border: "none", borderRadius: 4,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 2,
  cursor: "pointer", background: "transparent", transition: "color 0.15s, background 0.15s",
};

function IconBtn({ title, onClick, isActive, children }: {
  title: string; onClick: () => void; isActive?: boolean; children: ReactNode;
}) {
  return (
    <button
      title={title} onClick={onClick}
      style={{
        ...ICON_BTN_STYLE,
        color: isActive ? theme.colors.primary : theme.colors.textMuted,
        background: isActive ? theme.colors.bgLightest : "transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.primary; e.currentTarget.style.background = theme.colors.bgLightest; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isActive ? theme.colors.primary : theme.colors.textMuted;
        e.currentTarget.style.background = isActive ? theme.colors.bgLightest : "transparent";
      }}
    >{children}</button>
  );
}

const PANEL_TABS: { id: "yaml" | "graph"; label: string; icon: ReactNode }[] = [
  { id: "yaml", label: "YAML Editor", icon: <EditNoteIcon sx={{ fontSize: 14 }} /> },
  { id: "graph", label: "Graph", icon: <AccountTreeIcon sx={{ fontSize: 14 }} /> },
];

function PanelTabBar({ activeTab, onTabChange, isReadOnly, onToggleReadOnly }: {
  activeTab: "yaml" | "graph";
  onTabChange: (tab: "yaml" | "graph" | "none") => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
}) {
  return (
    <div style={{
      height: 32, display: "flex", alignItems: "stretch",
      background: theme.colors.bgLight, borderBottom: `2px solid ${theme.colors.border}`,
      userSelect: "none", flexShrink: 0,
    }}>
      {PANEL_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "0 14px", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: isActive ? theme.colors.textBright : theme.colors.textMuted,
              background: isActive ? theme.colors.bg : "transparent",
              borderBottom: isActive ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = theme.colors.text; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = theme.colors.textMuted; }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
      {activeTab === "yaml" && (
        <>
          <div style={{ flex: 1 }} />
          <div
            title={isReadOnly ? "Click to enable editing" : "Click to lock"}
            onClick={onToggleReadOnly}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 8px", margin: "4px 6px", cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: isReadOnly ? theme.colors.textMuted : theme.colors.primary,
              transition: "color 0.15s",
            }}>
              Locked
            </span>
            {/* Toggle track */}
            <div style={{
              position: "relative", width: 30, height: 16, borderRadius: 8,
              background: isReadOnly ? theme.colors.border : theme.colors.primary,
              transition: "background 0.2s",
              flexShrink: 0,
            }}>
              {/* Toggle knob */}
              <div style={{
                position: "absolute", top: 2, width: 12, height: 12,
                borderRadius: "50%", background: "#fff",
                left: isReadOnly ? 2 : 16,
                transition: "left 0.2s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isReadOnly && <LockIcon sx={{ fontSize: 8, color: theme.colors.border }} />}
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: isReadOnly ? theme.colors.textMuted : theme.colors.primary,
              transition: "color 0.15s",
            }}>
              Edit
            </span>
          </div>
        </>
      )}
    </div>
  );
}


