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
import { useProjectStore } from "../../store/useProjectStore";
import { yamlToModel } from "../../sync/yamlToModel";
import { importProjectZip, importExampleFolder } from "../../store/projectIO";
import { ExportDialog } from "../ExportDialog/ExportDialog";
import { theme } from "../../theme/tractusxTheme";
import ScienceIcon from "@mui/icons-material/Science";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { ToolbarButton } from "./TopBarButtons";
import { TopBarExampleMenu } from "./TopBarExampleMenu";
import { ExecuteButton } from "../ExecutionControls/ExecuteButton";
import { CompileButton } from "../ExecutionControls/CompileButton";
import { BackendSettings } from "../ExecutionControls/BackendSettings";
import { useAutoCompile } from "../../hooks/useAutoCompile";
import "../ExecutionControls/ExecutionControls.css";

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName);
  const hasProject = useProjectStore((s) => s.hasProject);
  const isAnyDirty = useProjectStore((s) => s.isAnyDirty);
  const activeFile = useProjectStore((s) => s.activeFile);
  const createProject = useProjectStore((s) => s.createProject);
  const loadFromDocument = useProjectStore((s) => s.loadFromDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useAutoCompile();

  const handleGoHome = () => {
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
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
      }}
    >
      {/* Left: logo + project name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleGoHome}
          title="Back to Welcome Screen"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px 4px 0",
            borderRadius: 4,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <ScienceIcon sx={{ fontSize: 22, color: theme.colors.primary }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: theme.colors.primary,
              letterSpacing: "0.05em",
            }}
          >
            TestLab IDE
          </span>
        </button>
        {hasProject && (
        <>
        <span
          style={{
            fontSize: 13,
            color: theme.colors.textMuted,
            marginLeft: 8,
          }}
        >
          {projectName}
          {isAnyDirty() ? " •" : ""}
        </span>
        {activeFile && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background:
                activeFile.type === "tck"
                  ? "rgba(255, 215, 0, 0.15)"
                  : activeFile.type === "schema"
                    ? "rgba(66, 165, 245, 0.15)"
                    : theme.colors.bgLighter,
              color:
                activeFile.type === "tck"
                  ? theme.colors.primary
                  : activeFile.type === "schema"
                    ? "#42a5f5"
                    : theme.colors.textMuted,
              border: `1px solid ${
                activeFile.type === "tck"
                  ? theme.colors.primary
                  : activeFile.type === "schema"
                    ? "#42a5f5"
                    : theme.colors.border
              }`,
              display: "flex",
              alignItems: "center",
              gap: 4,
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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CompileButton />
        <ExecuteButton />
        <BackendSettings />
        <div className="execution-divider" />
        <ToolbarButton
          label="New Project"
          icon={<NoteAddIcon sx={{ fontSize: 14 }} />}
          onClick={() => createProject()}
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
        <div style={{ position: "relative" }}>
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
    </div>
  );
}


