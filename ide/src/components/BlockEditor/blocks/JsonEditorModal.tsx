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

import { useCallback, useEffect, useState } from "react";
import "./JsonEditorModal.css";

export interface JsonEditorModalProps {
  blockId: string;
  initialJson: string;
  onSave: (blockId: string, json: string) => void;
  onClose: () => void;
}

function validateJson(text: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(text);
    return { isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { isValid: false, error: message };
  }
}

export function JsonEditorModal({
  blockId,
  initialJson,
  onSave,
  onClose,
}: JsonEditorModalProps) {
  const [text, setText] = useState(initialJson);
  const validation = validateJson(text);

  const handleFormat = useCallback(() => {
    try {
      const parsed: unknown = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
    } catch {
      // Cannot format invalid JSON — ignore
    }
  }, [text]);

  const handleDone = useCallback(() => {
    if (!validation.isValid) return;
    onSave(blockId, text);
    onClose();
  }, [validation.isValid, blockId, text, onSave, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        if (validation.isValid) handleDone();
      }
    },
    [validation.isValid, handleDone],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (validation.isValid) handleDone();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [validation.isValid, handleDone]);

  return (
    <div className="json-editor-overlay" onMouseDown={handleOverlayClick}>
      <div className="json-editor-modal">
        <div className="json-editor-title">{"{}"} Edit JSON</div>
        <textarea
          className="json-editor-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder='{ "key": "value" }'
        />
        <p
          className={`json-editor-status ${
            validation.isValid
              ? "json-editor-status--valid"
              : "json-editor-status--invalid"
          }`}
        >
          {validation.isValid ? "Valid JSON \u2713" : `Invalid JSON: ${validation.error}`}
        </p>
        <div className="json-editor-actions">
          <button className="json-editor-btn-format" onClick={handleFormat}>
            Format
          </button>
          <button
            className="json-editor-btn-done"
            onClick={handleDone}
            disabled={!validation.isValid}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
