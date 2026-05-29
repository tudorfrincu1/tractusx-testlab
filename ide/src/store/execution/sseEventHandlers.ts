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
 * SSE event dispatching and type guards for execution store.
 * Extracted from useExecutionStore to keep files under 300 lines.
 */

import type {
  ExecutionPhase,
  ExecutionStep,
  JobStatus,
  StepEvent,
  PhaseEvent,
  JobEvent,
} from "@/models/execution";

/** Minimal state shape needed by SSE event handlers. */
interface SseHandlerState {
  currentPhase: ExecutionPhase | null;
  jobStatus: JobStatus | null;
  isExecuting: boolean;
  steps: ExecutionStep[];
}

/** Setter function compatible with Zustand's set(). */
export type SseSetState = (
  partial:
    | Partial<SseHandlerState>
    | ((s: SseHandlerState) => Partial<SseHandlerState>),
) => void;

/* ── Type guards for SSE event payloads ─────────────────────────────────── */

function isStepEvent(data: unknown): data is StepEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    ("step_index" in data || "step_name" in data)
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

/* ── SSE event dispatcher ───────────────────────────────────────────────── */

export function handleSseEvent(
  set: SseSetState,
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

    case "job.paused":
      if (isJobEvent(data)) {
        set({ jobStatus: "paused" });
      }
      break;

    case "job.resumed":
      if (isJobEvent(data)) {
        set({ jobStatus: "running" });
      }
      break;
  }
}

/* ── Phase normalization ─────────────────────────────────────────────────── */

const PHASE_MAP: Record<string, ExecutionPhase> = {
  precondition: "precondition",
  setup: "setup",
  main: "main",
  cleanup: "cleanup",
};

function normalizePhase(raw: string | undefined): ExecutionPhase {
  if (!raw) return "main";
  return PHASE_MAP[raw.toLowerCase()] ?? "main";
}

/* ── Step event handler ─────────────────────────────────────────────────── */

function handleStepEvent(set: SseSetState, event: StepEvent): void {
  const step: ExecutionStep = {
    index: event.step_index ?? 0,
    name: event.step_name,
    type: event.step_type ?? "",
    phase: normalizePhase(event.phase),
    status: event.status,
    duration_s: event.duration_s,
    error: event.error,
  };

  set((state) => {
    const existing = state.steps.findIndex((s) => s.name === step.name);
    const updated = [...state.steps];
    if (existing >= 0) {
      // Merge: keep existing fields, update with new data
      updated[existing] = { ...updated[existing], ...step };
    } else {
      updated.push(step);
    }
    return { steps: updated };
  });
}
