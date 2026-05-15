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

import { useState, useCallback } from "react";
import { theme } from "../../theme/tractusxTheme";
import { useProjectStore, type ActiveFile } from "../../store/useProjectStore";
import { ExplorerContextMenu, type ContextTarget } from "./ExplorerContextMenu";
import { ExplorerActions } from "./ExplorerActions";
import { TreeRow } from "./TreeRow";
import { useTestDragReorder } from "./useTestDragReorder";

import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ScienceIcon from "@mui/icons-material/Science";
import DataObjectIcon from "@mui/icons-material/DataObject";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: ContextTarget } | null>(null);

  const projectName = useProjectStore((s) => s.projectName);
  const testOrder = useProjectStore((s) => s.testOrder);
  const schemas = useProjectStore((s) => s.schemas);
  const activeFile = useProjectStore((s) => s.activeFile);
  const dirty = useProjectStore((s) => s.dirty);
  const reorderTest = useProjectStore((s) => s.reorderTest);

  const { dragOver, handleDragStart, handleDragOver, handleDragLeave, handleDrop } =
    useTestDragReorder(testOrder, reorderTest);

  useState(() => { ensureStyles(); });

  const schemaNames = [...schemas.keys()];

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
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.colors.bg,
        borderRight: `1px solid ${theme.colors.border}`,
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          height: 32, padding: "0 12px",
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgLight,
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FolderSpecialIcon sx={{ fontSize: 16, color: theme.colors.primary }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.06em",
              color: theme.colors.textMuted,
              textTransform: "uppercase",
            }}
          >
            Explorer
          </span>
        </div>
        {onCollapse && (
          <button
            title="Collapse Explorer"
            onClick={onCollapse}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0 4px", display: "inline-flex", alignItems: "center", gap: 2,
              color: theme.colors.textMuted, borderRadius: 4,
              minWidth: 28, height: 28, justifyContent: "center",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.text; e.currentTarget.style.background = theme.colors.bgLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            <ChevronLeftIcon sx={{ fontSize: 14 }} />
            <VerticalSplitIcon sx={{ fontSize: 16, transform: "scaleX(-1)" }} />
          </button>
        )}
      </div>

      {/* ── Tree ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
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
              badge={String(idx + 1)}
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
            style={{
              paddingLeft: 52,
              padding: "6px 14px 6px 52px",
              fontSize: 11,
              color: theme.colors.textMuted,
              fontStyle: "italic",
            }}
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
            style={{
              padding: "6px 14px 6px 52px",
              fontSize: 11,
              color: theme.colors.textMuted,
              fontStyle: "italic",
            }}
          >
            No schemas
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
