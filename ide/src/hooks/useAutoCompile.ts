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
 * Hook that watches project store changes, marks compile status as stale,
 * and auto-triggers compilation after an 800 ms debounce.
 */

import { useEffect, useRef } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useCompileStore } from "../store/useCompileStore";
import { useExecutionStore } from "../store/useExecutionStore";
import { modelToYaml } from "../sync/modelToYaml";

const AUTO_COMPILE_DELAY_MS = 800;

/**
 * Subscribe to project model changes and auto-compile.
 * Mount this once at the app root (e.g. inside TopBar or App).
 */
export function useAutoCompile(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Track previous references to detect actual model changes
    let prevTck = useProjectStore.getState().tck;
    let prevTests = useProjectStore.getState().tests;
    let prevTestOrder = useProjectStore.getState().testOrder;
    let prevGeneration = useProjectStore.getState().projectGeneration;

    const unsubscribe = useProjectStore.subscribe((state) => {
      const changed =
        state.tck !== prevTck ||
        state.tests !== prevTests ||
        state.testOrder !== prevTestOrder ||
        state.projectGeneration !== prevGeneration;

      prevTck = state.tck;
      prevTests = state.tests;
      prevTestOrder = state.testOrder;
      prevGeneration = state.projectGeneration;

      if (!changed) return;

      // Mark stale immediately
      useCompileStore.getState().markStale();

      // Clear any pending auto-compile
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      // Schedule auto-compile after debounce
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        triggerCompile();
      }, AUTO_COMPILE_DELAY_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
}

function triggerCompile(): void {
  const { connectionStatus, backendUrl } = useExecutionStore.getState();
  if (connectionStatus !== "connected" || !backendUrl) return;

  const { hasProject, tck } = useProjectStore.getState();
  if (!hasProject) return;

  const yaml = modelToYaml(tck);
  useCompileStore.getState().compile(backendUrl, yaml);
}
