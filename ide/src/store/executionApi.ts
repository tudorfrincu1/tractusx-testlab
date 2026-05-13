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
 * Backend API helpers for live test execution.
 * Handles YAML submission and SSE event streaming.
 */

/** Response from POST /testlab/run/yaml */
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
  const res = await fetch(`${backendUrl}/testlab/run/yaml`, {
    method: "POST",
    headers: { "Content-Type": "application/x-yaml" },
    body: yaml,
  });
  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SubmitResponse>;
}

/** Parsed SSE event with type and data payload. */
interface SseEvent {
  type: string;
  data: string;
}

/**
 * Parse raw SSE text chunks into discrete events.
 * Handles the `event:` / `data:` / blank-line protocol.
 */
function parseSseChunk(chunk: string): SseEvent[] {
  const events: SseEvent[] = [];
  let currentType = "message";
  let currentData = "";

  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) {
      currentType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      currentData += line.slice(5).trim();
    } else if (line.trim() === "" && currentData) {
      events.push({ type: currentType, data: currentData });
      currentType = "message";
      currentData = "";
    }
  }
  return events;
}

/**
 * Connect to the backend SSE stream for a running job.
 * Uses fetch + ReadableStream for fine-grained control.
 *
 * @returns A cleanup function that aborts the connection.
 */
export function connectJobStream(
  backendUrl: string,
  jobId: string,
  onEvent: (eventType: string, data: unknown) => void,
  onError: (error: Error) => void,
  onClose: () => void,
): () => void {
  const controller = new AbortController();

  const consume = async () => {
    try {
      const res = await fetch(
        `${backendUrl}/testlab/run/${encodeURIComponent(jobId)}/stream`,
        {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        throw new Error(`Stream error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (separated by double newline)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const events = parseSseChunk(part + "\n\n");
          for (const evt of events) {
            try {
              const parsed: unknown = JSON.parse(evt.data);
              onEvent(evt.type, parsed);
            } catch {
              onEvent(evt.type, evt.data);
            }
          }
        }
      }

      onClose();
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  consume();

  return () => {
    controller.abort();
  };
}
