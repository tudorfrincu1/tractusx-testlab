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
 * SSE stream connection with auto-reconnection and Last-Event-ID replay.
 * Extracted from executionApi to keep files under 300 lines.
 */

/** Parsed SSE event with type, data payload, and optional event ID. */
interface SseEvent {
  type: string;
  data: string;
  id: string;
}

/**
 * Parse raw SSE text chunks into discrete events.
 * Handles the `event:` / `data:` / `id:` / blank-line protocol.
 */
function parseSseChunk(chunk: string): SseEvent[] {
  const events: SseEvent[] = [];
  let currentType = "message";
  let currentData = "";
  let currentId = "";

  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) {
      currentType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      currentData += line.slice(5).trim();
    } else if (line.startsWith("id:")) {
      currentId = line.slice(3).trim();
    } else if (line.trim() === "" && currentData) {
      events.push({ type: currentType, data: currentData, id: currentId });
      currentType = "message";
      currentData = "";
      currentId = "";
    }
  }
  return events;
}

/** SSE event types that indicate the job has reached a terminal state. */
const TERMINAL_EVENTS = new Set(["job.completed", "job.failed", "job.cancelled"]);

/** Maximum number of automatic reconnection attempts. */
const MAX_RETRIES = 3;

/** Delay in milliseconds between reconnection attempts. */
const RETRY_DELAY_MS = 2000;

/** State shared across the streaming read loop. */
interface StreamContext {
  trackedEventId: string;
  receivedTerminal: boolean;
}

/** Process a single SSE event: track ID, detect terminal, dispatch to callback. */
function dispatchSseEvent(
  evt: SseEvent,
  ctx: StreamContext,
  onEvent: (eventType: string, data: unknown) => void,
): void {
  if (evt.id) ctx.trackedEventId = evt.id;
  if (TERMINAL_EVENTS.has(evt.type)) ctx.receivedTerminal = true;
  try {
    const parsed: unknown = JSON.parse(evt.data);
    onEvent(evt.type, parsed);
  } catch {
    onEvent(evt.type, evt.data);
  }
}

/** Read the SSE stream to completion, dispatching events as they arrive. */
async function readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  ctx: StreamContext,
  onEvent: (eventType: string, data: unknown) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const evt of parseSseChunk(part + "\n\n")) {
        dispatchSseEvent(evt, ctx, onEvent);
      }
    }
  }
}

/** Convert an unknown caught value to an Error. */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error("Unknown stream error");
}

/**
 * Connect to the backend SSE stream for a running job.
 * Uses fetch + ReadableStream for fine-grained control.
 * Automatically reconnects with Last-Event-ID on unexpected close (max 3 retries).
 *
 * @param lastEventId - Optional event ID to resume from (sent as Last-Event-ID header).
 * @returns A cleanup function that aborts the connection and cancels pending retries.
 */
export function connectJobStream(
  backendUrl: string,
  jobId: string,
  onEvent: (eventType: string, data: unknown) => void,
  onError: (error: Error) => void,
  onClose: () => void,
  lastEventId = "",
): () => void {
  let aborted = false;
  let currentController: AbortController | null = null;
  let retryCount = 0;
  const ctx: StreamContext = { trackedEventId: lastEventId, receivedTerminal: false };
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleRetry = () => {
    if (aborted || retryCount >= MAX_RETRIES) {
      onError(new Error("Stream connection lost after maximum retries"));
      return;
    }
    retryCount++;
    retryTimer = setTimeout(() => {
      if (!aborted) consume();
    }, RETRY_DELAY_MS);
  };

  const consume = async () => {
    currentController = new AbortController();
    ctx.receivedTerminal = false;

    try {
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (ctx.trackedEventId) {
        headers["Last-Event-ID"] = ctx.trackedEventId;
      }

      const res = await fetch(
        `${backendUrl}/testlab/test-execution/${encodeURIComponent(jobId)}/stream`,
        { headers, signal: currentController.signal },
      );

      if (!res.ok) {
        throw new Error(`Stream error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      retryCount = 0;
      await readStream(reader, ctx, onEvent);

      if (ctx.receivedTerminal || aborted) {
        onClose();
      } else {
        scheduleRetry();
      }
    } catch (err: unknown) {
      if (aborted) return;
      if (retryCount < MAX_RETRIES) {
        scheduleRetry();
      } else {
        onError(toError(err));
      }
    }
  };

  consume();

  return () => {
    aborted = true;
    if (retryTimer) clearTimeout(retryTimer);
    currentController?.abort();
  };
}
