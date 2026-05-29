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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/store/editor/useEditorStore";
import { theme } from "@/shared/theme/tractusxTheme";
import { findStepLineRange } from "@/services";
import { defineTractusDarkTheme, registerYamlCompletions } from "./monacoSetup";

export function YamlEditor({ readOnly = false }: { readOnly?: boolean }) {
  const yaml = useEditorStore((s) => s.yaml);
  const errors = useEditorStore((s) => s.errors);
  const lastEditSource = useEditorStore((s) => s.lastEditSource);
  const setModelFromYaml = useEditorStore((s) => s.setModelFromYaml);
  const selectedStepType = useEditorStore((s) => s.selectedStepType);
  const selectStep = useEditorStore((s) => s.selectStep);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const isEditorFocused = useRef(false);
  const completionDisposable = useRef<import("monaco-editor").IDisposable | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Clear block selection when user focuses the YAML editor
    editor.onDidFocusEditorText(() => {
      isEditorFocused.current = true;
      selectStep(null);
    });
    editor.onDidBlurEditorText(() => {
      isEditorFocused.current = false;
    });

    defineTractusDarkTheme(monaco);

    // Dispose previous completion provider to avoid duplicates on re-mount
    completionDisposable.current?.dispose();
    completionDisposable.current = registerYamlCompletions(monaco);
  };

  // Update editor markers from validation errors
  useEffect(() => {
    const edtr = editorRef.current;
    const m = monacoRef.current;
    if (!edtr || !m) return;

    const model = edtr.getModel();
    if (!model) return;

    const markers: editor.IMarkerData[] = errors.map((err) => ({
      severity:
        err.severity === "error"
          ? m.MarkerSeverity.Error
          : m.MarkerSeverity.Warning,
      message: err.message,
      startLineNumber: err.line ?? 1,
      startColumn: 1,
      endLineNumber: err.line ?? 1,
      endColumn: 1000,
    }));

    m.editor.setModelMarkers(model, "testlab", markers);
  }, [errors]);

  // Sync editor content when model changes from blocks
  useEffect(() => {
    const edtr = editorRef.current;
    if (!edtr || lastEditSource === "yaml") return;

    // Cancel any pending debounce from previous file — prevents stale setModelFromYaml
    // firing after a file switch and corrupting the new file's data.
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const currentValue = edtr.getValue();
    if (currentValue !== yaml) {
      isUpdatingFromStore.current = true;
      edtr.setValue(yaml);
      isUpdatingFromStore.current = false;
    }
  }, [yaml, lastEditSource]);

  // Sync readOnly option when prop changes
  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly,
      cursorStyle: readOnly ? "underline-thin" : "line",
      cursorWidth: readOnly ? 0 : 2,
      cursorBlinking: readOnly ? "solid" : "smooth",
      hideCursorInOverviewRuler: readOnly,
      renderLineHighlight: readOnly ? "none" : "all",
      lineNumbers: readOnly ? "off" : "on",
      minimap: { enabled: !readOnly },
      folding: !readOnly,
      glyphMargin: !readOnly,
    });
  }, [readOnly]);

  // Highlight YAML lines matching the selected block's step
  useEffect(() => {
    const edtr = editorRef.current;
    const m = monacoRef.current;
    if (!edtr || !m) return;

    if (!decorationsRef.current) {
      decorationsRef.current = edtr.createDecorationsCollection();
    }

    // Never highlight or scroll while the user is typing in YAML
    if (!selectedStepType || isEditorFocused.current) {
      decorationsRef.current.clear();
      return;
    }

    const currentYaml = edtr.getValue();
    const range = findStepLineRange(currentYaml, selectedStepType);
    if (!range) {
      decorationsRef.current.clear();
      return;
    }

    decorationsRef.current.set([
      {
        range: new m.Range(range.startLine, 1, range.endLine, 1),
        options: {
          isWholeLine: true,
          className: "yaml-step-highlight",
          overviewRuler: {
            color: theme.colors.primary,
            position: m.editor.OverviewRulerLane.Full,
          },
        },
      },
    ]);

    edtr.revealLineInCenterIfOutsideViewport(range.startLine);
  }, [selectedStepType]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (isUpdatingFromStore.current || !value) return;
      // Only process user-initiated changes; ignore echo-backs from store → value prop
      if (!isEditorFocused.current) return;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setModelFromYaml(value);
      }, 500);
    },
    [setModelFromYaml]
  );

  return (
    <div style={{ height: "100%", position: "relative" }}>
      {readOnly && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: "rgba(0,0,0,0.18)",
          pointerEvents: "none",
        }} />
      )}
      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={yaml}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="tractus-x-dark"
        options={{
          fontSize: 13,
          fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
          minimap: { enabled: !readOnly },
          padding: { top: 8 },
          lineNumbers: readOnly ? "off" : "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          formatOnPaste: true,
          bracketPairColorization: { enabled: true },
          folding: !readOnly,
          suggest: { showSnippets: true },
          quickSuggestions: !readOnly,
          renderLineHighlight: readOnly ? "none" : "all",
          cursorBlinking: readOnly ? "solid" : "smooth",
          cursorWidth: readOnly ? 0 : 2,
          smoothScrolling: true,
          readOnly,
        }}
      />
    </div>
  );
}
