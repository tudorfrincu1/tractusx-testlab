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

import { useState, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  BlocklyWorkspace,
  BlockEditorErrorBoundary,
  ValidationPanel,
  collectBlockWarnings,
  modelErrorsToIssues,
} from "@/features/block-editor";
import type { ValidationError } from "@/services/validation/validator";
import { YamlEditor, SchemaEditor, TestdataEditor, TestdataVariableButton } from "@/features/yaml-editor";
import { DependencyGraph } from "@/features/graph-view";
import { SequenceDiagram } from "@/features/sequence-view";
import { PanelHeader, PanelTabBar, IconBtn } from "./PanelControls";
import { useProjectStore, useEditorStore, useExecutionStore } from "@/store";
import ExtensionIcon from "@mui/icons-material/Extension";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import * as Blockly from "blockly";
import { ExecutionPanel } from "@/features/execution";
import { EditableFileName } from "./EditableFileName";

function resolveValidationStatus(showValidation: boolean, issueCount: number): string {
  if (!showValidation) return "stale";
  return issueCount === 0 ? "pass" : "fail";
}

function useValidation(showValidation: boolean, storeErrors: ValidationError[]) {
  const issues = useMemo(() => {
    if (!showValidation) return [];
    const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
    const blockWarnings = ws ? collectBlockWarnings(ws) : [];
    const modelErrors = modelErrorsToIssues(storeErrors);
    return [...modelErrors, ...blockWarnings];
  }, [showValidation, storeErrors]);

  const status = resolveValidationStatus(showValidation, issues.length);

  return { issues, status };
}

function emptyWorkspaceTrash(setTrashHasItems: (v: boolean) => void): void {
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
}

interface RightPanelContentProps {
  isSchema: boolean;
  isTestdata: boolean;
  isJsonEditor: boolean;
  rightPanel: "yaml" | "graph" | "sequence" | "none";
  yamlReadOnly: boolean;
}

function RightPanelContent({ isSchema, isTestdata, isJsonEditor, rightPanel, yamlReadOnly }: Readonly<RightPanelContentProps>) {
  if (isSchema) return <SchemaEditor />;
  if (isTestdata) return <TestdataEditor />;
  if (rightPanel === "yaml") return <YamlEditor readOnly={yamlReadOnly} />;
  if (rightPanel === "graph" && !isJsonEditor) return <DependencyGraph />;
  if (rightPanel === "sequence" && !isJsonEditor) return <SequenceDiagram />;
  return null;
}

interface BlockEditorToolbarProps {
  autoSave: boolean;
  onAutoSaveChange: (value: boolean) => void;
  validationStatus: string;
  onValidate: () => void;
  trashHasItems: boolean;
  onEmptyTrash: () => void;
}

function BlockEditorToolbar({ autoSave, onAutoSaveChange, validationStatus, onValidate, trashHasItems, onEmptyTrash }: Readonly<BlockEditorToolbarProps>) {
  return (
    <div className="editor-controls">
      <IconBtn title="Save" onClick={() => useProjectStore.getState().saveToLocalStorage()}>
        <SaveIcon sx={{ fontSize: 16 }} />
      </IconBtn>
      <div
        className="auto-save"
        title={autoSave ? "Auto-save ON — click to disable" : "Auto-save OFF — click to enable"}
        role="switch"
        aria-checked={autoSave}
        tabIndex={0}
        onClick={() => onAutoSaveChange(!autoSave)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAutoSaveChange(!autoSave); }}
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
        onClick={onValidate}
        className={`validate-btn validate-btn--${validationStatus}`}
      >
        <PlaylistAddCheckIcon sx={{ fontSize: 13 }} />
        Validate
      </button>
      <IconBtn title="Empty Trash" onClick={onEmptyTrash}>
        <DeleteForeverIcon sx={{ fontSize: 16, color: trashHasItems ? "#e53935" : undefined }} />
      </IconBtn>
    </div>
  );
}

export interface EditorPanelsProps {
  autoSave: boolean;
  onAutoSaveChange: (value: boolean) => void;
}

export function EditorPanels({ autoSave, onAutoSaveChange }: Readonly<EditorPanelsProps>) {
  const activeFile = useProjectStore((s) => s.activeFile);
  const isSchema = activeFile?.type === "schema";
  const isTestdata = activeFile?.type === "testdata";
  const isJsonEditor = isSchema || isTestdata;

  const [rightPanel, setRightPanel] = useState<"yaml" | "graph" | "sequence" | "none">("yaml");
  const [yamlReadOnly, setYamlReadOnly] = useState(true);
  const [trashHasItems, setTrashHasItems] = useState(false);

  const handleRefreshYaml = () => {
    globalThis.dispatchEvent(new Event("testlab:force-sync"));
  };

  const showValidation = useEditorStore((s) => s.showValidation);
  const setShowValidation = useEditorStore((s) => s.setShowValidation);
  const storeErrors = useEditorStore((s) => s.errors);

  const isConnected = useExecutionStore((s) => s.isConnected);
  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const jobStatus = useExecutionStore((s) => s.jobStatus);
  const showExecutionPanel = isConnected && (isExecuting || jobStatus !== null);

  const { issues: validationIssues, status: validationStatus } = useValidation(showValidation, storeErrors);

  const handleValidate = () => setShowValidation(!showValidation);

  const handleEmptyTrash = () => {
    emptyWorkspaceTrash(setTrashHasItems);
  };

  const blockEditorAfterTitle = activeFile?.type === "test" && activeFile.name ? (
    <EditableFileName
      name={activeFile.name}
      extension=".yaml"
      onRename={(newName) => useProjectStore.getState().renameTest(activeFile.name, newName)}
    />
  ) : undefined;

  const jsonEditorAfterTitle = activeFile?.name ? (
    <EditableFileName
      name={activeFile.name}
      extension=".json"
      onRename={(newName) => {
        const store = useProjectStore.getState();
        const rename = isTestdata ? store.renameTestdata : store.renameSchema;
        rename(activeFile.name, newName);
      }}
    />
  ) : undefined;

  const leftPanelSize = rightPanel === "none" ? 100 : 50;
  const showRightPanel = rightPanel !== "none" || isJsonEditor;
  const rightPanelSize = isJsonEditor ? 100 : 50;
  const showCollapsedButton = rightPanel === "none" && !isJsonEditor;

  return (
    <div className="editor-area">
      <div className="editor-area__horizontal">
      <Group orientation="horizontal" className="editor-panels">
        {!isJsonEditor && (
          <Panel defaultSize={leftPanelSize} minSize={20}>
            <div className="panel-container">
              <PanelHeader
                title="Block Editor"
                icon={<ExtensionIcon sx={{ fontSize: 16 }} />}
                afterTitle={blockEditorAfterTitle}
                extra={
                  <BlockEditorToolbar
                    autoSave={autoSave}
                    onAutoSaveChange={onAutoSaveChange}
                    validationStatus={validationStatus}
                    onValidate={handleValidate}
                    trashHasItems={trashHasItems}
                    onEmptyTrash={handleEmptyTrash}
                  />
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
        {showRightPanel && (
          <>
            <Separator className="panel-separator" />
            <Panel defaultSize={rightPanelSize} minSize={20}>
              <div className="panel-container">
                {isJsonEditor ? (
                  <PanelHeader
                    title={isTestdata ? "Testdata Editor" : "Schema Editor"}
                    icon={<EditNoteIcon sx={{ fontSize: 16 }} />}
                    afterTitle={jsonEditorAfterTitle}
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
                  <RightPanelContent isSchema={isSchema} isTestdata={isTestdata} isJsonEditor={isJsonEditor} rightPanel={rightPanel} yamlReadOnly={yamlReadOnly} />
                </div>
              </div>
            </Panel>
          </>
        )}
      </Group>
      {showCollapsedButton && (
        <button
          className="editor-panels__right-collapsed"
          title="Show YAML Editor"
          type="button"
          onClick={() => setRightPanel("yaml")}
        >
          YAML Editor
        </button>
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
