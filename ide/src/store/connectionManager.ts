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
 * Connection lifecycle manager for the backend health check flow.
 * Handles abort controllers, race conditions, and state transitions.
 */

import {
  checkBackendHealth,
  isValidBackendUrl,
} from "./executionApi";

/** Discriminated connection status union. */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** State shape for connection-related fields. */
export interface ConnectionState {
  backendUrl: string;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
}

/** Callback to patch the store with partial connection state. */
export type SetConnectionState = (partial: Partial<ConnectionState>) => void;

/** Module-scoped abort controller for in-flight health checks. */
let connectAbortController: AbortController | null = null;

/**
 * Cancel any in-flight connection attempt.
 * Safe to call even if no connection is in progress.
 */
export function cancelInFlightConnection(): void {
  connectAbortController?.abort();
  connectAbortController = null;
}

/**
 * Run the full connect flow: validate → connecting → health check → result.
 * Handles race conditions via AbortController.
 */
export async function performConnect(
  url: string,
  setState: SetConnectionState,
): Promise<void> {
  const trimmed = url.trim();

  if (!isValidBackendUrl(trimmed)) {
    setState({
      backendUrl: "",
      connectionStatus: "error",
      connectionError: "Invalid URL: must start with http:// or https://",
    });
    return;
  }

  // Cancel any previous in-flight connection
  cancelInFlightConnection();

  const controller = new AbortController();
  connectAbortController = controller;

  setState({
    backendUrl: trimmed,
    connectionStatus: "connecting",
    connectionError: null,
  });

  try {
    await checkBackendHealth(trimmed, controller.signal);

    // Guard: if aborted between await and here, don't update state
    if (controller.signal.aborted) return;

    connectAbortController = null;
    setState({
      connectionStatus: "connected",
      connectionError: null,
    });
  } catch (err: unknown) {
    if (controller.signal.aborted) return;

    connectAbortController = null;
    const message = err instanceof Error ? err.message : String(err);
    setState({
      connectionStatus: "error",
      connectionError: message,
    });
  }
}

/**
 * Disconnect: cancel in-flight requests and reset connection state.
 */
export function performDisconnect(setState: SetConnectionState): void {
  cancelInFlightConnection();
  setState({
    backendUrl: "",
    connectionStatus: "disconnected",
    connectionError: null,
  });
}
