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

import { useState, useEffect, useCallback } from "react";
import { theme } from "@/shared/theme/tractusxTheme";
import { useProjectStore, type ActiveFile } from "@/store/project/useProjectStore";
import { ExplorerContextMenu, type ContextTarget } from "./ExplorerContextMenu";
import { ExplorerActions } from "./ExplorerActions";
import { ExplorerHeader } from "./ExplorerHeader";
import "./ProjectExplorer.css";
import { TreeRow } from "./TreeRow";
import { useTestDragReorder } from "./useTestDragReorder";

import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ScienceIcon from "@mui/icons-material/Science";
import DataObjectIcon from "@mui/icons-material/DataObject";
import StorageIcon from "@mui/icons-material/Storage";

/* ── Styles injected once ───────────────────────────────────────────────── */

const STYLE_ID = "project-explorer-styles";
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .pe-row:hover { background: ${theme.colors.bgLight} !important; }
    .pe-row .pe-drag { opacity: 0; transition: opacity 0.12s; }
    .pe-row:hover .pe-drag { opacity: 0.5; }
    .pe-row .pe-drag:hover { opacity: 1 !important; }
    .pe-drag-over { border-top: 2px solid ${theme.colors.primary} !important; }
    .pe-drag-over-bottom { border-bottom: 2px solid ${theme.colors.primary} !important; }
  `;
  document.head.appendChild(s);
}

export interface ProjectExplorerProps {
  onSelectFile: (file: ActiveFile) => void;
  onCollapse?: () => void;
}

export function ProjectExplorer({ onSelectFile, onCollapse }: Readonly<ProjectExplorerProps>) {
  const [testsOpen, setTestsOpen] = useState(true);
  const [schemasOpen, setSchemasOpen] = useState(true);
  const [testdataOpen, setTestdataOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: ContextTarget } | null>(null);

  const projectName = useProjectStore((s) => s.projectName);
  const testOrder = useProjectStore((s) => s.testOrder);
  const schemas = useProjectStore((s) => s.schemas);
  const testdata = useProjectStore((s) => s.testdata);
  const activeFile = useProjectStore((s) => s.activeFile);
  const dirty = useProjectStore((s) => s.dirty);
  const reorderTest = useProjectStore((s) => s.reorderTest);

  const { dragOver, handleDragStart, handleDragOver, handleDragLeave, handleDrop } =
    useTestDragReorder(testOrder, reorderTest);

  useEffect(() => { ensureStyles(); }, []);

  const schemaNames = [...schemas.keys()];
  const testdataNames = [...testdata.keys()];

  const handleClick = useCallback(
    (file: ActiveFile) => {
      onSelectFile(file);
    },
    [onSelectFile],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, target: ContextTarget) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, target });
    },
    [],
  );

  const isActive = (type: ActiveFile["type"], name: string) =>
    activeFile?.type === type && activeFile.name === name;

  const isDirty = (name: string) => dirty.has(name);

  return (
    <div
      className="project-explorer"
      style={{
        background: theme.colors.bg,
        borderRight: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <ExplorerHeader onCollapse={onCollapse} />

      {/* ── Tree ────────────────────────────────────────────────────── */}
      <div className="project-explorer__tree">
        {/* Project root — click opens TCK dashboard */}
        <TreeRow
          depth={0}
          icon={<FolderOpenIcon sx={{ fontSize: 16, color: theme.colors.primary }} />}
          label={projectName}
          isBold
          isActive={isActive("tck", "index")}
          isDirty={isDirty("index")}
          onClick={() => handleClick({ type: "tck", name: "index" })}
          onContextMenu={(e) => handleContextMenu(e, { type: "project" })}
        />

        {/* tests/ folder */}
        <TreeRow
          depth={1}
          icon={
            testsOpen
              ? <FolderOpenIcon sx={{ fontSize: 16, color: "#66bb6a" }} />
              : <FolderIcon sx={{ fontSize: 16, color: "#66bb6a" }} />
          }
          label="tests"
          isFolder
          isOpen={testsOpen}
          onClick={() => setTestsOpen((v) => !v)}
          onContextMenu={(e) => handleContextMenu(e, { type: "tests-folder" })}
          badge={testOrder.length > 0 ? String(testOrder.length) : undefined}
        />

        {testsOpen &&
          testOrder.map((name, idx) => (
            <TreeRow
              key={name}
              depth={2}
              icon={<ScienceIcon sx={{ fontSize: 15, color: "#66bb6a" }} />}
              label={`${name}.yaml`}
              isActive={isActive("test", name)}
              isDirty={isDirty(name)}
              draggable
              isDragOver={dragOver?.name === name ? dragOver.pos : undefined}
              onClick={() => handleClick({ type: "test", name })}
              onContextMenu={(e) => handleContextMenu(e, { type: "test", name })}
              onDragStart={() => handleDragStart(name)}
              onDragOver={(e) => handleDragOver(e, name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, name)}
            />
          ))}

        {testsOpen && testOrder.length === 0 && (
          <div
            className="project-explorer__empty"
            style={{ color: theme.colors.textMuted }}
          >
            No tests yet
          </div>
        )}

        {/* schemas/ folder */}
        <TreeRow
          depth={1}
          icon={
            schemasOpen
              ? <FolderOpenIcon sx={{ fontSize: 16, color: "#42a5f5" }} />
              : <FolderIcon sx={{ fontSize: 16, color: "#42a5f5" }} />
          }
          label="schemas"
          isFolder
          isOpen={schemasOpen}
          onClick={() => setSchemasOpen((v) => !v)}
          onContextMenu={(e) => handleContextMenu(e, { type: "schemas-folder" })}
          badge={schemaNames.length > 0 ? String(schemaNames.length) : undefined}
        />

        {schemasOpen &&
          schemaNames.map((name) => (
            <TreeRow
              key={name}
              depth={2}
              icon={<DataObjectIcon sx={{ fontSize: 15, color: "#42a5f5" }} />}
              label={`${name}.json`}
              isActive={isActive("schema", name)}
              onClick={() => handleClick({ type: "schema", name })}
              onContextMenu={(e) => handleContextMenu(e, { type: "schema", name })}
            />
          ))}

        {schemasOpen && schemaNames.length === 0 && (
          <div
            className="project-explorer__empty"
            style={{ color: theme.colors.textMuted }}
          >
            No schemas
          </div>
        )}

        {/* testdata/ folder */}
        <TreeRow
          depth={1}
          icon={
            testdataOpen
              ? <FolderOpenIcon sx={{ fontSize: 16, color: "#ab47bc" }} />
              : <FolderIcon sx={{ fontSize: 16, color: "#ab47bc" }} />
          }
          label="testdata"
          isFolder
          isOpen={testdataOpen}
          onClick={() => setTestdataOpen((v) => !v)}
          onContextMenu={(e) => handleContextMenu(e, { type: "testdata-folder" })}
          badge={testdataNames.length > 0 ? String(testdataNames.length) : undefined}
        />

        {testdataOpen &&
          testdataNames.map((name) => (
            <TreeRow
              key={name}
              depth={2}
              icon={<StorageIcon sx={{ fontSize: 15, color: "#ab47bc" }} />}
              label={`${name}.json`}
              isActive={isActive("testdata", name)}
              onClick={() => handleClick({ type: "testdata", name })}
              onContextMenu={(e) => handleContextMenu(e, { type: "testdata", name })}
            />
          ))}

        {testdataOpen && testdataNames.length === 0 && (
          <div
            className="project-explorer__empty"
            style={{ color: theme.colors.textMuted }}
          >
            No testdata
          </div>
        )}
      </div>

      {/* ── Bottom actions ──────────────────────────────────────────── */}
      <ExplorerActions />

      {/* ── Context menu ────────────────────────────────────────────── */}
      {contextMenu && (
        <ExplorerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
