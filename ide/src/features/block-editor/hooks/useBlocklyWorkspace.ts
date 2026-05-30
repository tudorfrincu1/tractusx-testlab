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

import { useRef, useState, type RefObject } from "react";
import * as Blockly from "blockly";

import { useEditorStore } from "@/store";
import { loadBlockCatalog } from "../config/blockDefinitions";
import { useBlocklyInit } from "./useBlocklyInit";
import { useBlocklyStoreSync } from "./useBlocklyStoreSync";
import { useBlocklyResize } from "./useBlocklyResize";
import type { BlocklyWorkspaceRefs } from "./blocklyWorkspaceRefs";

/**
 * Owns the Blockly workspace lifecycle by composing three focused effect hooks:
 * - `useBlocklyInit`      — inject + catalog load + initial population
 * - `useBlocklyStoreSync` — model→workspace sync on store changes
 * - `useBlocklyResize`    — keep the SVG sized to its container
 *
 * It holds the shared refs and `ready` state the three hooks coordinate on and
 * returns the same `{ workspace, catalog, ready }` shape as before the split.
 */
export function useBlocklyWorkspace(containerRef: RefObject<HTMLDivElement | null>) {
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const catalogRef = useRef<Awaited<ReturnType<typeof loadBlockCatalog>> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToolboxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);

  const modelKind = useEditorStore((s) => s.model.kind);
  const setModelFromBlocks = useEditorStore((s) => s.setModelFromBlocks);
  const selectStep = useEditorStore((s) => s.selectStep);

  const refs: BlocklyWorkspaceRefs = {
    containerRef,
    workspaceRef,
    catalogRef,
    isUpdatingFromStore,
    pendingUpdateRef,
    pendingToolboxRef,
  };

  useBlocklyInit({ refs, modelKind, setModelFromBlocks, selectStep, setReady });
  useBlocklyStoreSync({ refs, ready, modelKind });
  useBlocklyResize({ containerRef, workspaceRef, ready });

  return { workspace: ready ? workspaceRef.current : null, catalog: catalogRef.current, ready };
}
