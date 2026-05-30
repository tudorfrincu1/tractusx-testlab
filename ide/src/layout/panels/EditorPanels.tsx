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

import { useState, useEffect, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { BlocklyWorkspace, BlockEditorErrorBoundary } from "@/features/block-editor";
import { YamlEditor, SchemaEditor, TestdataEditor } from "@/features/yaml-editor";
import { DependencyGraph } from "@/features/graph-view";
import { SequenceDiagram } from "@/features/sequence-view";
import { PanelHeader, PanelTabBar, IconBtn } from "./PanelControls";
import { useProjectStore } from "@/store";
import ExtensionIcon from "@mui/icons-material/Extension";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import * as Blockly from "blockly";
import {
  ValidationPanel,
  collectBlockWarnings,
  modelErrorsToIssues,
} from "@/features/block-editor";
import { useEditorStore } from "@/store";
import { useExecutionStore } from "@/store";
import { ExecutionPanel } from "@/features/execution";
import { TestdataVariableButton } from "@/features/yaml-editor";
import { EditableFileName } from "./EditableFileName";

export interface EditorPanelsProps {
  autoSave: boolean;
  onAutoSaveChange: (value: boolean) => void;
}

export function EditorPanels({ autoSave, onAutoSaveChange }: EditorPanelsProps) {
  const activeFile = useProjectStore((s) => s.activeFile);
  const isSchema = activeFile?.type === "schema";
  const isTestdata = activeFile?.type === "testdata";
  const isJsonEditor = isSchema || isTestdata;

  const [rightPanel, setRightPanel] = useState<"yaml" | "graph" | "sequence" | "none">("yaml");
  const [yamlReadOnly, setYamlReadOnly] = useState(true);
  const [trashHasItems, setTrashHasItems] = useState(false);

  const handleRefreshYaml = () => {
    window.dispatchEvent(new Event("testlab:force-sync"));
  };

  const showValidation = useEditorStore((s) => s.showValidation);
  const setShowValidation = useEditorStore((s) => s.setShowValidation);
  const storeErrors = useEditorStore((s) => s.errors);

  const isConnected = useExecutionStore((s) => s.isConnected);
  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const jobStatus = useExecutionStore((s) => s.jobStatus);
  const showExecutionPanel = isConnected && (isExecuting || jobStatus !== null);

  useEffect(() => {
    const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
    if (!ws) return;
    const listener = (event: Blockly.Events.Abstract) => {
      const isChange =
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE;
      if (isChange && !showValidation) {
        // no-op: panel closed, nothing to update
      }
    };
    ws.addChangeListener(listener);
    return () => ws.removeChangeListener(listener);
  }, [activeFile, showValidation]);

  const validationIssues = useMemo(() => {
    if (!showValidation) return [];
    const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
    const blockWarnings = ws ? collectBlockWarnings(ws) : [];
    const modelErrors = modelErrorsToIssues(storeErrors);
    return [...modelErrors, ...blockWarnings];
  }, [showValidation, storeErrors]);

  const validationStatus = !showValidation
    ? "stale"
    : validationIssues.length === 0
    ? "pass"
    : "fail";

  const handleValidate = () => {
    if (showValidation) {
      setShowValidation(false);
      return;
    }
    setShowValidation(true);
  };

  const handleEmptyTrash = () => {
    const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
    ws?.trashcan?.emptyContents();
    setTrashHasItems(false);
    if (ws) {
      const file = useProjectStore.getState().activeFile;
      const key = file?.name ?? "index";
      const state = Blockly.serialization.workspaces.save(ws);
      const { blocks, variables } = state as Record<string, unknown>;
      useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
    }
  };

  return (
    <div className="editor-area">
      <div className="editor-area__horizontal">
      <Group orientation="horizontal" className="editor-panels">
        {!isJsonEditor && (
          <Panel defaultSize={rightPanel === "none" ? 100 : 50} minSize={20}>
            <div className="panel-container">
              <PanelHeader
                title="Block Editor"
                icon={<ExtensionIcon sx={{ fontSize: 16 }} />}
                afterTitle={
                  activeFile?.type === "test" && activeFile.name ? (
                    <EditableFileName
                      name={activeFile.name}
                      extension=".yaml"
                      onRename={(newName) => useProjectStore.getState().renameTest(activeFile.name, newName)}
                    />
                  ) : undefined
                }
                extra={
                  <div className="editor-controls">
                    <IconBtn
                      title="Save"
                      onClick={() => useProjectStore.getState().saveToLocalStorage()}
                    >
                      <SaveIcon sx={{ fontSize: 16 }} />
                    </IconBtn>
                    <div
                      className="auto-save"
                      title={autoSave ? "Auto-save ON — click to disable" : "Auto-save OFF — click to enable"}
                      onClick={() => onAutoSaveChange(!autoSave)}
                    >
                      <span className={`auto-save__label${autoSave ? " auto-save__label--on" : ""}`}>
                        Auto
                      </span>
                      <div className={`auto-save__track${autoSave ? " auto-save__track--on" : ""}`}>
                        <div className={`auto-save__knob${autoSave ? " auto-save__knob--on" : ""}`} />
                      </div>
                    </div>
                    <div className="toolbar-divider" />
                    <button
                      title="Validate workspace"
                      onClick={handleValidate}
                      className={`validate-btn validate-btn--${validationStatus}`}
                    >
                      <PlaylistAddCheckIcon sx={{ fontSize: 13 }} />
                      Validate
                    </button>
                    <IconBtn title="Empty Trash" onClick={handleEmptyTrash}>
                      <DeleteForeverIcon sx={{ fontSize: 16, color: trashHasItems ? "#e53935" : undefined }} />
                    </IconBtn>
                  </div>
                }
              />
              <div className="panel-container__content">
                <BlockEditorErrorBoundary>
                  <BlocklyWorkspace onTrashChange={setTrashHasItems} />
                </BlockEditorErrorBoundary>
              </div>
            </div>
          </Panel>
        )}
        {(rightPanel !== "none" || isJsonEditor) && (
          <>
            <Separator className="panel-separator" />
            <Panel defaultSize={isJsonEditor ? 100 : 50} minSize={20}>
              <div className="panel-container">
                {isJsonEditor ? (
                  <PanelHeader
                    title={isTestdata ? "Testdata Editor" : "Schema Editor"}
                    icon={<EditNoteIcon sx={{ fontSize: 16 }} />}
                    afterTitle={
                      activeFile?.name ? (
                        <EditableFileName
                          name={activeFile.name}
                          extension=".json"
                          onRename={(newName) => {
                            if (isTestdata) {
                              useProjectStore.getState().renameTestdata(activeFile.name, newName);
                            } else {
                              useProjectStore.getState().renameSchema(activeFile.name, newName);
                            }
                          }}
                        />
                      ) : undefined
                    }
                    extra={isTestdata ? <TestdataVariableButton /> : undefined}
                  />
                ) : (
                  <PanelTabBar
                    activeTab={rightPanel as "yaml" | "graph" | "sequence"}
                    onTabChange={setRightPanel}
                    isReadOnly={yamlReadOnly}
                    onToggleReadOnly={() => setYamlReadOnly((v) => !v)}
                    onRefresh={handleRefreshYaml}
                    onCollapse={() => setRightPanel("none")}
                  />
                )}
                <div className="panel-container__content">
                  {isSchema && <SchemaEditor />}
                  {isTestdata && <TestdataEditor />}
                  {!isJsonEditor && rightPanel === "yaml" && <YamlEditor readOnly={yamlReadOnly} />}
                  {rightPanel === "graph" && !isJsonEditor && <DependencyGraph />}
                  {rightPanel === "sequence" && !isJsonEditor && <SequenceDiagram />}
                </div>
              </div>
            </Panel>
          </>
        )}
      </Group>
      {rightPanel === "none" && !isJsonEditor && (
        <div
          className="editor-panels__right-collapsed"
          title="Show YAML Editor"
          onClick={() => setRightPanel("yaml")}
        >
          YAML Editor
        </div>
      )}
      </div>
      {showValidation && (
        <ValidationPanel
          issues={validationIssues}
          onClose={() => setShowValidation(false)}
        />
      )}
      {showExecutionPanel && <ExecutionPanel />}
    </div>
  );
}
