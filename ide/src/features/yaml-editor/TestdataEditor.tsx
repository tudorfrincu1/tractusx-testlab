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

import Editor, { type OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useRef } from "react";
import { useProjectStore } from "@/store/project/useProjectStore";
import { theme } from "@/shared/theme/tractusxTheme";
import {
  getVariableRanges,
  getVariableRangeAt,
  getVariableEndingAt,
  getVariableStartingAt,
  isInsideVariable,
  isNavigationOrModifierKey,
} from "./TestdataEditorHelpers";
import "./VariablePicker/VariablePicker.css";

/** Ref handle exposed to parent for inserting text at cursor */
export interface TestdataEditorHandle {
  insertAtCursor: (text: string) => void;
}

/** Module-level ref so the sibling button can trigger insertion */
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
let decorationsCollection: monaco.editor.IEditorDecorationsCollection | null = null;
let variableRangesCache: monaco.IRange[] = [];

/** Callback for opening the variable picker from context menu */
let openVariablePickerCallback: (() => void) | null = null;

export function registerOpenVariablePicker(cb: () => void) {
  openVariablePickerCallback = cb;
}

export function unregisterOpenVariablePicker() {
  openVariablePickerCallback = null;
}

export function getTestdataEditorInstance(): monaco.editor.IStandaloneCodeEditor | null {
  return editorInstance;
}

const VARIABLE_PATTERN = /\$\{\{[^}]*\}\}/g;

function updateVariableHighlights(
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoRef: typeof monaco,
) {
  const model = editor.getModel();
  if (!model) return;

  const text = model.getValue();
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];
  let match: RegExpExecArray | null;

  VARIABLE_PATTERN.lastIndex = 0;
  while ((match = VARIABLE_PATTERN.exec(text)) !== null) {
    const startPos = model.getPositionAt(match.index);
    const endPos = model.getPositionAt(match.index + match[0].length);
    decorations.push({
      range: new monacoRef.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
      options: { inlineClassName: "variable-highlight" },
    });
  }

  if (decorationsCollection) {
    decorationsCollection.set(decorations);
  }

  // Update cached ranges for edit protection
  variableRangesCache = getVariableRanges(model, monacoRef);
}

export function TestdataEditor() {
  const activeFile = useProjectStore((s) => s.activeFile);
  const testdata = useProjectStore((s) => s.testdata);
  const updateTestdataContent = useProjectStore((s) => s.updateTestdataContent);
  const monacoRef = useRef<typeof monaco | null>(null);

  const content = activeFile?.type === "testdata"
    ? testdata.get(activeFile.name)?.content ?? ""
    : "";

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorInstance = editor;
    monacoRef.current = monacoInstance;
    decorationsCollection = editor.createDecorationsCollection();
    editor.onDidDispose(() => { editorInstance = null; decorationsCollection = null; variableRangesCache = []; });

    // Highlight variables on content change
    editor.onDidChangeModelContent(() => {
      updateVariableHighlights(editor, monacoInstance);
    });

    // --- Variable edit protection ---
    let suppressCursorSelect = false;

    editor.onKeyDown((e) => {
      if (isNavigationOrModifierKey(e)) return;

      const position = editor.getPosition();
      if (!position) return;

      const key = e.browserEvent.key;

      // Backspace at boundary: cursor right after a variable
      if (key === "Backspace" && !isInsideVariable(position, variableRangesCache)) {
        const varRange = getVariableEndingAt(position, variableRangesCache);
        if (varRange) {
          e.preventDefault();
          e.stopPropagation();
          suppressCursorSelect = true;
          editor.executeEdits("variable-delete", [{ range: varRange, text: "" }]);
          return;
        }
      }

      // Delete at boundary: cursor right before a variable
      if (key === "Delete" && !isInsideVariable(position, variableRangesCache)) {
        const varRange = getVariableStartingAt(position, variableRangesCache);
        if (varRange) {
          e.preventDefault();
          e.stopPropagation();
          suppressCursorSelect = true;
          editor.executeEdits("variable-delete", [{ range: varRange, text: "" }]);
          return;
        }
      }

      // Inside a variable: Backspace/Delete = delete whole variable, else block
      if (isInsideVariable(position, variableRangesCache)) {
        const varRange = getVariableRangeAt(position, variableRangesCache);
        if (key === "Backspace" || key === "Delete") {
          e.preventDefault();
          e.stopPropagation();
          if (varRange) {
            suppressCursorSelect = true;
            editor.executeEdits("variable-delete", [{ range: varRange, text: "" }]);
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    // Context key for conditional context menu actions
    const isInsideVariableKey = editor.createContextKey('isInsideVariable', false);

    // Click inside a variable selects the entire variable
    editor.onDidChangeCursorPosition((e) => {
      if (suppressCursorSelect) {
        suppressCursorSelect = false;
        return;
      }
      const varRange = getVariableRangeAt(e.position, variableRangesCache);
      isInsideVariableKey.set(!!varRange);
      if (e.source === "mouse" || e.source === "keyboard") {
        if (varRange) {
          editor.setSelection(varRange as monaco.IRange & monaco.Selection);
        }
      }
    });

    // --- Context menu actions ---
    editor.addAction({
      id: 'testdata.insertVariable',
      label: 'Insert Variable',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1,
      run: () => {
        if (openVariablePickerCallback) openVariablePickerCallback();
      },
    });

    editor.addAction({
      id: 'testdata.deleteVariable',
      label: 'Delete Variable',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 2,
      precondition: 'isInsideVariable',
      run: (ed) => {
        const pos = ed.getPosition();
        if (!pos) return;
        const range = getVariableRangeAt(pos, variableRangesCache);
        if (range) {
          ed.executeEdits('variable-delete', [{ range, text: '' }]);
        }
      },
    });

    // Paste protection: block paste if cursor is inside a variable without full selection
    editor.onDidPaste(() => {
      // After paste, recompute ranges (content already changed)
      updateVariableHighlights(editor, monacoInstance);
    });

    monacoInstance.editor.defineTheme("tractus-x-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "FFD700" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
      ],
      colors: {
        "editor.background": theme.colors.bgLighter,
        "editor.foreground": theme.colors.text,
        "editor.lineHighlightBackground": "#2a2a2a",
        "editorLineNumber.foreground": "#555555",
        "editorCursor.foreground": theme.colors.primary,
        "editor.selectionBackground": "#264f78",
        "editorIndentGuide.background": "#404040",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": theme.colors.primary,
      },
    });
    monacoInstance.editor.setTheme("tractus-x-dark");

    // Initial highlight pass
    updateVariableHighlights(editor, monacoInstance);
  };

  const handleChange = (value: string | undefined) => {
    if (activeFile?.type === "testdata" && value !== undefined) {
      updateTestdataContent(activeFile.name, value);
    }
  };

  return (
    <Editor
      height="100%"
      language="json"
      value={content}
      onMount={handleMount}
      onChange={handleChange}
      theme="tractus-x-dark"
      options={{
        fontSize: 13,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
        minimap: { enabled: true },
        padding: { top: 8 },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        bracketPairColorization: { enabled: true },
        folding: true,
        readOnly: false,
        renderLineHighlight: "line",
        lineNumbers: "on",
        smoothScrolling: true,
      }}
    />
  );
}
