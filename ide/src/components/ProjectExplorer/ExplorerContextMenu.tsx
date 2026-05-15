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
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useEffect, useRef, useState } from "react";
import { theme } from "../../theme/tractusxTheme";
import { useProjectStore } from "../../store/useProjectStore";
import { modelToYaml } from "../../sync/modelToYaml";
import { yamlToModel } from "../../sync/yamlToModel";

import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { SchemaDownloadDialog } from "../SchemaDownloadDialog/SchemaDownloadDialog";
import { YamlPreviewModal, useRenameInput } from "./ExplorerContextMenuParts";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ContextTarget =
  | { type: "project" }
  | { type: "tck"; name: string }
  | { type: "test"; name: string }
  | { type: "schema"; name: string }
  | { type: "tests-folder" }
  | { type: "schemas-folder" };

interface ExplorerContextMenuProps {
  x: number;
  y: number;
  target: ContextTarget;
  onClose: () => void;
}

/* ── Context menu component ─────────────────────────────────────────────── */

export function ExplorerContextMenu({ x, y, target, onClose }: Readonly<ExplorerContextMenuProps>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yamlPreview, setYamlPreview] = useState<string | null>(null);
  const [showSchemaDownload, setShowSchemaDownload] = useState(false);
  const rename = useRenameInput();

  const addTest = useProjectStore((s) => s.addTest);
  const removeTest = useProjectStore((s) => s.removeTest);
  const renameTest = useProjectStore((s) => s.renameTest);
  const duplicateTest = useProjectStore((s) => s.duplicateTest);
  const reorderTest = useProjectStore((s) => s.reorderTest);
  const removeSchema = useProjectStore((s) => s.removeSchema);
  const renameSchema = useProjectStore((s) => s.renameSchema);
  const exportFile = useProjectStore((s) => s.exportFile);
  const exportZip = useProjectStore((s) => s.exportZip);
  const testOrder = useProjectStore((s) => s.testOrder);
  const tests = useProjectStore((s) => s.tests);
  const tck = useProjectStore((s) => s.tck);
  const createProject = useProjectStore((s) => s.createProject);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showSchemaDownload) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, showSchemaDownload]);

  // Adjust menu position to stay in viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 500,
    background: theme.colors.bgLighter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 6,
    overflow: "hidden",
    minWidth: 180,
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    padding: "4px 0",
  };

  const items: { label: string; icon: React.ReactNode; action: () => void; disabled?: boolean }[] = [];

  if (target.type === "test") {
    const idx = testOrder.indexOf(target.name);
    items.push(
      { label: "Rename", icon: <DriveFileRenameOutlineIcon sx={{ fontSize: 15 }} />, action: () => { rename.startRename("test", target.name); onClose(); } },
      { label: "Duplicate", icon: <ContentCopyIcon sx={{ fontSize: 15 }} />, action: () => { duplicateTest(target.name); onClose(); } },
      { label: "Delete", icon: <DeleteOutlineIcon sx={{ fontSize: 15 }} />, action: () => { removeTest(target.name); onClose(); } },
      { label: "Move Up", icon: <ArrowUpwardIcon sx={{ fontSize: 15 }} />, action: () => { reorderTest(target.name, idx - 1); onClose(); }, disabled: idx <= 0 },
      { label: "Move Down", icon: <ArrowDownwardIcon sx={{ fontSize: 15 }} />, action: () => { reorderTest(target.name, idx + 1); onClose(); }, disabled: idx >= testOrder.length - 1 },
      { label: "Export YAML", icon: <FileDownloadIcon sx={{ fontSize: 15 }} />, action: () => { exportFile(target.name, "test"); onClose(); } },
      {
        label: "View YAML",
        icon: <VisibilityIcon sx={{ fontSize: 15 }} />,
        action: () => {
          const model = tests.get(target.name);
          if (model) setYamlPreview(modelToYaml(model));
          onClose();
        },
      },
    );
  } else if (target.type === "tck") {
    items.push(
      { label: "Export YAML", icon: <FileDownloadIcon sx={{ fontSize: 15 }} />, action: () => { exportFile("index", "tck"); onClose(); } },
      {
        label: "View YAML",
        icon: <VisibilityIcon sx={{ fontSize: 15 }} />,
        action: () => { setYamlPreview(modelToYaml(tck)); onClose(); },
      },
    );
  } else if (target.type === "tests-folder") {
    items.push(
      { label: "New Test", icon: <NoteAddIcon sx={{ fontSize: 15 }} />, action: () => { addTest(); onClose(); } },
      { label: "Upload Test", icon: <UploadFileIcon sx={{ fontSize: 15 }} />, action: () => { fileInputRef.current?.click(); } },
    );
  } else if (target.type === "schemas-folder") {
    items.push(
      { label: "Download from Tractus-X", icon: <CloudDownloadIcon sx={{ fontSize: 15 }} />, action: () => { setShowSchemaDownload(true); } },
      { label: "Upload Schema", icon: <UploadFileIcon sx={{ fontSize: 15 }} />, action: () => { fileInputRef.current?.click(); } },
    );
  } else if (target.type === "schema") {
    items.push(
      { label: "Rename", icon: <DriveFileRenameOutlineIcon sx={{ fontSize: 15 }} />, action: () => { rename.startRename("schema", target.name); onClose(); } },
      { label: "Delete", icon: <DeleteOutlineIcon sx={{ fontSize: 15 }} />, action: () => { removeSchema(target.name); onClose(); } },
      { label: "Export JSON", icon: <FileDownloadIcon sx={{ fontSize: 15 }} />, action: () => { exportFile(target.name, "schema"); onClose(); } },
    );
  } else if (target.type === "project") {
    items.push(
      { label: "Rename Project", icon: <EditIcon sx={{ fontSize: 15 }} />, action: () => { rename.startRename("project", useProjectStore.getState().projectName); onClose(); } },
      { label: "Export ZIP", icon: <FolderZipIcon sx={{ fontSize: 15 }} />, action: () => { exportZip(); onClose(); } },
      { label: "New Project", icon: <NoteAddIcon sx={{ fontSize: 15 }} />, action: () => { createProject(); onClose(); } },
    );
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      file.text().then((content) => {
        if (target.type === "schemas-folder" || /\.json$/i.test(file.name)) {
          const name = file.name.replace(/\.json$/i, "");
          useProjectStore.getState().addSchema(name, content);
        } else {
          const result = yamlToModel(content);
          if (result.ok && result.model.kind === "test") {
            const name = file.name.replace(/\.(yaml|yml)$/i, "").replace(/_/g, "-");
            const testName = useProjectStore.getState().addTest(name);
            useProjectStore.getState().updateTest(testName, result.model);
          }
        }
      });
    }
    e.target.value = "";
    onClose();
  };

  /* ── Rename handling ────────────────────────────────────────────────── */

  if (rename.renaming) {
    const handleSubmit = () => {
      const { type, name } = rename.renaming!;
      if (type === "test") renameTest(name, rename.value);
      else if (type === "schema") renameSchema(name, rename.value);
      else if (type === "project") {
        const s = useProjectStore.getState();
        const tc = { ...s.tck, name: rename.value.trim() };
        s.updateTck(tc);
        useProjectStore.setState({ projectName: rename.value.trim() });
        s.saveToLocalStorage();
      }
      rename.cancelRename();
    };

    return (
      <div ref={menuRef} style={{ ...style, padding: 8 }}>
        <input
          autoFocus
          value={rename.value}
          onChange={(e) => rename.setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") rename.cancelRename();
          }}
          onBlur={handleSubmit}
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: 12,
            background: theme.colors.bg,
            border: `1px solid ${theme.colors.primary}`,
            borderRadius: 3,
            color: theme.colors.text,
            outline: "none",
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div ref={menuRef} style={style}>
        {items.map((item) => (
          <button
            key={item.label}
            disabled={item.disabled}
            onClick={item.action}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 12px",
              background: "transparent",
              border: "none",
              color: item.disabled ? theme.colors.textMuted : theme.colors.text,
              cursor: item.disabled ? "default" : "pointer",
              fontSize: 12,
              textAlign: "left",
              opacity: item.disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = theme.colors.bgLightest;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ color: theme.colors.primary, flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.json"
          multiple
          style={{ display: "none" }}
          onChange={handleUpload}
        />
      </div>
      {yamlPreview !== null && (
        <YamlPreviewModal yaml={yamlPreview} onClose={() => setYamlPreview(null)} />
      )}
      {showSchemaDownload && (
        <SchemaDownloadDialog onClose={() => { setShowSchemaDownload(false); onClose(); }} />
      )}
    </>
  );
}
