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

/**
 * Barrel module — re-exports the public API that was previously a single
 * 2 100-line monolith.  Consumers keep importing from "./blockDefinitions"
 * so nothing downstream needs to change.
 */

import type * as BlocklyType from "blockly";
import type { BlockCatalog } from "./blocks/catalogLoader";
import { registerValueBlocks } from "./blocks/valueBlocks";
import { registerAssertionBlocks } from "./blocks/assertionBlocks";
import { registerRootBlocks } from "./blocks/rootBlocks";
import { registerAuthBlocks } from "./blocks/authBlocks";
import { registerUtilityBlocks } from "./blocks/utilityBlocks";
import { registerCatalogBlocks } from "./blocks/catalogBlocks";

// ── Re-exports ────────────────────────────────────────────────────────────────

export type { BlockCatalog } from "./blocks/catalogLoader";
export { loadBlockCatalog } from "./blocks/catalogLoader";
export { deriveTestLabel } from "./blocks/icons";
export { collectWorkspaceVariables } from "./blocks/variableCollection";
export { buildToolbox } from "./toolbox/toolboxBuilder";
export { workspaceToModel } from "./serialization/workspaceToModel";
export { populateWorkspaceFromModel, cleanupOrphanBlocks } from "./serialization/modelToWorkspace";

// ── Orchestrated registration ─────────────────────────────────────────────────

export function registerBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {
  registerValueBlocks(Blockly);
  registerAssertionBlocks(Blockly, catalog);
  registerRootBlocks(Blockly);
  registerAuthBlocks(Blockly);
  registerUtilityBlocks(Blockly);
  registerCatalogBlocks(Blockly, catalog);
}
