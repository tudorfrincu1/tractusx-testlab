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

import { useCallback, useEffect, useRef } from "react";
import { HighlightedEditor } from "./HighlightedEditor";
import { useJsonEditor } from "./useJsonEditor";

export interface JsonEditorModalProps {
  blockId: string;
  initialJson: string;
  variables: string[];
  onSave: (blockId: string, json: string) => void;
  onClose: () => void;
}



export function JsonEditorModal({
  blockId,
  initialJson,
  variables,
  onSave,
  onClose,
}: JsonEditorModalProps) {
  const editor = useJsonEditor(initialJson, variables);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleDone = useCallback(() => {
    if (!editor.isValid) return;
    onSave(blockId, editor.text);
    onClose();
  }, [editor.isValid, blockId, editor.text, onSave, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        if (editor.isValid) handleDone();
      }
    },
    [editor.isValid, handleDone],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editor.isPickerOpen) {
          editor.closePicker();
        } else if (editor.isValid) {
          handleDone();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [editor.isValid, editor.isPickerOpen, editor.closePicker, handleDone]);

  /* Close picker on outside click */
  useEffect(() => {
    if (!editor.isPickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        editor.closePicker();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editor.isPickerOpen, editor.closePicker]);

  const hasVariables = editor.availableVariables.length > 0;

  return (
    <div className="json-editor-overlay" onMouseDown={handleOverlayClick} role="presentation">
      <dialog className="json-editor-modal" open>
        <div className="json-editor-title">{"{}"} Edit JSON</div>
        <HighlightedEditor
          value={editor.text}
          onChange={editor.setText}
          textareaRef={editor.textareaRef}
        />
        <p
          className={`json-editor-status ${
            editor.isValid
              ? "json-editor-status--valid"
              : "json-editor-status--invalid"
          }`}
        >
          {editor.statusMessage}
        </p>
        <div className="json-editor-actions">
          <div className="json-editor-var-picker-anchor" ref={pickerRef}>
            <button
              className="json-editor-btn-var"
              onClick={editor.togglePicker}
              disabled={!hasVariables}
              title={hasVariables ? "Insert a variable reference" : "No variables available"}
            >
              + Variable
            </button>
            {editor.isPickerOpen && hasVariables && (
              <ul className="json-editor-var-dropdown">
                {editor.availableVariables.map((name) => (
                  <li key={name}>
                    <button
                      className="json-editor-var-option"
                      onClick={() => editor.insertVariable(name)}
                    >
                      @{name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="json-editor-actions-right">
            <button className="json-editor-btn-format" onClick={editor.handleFormat}>
              Format
            </button>
            <button
              className="json-editor-btn-done"
              onClick={handleDone}
              disabled={!editor.isValid}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
