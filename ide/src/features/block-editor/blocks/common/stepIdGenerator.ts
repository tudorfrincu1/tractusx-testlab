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

import type { Workspace } from "blockly";

const TYPE_TO_SHORT_ID: Record<string, string> = {
  "pull_data_filtered": "pull_data",
  "pull_data_filtered_by_policy": "pull_data_policy",
  "generate_uuid": "gen_uuid",
  "generate_bpn": "gen_bpn",
  "http_call_dataplane": "http_dataplane",
  "http_call": "http_call",
  "mock_endpoint": "mock_ep",
  "mock_discovery": "mock_disc",
  "mock_dtr": "mock_dtr",
  "wait_for_call": "wait_call",
  "create_asset": "create_asset",
  "create_policy": "create_policy",
  "create_contract_definition": "create_contract",
  "negotiate": "negotiate",
  "initiate_transfer": "init_transfer",
  "query_catalog": "query_catalog",
  "query_catalog_with_filters": "query_catalog_f",
  "register_shell": "reg_shell",
  "lookup_shell": "lookup_shell",
  "add_submodel": "add_submodel",
  "validate_path": "validate",
  "json_path_extract": "extract",
  "log": "log",
  "delay": "delay",
  "retry": "retry",
} as const;

/**
 * Generates a unique short step ID for a block based on its type.
 * Checks existing workspace blocks to avoid collisions.
 */
export function generateStepId(blockType: string, workspace: Workspace): string {
  const rawType = blockType.startsWith("step_") ? blockType.slice(5) : blockType;
  const base = TYPE_TO_SHORT_ID[rawType] ?? rawType.slice(0, 12);

  const existingIds = new Set<string>();
  for (const block of workspace.getAllBlocks(false)) {
    if (!block.type.startsWith("step_")) continue;
    const id = block.getFieldValue("STEP_ID");
    if (id) existingIds.add(id);
  }

  if (!existingIds.has(base)) return base;

  let suffix = 2;
  while (existingIds.has(`${base}_${suffix}`)) {
    suffix++;
  }
  return `${base}_${suffix}`;
}
