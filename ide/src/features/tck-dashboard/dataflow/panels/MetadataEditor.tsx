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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { memo, useState, useCallback } from "react";
import { useProjectStore } from "@/store";
import type { VariableDefinition } from "@/models/schema";
import {
  InlineField,
  VersionField,
  SelectField,
  StandardsField,
  TagField,
} from "../../forms/FormFields";

const DATASPACE_OPTIONS = ["saturn", "R25.03", "R25.06", "R24.12", "R24.08"] as const;

export interface MetadataEditorProps {
  onClose: () => void;
}

/**
 * Inline metadata edit form for the sidebar.
 * Reuses the same form field components as the pipeline MetadataSection.
 */
export const MetadataEditor = memo(function MetadataEditor({ onClose }: MetadataEditorProps) {
  const tck = useProjectStore((s) => s.tck);
  const updateField = useProjectStore((s) => s.updateTckField);

  const [newVarName, setNewVarName] = useState("");
  const [newVarDefault, setNewVarDefault] = useState("");

  const variables = tck.variables ?? {};

  const addVariable = useCallback(() => {
    const name = newVarName.trim();
    if (!name || name in variables) return;
    const entry: VariableDefinition = { type: "string", default: newVarDefault || undefined };
    updateField("variables", { ...variables, [name]: entry });
    setNewVarName("");
    setNewVarDefault("");
  }, [newVarName, newVarDefault, variables, updateField]);

  const removeVariable = useCallback((key: string) => {
    const next = { ...variables };
    delete next[key];
    updateField("variables", Object.keys(next).length > 0 ? next : undefined);
  }, [variables, updateField]);

  return (
    <div className="metadata-editor">
      <div className="metadata-editor__header">
        <span className="metadata-editor__title">TCK Metadata</span>
        <span className="metadata-editor__badge">Editing</span>
      </div>

      <div className="metadata-editor__fields">
        <InlineField
          label="Name"
          value={tck.name}
          onChange={(v) => updateField("name", v)}
        />
        <VersionField
          label="Version"
          value={tck.version ?? ""}
          onChange={(v) => updateField("version", v || undefined)}
        />
        <SelectField
          label="Dataspace Version"
          value={tck.dataspace_version ?? ""}
          options={DATASPACE_OPTIONS}
          onChange={(v) => updateField("dataspace_version", v || undefined)}
        />
        <InlineField
          label="Author"
          value={tck.author ?? ""}
          onChange={(v) => updateField("author", v || undefined)}
          placeholder="team or person"
        />
        <InlineField
          label="Description"
          value={tck.description ?? ""}
          onChange={(v) => updateField("description", v || undefined)}
          placeholder="What does this TCK verify?"
          isMultiline
        />
        <StandardsField
          values={tck.standards ?? []}
          onChange={(v) => updateField("standards", v.length > 0 ? v : undefined)}
        />
        <TagField
          label="Tags"
          values={tck.tags ?? []}
          onChange={(v) => updateField("tags", v.length > 0 ? v : undefined)}
          placeholder="e.g. integration"
          chipColor="rgba(15, 118, 110, 0.25)"
          chipTextColor="#5eead4"
        />

        {/* Variables — kept inline since no shared component exists yet */}
        <div className="metadata-editor__field">
          <label className="metadata-editor__label">Variables</label>
          <div className="metadata-editor__var-table">
            {Object.entries(variables).map(([key, val]) => (
              <div key={key} className="metadata-editor__var-row">
                <span className="metadata-editor__var-name">{key}</span>
                <span className="metadata-editor__var-value">{String(val.default ?? "—")}</span>
                <button className="metadata-editor__chip-remove" onClick={() => removeVariable(key)}>✕</button>
              </div>
            ))}
            <div className="metadata-editor__var-row metadata-editor__var-row--add">
              <input
                type="text"
                className="metadata-editor__chip-input"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="name"
              />
              <input
                type="text"
                className="metadata-editor__chip-input"
                value={newVarDefault}
                onChange={(e) => setNewVarDefault(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVariable(); } }}
                placeholder="default value"
              />
              <button className="metadata-editor__chip-add-btn" onClick={addVariable}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="metadata-editor__actions">
        <button className="metadata-editor__btn metadata-editor__btn--cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
});
