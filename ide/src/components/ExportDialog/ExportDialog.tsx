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

import { useMemo, useState } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { modelToYaml } from "../../sync/modelToYaml";
import { theme } from "../../theme/tractusxTheme";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import DataObjectIcon from "@mui/icons-material/DataObject";
import ScienceIcon from "@mui/icons-material/Science";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const testCase = useProjectStore((s) => s.testCase);
  const tests = useProjectStore((s) => s.tests);
  const schemas = useProjectStore((s) => s.schemas);
  const testOrder = useProjectStore((s) => s.testOrder);
  const exportZip = useProjectStore((s) => s.exportZip);
  const exportFile = useProjectStore((s) => s.exportFile);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTree = useMemo(() => {
    const items: FileNode[] = [];
    items.push({ path: "index.yaml", type: "test-case", name: "index", size: modelToYaml(testCase).length });
    for (const name of testOrder) {
      const script = tests.get(name);
      items.push({
        path: `tests/${name}.yaml`,
        type: "test",
        name,
        size: script ? modelToYaml(script).length : 0,
      });
    }
    for (const [name, schema] of schemas) {
      items.push({ path: `schemas/${name}.json`, type: "schema", name, size: schema.content.length });
    }
    return items;
  }, [testCase, tests, schemas, testOrder]);

  const selectedContent = useMemo(() => {
    if (!selectedFile) return null;
    const node = fileTree.find((f) => f.path === selectedFile);
    if (!node) return null;
    if (node.type === "test-case") return modelToYaml(testCase);
    if (node.type === "test") {
      const script = tests.get(node.name);
      return script ? modelToYaml(script) : null;
    }
    if (node.type === "schema") return schemas.get(node.name)?.content ?? null;
    return null;
  }, [selectedFile, fileTree, testCase, tests, schemas]);

  const handleExportZip = () => { exportZip(); onClose(); };

  const handleExportFile = (node: FileNode) => {
    exportFile(node.name, node.type);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 680,
          maxHeight: "80vh",
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileDownloadIcon sx={{ fontSize: 18, color: theme.colors.primary }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textBright }}>
              Export Project
            </span>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {projectName}
            </span>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* File tree */}
          <div style={{
            width: 240,
            borderRight: `1px solid ${theme.colors.border}`,
            overflow: "auto",
            padding: "8px 0",
          }}>
            <div style={{
              padding: "4px 14px",
              fontSize: 10,
              fontWeight: 600,
              color: theme.colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}>
              Project Files
            </div>

            {/* Root folder */}
            <FileTreeRow
              icon={<FolderIcon sx={{ fontSize: 14, color: theme.colors.primary }} />}
              label={projectName}
              depth={0}
              isBold
            />

            {fileTree.map((node) => (
              <FileTreeRow
                key={node.path}
                icon={nodeIcon(node.type)}
                label={node.path.split("/").pop() ?? node.path}
                depth={node.path.includes("/") ? 2 : 1}
                isSelected={selectedFile === node.path}
                size={formatSize(node.size)}
                onClick={() => setSelectedFile(selectedFile === node.path ? null : node.path)}
                onExport={() => handleExportFile(node)}
              />
            ))}
          </div>

          {/* Preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {selectedContent ? (
              <>
                <div style={{
                  padding: "8px 16px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: theme.colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}>
                  Preview — {selectedFile}
                </div>
                <pre style={{
                  flex: 1,
                  margin: 0,
                  padding: 12,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: theme.colors.text,
                  overflow: "auto",
                  background: theme.colors.bg,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 400,
                }}>
                  {selectedContent}
                </pre>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.colors.textMuted,
                fontSize: 12,
              }}>
                Click a file to preview its contents
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderTop: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgLighter,
        }}>
          <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
            {fileTree.length} file{fileTree.length !== 1 ? "s" : ""} •{" "}
            {formatSize(fileTree.reduce((sum, f) => sum + f.size, 0))}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton
              icon={<FolderZipIcon sx={{ fontSize: 14 }} />}
              label="Export ZIP"
              onClick={handleExportZip}
              isPrimary
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Types & helpers ────────────────────────────────────────────────────── */

interface FileNode {
  path: string;
  type: "test-case" | "test" | "schema";
  name: string;
  size: number;
}

function nodeIcon(type: FileNode["type"]) {
  switch (type) {
    case "test-case": return <DescriptionIcon sx={{ fontSize: 14, color: theme.colors.primary }} />;
    case "test": return <ScienceIcon sx={{ fontSize: 14, color: "#66bb6a" }} />;
    case "schema": return <DataObjectIcon sx={{ fontSize: 14, color: "#42a5f5" }} />;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function FileTreeRow({ icon, label, depth, isBold, isSelected, size, onClick, onExport }: {
  icon: React.ReactNode;
  label: string;
  depth: number;
  isBold?: boolean;
  isSelected?: boolean;
  size?: string;
  onClick?: () => void;
  onExport?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: `3px 10px 3px ${12 + depth * 14}px`,
        cursor: onClick ? "pointer" : "default",
        background: isSelected ? theme.colors.bgLighter : "transparent",
        fontSize: 12,
        fontWeight: isBold ? 600 : 400,
        color: isSelected ? theme.colors.textBright : theme.colors.text,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = theme.colors.bgLighter; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {size && <span style={{ fontSize: 9, color: theme.colors.textMuted }}>{size}</span>}
      {onExport && (
        <button
          onClick={(e) => { e.stopPropagation(); onExport(); }}
          title="Export this file"
          style={{ ...iconBtnStyle, opacity: 0.4, padding: 2 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  );
}

function ExportButton({ icon, label, onClick, isPrimary }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 600,
        color: isPrimary ? "#000" : theme.colors.text,
        background: isPrimary ? theme.colors.primary : theme.colors.bgLight,
        border: `1px solid ${isPrimary ? theme.colors.primary : theme.colors.border}`,
        borderRadius: 6,
        cursor: "pointer",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      {icon}
      {label}
    </button>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  borderRadius: 4,
  padding: 4,
};
