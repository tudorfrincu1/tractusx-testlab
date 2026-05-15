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

import { useState, useEffect, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { BlocklyWorkspace } from "../BlockEditor/BlocklyWorkspace";
import { BlockEditorErrorBoundary } from "../BlockEditor/BlockEditorErrorBoundary";
import { YamlEditor } from "../YamlEditor/MonacoEditor";
import { SchemaEditor } from "../YamlEditor/SchemaEditor";
import { DependencyGraph } from "../GraphView/DependencyGraph";
import { ServiceDialog } from "../ServiceDialog/ServiceDialog";
import { PanelHeader, PanelTabBar, IconBtn } from "./PanelControls";
import { useProjectStore } from "../../store/useProjectStore";
import ExtensionIcon from "@mui/icons-material/Extension";
import EditNoteIcon from "@mui/icons-material/EditNote";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import * as Blockly from "blockly";
import {
  ValidationPanel,
  collectBlockWarnings,
  modelErrorsToIssues,
} from "../BlockEditor/ui/ValidationPanel";
import { useTestLabStore } from "../../store/useTestLabStore";
import { useExecutionStore } from "../../store/useExecutionStore";
import { ExecutionPanel } from "../ExecutionPanel/ExecutionPanel";

export interface EditorPanelsProps {
  autoSave: boolean;
  onAutoSaveChange: (value: boolean) => void;
}

export function EditorPanels({ autoSave, onAutoSaveChange }: EditorPanelsProps) {
  const activeFile = useProjectStore((s) => s.activeFile);
  const isSchema = activeFile?.type === "schema";

  const [rightPanel, setRightPanel] = useState<"yaml" | "graph" | "none">("yaml");
  const [yamlReadOnly, setYamlReadOnly] = useState(true);
  const [trashHasItems, setTrashHasItems] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);

  const handleRefreshYaml = () => {
    window.dispatchEvent(new Event("testlab:force-sync"));
  };

  const showValidation = useTestLabStore((s) => s.showValidation);
  const setShowValidation = useTestLabStore((s) => s.setShowValidation);
  const storeErrors = useTestLabStore((s) => s.errors);

  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const jobStatus = useExecutionStore((s) => s.jobStatus);
  const showExecutionPanel = isExecuting || jobStatus !== null;

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
      <Group orientation="horizontal" className="editor-panels">
        {!isSchema && (
          <Panel defaultSize={rightPanel === "none" ? 100 : 50} minSize={20}>
            <div className="panel-container">
              <PanelHeader
                title="Block Editor"
                icon={<ExtensionIcon sx={{ fontSize: 16 }} />}
                afterTitle={
                  <button
                    title="Add/Remove Services"
                    onClick={() => setShowServiceDialog(true)}
                    className="services-btn"
                  >
                    <TuneIcon sx={{ fontSize: 13 }} />
                    Add/Remove Services
                  </button>
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
                    <IconBtn
                      title={rightPanel === "none" ? "Show panel" : "Hide panel"}
                      isActive={rightPanel !== "none"}
                      onClick={() => setRightPanel((c) => (c === "none" ? "yaml" : "none"))}
                    >
                      <VerticalSplitIcon sx={{ fontSize: 16 }} />
                      {rightPanel === "none"
                        ? <ChevronLeftIcon sx={{ fontSize: 14 }} />
                        : <ChevronRightIcon sx={{ fontSize: 14 }} />}
                    </IconBtn>
                  </div>
                }
              />
              <div className="panel-container__content">
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
            <Separator className="panel-separator" />
            <Panel defaultSize={isSchema ? 100 : 50} minSize={20}>
              <div className="panel-container">
                {isSchema ? (
                  <PanelHeader title="Schema Editor" icon={<EditNoteIcon sx={{ fontSize: 16 }} />} />
                ) : (
                  <PanelTabBar
                    activeTab={rightPanel as "yaml" | "graph"}
                    onTabChange={setRightPanel}
                    isReadOnly={yamlReadOnly}
                    onToggleReadOnly={() => setYamlReadOnly((v) => !v)}
                    onRefresh={handleRefreshYaml}
                  />
                )}
                <div className="panel-container__content">
                  {isSchema && <SchemaEditor />}
                  {!isSchema && rightPanel === "yaml" && <YamlEditor readOnly={yamlReadOnly} />}
                  {rightPanel === "graph" && !isSchema && <DependencyGraph />}
                </div>
              </div>
            </Panel>
          </>
        )}
      </Group>
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
