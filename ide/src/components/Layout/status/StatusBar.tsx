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

import { useTestLabStore } from "../../../store/slices/useTestLabStore";
import { useProjectStore } from "../../../store/slices/useProjectStore";
import { theme } from "../../../theme/tractusxTheme";
import { isTest, isTck } from "../../../models/schema";
import type { ScriptDefinition, TckDefinition } from "../../../models/schema";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmber from "@mui/icons-material/WarningAmber";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import Science from "@mui/icons-material/Science";

export function StatusBar() {
  const errors = useTestLabStore((s) => s.errors);
  const toggleValidation = useTestLabStore((s) => s.toggleValidation);
  const model = useTestLabStore((s) => s.model);
  const activeFile = useProjectStore((s) => s.activeFile);
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  const stepCount = isTest(model)
    ? ((model as ScriptDefinition).setup?.length ?? 0) +
      ((model as ScriptDefinition).steps?.length ?? 0) +
      ((model as ScriptDefinition).teardown?.length ?? 0)
    : 0;

  const testCount = isTck(model)
    ? (model as TckDefinition).tests.length
    : 0;

  return (
    <div
      style={{
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        background: theme.colors.bgLight,
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: 11,
        color: theme.colors.textMuted,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          onClick={toggleValidation}
          title="Toggle Issues Panel"
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 3, padding: "0 4px" }}
          className="statusbar-issues-toggle"
        >
        {errorCount > 0 && (
          <span style={{ color: theme.colors.error, display: "flex", alignItems: "center", gap: 3 }}>
            <ErrorOutlined sx={{ fontSize: 13 }} />
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </span>
        )}
        {warningCount > 0 && (
          <span style={{ color: theme.colors.warning, display: "flex", alignItems: "center", gap: 3 }}>
            <WarningAmber sx={{ fontSize: 13 }} />
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </span>
        )}
        {errorCount === 0 && warningCount === 0 && (
          <span style={{ color: theme.colors.success, display: "flex", alignItems: "center", gap: 3 }}>
            <CheckCircleOutlined sx={{ fontSize: 13 }} />
            No issues
          </span>
        )}
        </div>
        {isTest(model) && (
          <span>{stepCount} step{stepCount !== 1 ? "s" : ""}</span>
        )}
        {isTck(model) && (
          <span>{testCount} test{testCount !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {activeFile && (
          <span style={{ color: isDirty(activeFile.name) ? theme.colors.warning : theme.colors.textMuted }}>
            {projectName} / {activeFile.type === "tck" ? "index.yaml" : activeFile.type === "schema" ? `schemas / ${activeFile.name}.json` : `tests / ${activeFile.name}.yaml`}
            {isDirty(activeFile.name) ? " •" : ""}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Science sx={{ fontSize: 12 }} />
          Tractus-X TestLab IDE
        </span>
      </div>
    </div>
  );
}
