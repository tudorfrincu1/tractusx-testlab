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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useState, useEffect, useRef } from "react";
import * as Blockly from "blockly";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmber from "@mui/icons-material/WarningAmber";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import type { ValidationError } from "@/services/validation/validator";

export interface ValidationIssue {
  severity: "error" | "warning";
  source: string;
  message: string;
  blockId?: string;
}

export interface ValidationPanelProps {
  issues: ValidationIssue[];
  onClose: () => void;
}

/** Collect warning text from all Blockly blocks in the workspace. */
export function collectBlockWarnings(ws: Blockly.WorkspaceSvg): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const block of ws.getAllBlocks(false)) {
    const warningBubble = block.getIcon(Blockly.icons.WarningIcon.TYPE);
    const warningText = warningBubble
      ? (warningBubble as Blockly.icons.WarningIcon).getText()
      : undefined;
    if (warningText) {
      const name = block.getFieldValue("NAME") || block.type;
      issues.push({
        severity: "warning",
        source: name,
        message: warningText,
        blockId: block.id,
      });
    }
  }
  return issues;
}

/** Convert model ValidationErrors into ValidationIssues. */
export function modelErrorsToIssues(errors: ValidationError[]): ValidationIssue[] {
  return errors.map((e) => ({
    severity: e.severity,
    source: e.path || "model",
    message: e.message,
  }));
}

function centerOnBlock(blockId: string) {
  const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
  if (!ws) return;
  const block = ws.getBlockById(blockId);
  if (!block) return;
  ws.centerOnBlock(blockId);
  Blockly.common.setSelected(block);
}

const SEVERITY_ICON = {
  error: <ErrorOutlined sx={{ fontSize: 14, color: "#ff6b6b" }} />,
  warning: <WarningAmber sx={{ fontSize: 14, color: "#ffa726" }} />,
} as const;

export function ValidationPanel({ issues, onClose }: ValidationPanelProps) {
  const [height, setHeight] = useState(220);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      const delta = dragRef.current.startY - e.clientY;
      setHeight(Math.max(80, Math.min(500, dragRef.current.startHeight + delta)));
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startHeight: height };
  };

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="validation-panel" style={{ height }}>
      <div className="validation-panel__resize-handle" onMouseDown={handleResizeStart} />
      <div className="validation-panel__header">
        <span className="validation-panel__title">Issues</span>
        {errorCount > 0 && (
          <span className="validation-panel__badge validation-panel__badge--error">
            <ErrorOutlined sx={{ fontSize: 12 }} />
            {errorCount}
          </span>
        )}
        {warningCount > 0 && (
          <span className="validation-panel__badge validation-panel__badge--warning">
            <WarningAmber sx={{ fontSize: 12 }} />
            {warningCount}
          </span>
        )}
        <div className="validation-panel__spacer" />
        <button
          className="validation-panel__close"
          onClick={onClose}
          title="Close"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>

      <div className="validation-panel__list">
        {issues.length === 0 ? (
          <div className="validation-panel__empty">
            <CheckCircleOutlined sx={{ fontSize: 18 }} />
            No issues found
          </div>
        ) : (
          issues.map((issue, idx) => (
            <button
              key={idx}
              className="validation-panel__row"
              onClick={() => issue.blockId && centerOnBlock(issue.blockId)}
              title={issue.blockId ? "Click to focus block" : undefined}
            >
              <span className="validation-panel__row-icon">
                {SEVERITY_ICON[issue.severity]}
              </span>
              <span className="validation-panel__row-source">{issue.source}</span>
              <span className="validation-panel__row-message">{issue.message}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
