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

import { useCallback, useMemo, useRef, useState } from "react";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import { useExecutionStore } from "../../store/useExecutionStore";
import { isValidBackendUrl } from "../../store/executionApi";
import "./ExecutionControls.css";

/**
 * Gear/plug icon button with a popover for configuring the backend URL.
 * Supports connecting, connected, error, and disconnected states.
 */
export function BackendSettings() {
  const backendUrl = useExecutionStore((s) => s.backendUrl);
  const connectionStatus = useExecutionStore((s) => s.connectionStatus);
  const connectionError = useExecutionStore((s) => s.connectionError);
  const connect = useExecutionStore((s) => s.connect);
  const disconnect = useExecutionStore((s) => s.disconnect);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(backendUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConnecting = connectionStatus === "connecting";
  const isConnected = connectionStatus === "connected";
  const isError = connectionStatus === "error";

  const draftValid = useMemo(() => isValidBackendUrl(draft.trim()), [draft]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setDraft(backendUrl);
      return !prev;
    });
  }, [backendUrl]);

  const handleConnect = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await connect(trimmed);
    if (useExecutionStore.getState().connectionStatus === "connected") {
      setIsOpen(false);
    }
  }, [draft, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setDraft("");
  }, [disconnect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && draftValid && !isConnecting) handleConnect();
      if (e.key === "Escape") setIsOpen(false);
    },
    [handleConnect, draftValid, isConnecting],
  );

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dotClass = isConnected
    ? "backend-status-dot--connected"
    : isError
      ? "backend-status-dot--error"
      : isConnecting
        ? "backend-status-dot--connecting"
        : "backend-status-dot--disconnected";

  return (
    <div className="backend-popover-anchor">
      <button
        className="backend-settings-btn"
        onClick={handleToggle}
        title="Backend connection settings"
        type="button"
      >
        <span className={`backend-status-dot ${dotClass}`} />
        <SettingsInputComponentIcon sx={{ fontSize: 14 }} />
      </button>

      {isOpen && (
        <>
          <div
            className="backend-popover-backdrop"
            onClick={handleBackdropClick}
          />
          <div className="backend-popover">
            <p className="backend-popover__title">Backend Connection</p>

            <div className="backend-popover__input-row">
              <input
                ref={inputRef}
                className={`backend-popover__input ${draft.trim() && !draftValid ? "backend-popover__input--invalid" : ""}`}
                type="url"
                placeholder="http://localhost:8000"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isConnecting}
                autoFocus
              />
              {isConnected || isConnecting ? (
                <button
                  className="backend-popover__connect-btn backend-popover__connect-btn--disconnect"
                  onClick={handleDisconnect}
                  type="button"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  className="backend-popover__connect-btn backend-popover__connect-btn--connect"
                  onClick={handleConnect}
                  type="button"
                  disabled={!draftValid || isConnecting}
                >
                  Connect
                </button>
              )}
            </div>

            {draft.trim() && !draftValid && (
              <p className="backend-popover__hint">
                URL must start with http:// or https://
              </p>
            )}

            <div className="backend-popover__status">
              <span className={`backend-status-dot ${dotClass}`} />
              {isConnecting && (
                <>
                  <span className="backend-popover__spinner" />
                  Connecting…
                </>
              )}
              {isConnected && `Connected to ${backendUrl}`}
              {isError && (
                <span className="backend-popover__error">
                  {connectionError ?? "Connection failed"}
                </span>
              )}
              {connectionStatus === "disconnected" && "Not connected"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
