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
import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store";
import { useEditorStore } from "@/store";
import { useServiceStore } from "@/store";
import { yamlToModel } from "@/services";
import { importProjectZip, importExampleFolder } from "@/services/project";
import { ExportDialog } from "@/features/export";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { theme } from "@/shared/theme/tractusxTheme";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import { ToolbarButton } from "./TopBarButtons";
import { TopBarExampleMenu } from "./TopBarExampleMenu";
import { TopBarHamburgerMenu, HamburgerMenuItem } from "./TopBarHamburgerMenu";
import { ExecuteButton } from "./controls/ExecuteButton";
import { CompileButton } from "./controls/CompileButton";
import { BackendSettings } from "./controls/BackendSettings";
export function TopBar() {
  const hasProject = useProjectStore((s) => s.hasProject);
  const activeFile = useProjectStore((s) => s.activeFile);
  const tests = useProjectStore((s) => s.tests);
  const loadFromDocument = useProjectStore((s) => s.loadFromDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);

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

  const handleProjectInfo = () => {
    useProjectStore.setState({
      activeFile: { type: "tck", name: "index" },
    });
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
          tck: project.tck,
          tests: project.tests,
          schemas: project.schemas,
          testdata: project.testdata ?? new Map(),
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
          dirty: new Map(),
        });

        const activeModel = useProjectStore.getState().getActiveModel();
        if (activeModel) {
          useEditorStore.getState().loadModel(activeModel);
        }
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
  const exampleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExampleMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exampleMenuRef.current && !exampleMenuRef.current.contains(e.target as Node)) {
        setShowExampleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExampleMenu]);

  const handleLoadExample = async (file: string) => {
    try {
      const project = await importExampleFolder(file);
      if (project) {
        useProjectStore.setState({
          hasProject: true,
          projectName: project.projectName,
          projectGeneration: useProjectStore.getState().projectGeneration + 1,
          tck: project.tck,
          tests: project.tests,
          schemas: project.schemas,
          testdata: project.testdata ?? new Map(),
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
          dirty: new Map(),
          workspaceStates: {},
        });

        const services = project.tck.env?.services ?? [];
        useServiceStore.getState().setServices(services);

        const activeModel = useProjectStore.getState().getActiveModel();
        if (activeModel) {
          useEditorStore.getState().loadModel(activeModel);
        }
        useProjectStore.getState().saveToLocalStorage();
      }
    } catch { /* Example not available */ }
    setShowExampleMenu(false);
  };

  const hamburgerItems: HamburgerMenuItem[] = [
    { label: "Project Info", icon: <InfoOutlinedIcon sx={{ fontSize: 16 }} />, onClick: handleProjectInfo, active: activeFile?.type === "tck" && activeFile?.name === "index" },
    { label: "Environment", icon: <TuneIcon sx={{ fontSize: 16 }} />, onClick: () => useProjectStore.setState({ activeFile: { type: "environment", name: "config" } }), active: activeFile?.type === "environment" },
    { label: "Preconditions", icon: <SecurityOutlinedIcon sx={{ fontSize: 16 }} />, onClick: () => useProjectStore.setState({ activeFile: { type: "preconditions", name: "root" } }) },
    { label: "New Project", icon: <NoteAddIcon sx={{ fontSize: 16 }} />, onClick: handleNewProject, dividerBefore: true },
    { label: "Import", icon: <FileUploadIcon sx={{ fontSize: 16 }} />, onClick: handleImport },
    { label: "Export", icon: <FileDownloadIcon sx={{ fontSize: 16 }} />, onClick: () => setShowExportDialog(true) },
    { label: "Example", icon: <FolderOpenIcon sx={{ fontSize: 16 }} />, onClick: () => setShowExampleMenu(!showExampleMenu) },
  ];

  return (
    <div className="topbar-container">
    <div className="topbar">
      {/* Left: logo */}
      <div className="topbar__left">
        <div className="topbar__logo">
          <img
            src={`${import.meta.env.BASE_URL}just-logo-app-white.png`}
            alt="Test Lab"
            className="topbar__logo-img"
          />
          <span
            className="topbar__logo-text"
          >
            Test Lab TCK Builder
          </span>
        </div>
      </div>

      {/* Right: actions */}
      {hasProject && (
      <>
      <div className="topbar__right">
        <CompileButton />
        <ExecuteButton />
        <BackendSettings />
        <TopBarHamburgerMenu items={hamburgerItems} />
        <div className="topbar__nav">
          <div className="execution-divider" />
          <ToolbarButton
            label="Project Info"
            icon={<InfoOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={handleProjectInfo}
            active={activeFile?.type === "tck" && activeFile?.name === "index"}
          />
          <ToolbarButton
            label="Environment"
            icon={<TuneIcon sx={{ fontSize: 14 }} />}
            onClick={() => useProjectStore.setState({ activeFile: { type: "environment", name: "config" } })}
            active={activeFile?.type === "environment"}
          />
          <ToolbarButton
            label="Preconditions"
            icon={<SecurityOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={() => useProjectStore.setState({ activeFile: { type: "preconditions", name: "root" } })}
          />
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
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.zip"
          className="topbar__hidden-input"
          onChange={handleFileChange}
          aria-label="Import project file"
        />
      </div>
      {showExampleMenu && (
        <div className="topbar__example-dropdown" ref={exampleMenuRef}>
          <TopBarExampleMenu onLoadExample={handleLoadExample} />
        </div>
      )}
      </>
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
    </div>
  );
}

