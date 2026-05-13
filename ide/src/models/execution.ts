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
 * Types for live execution SSE events and frontend execution state.
 * These mirror the backend SSE event payloads from the test runner.
 */

export type ExecutionPhase = "precondition" | "setup" | "main" | "cleanup";
export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped" | "waiting";
export type JobStatus = "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";

/** SSE event payload for individual step status changes. */
export interface StepEvent {
  step_index: number;
  step_name: string;
  step_type: string;
  phase: ExecutionPhase;
  status: StepStatus;
  duration_s?: number;
  error?: string;
}

/** SSE event payload for phase lifecycle transitions. */
export interface PhaseEvent {
  phase: ExecutionPhase;
  status: "running" | "completed" | "failed";
}

/** SSE event payload for job-level status changes. */
export interface JobEvent {
  job_id: string;
  status: JobStatus;
  tck?: string;
}

/** Frontend representation of a single execution step. */
export interface ExecutionStep {
  index: number;
  name: string;
  type: string;
  phase: ExecutionPhase;
  status: StepStatus;
  duration_s?: number;
  error?: string;
}

/** Frontend state for the entire execution session. */
export interface ExecutionState {
  is_connected: boolean;
  backend_url: string;
  job_id: string | null;
  job_status: JobStatus | null;
  current_phase: ExecutionPhase | null;
  steps: ExecutionStep[];
  error: string | null;
}
