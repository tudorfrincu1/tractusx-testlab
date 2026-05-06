/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
import { useTestLabStore } from "../../store/useTestLabStore";
import { theme } from "../../theme/tractusxTheme";
import { findStepLineRange } from "../../sync/yamlLineMap";

export function YamlEditor({ readOnly = false }: { readOnly?: boolean }) {
  const yaml = useTestLabStore((s) => s.yaml);
  const errors = useTestLabStore((s) => s.errors);
  const lastEditSource = useTestLabStore((s) => s.lastEditSource);
  const setModelFromYaml = useTestLabStore((s) => s.setModelFromYaml);
  const selectedStepName = useTestLabStore((s) => s.selectedStepName);
  const selectStep = useTestLabStore((s) => s.selectStep);

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

    // Define custom Tractus-X dark theme
    monaco.editor.defineTheme("tractus-x-dark", {
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
    monaco.editor.setTheme("tractus-x-dark");

    // Dispose previous completion provider to avoid duplicates on re-mount
    completionDisposable.current?.dispose();

    // Register YAML completions for TestLab keywords
    completionDisposable.current = monaco.languages.registerCompletionItemProvider("yaml", {
      provideCompletionItems: (model: import("monaco-editor").editor.ITextModel, position: import("monaco-editor").Position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: import("monaco-editor").languages.CompletionItem[] = [
          // Top-level fields
          ...["kind", "name", "version", "dataspace_version", "description", "variables", "services", "steps", "setup", "cleanup", "preconditions", "tests"].map(
            (label) => ({
              label,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `${label}: `,
              range,
            })
          ),
          // Step types
          ...["create_asset", "delete_asset", "create_policy", "delete_policy", "create_contract_definition", "delete_contract_definition", "query_catalog_by_asset_id", "query_catalog", "dsp_catalog_request", "negotiate_contract", "transfer_data", "get_edr", "dataplane_call", "http_request", "do_dsp", "do_dsp_with_bpnl", "upload_backend_data", "sdk_call", "init_service", "stop_service", "await_callback"].map(
            (label) => ({
              label,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: label,
              detail: "Step type",
              range,
            })
          ),
          // Enum values
          ...["HARD", "SOFT"].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: label,
            detail: "Assertion severity",
            range,
          })),
          ...["EXACT", "CONTAINS", "SCHEMA", "REGEX", "STATUS_CODE", "NOT_CONTAINS"].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: label,
            detail: "Assertion type",
            range,
          })),
          ...["ABORT", "CONTINUE", "SKIP_REST"].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: label,
            detail: "Failure policy",
            range,
          })),
          ...["CONNECTOR_CONSUMER", "CONNECTOR_PROVIDER", "DSP_CONSUMER", "DSP_PROVIDER", "DTR"].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: label,
            detail: "Service type",
            range,
          })),
          // Snippets
          {
            label: "step",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "- type: ${1:http_request}",
              '  name: "${2:Step name}"',
              "  params:",
              '    ${3:key}: "${4:value}"',
              "  expect:",
              "    - type: STATUS_CODE",
              "      value: 200",
              "      severity: HARD",
            ].join("\n"),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Insert a test step",
            range,
          },
          {
            label: "variable",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "${1:var_name}:",
              "  type: str",
              '  default: "${2:value}"',
              "  runtime: ${3:false}",
              '  description: "${4:Description}"',
            ].join("\n"),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Insert a variable definition",
            range,
          },
          {
            label: "service",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '- name: "${1:provider}"',
              "  type: ${2:CONNECTOR_PROVIDER}",
              '  base_url: "${3:\\${provider_base_url}}"',
              "  auth:",
              '    api_key: "${4:\\${provider_api_key}}"',
              "  params:",
              "    version: saturn",
            ].join("\n"),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Insert a service definition",
            range,
          },
        ];

        return { suggestions };
      },
    });
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
    if (!selectedStepName || isEditorFocused.current) {
      decorationsRef.current.clear();
      return;
    }

    const currentYaml = edtr.getValue();
    const range = findStepLineRange(currentYaml, selectedStepName);
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
  }, [selectedStepName]);

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
