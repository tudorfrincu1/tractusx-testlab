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
import { VariablePicker } from "./VariablePicker";
import {
  getTestdataEditorInstance,
  registerOpenVariablePicker,
  unregisterOpenVariablePicker,
} from "../TestdataEditor";
import "./VariablePicker.css";

export function TestdataVariableButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    registerOpenVariablePicker(() => setIsOpen(true));
    return () => unregisterOpenVariablePicker();
  }, []);

  const handleInsert = useCallback((expression: string) => {
    const editor = getTestdataEditorInstance();
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    editor.executeEdits("variable-picker", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: expression,
      },
    ]);

    // Move cursor after the inserted text
    const newColumn = position.column + expression.length;
    editor.setPosition({ lineNumber: position.lineNumber, column: newColumn });
    editor.focus();
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <button
        className="variable-picker-btn"
        onClick={() => setIsOpen((v) => !v)}
        title="Insert a variable reference"
      >
        + Variable
      </button>
      {isOpen && <VariablePicker onInsert={handleInsert} onClose={handleClose} />}
    </>
  );
}
