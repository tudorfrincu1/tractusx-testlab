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
 * Backend API helpers for live test execution.
 * Handles YAML submission and SSE event streaming.
 */

/** Response from GET /testlab/health */
export interface HealthResponse {
  status: string;
  version: string;
}

/** Timeout in milliseconds for health check requests. */
const HEALTH_CHECK_TIMEOUT_MS = 5000;

/**
 * Validate that a URL string starts with http:// or https://.
 * Does NOT make a network request.
 */
export function isValidBackendUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url);
}

/**
 * Check backend health by calling GET {backendUrl}/testlab/health.
 * Uses AbortController with a 5-second timeout.
 * Accepts an optional external signal to allow cancellation from callers.
 */
export async function checkBackendHealth(
  backendUrl: string,
  externalSignal?: AbortSignal,
): Promise<HealthResponse> {
  if (!isValidBackendUrl(backendUrl)) {
    throw new Error("Invalid URL: must start with http:// or https://");
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    HEALTH_CHECK_TIMEOUT_MS,
  );

  /** Abort if either the timeout or external signal fires. */
  const onExternalAbort = () => timeoutController.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);

  try {
    const res = await fetch(`${backendUrl}/testlab/health`, {
      signal: timeoutController.signal,
    });
    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as HealthResponse;
  } catch (err: unknown) {
    if (externalSignal?.aborted) {
      throw new Error("Connection cancelled");
    }
    if (timeoutController.signal.aborted) {
      throw new Error("Connection timed out after 5 seconds");
    }
    if (err instanceof TypeError) {
      throw new Error("Failed to connect: server unreachable");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/** Response from POST /testlab/test-execution/run */
export interface SubmitResponse {
  job_id: string;
  status: string;
}

/**
 * Submit a YAML test definition to the backend for execution.
 * Returns the assigned job_id and initial status.
 */
export async function submitTestYaml(
  backendUrl: string,
  yaml: string,
): Promise<SubmitResponse> {
  const res = await fetch(`${backendUrl}/testlab/test-execution/run`, {
    method: "POST",
    headers: { "Content-Type": "application/x-yaml" },
    body: yaml,
  });
  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SubmitResponse>;
}

export { connectJobStream } from "./sseStream";

/* ── Execution control endpoints ────────────────────────────────────────── */

/**
 * Cancel a running execution.
 * POST /testlab/test-execution/{jobId}/cancel
 */
export async function cancelExecution(
  backendUrl: string,
  jobId: string,
): Promise<void> {
  const res = await fetch(
    `${backendUrl}/testlab/test-execution/${encodeURIComponent(jobId)}/cancel`,
    { method: "POST" },
  );
  if (!res.ok) {
    throw new Error(`Cancel failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * Pause a running execution.
 * POST /testlab/test-execution/{jobId}/pause
 */
export async function pauseExecution(
  backendUrl: string,
  jobId: string,
): Promise<void> {
  const res = await fetch(
    `${backendUrl}/testlab/test-execution/${encodeURIComponent(jobId)}/pause`,
    { method: "POST" },
  );
  if (!res.ok) {
    throw new Error(`Pause failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * Resume a paused execution.
 * POST /testlab/test-execution/{jobId}/resume
 */
export async function resumeExecution(
  backendUrl: string,
  jobId: string,
): Promise<void> {
  const res = await fetch(
    `${backendUrl}/testlab/test-execution/${encodeURIComponent(jobId)}/resume`,
    { method: "POST" },
  );
  if (!res.ok) {
    throw new Error(`Resume failed: ${res.status} ${res.statusText}`);
  }
}
