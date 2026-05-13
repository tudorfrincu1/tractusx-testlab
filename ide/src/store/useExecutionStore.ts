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
 * Zustand store for live test execution state.
 * Manages backend connection, SSE streaming, and step/phase tracking.
 */

import { create } from "zustand";
import type {
  ExecutionPhase,
  ExecutionStep,
  JobStatus,
  StepEvent,
  PhaseEvent,
  JobEvent,
} from "../models/execution";
import { submitTestYaml, connectJobStream } from "./executionApi";

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
  // Connection config (persisted)
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  isConnected: boolean;

  // Execution state
  jobId: string | null;
  jobStatus: JobStatus | null;
  currentPhase: ExecutionPhase | null;
  steps: ExecutionStep[];
  error: string | null;
  isExecuting: boolean;

  // Actions
  execute: (yaml: string) => Promise<void>;
  cancel: () => void;
  clearResults: () => void;
}

/* ── Type guards for SSE event payloads ─────────────────────────────────── */

function isStepEvent(data: unknown): data is StepEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "step_index" in data &&
    "status" in data
  );
}

function isPhaseEvent(data: unknown): data is PhaseEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "phase" in data &&
    "status" in data &&
    !("step_index" in data)
  );
}

function isJobEvent(data: unknown): data is JobEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "job_id" in data &&
    "status" in data &&
    !("phase" in data)
  );
}

/* ── Abort handle (module-scoped, not serialized) ───────────────────────── */

let abortStream: (() => void) | null = null;

/* ── Store ──────────────────────────────────────────────────────────────── */

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  backendUrl: loadBackendUrl(),
  isConnected: loadBackendUrl() !== "",

  jobId: null,
  jobStatus: null,
  currentPhase: null,
  steps: [],
  error: null,
  isExecuting: false,

  setBackendUrl: (url) => {
    saveBackendUrl(url);
    set({ backendUrl: url, isConnected: url !== "" });
  },

  execute: async (yaml) => {
    const { backendUrl, isExecuting, cancel } = get();
    if (!backendUrl) {
      set({ error: "No backend URL configured" });
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
    abortStream?.();
    abortStream = null;
    set({ isExecuting: false, jobStatus: "cancelled" });
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
}));

/* ── SSE event dispatcher ───────────────────────────────────────────────── */

type SetState = (
  partial: Partial<ExecutionStore> | ((s: ExecutionStore) => Partial<ExecutionStore>),
) => void;

function handleSseEvent(
  set: SetState,
  eventType: string,
  data: unknown,
): void {
  switch (eventType) {
    case "step.started":
    case "step.completed":
    case "step.failed":
    case "step.skipped":
      if (isStepEvent(data)) {
        handleStepEvent(set, data);
      }
      break;

    case "phase.started":
    case "phase.completed":
    case "phase.failed":
      if (isPhaseEvent(data)) {
        set({ currentPhase: data.phase });
      }
      break;

    case "job.completed":
    case "job.failed":
    case "job.cancelled":
      if (isJobEvent(data)) {
        set({ jobStatus: data.status, isExecuting: false });
      }
      break;

    case "job.started":
      if (isJobEvent(data)) {
        set({ jobStatus: data.status });
      }
      break;
  }
}

function handleStepEvent(set: SetState, event: StepEvent): void {
  const step: ExecutionStep = {
    index: event.step_index,
    name: event.step_name,
    type: event.step_type,
    phase: event.phase,
    status: event.status,
    duration_s: event.duration_s,
    error: event.error,
  };

  set((state) => {
    const existing = state.steps.findIndex((s) => s.index === step.index);
    const updated = [...state.steps];
    if (existing >= 0) {
      updated[existing] = step;
    } else {
      updated.push(step);
    }
    return { steps: updated };
  });
}
