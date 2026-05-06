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
    assetManagement: "#166534",
    policies: "#1E40AF",
    contracts: "#6D28D9",
    catalog: "#9A3412",
    negotiation: "#991B1B",
    dataAccess: "#0F766E",
    convenience: "#475569",
    utilities: "#475569",
    async: "#9A3412",
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
  create_asset: "assetManagement",
  delete_asset: "assetManagement",
  create_policy: "policies",
  delete_policy: "policies",
  create_contract_definition: "contracts",
  delete_contract_definition: "contracts",
  query_catalog_by_asset_id: "catalog",
  query_catalog: "catalog",
  dsp_catalog_request: "catalog",
  negotiate_contract: "negotiation",
  transfer_data: "negotiation",
  get_edr: "negotiation",
  dataplane_call: "dataAccess",
  http_request: "dataAccess",
  do_dsp: "convenience",
  do_dsp_with_bpnl: "convenience",
  upload_backend_data: "utilities",
  sdk_call: "utilities",
  init_service: "utilities",
  stop_service: "utilities",
  await_callback: "async",
};

export function getStepColor(stepType: string): string {
  const category = stepCategoryMap[stepType];
  if (category) return theme.stepColors[category];
  return theme.stepColors.utilities;
}
