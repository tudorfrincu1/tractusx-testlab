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
 * Zustand store for live test execution state.
 * Manages backend connection, SSE streaming, and step/phase tracking.
 */

import { create } from "zustand";
import type {
  ExecutionPhase,
  ExecutionStep,
  JobStatus,
} from "../models/execution";
import {
  submitTestYaml,
  connectJobStream,
  cancelExecution,
  pauseExecution,
  resumeExecution,
} from "./executionApi";
import { handleSseEvent } from "./sseEventHandlers";
import type { ConnectionStatus } from "./connectionManager";
import { performConnect, performDisconnect } from "./connectionManager";

/* ── localStorage persistence ───────────────────────────────────────────── */

const BACKEND_URL_KEY = "testlab-backend-url";

function loadBackendUrl(): string {
  try {
    return localStorage.getItem(BACKEND_URL_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveBackendUrl(url: string): void {
  try {
    localStorage.setItem(BACKEND_URL_KEY, url);
  } catch {
    // localStorage may be unavailable
  }
}

/* ── Store interface ────────────────────────────────────────────────────── */

interface ExecutionStore {
  // Connection state (persisted URL, validated status)
  backendUrl: string;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  isConnected: boolean;

  // Connection actions
  connect: (url: string) => Promise<void>;
  disconnect: () => void;

  // Execution state
  jobId: string | null;
  jobStatus: JobStatus | null;
  currentPhase: ExecutionPhase | null;
  steps: ExecutionStep[];
  error: string | null;
  isExecuting: boolean;

  // Execution actions
  execute: (yaml: string) => Promise<void>;
  cancel: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  clearResults: () => void;
}

/* ── Abort handle (module-scoped, not serialized) ───────────────────────── */

let abortStream: (() => void) | null = null;

/* ── Store ──────────────────────────────────────────────────────────────── */

export const useExecutionStore = create<ExecutionStore>((set, get) => {
  const persistedUrl = loadBackendUrl();

  /** Shared setState wrapper that also persists the URL. */
  const setConnectionState = (
    partial: Partial<{ backendUrl: string; connectionStatus: ConnectionStatus; connectionError: string | null }>,
  ) => {
    if ("backendUrl" in partial) {
      saveBackendUrl(partial.backendUrl ?? "");
    }
    set({
      ...partial,
      isConnected: (partial.connectionStatus ?? get().connectionStatus) === "connected",
    });
  };

  // Auto-revalidate persisted URL on load
  if (persistedUrl) {
    performConnect(persistedUrl, setConnectionState);
  }

  return {
    backendUrl: persistedUrl,
    connectionStatus: persistedUrl ? "connecting" : "disconnected",
    connectionError: null,
    isConnected: false,

    connect: async (url) => {
      await performConnect(url, setConnectionState);
    },

    disconnect: () => {
      performDisconnect(setConnectionState);
    },

    jobId: null,
    jobStatus: null,
    currentPhase: null,
    steps: [],
    error: null,
    isExecuting: false,

  execute: async (yaml) => {
    const { backendUrl, connectionStatus, isExecuting, cancel } = get();
    if (connectionStatus !== "connected" || !backendUrl) {
      set({ error: "Not connected to backend" });
      return;
    }
    if (isExecuting) {
      cancel();
    }

    set({
      isExecuting: true,
      error: null,
      jobId: null,
      jobStatus: null,
      currentPhase: null,
      steps: [],
    });

    try {
      const { job_id, status } = await submitTestYaml(backendUrl, yaml);
      set({ jobId: job_id, jobStatus: status as JobStatus });

      abortStream = connectJobStream(
        backendUrl,
        job_id,
        (eventType, data) => handleSseEvent(set, eventType, data),
        (err) => {
          set({ error: err.message, isExecuting: false });
          abortStream = null;
        },
        () => {
          set({ isExecuting: false });
          abortStream = null;
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, isExecuting: false });
    }
  },

  cancel: () => {
    const { backendUrl, jobId } = get();
    abortStream?.();
    abortStream = null;
    set({ isExecuting: false, jobStatus: "cancelled" });
    if (backendUrl && jobId) {
      cancelExecution(backendUrl, jobId).catch(() => {
        /* best-effort — stream already aborted locally */
      });
    }
  },

  pause: async () => {
    const { backendUrl, jobId, jobStatus } = get();
    if (!backendUrl || !jobId || jobStatus !== "running") return;
    try {
      await pauseExecution(backendUrl, jobId);
      set({ jobStatus: "paused" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  resume: async () => {
    const { backendUrl, jobId, jobStatus } = get();
    if (!backendUrl || !jobId || jobStatus !== "paused") return;
    try {
      await resumeExecution(backendUrl, jobId);
      set({ jobStatus: "running" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  clearResults: () => {
    abortStream?.();
    abortStream = null;
    set({
      jobId: null,
      jobStatus: null,
      currentPhase: null,
      steps: [],
      error: null,
      isExecuting: false,
    });
  },
  };
});
