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
import { useProjectStore } from "@/store";
import { theme } from "@/shared/theme/tractusxTheme";

export function SchemaEditor() {
  const activeFile = useProjectStore((s) => s.activeFile);
  const schemas = useProjectStore((s) => s.schemas);

  const schemaContent = activeFile?.type === "schema"
    ? schemas.get(activeFile.name)?.content ?? ""
    : "";

  const handleMount: OnMount = (_editor, monaco) => {
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
  };

  return (
    <Editor
      height="100%"
      language="json"
      value={schemaContent}
      onMount={handleMount}
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
        readOnly: true,
        renderLineHighlight: "none",
        lineNumbers: "on",
        smoothScrolling: true,
      }}
    />
  );
}
