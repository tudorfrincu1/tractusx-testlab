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

/**
 * Barrel module — re-exports block registration, toolbox building,
 * serialization, and variable collection from their modular homes.
 */

import type * as BlocklyType from "blockly";
import {
  loadBlockCatalog,
  type BlockCatalog,
  registerStructuralBlocks,
  registerValueBlocks,
  registerRootBlocks,
  registerPolicyBlocks,
  registerPreconditionBlocks,
  registerCatalogBlocks,
  registerUtilityBlocks,
  registerAssertionBlocks,
  registerAuthBlocks,
  registerFilterExpressionBlock,
} from "../blocks";
import { buildToolbox } from "../toolbox/toolboxBuilder";
import { patchBubbleColours } from "../fields/bubblePatch";
import { workspaceToModel } from "../serialization/serialize/workspaceToModel";
import { populateWorkspaceFromModel, cleanupOrphanBlocks } from "../serialization/populate/modelToWorkspace";
import { collectWorkspaceVariables, collectCategorizedVariables } from "../blocks";
import type { CategorizedVariables } from "../blocks";

export type { BlockCatalog, CategorizedVariables };

export { loadBlockCatalog, buildToolbox, workspaceToModel, populateWorkspaceFromModel, collectWorkspaceVariables, collectCategorizedVariables, cleanupOrphanBlocks };

/** Register all block types from the modular sub-modules. */
export function registerBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog): void {
  patchBubbleColours();
  registerStructuralBlocks(Blockly);
  registerValueBlocks(Blockly, catalog);
  registerRootBlocks(Blockly);
  registerPolicyBlocks(Blockly);
  registerPreconditionBlocks(Blockly);
  registerUtilityBlocks(Blockly, catalog);
  registerAuthBlocks(Blockly);
  registerAssertionBlocks(Blockly, catalog);
  registerFilterExpressionBlock(Blockly);
  registerCatalogBlocks(Blockly, catalog);
}
