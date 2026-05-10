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
import HttpIcon from "@mui/icons-material/Http";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorageIcon from "@mui/icons-material/Storage";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName);
  const hasProject = useProjectStore((s) => s.hasProject);
  const isAnyDirty = useProjectStore((s) => s.isAnyDirty);
  const activeFile = useProjectStore((s) => s.activeFile);
  const createProject = useProjectStore((s) => s.createProject);
  const loadFromDocument = useProjectStore((s) => s.loadFromDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

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
          activeFile: { type: "test-case", name: "index" },
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
          activeFile: { type: "test-case", name: "index" },
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
                activeFile.type === "test-case"
                  ? "rgba(255, 215, 0, 0.15)"
                  : activeFile.type === "schema"
                    ? "rgba(66, 165, 245, 0.15)"
                    : theme.colors.bgLighter,
              color:
                activeFile.type === "test-case"
                  ? theme.colors.primary
                  : activeFile.type === "schema"
                    ? "#42a5f5"
                    : theme.colors.textMuted,
              border: `1px solid ${
                activeFile.type === "test-case"
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
            {activeFile.type === "test-case" ? (
              <PlaylistAddIcon sx={{ fontSize: 12 }} />
            ) : activeFile.type === "schema" ? (
              <InsertDriveFileIcon sx={{ fontSize: 12 }} />
            ) : (
              <ScienceIcon sx={{ fontSize: 12 }} />
            )}
            {activeFile.type === "test-case" ? "index.yaml" : `${activeFile.name}.${activeFile.type === "schema" ? "json" : "yaml"}`}
          </span>
        )}
        </>
        )}
      </div>

      {/* Right: actions */}
      {hasProject && (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: theme.colors.bgLighter,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 6,
                overflow: "hidden",
                zIndex: 100,
                minWidth: 240,
                maxHeight: 360,
                overflowY: "auto",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ padding: "6px 12px", fontSize: 10, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Base Tests
              </div>
              <DropdownItem
                icon={<HttpIcon sx={{ fontSize: 16 }} />}
                label="Connector Ping"
                description="Verify connector responds to catalog query"
                onClick={() => handleLoadExample("connector-ping-v1.0/index.yaml")}
              />
              <DropdownItem
                icon={<StorageIcon sx={{ fontSize: 16 }} />}
                label="DTR Ping"
                description="Negotiate dataplane access to DTR"
                onClick={() => handleLoadExample("dtr-ping-v1.0/index.yaml")}
              />
              <div style={{ padding: "6px 12px", fontSize: 10, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", borderTop: `1px solid ${theme.colors.border}` }}>
                Industry Core
              </div>
              <DropdownItem
                icon={<AccountTreeIcon sx={{ fontSize: 16 }} />}
                label="Industry Core Validation"
                description="Shell descriptors + submodel validation"
                onClick={() => handleLoadExample("industry-core-validation-v1.0/index.yaml")}
              />
              <div style={{ padding: "6px 12px", fontSize: 10, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", borderTop: `1px solid ${theme.colors.border}` }}>
                Use Cases
              </div>
              <DropdownItem
                icon={<NotificationsActiveIcon sx={{ fontSize: 16 }} />}
                label="Traceability Notification"
                description="Quality investigation + alert flows"
                onClick={() => handleLoadExample("traceability-notification-v1.0/index.yaml")}
              />
              <DropdownItem
                icon={<PlaylistAddIcon sx={{ fontSize: 16 }} />}
                label="Certificate Management"
                description="CCMAPI offer, validation, feedback"
                onClick={() => handleLoadExample("certificate-management-v1.0/index.yaml")}
              />
              <DropdownItem
                icon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                label="Special Characteristics"
                description="Notification + data transfer validation"
                onClick={() => handleLoadExample("special-characteristics-v1.0/index.yaml")}
              />
              <DropdownItem
                icon={<ScienceIcon sx={{ fontSize: 16 }} />}
                label="Product Carbon Footprint"
                description="PCF data discovery + schema validation"
                onClick={() => handleLoadExample("product-carbon-footprint-v1.0/index.yaml")}
              />
            </div>
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

function ToolbarButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: theme.colors.text,
        background: theme.colors.bgLighter,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 4,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.colors.bgLightest;
        e.currentTarget.style.borderColor = theme.colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme.colors.bgLighter;
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function DropdownItem({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 14px",
        background: "transparent",
        border: "none",
        color: theme.colors.text,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.colors.bgLightest;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: theme.colors.primary, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{description}</div>
      </div>
    </button>
  );
}
