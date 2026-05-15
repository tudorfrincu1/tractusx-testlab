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
import type { PathSegment, SegmentType } from "../core/pathBuilder";
import { segmentsToPath } from "../core/pathBuilder";
import { jsonToSchema } from "../core/jsonToSchema";
import { SchemaTree } from "../schema/SchemaTree";
import "./PathBuilderModal.css";

export interface PathBuilderModalProps {
  blockId: string;
  initialSegments: PathSegment[];
  schema?: Record<string, unknown>;
  sourceVariable?: string;
  onSave: (blockId: string, segments: PathSegment[], path: string) => void;
  onClose: () => void;
}

type SourceTab = "schema" | "paste";

export function PathBuilderModal({
  blockId,
  initialSegments,
  schema,
  sourceVariable,
  onSave,
  onClose,
}: PathBuilderModalProps) {
  const [segments, setSegments] = useState<PathSegment[]>(() =>
    initialSegments.length > 0 ? initialSegments.map((s) => ({ ...s })) : []
  );
  const [pastedSchema, setPastedSchema] = useState<Record<string, unknown> | undefined>();
  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState("");
  const [activeTab, setActiveTab] = useState<SourceTab>(schema ? "schema" : "paste");
  const listRef = useRef<HTMLDivElement>(null);

  const effectiveSchema = activeTab === "schema" ? (schema ?? pastedSchema) : undefined;
  const hasAnySchema = !!(schema ?? pastedSchema);
  const preview = segmentsToPath(segments) || "(empty)";

  const handleParse = useCallback(() => {
    try {
      const parsed: unknown = JSON.parse(pasteText);
      setPastedSchema(jsonToSchema(parsed));
      setParseError("");
      setActiveTab("schema");
    } catch {
      setParseError("Invalid JSON — please check your input.");
      setPastedSchema(undefined);
    }
  }, [pasteText]);

  const handleSchemaSelect = useCallback((schemaSegments: PathSegment[]) => {
    setSegments(schemaSegments);
  }, []);

  const handleTypeChange = useCallback((idx: number, newType: SegmentType) => {
    setSegments((prev) => prev.map((s, i) =>
      i === idx ? { type: newType, value: newType === "index" ? "0" : s.value } : s
    ));
  }, []);

  const handleValueChange = useCallback((idx: number, newValue: string) => {
    setSegments((prev) => prev.map((s, i) =>
      i === idx ? { ...s, value: newValue } : s
    ));
  }, []);

  const handleDelete = useCallback((idx: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAdd = useCallback(() => {
    setSegments((prev) => [...prev, { type: "key", value: "" }]);
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }, []);

  const handleDone = useCallback(() => {
    const filtered = segments.filter((s) => s.value !== "");
    const path = segmentsToPath(filtered);
    onSave(blockId, filtered, path);
    onClose();
  }, [segments, blockId, onSave, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleDone();
    },
    [handleDone],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDone();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleDone]);

  return (
    <div className="path-builder-overlay" onMouseDown={handleOverlayClick}>
      <div className="path-builder-modal">
        <div className="path-builder-header">
          <span className="path-builder-title">Build Path</span>
          <div className="path-builder-preview">{preview}</div>
          <button className="path-builder-close" onClick={handleDone} title="Close">
            &#x2715;
          </button>
        </div>

        <div className={`path-builder-body${effectiveSchema ? " path-builder-body--with-schema" : ""}`}>
          <div className="path-builder-source-panel">
            <div className="path-builder-tabs">
              <button
                className={`path-builder-tab${activeTab === "schema" ? " path-builder-tab--active" : ""}`}
                onClick={() => setActiveTab("schema")}
                disabled={!hasAnySchema && !schema}
              >
                Schema Tree
              </button>
              <button
                className={`path-builder-tab${activeTab === "paste" ? " path-builder-tab--active" : ""}`}
                onClick={() => setActiveTab("paste")}
              >
                Paste JSON
              </button>
            </div>

            {activeTab === "paste" && (
              <div className="path-builder-paste-panel">
                <p className="path-builder-paste-hint">
                  Paste a JSON response example to explore its structure:
                </p>
                <textarea
                  className="path-builder-paste-textarea"
                  value={pasteText}
                  onChange={(e) => { setPasteText(e.target.value); setParseError(""); }}
                  placeholder='{ "items": [{ "id": 1 }] }'
                  spellCheck={false}
                />
                {parseError && (
                  <p className="path-builder-parse-error">{parseError}</p>
                )}
                <button className="path-builder-btn-parse" onClick={handleParse}>
                  Parse &amp; Build Tree
                </button>
              </div>
            )}

            {activeTab === "schema" && effectiveSchema && (
              <SchemaTree schema={effectiveSchema} onSelectPath={handleSchemaSelect} />
            )}

            {activeTab === "schema" && !effectiveSchema && (
              <p className="path-builder-paste-hint">
                No schema available. Switch to Paste JSON to provide a sample.
              </p>
            )}
          </div>

          <div className="path-builder-segments-panel">
            <div className="path-builder-panel-label">Path Segments</div>
            <div className="path-builder-segment-list" ref={listRef}>
              {segments.map((seg, idx) => (
                <div className="path-builder-seg-row" key={idx}>
                  <select
                    value={seg.type}
                    onChange={(e) => handleTypeChange(idx, e.target.value as SegmentType)}
                  >
                    <option value="key">Key</option>
                    <option value="index">Index</option>
                  </select>
                  <input
                    type={seg.type === "index" ? "number" : "text"}
                    value={seg.value}
                    placeholder={seg.type === "index" ? "0" : "key"}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    min={seg.type === "index" ? 0 : undefined}
                  />
                  <button
                    className="path-builder-del-btn"
                    onClick={() => handleDelete(idx)}
                    title="Remove segment"
                  >
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>

            <div className="path-builder-actions">
              <button className="path-builder-btn-add" onClick={handleAdd}>
                + Add Segment
              </button>
              <button className="path-builder-btn-done" onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        </div>

        {sourceVariable && (
          <div className="path-builder-footer">
            Source: <span className="path-builder-var-ref">@{sourceVariable}</span>
          </div>
        )}
      </div>
    </div>
  );
}
