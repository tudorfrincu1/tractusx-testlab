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

import { useRef, useState } from "react";
import { useProjectStore } from "../../../store/slices/useProjectStore";
import { yamlToModel } from "../../../sync";
import { importProjectZip, importExampleFolder } from "../../../store/project/projectIO";
import { ExportDialog } from "../../ExportDialog/ExportDialog";
import { ConfirmDialog } from "../../ConfirmDialog";
import { theme } from "../../../theme/tractusxTheme";
import ScienceIcon from "@mui/icons-material/Science";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { ToolbarButton } from "./TopBarButtons";
import { TopBarExampleMenu } from "./TopBarExampleMenu";
import { ExecuteButton } from "../../ExecutionControls/ExecuteButton";
import { CompileButton } from "../../ExecutionControls/CompileButton";
import { BackendSettings } from "../../ExecutionControls/BackendSettings";
import { useAutoCompile } from "../../../hooks/useAutoCompile";
import "../../ExecutionControls/ExecutionControls.css";
import "./TopBar.css";

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName);
  const hasProject = useProjectStore((s) => s.hasProject);
  const isAnyDirty = useProjectStore((s) => s.isAnyDirty);
  const activeFile = useProjectStore((s) => s.activeFile);
  const tests = useProjectStore((s) => s.tests);
  const loadFromDocument = useProjectStore((s) => s.loadFromDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);

  useAutoCompile();

  const handleNewProject = () => {
    const hasContent = tests.size > 0;
    if (hasContent) {
      setShowNewProjectConfirm(true);
    } else {
      useProjectStore.setState({ hasProject: false, activeFile: null });
    }
  };

  const handleConfirmNewProject = () => {
    setShowNewProjectConfirm(false);
    useProjectStore.setState({ hasProject: false, activeFile: null });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (/\.zip$/i.test(file.name)) {
      const project = await importProjectZip(file);
      if (project) {
        useProjectStore.setState({
          hasProject: true,
          projectName: project.projectName,
          testCase: project.testCase,
          tests: project.tests,
          schemas: project.schemas,
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
          dirty: new Map(),
        });
        useProjectStore.getState().saveToLocalStorage();
      }
    } else {
      const text = await file.text();
      const result = yamlToModel(text);
      if (result.ok) {
        loadFromDocument(result.model, result.model.name);
      }
    }
    e.target.value = "";
  };

  const [showExampleMenu, setShowExampleMenu] = useState(false);

  const handleLoadExample = async (file: string) => {
    try {
      const project = await importExampleFolder(file);
      if (project) {
        useProjectStore.setState({
          hasProject: true,
          projectName: project.projectName,
          projectGeneration: useProjectStore.getState().projectGeneration + 1,
          testCase: project.testCase,
          tests: project.tests,
          schemas: project.schemas,
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
          dirty: new Map(),
          workspaceStates: {},
        });
      }
    } catch {
      // Example not available or parse error
    }
    setShowExampleMenu(false);
  };

  return (
    <div className="topbar">
      {/* Left: logo + project name */}
      <div className="topbar__left">
        <div className="topbar__logo">
          <ScienceIcon sx={{ fontSize: 22, color: theme.colors.primary }} />
          <span
            className="topbar__logo-text"
            style={{ color: theme.colors.primary }}
          >
            TestLab IDE
          </span>
        </div>
        {hasProject && (
        <>
        <span
          className="topbar__project-name"
          style={{ color: theme.colors.textMuted }}
        >
          {projectName}
          {isAnyDirty() ? " •" : ""}
        </span>
        {activeFile && (
          <span
            className={`topbar__active-file topbar__active-file--${
              activeFile.type === "tck" ? "tck" : activeFile.type === "schema" ? "schema" : "other"
            }`}
            style={{
              background:
                activeFile.type === "tck"
                  ? undefined
                  : activeFile.type === "schema"
                    ? undefined
                    : theme.colors.bgLighter,
              color:
                activeFile.type === "tck"
                  ? theme.colors.primary
                  : activeFile.type === "schema"
                    ? undefined
                    : theme.colors.textMuted,
            }}
          >
            {activeFile.type === "tck" ? (
              <PlaylistAddIcon sx={{ fontSize: 12 }} />
            ) : activeFile.type === "schema" ? (
              <InsertDriveFileIcon sx={{ fontSize: 12 }} />
            ) : (
              <ScienceIcon sx={{ fontSize: 12 }} />
            )}
            {activeFile.type === "tck" ? "index.yaml" : `${activeFile.name}.${activeFile.type === "schema" ? "json" : "yaml"}`}
          </span>
        )}
        </>
        )}
      </div>

      {/* Right: actions */}
      {hasProject && (
      <div className="topbar__right">
        <CompileButton />
        <ExecuteButton />
        <BackendSettings />
        <div className="execution-divider" />
        <ToolbarButton
          label="New Project"
          icon={<NoteAddIcon sx={{ fontSize: 14 }} />}
          onClick={handleNewProject}
        />
        <ToolbarButton
          label="Import"
          icon={<FileUploadIcon sx={{ fontSize: 14 }} />}
          onClick={handleImport}
        />
        <ToolbarButton
          label="Export"
          icon={<FileDownloadIcon sx={{ fontSize: 14 }} />}
          onClick={() => setShowExportDialog(true)}
        />
        <div className="topbar__example-wrapper">
          <ToolbarButton
            label="Example"
            icon={<FolderOpenIcon sx={{ fontSize: 14 }} />}
            onClick={() => setShowExampleMenu(!showExampleMenu)}
          />
          {showExampleMenu && (
            <TopBarExampleMenu onLoadExample={handleLoadExample} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.zip"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      )}
      {showExportDialog && <ExportDialog onClose={() => setShowExportDialog(false)} />}
      {showNewProjectConfirm && (
        <ConfirmDialog
          title="Create New Project"
          message="Are you sure you want to create a new project? Your project will be lost if you didn't export it."
          confirmLabel="Create New Project"
          onConfirm={handleConfirmNewProject}
          onCancel={() => setShowNewProjectConfirm(false)}
        />
      )}
    </div>
  );
}


