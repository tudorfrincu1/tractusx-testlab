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

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { theme } from "../../../theme/tractusxTheme";

import EditIcon from "@mui/icons-material/Edit";

/* ── Shared Card Wrapper ────────────────────────────────────────────────── */

export function SectionCard({ title, children, extra }: {
  title: string; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div style={{
      background: theme.colors.bgLight, border: `1px solid ${theme.colors.border}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 16px", fontSize: 11, fontWeight: 600, color: theme.colors.textMuted,
        textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {title}
        {extra}
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Inline Editable Field ──────────────────────────────────────────────── */

export function InlineField({ label, value, onChange, placeholder, isMultiline }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isMultiline?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (draft !== value) onChange(draft);
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isMultiline) commit();
    if (e.key === "Escape") cancel();
  };

  const fieldStyle: CSSProperties = {
    width: "100%",
    fontSize: 12,
    color: theme.colors.text,
    background: isEditing ? theme.colors.bgLighter : "transparent",
    border: isEditing ? `1px solid ${theme.colors.primary}` : `1px solid transparent`,
    borderRadius: 4,
    padding: "4px 6px",
    outline: "none",
    fontFamily: "inherit",
    resize: isMultiline ? "vertical" : "none",
    transition: "border-color 0.15s, background 0.15s",
  };

  return (
    <div>
      <label style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 2, display: "block" }}>
        {label}
      </label>
      {isEditing ? (
        isMultiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            style={fieldStyle}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={fieldStyle}
          />
        )
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{
            ...fieldStyle,
            cursor: "pointer",
            minHeight: isMultiline ? 40 : 24,
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            color: value ? theme.colors.text : theme.colors.textMuted,
          }}
          title="Click to edit"
        >
          <span style={{ flex: 1 }}>{value || placeholder || "—"}</span>
          <EditIcon sx={{ fontSize: 11, color: theme.colors.textMuted, opacity: 0.5, flexShrink: 0, marginTop: "2px" }} />
        </div>
      )}
    </div>
  );
}

/* ── Select Field ───────────────────────────────────────────────────────── */

export function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 2, display: "block" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          fontSize: 12,
          color: theme.colors.text,
          background: theme.colors.bgLighter,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 4,
          padding: "4px 6px",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <option value="">— select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Semantic Version Field (v{major}.{minor}.{patch}) ──────────────────── */

const VERSION_RE = /^\d+\.\d+\.\d+$/;

function stripPrefix(raw: string): string {
  return raw.replace(/^v/i, "").trim();
}

function isValidVersion(input: string): boolean {
  return VERSION_RE.test(input);
}

export function VersionField({ label, value, onChange, compact }: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(() => stripPrefix(value));
  const [touched, setTouched] = useState(false);

  useEffect(() => { setDraft(stripPrefix(value)); }, [value]);

  const isValid = draft === "" || isValidVersion(draft);
  const showError = touched && draft !== "" && !isValid;

  const handleInput = (raw: string) => {
    // Allow only digits and dots while typing
    const cleaned = raw.replace(/[^\d.]/g, "");
    setDraft(cleaned);
    if (isValidVersion(cleaned)) {
      onChange(cleaned);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (draft === "") {
      onChange("");
    } else if (isValidVersion(draft)) {
      onChange(draft);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = stripPrefix(e.clipboardData.getData("text"));
    handleInput(pasted);
  };

  const borderColor = showError
    ? theme.colors.error
    : theme.colors.border;

  const fontSize = compact ? 10 : 12;
  const inputWidth = compact ? 64 : 90;

  return (
    <div>
      {label && (
        <label style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 2, display: "block" }}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{
          fontSize, fontWeight: 600,
          color: showError ? theme.colors.error : theme.colors.textMuted,
          userSelect: "none",
        }}>
          v
        </span>
        <input
          type="text"
          value={draft}
          placeholder="0.0.0"
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          onPaste={handlePaste}
          onFocus={() => setTouched(false)}
          style={{
            width: inputWidth,
            fontSize,
            color: theme.colors.text,
            background: theme.colors.bgLighter,
            border: `1px solid ${borderColor}`,
            borderRadius: 3,
            padding: compact ? "2px 4px" : "3px 6px",
            outline: "none",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "border-color 0.15s",
          }}
        />
      </div>
      {showError && (
        <span style={{ fontSize: 9, color: theme.colors.error, marginTop: 2, display: "block" }}>
          Expected format: 0.0.0
        </span>
      )}
    </div>
  );
}

export { StandardsField } from "./ChipFields";
export { TagField } from "./ChipFields";
