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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";

export interface JsonEditorProps {
  /** Current editor text (the host owns this draft). */
  value: string;
  /** Inline parse error to surface, or null when the text is valid. */
  error: string | null;
  /** Emits every keystroke; the host decides how to apply it. */
  onChange: (text: string) => void;
  /** Notifies the host when the textarea gains focus. */
  onFocus?: () => void;
  /** Notifies the host when the textarea loses focus. */
  onBlur?: () => void;
  /** Render the JSON as a copy-only output the operator cannot edit. */
  readOnly?: boolean;
}

/** Raw JSON textarea with a non-blocking inline parse-error footer. */
export function JsonEditor({ value, error, onChange, onFocus, onBlur, readOnly }: Readonly<JsonEditorProps>) {
  return (
    <div className="precond-json__editor">
      <textarea
        className={textareaClass(error)}
        value={value}
        spellCheck={false}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {error && (
        <p className="precond-json__error">
          <ErrorOutlinedIcon fontSize="inherit" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function textareaClass(error: string | null): string {
  return error
    ? "precond-json__textarea precond-json__textarea--invalid"
    : "precond-json__textarea";
}
