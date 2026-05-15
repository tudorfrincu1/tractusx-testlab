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

/**
 * Tractus-X gold/black theme constants, matching the MkDocs site branding.
 */

export const theme = {
  colors: {
    primary: "#FFD700",
    primaryLight: "#FFEB3B",
    primaryDark: "#B8860B",
    bg: "#1a1a1a",
    bgLight: "#242424",
    bgLighter: "#2d2d2d",
    bgLightest: "#303030",
    surface: "#2a2a2a",
    text: "#e0e0e0",
    textMuted: "#999999",
    textBright: "#ffffff",
    border: "#404040",
    borderLight: "#555555",
    error: "#ff6b6b",
    errorBg: "rgba(255, 107, 107, 0.1)",
    warning: "#ffa726",
    warningBg: "rgba(255, 167, 38, 0.1)",
    success: "#66bb6a",
    successBg: "rgba(102, 187, 106, 0.1)",
  },
  stepColors: {
    mock: "#475569",
    wait: "#92400E",
    assert: "#9F1239",
    data: "#374151",
    flow: "#6D28D9",
    edc: "#1E40AF",
    dtr: "#065F46",
    discovery: "#7C2D12",
    app: "#4338CA",
    utilities: "#475569",
  },
  graph: {
    nodeBg: "#262626",
    nodeBorder: "#3a3a3a",
    nodeRadius: 10,
    nodeShadow: "0 1px 4px rgba(0,0,0,0.25)",
    nodePadding: "10px 16px",
    nodeFontSize: 11,
    nodeMinWidth: 150,
    edgeColor: "#4a4a4a",
    edgeAnimatedColor: "#555",
    phaseOpacity: 0.7,
  },
} as const;

export const stepCategoryMap: Record<string, keyof typeof theme.stepColors> = {
  mock_endpoint: "mock",
  mock_dtr: "mock",
  mock_discovery: "mock",
  wait_for_call: "wait",
  assert_variable: "assert",
  assert_response_schema: "assert",
  assert_called: "assert",
  generate_uuid: "data",
  generate_bpn: "data",
  template_string: "data",
  load_json_file: "data",
  json_path_extract: "data",
  load_schema: "data",
  retry: "flow",
  delay: "flow",
  log: "flow",
  query_catalog: "edc",
  negotiate: "edc",
  initiate_transfer: "edc",
  create_asset: "edc",
  create_policy: "edc",
  create_contract_def: "edc",
  register_shell: "dtr",
  lookup_shell: "dtr",
  add_submodel: "dtr",
  configure_discovery: "discovery",
  call_api: "app",
};

export function getStepColor(stepType: string): string {
  const category = stepCategoryMap[stepType];
  if (category) return theme.stepColors[category];
  return theme.stepColors.utilities;
}
