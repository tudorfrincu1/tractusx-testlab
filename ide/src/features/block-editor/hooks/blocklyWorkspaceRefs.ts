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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { RefObject } from "react";
import * as Blockly from "blockly";
import type { loadBlockCatalog } from "../config/blockDefinitions";

/** The block catalog resolved from the async catalog loader. */
export type BlockCatalog = Awaited<ReturnType<typeof loadBlockCatalog>>;

/**
 * The mutable refs shared by the three Blockly workspace effect hooks
 * (`useBlocklyInit`, `useBlocklyStoreSync`, `useBlocklyResize`).
 *
 * `useBlocklyWorkspace` owns these refs and passes the same bundle to each
 * hook so they coordinate on a single workspace/catalog instance and on the
 * debounce timers that guard store↔workspace sync.
 */
export interface BlocklyWorkspaceRefs {
  /** The DOM node Blockly is injected into. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** The injected Blockly workspace, or null before init / after dispose. */
  workspaceRef: RefObject<Blockly.WorkspaceSvg | null>;
  /** The loaded block catalog, or null before the async load resolves. */
  catalogRef: RefObject<BlockCatalog | null>;
  /** True while the hook is mutating the workspace from the store, so change
   *  listeners ignore the resulting Blockly events. */
  isUpdatingFromStore: RefObject<boolean>;
  /** Pending debounced model-sync timer, cleared on dispose / re-sync. */
  pendingUpdateRef: RefObject<ReturnType<typeof setTimeout> | null>;
  /** Pending debounced toolbox-refresh timer, cleared on dispose / re-sync. */
  pendingToolboxRef: RefObject<ReturnType<typeof setTimeout> | null>;
}
