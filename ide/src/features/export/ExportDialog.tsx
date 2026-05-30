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
import { useProjectStore } from "@/store";
import { modelToYaml } from "@/services";
import { theme } from "@/shared/theme/tractusxTheme";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  type FileNode, nodeIcon, formatSize,
  FileTreeRow, ExportButton, iconBtnStyle,
} from "./ExportDialogParts";

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const schemas = useProjectStore((s) => s.schemas);
  const testOrder = useProjectStore((s) => s.testOrder);
  const exportZip = useProjectStore((s) => s.exportZip);
  const exportFile = useProjectStore((s) => s.exportFile);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTree = useMemo(() => {
    const items: FileNode[] = [];
    items.push({ path: "index.yaml", type: "tck", name: "index", size: modelToYaml(tck).length });
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
  }, [tck, tests, schemas, testOrder]);

  const selectedContent = useMemo(() => {
    if (!selectedFile) return null;
    const node = fileTree.find((f) => f.path === selectedFile);
    if (!node) return null;
    if (node.type === "tck") return modelToYaml(tck);
    if (node.type === "test") {
      const script = tests.get(node.name);
      return script ? modelToYaml(script) : null;
    }
    if (node.type === "schema") return schemas.get(node.name)?.content ?? null;
    return null;
  }, [selectedFile, fileTree, tck, tests, schemas]);

  const handleExportZip = () => { exportZip(); onClose(); };

  const handleExportFile = (node: FileNode) => {
    exportFile(node.name, node.type);
  };

  return (
    <div
      className="export-dialog__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Export project"
    >
      <div
        className="export-dialog__panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="export-dialog__header">
          <div className="export-dialog__header-left">
            <FileDownloadIcon sx={{ fontSize: 18, color: theme.colors.primary }} />
            <span className="export-dialog__title">
              Export Project
            </span>
            <span className="export-dialog__project-name">
              {projectName}
            </span>
          </div>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Close export dialog" title="Close export dialog">
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div className="export-dialog__body">
          {/* File tree */}
          <div className="export-dialog__file-tree">
            <div className="export-dialog__file-tree-header">
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
          <div className="export-dialog__preview">
            {selectedContent ? (
              <>
                <div className="export-dialog__preview-header">
                  Preview — {selectedFile}
                </div>
                <pre className="export-dialog__preview-content">
                  {selectedContent}
                </pre>
              </>
            ) : (
              <div className="export-dialog__preview-empty">
                Click a file to preview its contents
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="export-dialog__footer">
          <span className="export-dialog__footer-info">
            {fileTree.length} file{fileTree.length !== 1 ? "s" : ""} •{" "}
            {formatSize(fileTree.reduce((sum, f) => sum + f.size, 0))}
          </span>
          <div className="export-dialog__footer-actions">
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


