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

import { useCallback, useRef, useState } from "react";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import { useExecutionStore } from "../../store/useExecutionStore";
import "./ExecutionControls.css";

/**
 * Gear/plug icon button with a popover for configuring the backend URL.
 */
export function BackendSettings() {
  const backendUrl = useExecutionStore((s) => s.backendUrl);
  const isConnected = useExecutionStore((s) => s.isConnected);
  const setBackendUrl = useExecutionStore((s) => s.setBackendUrl);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(backendUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setDraft(backendUrl);
      return !prev;
    });
  }, [backendUrl]);

  const handleConnect = useCallback(() => {
    const trimmed = draft.trim();
    setBackendUrl(trimmed);
    if (trimmed) setIsOpen(false);
  }, [draft, setBackendUrl]);

  const handleDisconnect = useCallback(() => {
    setBackendUrl("");
    setDraft("");
  }, [setBackendUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleConnect();
      if (e.key === "Escape") setIsOpen(false);
    },
    [handleConnect],
  );

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="backend-popover-anchor">
      <button
        className="backend-settings-btn"
        onClick={handleToggle}
        title="Backend connection settings"
        type="button"
      >
        <span
          className={`backend-status-dot ${isConnected ? "backend-status-dot--connected" : "backend-status-dot--disconnected"}`}
        />
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
                className="backend-popover__input"
                type="url"
                placeholder="http://localhost:8000"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {isConnected ? (
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
                  disabled={!draft.trim()}
                >
                  Connect
                </button>
              )}
            </div>

            <div className="backend-popover__status">
              <span
                className={`backend-status-dot ${isConnected ? "backend-status-dot--connected" : "backend-status-dot--disconnected"}`}
              />
              {isConnected ? `Connected to ${backendUrl}` : "Not connected"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
