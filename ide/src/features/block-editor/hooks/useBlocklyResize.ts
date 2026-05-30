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

import { useEffect } from "react";
import * as Blockly from "blockly";
import type { BlocklyWorkspaceRefs } from "./blocklyWorkspaceRefs";

interface UseBlocklyResizeParams {
  containerRef: BlocklyWorkspaceRefs["containerRef"];
  workspaceRef: BlocklyWorkspaceRefs["workspaceRef"];
  ready: boolean;
}

/**
 * Keeps the Blockly SVG sized to its container. Runs an immediate `svgResize`
 * (for the case where the container already has its final dimensions) and then
 * observes the container for subsequent size changes. Re-runs when `ready`
 * flips, matching the original single-hook effect.
 */
export function useBlocklyResize({ containerRef, workspaceRef, ready }: UseBlocklyResizeParams) {
  useEffect(() => {
    const ws = workspaceRef.current;
    const container = containerRef.current;
    if (!ws || !container) return;

    // Immediate resize to catch cases where the container already has its
    // final dimensions (ResizeObserver only fires on subsequent changes).
    Blockly.svgResize(ws);

    const observer = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
