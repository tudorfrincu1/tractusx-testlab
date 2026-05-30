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

import { useEffect, useRef, useState } from "react";
import { theme } from "@/shared/theme/tractusxTheme";
import { useProjectStore } from "@/store";
import { yamlToModel } from "@/services";
import type { ScriptDefinition } from "@/models/schema";
import { SchemaDownloadDialog } from "@/shared/ui/SchemaDownloadDialog/SchemaDownloadDialog";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

function generateUniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let i = 1;
  while (existing.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

type DropdownId = "new" | "upload" | null;

export function ExplorerActions() {
  const yamlInputRef = useRef<HTMLInputElement>(null);
  const schemaInputRef = useRef<HTMLInputElement>(null);
  const testdataInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const [showSchemaDownload, setShowSchemaDownload] = useState(false);

  const addTest = useProjectStore((s) => s.addTest);
  const addSchema = useProjectStore((s) => s.addSchema);
  const addTestdata = useProjectStore((s) => s.addTestdata);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const updateTest = useProjectStore((s) => s.updateTest);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleAddTestdata = () => {
    const existing = useProjectStore.getState().getTestdataNames();
    const name = generateUniqueName("untitled", existing);
    addTestdata(name, "{\n  \n}", "application/json");
    setActiveFile({ type: "testdata", name });
  };

  const handleAddSchema = () => {
    const existing = useProjectStore.getState().project.schemas.map(s => s.name);
    const name = generateUniqueName("untitled_schema", existing);
    addSchema(name, "{\n  \n}");
    setActiveFile({ type: "schema", name });
  };

  const handleUploadYaml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      file.text().then((content) => {
        const result = yamlToModel(content);
        if (result.ok && result.model.kind === "test") {
          const name = file.name.replace(/\.(yaml|yml)$/i, "").replace(/_/g, "-");
          const testName = addTest(name);
          updateTest(testName, result.model as ScriptDefinition);
        }
      });
    }
    e.target.value = "";
  };

  const handleUploadSchema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      file.text().then((content) => {
        const name = file.name.replace(/\.json$/i, "");
        addSchema(name, content);
      });
    }
    e.target.value = "";
  };

  const handleUploadTestdata = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      file.text().then((content) => {
        const name = file.name.replace(/\.json$/i, "");
        addTestdata(name, content, "application/json");
      });
    }
    e.target.value = "";
  };

  const toggleDropdown = (id: DropdownId) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  return (
    <div
      ref={containerRef}
      className="explorer-actions"
      style={{
        borderTop: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgLight,
      }}
    >
      <ActionButton
        icon={<CloudDownloadIcon sx={{ fontSize: 13 }} />}
        label="Download Schema"
        onClick={() => setShowSchemaDownload(true)}
      />
      <div className="explorer-actions__row">
        <DropdownButton
          icon={<AddIcon sx={{ fontSize: 13 }} />}
          label="New"
          isOpen={openDropdown === "new"}
          onToggle={() => toggleDropdown("new")}
          items={[
            { label: "New Test", onClick: () => { addTest(); setOpenDropdown(null); } },
            { label: "New Schema", onClick: () => { handleAddSchema(); setOpenDropdown(null); } },
            { label: "New Testdata", onClick: () => { handleAddTestdata(); setOpenDropdown(null); } },
          ]}
        />
        <DropdownButton
          icon={<UploadFileIcon sx={{ fontSize: 13 }} />}
          label="Upload"
          isOpen={openDropdown === "upload"}
          onToggle={() => toggleDropdown("upload")}
          items={[
            { label: "Upload Test (.yaml)", onClick: () => { yamlInputRef.current?.click(); setOpenDropdown(null); } },
            { label: "Upload Schema (.json)", onClick: () => { schemaInputRef.current?.click(); setOpenDropdown(null); } },
            { label: "Upload Testdata (.json)", onClick: () => { testdataInputRef.current?.click(); setOpenDropdown(null); } },
          ]}
        />
      </div>
      <input ref={yamlInputRef} type="file" accept=".yaml,.yml" multiple className="explorer-actions__hidden-input" onChange={handleUploadYaml} aria-label="Upload test YAML files" />
      <input ref={schemaInputRef} type="file" accept=".json" multiple className="explorer-actions__hidden-input" onChange={handleUploadSchema} aria-label="Upload schema JSON files" />
      <input ref={testdataInputRef} type="file" accept=".json" multiple className="explorer-actions__hidden-input" onChange={handleUploadTestdata} aria-label="Upload testdata JSON files" />
      {showSchemaDownload && (
        <SchemaDownloadDialog onClose={() => setShowSchemaDownload(false)} />
      )}
    </div>
  );
}

interface DropdownItem {
  label: string;
  onClick: () => void;
}

function DropdownButton({ icon, label, isOpen, onToggle, items }: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  items: DropdownItem[];
}) {
  return (
    <div className="dropdown-button__wrapper">
      {isOpen && (
        <div className="dropdown-button__menu">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="dropdown-button__menu-item"
              style={{ color: theme.colors.text }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgLighter; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onToggle}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="dropdown-button__trigger"
        style={{
          color: theme.colors.text,
          background: theme.colors.bgLighter,
          border: `1px solid ${isOpen ? theme.colors.primary : theme.colors.border}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.borderColor = theme.colors.border; }}
      >
        {icon}
        {label} ▾
      </button>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="action-button"
      style={{
        color: theme.colors.text,
        background: theme.colors.bgLighter,
        border: `1px solid ${theme.colors.border}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.colors.border; }}
    >
      {icon}
      {label}
    </button>
  );
}
