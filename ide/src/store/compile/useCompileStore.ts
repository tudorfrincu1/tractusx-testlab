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
 * Zustand store for YAML compilation state.
 * Tracks compile status, errors, and manages in-flight request cancellation.
 */

import { create } from "zustand";
import { compileYaml } from "./compileApi";
import type { CompileError } from "./compileApi";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type CompileStatus = "idle" | "compiling" | "ok" | "error" | "stale";

interface CompileStore {
  compileStatus: CompileStatus;
  compileErrors: CompileError[];

  compile: (backendUrl: string, yaml: string) => Promise<void>;
  resetCompile: () => void;
  markStale: () => void;
}

/* ── Module-scoped abort controller ─────────────────────────────────────── */

let inFlightController: AbortController | null = null;

function cancelInFlight(): void {
  inFlightController?.abort();
  inFlightController = null;
}

/* ── Store ──────────────────────────────────────────────────────────────── */

export const useCompileStore = create<CompileStore>((set, get) => ({
  compileStatus: "idle",
  compileErrors: [],

  compile: async (backendUrl, yaml) => {
    cancelInFlight();

    const controller = new AbortController();
    inFlightController = controller;

    set({ compileStatus: "compiling", compileErrors: [] });

    try {
      const result = await compileYaml(backendUrl, yaml, controller.signal);

      // Ignore result if this request was superseded
      if (controller.signal.aborted) return;

      if (result.status === "ok") {
        set({ compileStatus: "ok", compileErrors: [] });
      } else {
        set({ compileStatus: "error", compileErrors: result.errors });
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : "Unknown compilation error";
      set({
        compileStatus: "error",
        compileErrors: [{ path: "", message }],
      });
    } finally {
      if (inFlightController === controller) {
        inFlightController = null;
      }
    }
  },

  resetCompile: () => {
    cancelInFlight();
    set({ compileStatus: "idle", compileErrors: [] });
  },

  markStale: () => {
    const { compileStatus } = get();
    if (compileStatus === "idle") return;
    set({ compileStatus: "stale" });
  },
}));
