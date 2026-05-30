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
import type { VarScope } from "../../serialization/varSyntax";
import { parseVarRef } from "../../serialization/varSyntax";
import { VariablePicker } from "../../../yaml-editor/VariablePicker/VariablePicker";
import type { TemplateSegment } from "./templateSegment.types";
import { parseTemplateString, serializeTemplateString } from "./templateStringParser";
import { setupTemplateEditorListener, type TemplateEditorCallback } from "./templateStringEditorBridge";

/** Scope-based pill colors — mirrors FieldTemplateString. */
const SCOPE_COLORS: Record<VarScope, string> = {
  steps: "#4a90d9",
  env: "#5ba55b",
  preconditions: "#d98c4a",
  metadata: "#8e6bbf",
  setup: "#4a90d9",
  services: "#7c3aed",
  execution: "#0369a1",
} as const;

export function TemplateStringEditorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [segments, setSegments] = useState<Array<TemplateSegment & { id: string }>>([]);
  const [callback, setCallback] = useState<TemplateEditorCallback | null>(null);
  const [showVarPicker, setShowVarPicker] = useState(false);
  const idCounter = useRef(0);

  const nextId = useCallback(() => String(++idCounter.current), []);

  useEffect(() => {
    return setupTemplateEditorListener((value, cb) => {
      idCounter.current = 0;
      setSegments(parseTemplateString(value).map((seg) => ({ ...seg, id: String(++idCounter.current) })));
      setCallback(() => cb);
      setIsOpen(true);
      setShowVarPicker(false);
    });
  }, []);

  const handleApply = useCallback(() => {
    const serialized = serializeTemplateString(segments);
    callback?.(serialized);
    setIsOpen(false);
  }, [segments, callback]);

  const handleCancel = useCallback(() => {
    callback?.(null);
    setIsOpen(false);
  }, [callback]);

  const handleLiteralChange = useCallback((index: number, value: string) => {
    setSegments((prev) => prev.map((seg, i) => (i === index ? { ...seg, type: "literal" as const, value } : seg)));
  }, []);

  const handleDeleteSegment = useCallback((index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddText = useCallback(() => {
    setSegments((prev) => [...prev, { type: "literal", value: "", id: nextId() }]);
  }, [nextId]);

  const handleAddVariable = useCallback(() => {
    setShowVarPicker(true);
  }, []);

  const handleVarInsert = useCallback((expression: string) => {
    const parsed = parseVarRef(expression);
    if (parsed) {
      setSegments((prev) => [...prev, { type: "variable", scope: parsed.scope, path: parsed.path, id: nextId() }]);
    }
    setShowVarPicker(false);
  }, [nextId]);

  const handleVarPickerClose = useCallback(() => {
    setShowVarPicker(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  return (
    <dialog
      className="tse-dialog"
      open
      aria-labelledby="tse-title"
    >
      <button
        className="tse-backdrop"
        onClick={handleCancel}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div className="tse-modal">
        <div className="tse-header">
          <h2 id="tse-title">Edit Template String</h2>
          <button className="tse-close-btn" onClick={handleCancel} aria-label="Close">×</button>
        </div>

        <div className="tse-body">
          <div className="tse-segments">
            {segments.map((seg, i) => (
              <div className="tse-segment-row" key={seg.id}>
                {seg.type === "literal" ? (
                  <input
                    className="tse-segment-input"
                    value={seg.value}
                    onChange={(e) => handleLiteralChange(i, e.target.value)}
                    placeholder="static text..."
                  />
                ) : (
                  <span
                    className="tse-segment-pill"
                    style={{ backgroundColor: SCOPE_COLORS[seg.scope] ?? "#666" }}
                  >
                    <span className="tse-segment-pill__label">{seg.scope}.{seg.path}</span>
                  </span>
                )}
                <button
                  className="tse-segment-delete"
                  onClick={() => handleDeleteSegment(i)}
                  aria-label="Remove segment"
                >×</button>
              </div>
            ))}
          </div>

          <div className="tse-actions">
            <button type="button" onClick={handleAddText}>+ Text</button>
            <button type="button" onClick={handleAddVariable}>+ Variable</button>
          </div>

          {showVarPicker && (
            <div className="tse-variable-picker-wrap">
              <VariablePicker onInsert={handleVarInsert} onClose={handleVarPickerClose} />
            </div>
          )}

          <div className="tse-preview">
            {segments.map((seg) =>
              seg.type === "literal" ? (
                <span key={seg.id}>{seg.value}</span>
              ) : (
                <span
                  key={seg.id}
                  className="tse-preview-pill"
                  style={{ backgroundColor: SCOPE_COLORS[seg.scope] ?? "#666" }}
                >
                  @{seg.path}
                </span>
              ),
            )}
            {segments.length === 0 && <span style={{ opacity: 0.5 }}>Empty template</span>}
          </div>
        </div>

        <div className="tse-footer">
          <button className="tse-btn-cancel" type="button" onClick={handleCancel}>Cancel</button>
          <button className="tse-btn-apply" type="button" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </dialog>
  );
}
