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

import { useProjectStore } from "@/store";
import { FolderIcon, FolderOpenIcon, FileTypeIcon, ViewTypeIcon } from "./ContextBarIcons";

/** Types that represent TCK-level views (not files in folders) */
const TCK_VIEW_TYPES = new Set(["tck", "environment", "preconditions"]);

/** Human-readable labels for TCK-level views */
const VIEW_LABELS: Record<string, string> = {
  tck: "Project Info",
  environment: "Environment",
  preconditions: "Preconditions",
};

/** Folder labels for actual file types */
const FOLDER_LABELS: Record<string, string> = {
  test: "tests",
  schema: "schemas",
  testdata: "testdata",
};

function getFileLabel(type: string, name: string): string {
  const ext = type === "schema" || type === "testdata" ? "json" : "yaml";
  return `${name}.${ext}`;
}

export function ContextBar() {
  const projectName = useProjectStore((s) => s.projectName);
  const hasProject = useProjectStore((s) => s.hasProject);
  const isAnyDirty = useProjectStore((s) => s.isAnyDirty);
  const activeFile = useProjectStore((s) => s.activeFile);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);

  if (!hasProject) return null;

  const isTckView = activeFile ? TCK_VIEW_TYPES.has(activeFile.type) : false;
  const isFileView = activeFile ? !isTckView : false;
  const isAtRoot = !activeFile;

  const handleRootClick = () => {
    setActiveFile({ type: "tck", name: "index" });
  };

  return (
    <div className="context-bar">
      <span
        className={`context-bar__segment ${isAtRoot ? "context-bar__segment--active" : "context-bar__segment--clickable"}`}
        onClick={isAtRoot ? undefined : handleRootClick}
        role={isAtRoot ? undefined : "button"}
        tabIndex={isAtRoot ? undefined : 0}
        onKeyDown={isAtRoot ? undefined : (e) => { if (e.key === "Enter") handleRootClick(); }}
      >
        <FolderIcon /> {projectName}{isAnyDirty() ? " •" : ""}
      </span>

      {isTckView && activeFile && (
        <>
          <span className="context-bar__separator">›</span>
          <span className="context-bar__segment context-bar__segment--active">
            <ViewTypeIcon type={activeFile.type} /> {VIEW_LABELS[activeFile.type]}
          </span>
        </>
      )}

      {isFileView && activeFile && (
        <>
          <span className="context-bar__separator">›</span>
          <button
            className="context-bar__segment context-bar__segment--clickable"
            onClick={handleRootClick}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") handleRootClick(); }}
          >
            <FolderOpenIcon /> {FOLDER_LABELS[activeFile.type]}
          </button>
          <span className="context-bar__separator">›</span>
          <span className="context-bar__segment context-bar__segment--active">
            <FileTypeIcon type={activeFile.type} /> {getFileLabel(activeFile.type, activeFile.name)}
          </span>
        </>
      )}
    </div>
  );
}
