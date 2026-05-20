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

import { theme } from "../../theme/tractusxTheme";
import { toRuntimeStepType } from "../BlockEditor/serialization/stepTypeAliases";

type Monaco = typeof import("monaco-editor");

/** Define and apply the custom Tractus-X dark theme. */
export function defineTractusDarkTheme(monaco: Monaco): void {
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
}

/** Register YAML completions for TestLab keywords. */
export function registerYamlCompletions(monaco: Monaco): import("monaco-editor").IDisposable {
  return monaco.languages.registerCompletionItemProvider("yaml", {
    provideCompletionItems: (
      model: import("monaco-editor").editor.ITextModel,
      position: import("monaco-editor").Position,
    ) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const topLevelFields = [
        "kind", "name", "version", "dataspace_version", "description",
        "variables", "services", "steps", "setup", "cleanup", "preconditions", "tests",
      ];

      const stepTypes = [
        "create_asset", "delete_asset", "create_policy", "delete_policy",
        "create_contract_definition", "delete_contract_definition",
        "query_catalog_by_asset_id", "query_catalog", "query_catalog_with_filters", "dsp_catalog_request",
        "negotiate_contract", "transfer_data", "get_edr", "dataplane_call",
        "http_request", "do_dsp", "do_dsp_with_bpnl", "upload_backend_data",
        "sdk_call", "init_service", "stop_service", "await_callback",
      ].map((stepType) => toRuntimeStepType(stepType));
      const runtimeStepTypes = [...new Set(stepTypes)];

      const assertionSeverities = ["HARD", "SOFT"];
      const assertionTypes = ["EXACT", "CONTAINS", "SCHEMA", "REGEX", "STATUS_CODE", "NOT_CONTAINS"];
      const failurePolicies = ["ABORT", "CONTINUE", "SKIP_REST"];
      const serviceTypes = ["CONNECTOR_CONSUMER", "CONNECTOR_PROVIDER", "DSP_CONSUMER", "DSP_PROVIDER", "DTR"];

      const suggestions: import("monaco-editor").languages.CompletionItem[] = [
        ...topLevelFields.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: `${label}: `,
          range,
        })),
        ...runtimeStepTypes.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: label,
          detail: "Step type",
          range,
        })),
        ...assertionSeverities.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: label,
          detail: "Assertion severity",
          range,
        })),
        ...assertionTypes.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: label,
          detail: "Assertion type",
          range,
        })),
        ...failurePolicies.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: label,
          detail: "Failure policy",
          range,
        })),
        ...serviceTypes.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: label,
          detail: "Service type",
          range,
        })),
        {
          label: "step",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "- type: ${1:http_request}",
            '  name: "${2:Step name}"',
            "  params:",
            '    ${3:key}: "${4:value}"',
            "  validate:",
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
}
