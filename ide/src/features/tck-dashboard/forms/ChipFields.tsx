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

import { useState, useRef } from "react";
import { theme } from "@/shared/theme/tractusxTheme";
import type { StandardRef } from "@/models/schema";

import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

/* ── Standards Field (chips with id + version) ──────────────────────────── */

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export function StandardsField({ values, onChange }: {
  values: StandardRef[];
  onChange: (values: StandardRef[]) => void;
}) {
  const [draftId, setDraftId] = useState("");
  const [draftVersion, setDraftVersion] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const idRef = useRef<HTMLInputElement>(null);
  const versionRef = useRef<HTMLInputElement>(null);

  const versionValid = draftVersion === "" || VERSION_RE.test(draftVersion);

  const addStandard = () => {
    const id = draftId.trim();
    const ver = draftVersion.trim();
    if (!id || values.some((s) => s.id === id)) return;
    if (ver && !VERSION_RE.test(ver)) return;
    const entry: StandardRef = { id, ...(ver ? { version: `v${ver}` } : {}) };
    onChange([...values, entry]);
    setDraftId("");
    setDraftVersion("");
    setIsAdding(false);
  };

  const removeStandard = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addStandard(); }
    if (e.key === "Escape") { setIsAdding(false); setDraftId(""); setDraftVersion(""); }
  };

  const handleIdKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(e);
    if (e.key === "-" || e.key === "Tab") {
      if (draftId.trim() && e.key === "-") {
        // Only jump to version if it looks like the user finished the standard ID
        // Don't prevent default for "-" since it's valid in standard IDs like "CX-0002"
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        versionRef.current?.focus();
      }
    }
  };

  return (
    <div className="chip-fields__field">
      <label className="chip-fields__label">
        Standards
      </label>
      <div className="chip-fields__container">
        {/* Existing standard chips */}
        {values.map((std, idx) => (
          <span key={std.id} className="chip-fields__chip chip-fields__chip--standard">
            <span>{std.id}</span>
            {std.version && (
              <span className="chip-fields__chip-version">
                {std.version}
              </span>
            )}
            <CloseIcon
              sx={{
                fontSize: 11, cursor: "pointer", color: "#93b4f5", opacity: 0.6, marginLeft: 1,
                "&:hover": { opacity: 1 },
              }}
              onClick={() => removeStandard(idx)}
            />
          </span>
        ))}

        {/* Add chip — collapsed = "+" button, expanded = inline input */}
        {isAdding ? (
          <span className="chip-fields__chip chip-fields__chip--editing">
            <input
              ref={idRef}
              type="text"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              onKeyDown={handleIdKeyDown}
              placeholder="CX-0002"
              autoFocus
              className="chip-fields__input chip-fields__input--id"
            />
            <span className="chip-fields__separator">–</span>
            <span className="chip-fields__separator--bold">v</span>
            <input
              ref={versionRef}
              type="text"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value.replace(/[^\d.]/g, ""))}
              onKeyDown={handleKeyDown}
              placeholder="0.0.0"
              className="chip-fields__input chip-fields__input--version"
            />
            {draftVersion && !versionValid && (
              <span className="chip-fields__error-indicator">!</span>
            )}
            <AddIcon
              sx={{
                fontSize: 13, cursor: "pointer", marginLeft: 1,
                color: draftId.trim() && versionValid ? theme.colors.primary : theme.colors.textMuted,
                opacity: draftId.trim() && versionValid ? 1 : 0.4,
              }}
              onClick={addStandard}
            />
          </span>
        ) : (
          <span
            onClick={() => { setIsAdding(true); setTimeout(() => idRef.current?.focus(), 0); }}
            className="chip-fields__chip chip-fields__chip--add"
          >
            <AddIcon sx={{ fontSize: 11 }} />
            Add
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Tag Chip Input ─────────────────────────────────────────────────────── */

export function TagField({ label, values, onChange, placeholder, chipColor, chipTextColor }: {
  label: string; values: string[]; onChange: (values: string[]) => void;
  placeholder?: string; chipColor: string; chipTextColor: string;
}) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const tag = draft.trim();
    if (tag && !values.includes(tag)) onChange([...values, tag]);
    setDraft("");
    setIsAdding(false);
  };

  const removeTag = (tag: string) => onChange(values.filter((v) => v !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    if (e.key === "Escape") { setIsAdding(false); setDraft(""); }
  };

  return (
    <div className="chip-fields__field">
      <label className="chip-fields__label">
        {label}
      </label>
      <div className="chip-fields__container">
        {values.map((tag) => (
          <span key={tag} className="chip-fields__chip"
            style={{ background: chipColor, color: chipTextColor, border: `1px solid ${chipColor}` }}
          >
            {tag}
            <CloseIcon
              sx={{
                fontSize: 11, cursor: "pointer", color: chipTextColor, opacity: 0.6, marginLeft: 1,
                "&:hover": { opacity: 1 },
              }}
              onClick={() => removeTag(tag)}
            />
          </span>
        ))}

        {isAdding ? (
          <span className="chip-fields__chip chip-fields__chip--editing">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (draft.trim()) addTag(); else setIsAdding(false); }}
              placeholder={placeholder ?? "tag"}
              autoFocus
              className="chip-fields__input chip-fields__input--tag"
            />
            <AddIcon
              sx={{
                fontSize: 13, cursor: "pointer", marginLeft: 1,
                color: draft.trim() ? theme.colors.primary : theme.colors.textMuted,
                opacity: draft.trim() ? 1 : 0.4,
              }}
              onClick={addTag}
            />
          </span>
        ) : (
          <span
            onClick={() => { setIsAdding(true); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="chip-fields__chip chip-fields__chip--add"
          >
            <AddIcon sx={{ fontSize: 11 }} />
            Add
          </span>
        )}
      </div>
    </div>
  );
}
