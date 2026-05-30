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

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiPathSegment, ApiSegmentType } from "../core/apiPathBuilder";
import { segmentsToApiPath } from "../core/apiPathBuilder";

const API_TEMPLATES: readonly string[] = [
  "/api/v1/transferprocesses",
  "/api/v1/assets",
  "/api/v1/catalog/request",
  "/api/v1/edrs",
] as const;

export interface ApiPathBuilderModalProps {
  blockId: string;
  initialSegments: ApiPathSegment[];
  variables: string[];
  onSave: (blockId: string, segments: ApiPathSegment[], path: string) => void;
  onClose: () => void;
}

export function ApiPathBuilderModal({
  blockId,
  initialSegments,
  variables,
  onSave,
  onClose,
}: ApiPathBuilderModalProps) {
  const [segments, setSegments] = useState<ApiPathSegment[]>(() =>
    initialSegments.length > 0 ? initialSegments.map((s) => ({ ...s })) : [],
  );
  const listRef = useRef<HTMLDivElement>(null);
  const preview = segmentsToApiPath(segments);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); });
  }, []);

  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) return;
    const parts = e.target.value.replace(/^\//, "").split("/").filter(Boolean);
    setSegments(parts.map((p) => ({ type: "literal" as const, value: p })));
  }, []);

  const handleTypeToggle = useCallback((idx: number, newType: ApiSegmentType) => {
    setSegments((prev) => prev.map((s, i) =>
      i === idx ? { type: newType, value: newType === "variable" ? (variables[0] ?? "") : "" } : s,
    ));
  }, [variables]);

  const handleValueChange = useCallback((idx: number, val: string) => {
    setSegments((prev) => prev.map((s, i) => (i === idx ? { ...s, value: val } : s)));
  }, []);

  const handleDelete = useCallback((idx: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addSegment = useCallback((type: ApiSegmentType) => {
    const value = type === "variable" ? (variables[0] ?? "") : "";
    setSegments((prev) => [...prev, { type, value }]);
    scrollToBottom();
  }, [variables, scrollToBottom]);

  const handleApply = useCallback(() => {
    const filtered = segments.filter((s) => s.value !== "");
    onSave(blockId, filtered, segmentsToApiPath(filtered));
    onClose();
  }, [segments, blockId, onSave, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }, [onClose],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="api-path-modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="api-path-modal">
        <div className="api-path-modal-header">
          <span className="api-path-modal-title">Edit API Path</span>
          <button className="api-path-modal-close" onClick={onClose} title="Close">&#x2715;</button>
        </div>

        <div className="api-path-modal-preview">{renderPreview(segments)}</div>

        <div className="api-path-modal-body">
          <label className="api-path-modal-label">START FROM TEMPLATE</label>
          <select className="api-path-modal-template" onChange={handleTemplateChange} defaultValue="">
            <option value="" disabled>Select a template...</option>
            {API_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="api-path-modal-segments" ref={listRef}>
            {segments.map((seg, idx) => (
              <div className="api-path-modal-row" key={idx}>
                <span className="api-path-modal-slash">/</span>
                {seg.type === "literal" ? (
                  <input
                    className="api-path-modal-input"
                    value={seg.value}
                    placeholder="segment"
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                  />
                ) : (
                  <select
                    className="api-path-modal-var-select"
                    value={seg.value}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                  >
                    {variables.map((v) => <option key={v} value={v}>{`\${{ env.${v} }}`}</option>)}
                  </select>
                )}
                <div className="api-path-modal-toggles">
                  <button
                    className={`api-path-modal-toggle${seg.type === "literal" ? " api-path-modal-toggle--lit" : ""}`}
                    onClick={() => handleTypeToggle(idx, "literal")}
                    title="Literal"
                  >abc</button>
                  <button
                    className={`api-path-modal-toggle${seg.type === "variable" ? " api-path-modal-toggle--var" : ""}`}
                    onClick={() => handleTypeToggle(idx, "variable")}
                    title="Variable"
                  >@</button>
                </div>
                <button className="api-path-modal-del" onClick={() => handleDelete(idx)} title="Remove">&#x2715;</button>
              </div>
            ))}
          </div>

          <div className="api-path-modal-add-row">
            <button className="api-path-modal-btn-add" onClick={() => addSegment("literal")}>+ Add segment</button>
            <button className="api-path-modal-btn-add" onClick={() => addSegment("variable")}>+ Add @variable</button>
          </div>
        </div>

        <div className="api-path-modal-footer">
          <button className="api-path-modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="api-path-modal-btn-apply" onClick={handleApply}>Apply Path</button>
        </div>
      </div>
    </div>
  );
}

function renderPreview(segments: ApiPathSegment[]): React.ReactNode {
  if (segments.length === 0) return <span className="api-path-modal-preview-empty">/</span>;
  return segments.map((s, i) => (<span key={i}>
    <span className="api-path-modal-preview-slash">/</span>
    <span className={s.type === "variable" ? "api-path-modal-preview-var" : "api-path-modal-preview-lit"}>
      {s.type === "variable" ? `\${{ env.${s.value} }}` : s.value}</span>
  </span>));
}
