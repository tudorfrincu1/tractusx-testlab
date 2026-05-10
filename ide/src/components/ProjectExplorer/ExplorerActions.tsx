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

import { useRef, useState } from "react";
import { theme } from "../../theme/tractusxTheme";
import { useProjectStore } from "../../store/useProjectStore";
import { yamlToModel } from "../../sync/yamlToModel";
import type { ScriptDefinition } from "../../models/schema";
import { SchemaDownloadDialog } from "../SchemaDownloadDialog/SchemaDownloadDialog";

import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

export function ExplorerActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSchemaDownload, setShowSchemaDownload] = useState(false);
  const addTest = useProjectStore((s) => s.addTest);
  const addSchema = useProjectStore((s) => s.addSchema);
  const updateTest = useProjectStore((s) => s.updateTest);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      file.text().then((content) => {
        if (/\.json$/i.test(file.name)) {
          const name = file.name.replace(/\.json$/i, "");
          addSchema(name, content);
        } else if (/\.(yaml|yml)$/i.test(file.name)) {
          const result = yamlToModel(content);
          if (result.ok && result.model.kind === "test") {
            const name = file.name.replace(/\.(yaml|yml)$/i, "").replace(/_/g, "-");
            const testName = addTest(name);
            updateTest(testName, result.model as ScriptDefinition);
          }
        }
      });
    }
    e.target.value = "";
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${theme.colors.border}`,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0,
        background: theme.colors.bgLight,
      }}
    >
      <ActionButton
        icon={<CloudDownloadIcon sx={{ fontSize: 13 }} />}
        label="Download Schema"
        onClick={() => setShowSchemaDownload(true)}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <ActionButton
          icon={<NoteAddIcon sx={{ fontSize: 13 }} />}
          label="New Test"
          onClick={() => addTest()}
        />
        <ActionButton
          icon={<UploadFileIcon sx={{ fontSize: 13 }} />}
          label="Upload"
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,.json"
        multiple
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      {showSchemaDownload && (
        <SchemaDownloadDialog onClose={() => setShowSchemaDownload(false)} />
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "5px 8px",
        fontSize: 11,
        fontWeight: 500,
        color: theme.colors.text,
        background: theme.colors.bgLighter,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 4,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
