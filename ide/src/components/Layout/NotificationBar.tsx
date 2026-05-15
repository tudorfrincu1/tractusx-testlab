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
 * https://www.apache.org/licenses/LICENSE-2.0
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

import { useCallback, useEffect, useRef, useState } from "react";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useExecutionStore } from "../../store/useExecutionStore";
import "./NotificationBar.css";

/** Auto-dismiss delay for success messages (ms). */
const SUCCESS_AUTO_DISMISS_MS = 5_000;

interface Notification {
  readonly message: string;
  readonly severity: "error" | "success";
}

/**
 * Thin notification bar rendered just above the StatusBar.
 *
 * - Error notifications stay visible until the user clicks dismiss.
 * - Success notifications auto-dismiss after 5 seconds.
 */
export function NotificationBar() {
  const executionError = useExecutionStore((s) => s.error);
  const jobStatus = useExecutionStore((s) => s.jobStatus);

  const [current, setCurrent] = useState<Notification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setCurrent(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Show error notifications (persist until dismissed)
  useEffect(() => {
    if (!executionError) return;
    dismiss();
    setCurrent({ message: executionError, severity: "error" });
  }, [executionError, dismiss]);

  // Show success notification when job completes successfully
  useEffect(() => {
    if (jobStatus !== "completed") return;
    dismiss();
    setCurrent({ message: "Test execution completed successfully", severity: "success" });
    timerRef.current = setTimeout(dismiss, SUCCESS_AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobStatus, dismiss]);

  if (!current) return null;

  const barClass = `notification-bar notification-bar--${current.severity}`;

  return (
    <div className={barClass} role="alert">
      <span className="notification-bar__icon">
        {current.severity === "error"
          ? <ErrorOutlined sx={{ fontSize: 15 }} />
          : <CheckCircleOutlined sx={{ fontSize: 15 }} />}
      </span>
      <span className="notification-bar__message" title={current.message}>
        {current.message}
      </span>
      <button
        className="notification-bar__dismiss"
        onClick={dismiss}
        title="Dismiss"
        type="button"
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </button>
    </div>
  );
}
