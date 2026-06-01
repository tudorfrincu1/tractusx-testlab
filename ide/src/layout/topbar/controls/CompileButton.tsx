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

import { useCallback } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import BuildIcon from "@mui/icons-material/Build";
import { useCompileStore } from "../../../store/compile/useCompileStore";
import { useExecutionStore } from "../../../store/execution/useExecutionStore";
import { useProjectStore } from "../../../store/project/useProjectStore";
import { modelToYaml } from "../../../services";
import type { CompileStatus } from "../../../store/compile/useCompileStore";

/** Map compile status to the appropriate icon. */
function CompileStatusIcon({ status }: Readonly<{ status: CompileStatus }>) {
  switch (status) {
    case "ok":
      return <CheckCircleIcon sx={{ fontSize: 14 }} />;
    case "error":
      return <ErrorIcon sx={{ fontSize: 14 }} />;
    case "stale":
      return <WarningIcon sx={{ fontSize: 14 }} />;
    case "compiling":
      return <span className="execute-spinner" />;
    default:
      return <BuildIcon sx={{ fontSize: 14 }} />;
  }
}

/** CSS modifier class for each compile status. */
const STATUS_CLASS: Record<CompileStatus, string> = {
  idle: "compile-btn--idle",
  compiling: "compile-btn--compiling",
  ok: "compile-btn--ok",
  error: "compile-btn--error",
  stale: "compile-btn--stale",
} as const;

function resolveCompileTooltip(status: CompileStatus, errorCount: number): string {
  if (status === "error" && errorCount > 0) return `${errorCount} error${errorCount > 1 ? "s" : ""}`;
  if (status === "stale") return "YAML changed \u2014 recompile needed";
  if (status === "ok") return "Compilation passed";
  return "Compile YAML";
}

/**
 * Compile button for the top bar.
 * Triggers manual YAML compilation and reflects current compile status.
 * Hidden when no backend is connected.
 */
export function CompileButton() {
  const isConnected = useExecutionStore((s) => s.connectionStatus === "connected");
  const backendUrl = useExecutionStore((s) => s.backendUrl);
  const compileStatus = useCompileStore((s) => s.compileStatus);
  const compileErrors = useCompileStore((s) => s.compileErrors);
  const compile = useCompileStore((s) => s.compile);
  const hasProject = useProjectStore((s) => s.hasProject);
  const getActiveModel = useProjectStore((s) => s.getActiveModel);

  const handleCompile = useCallback(() => {
    const model = getActiveModel();
    if (!model || !backendUrl) return;
    const yaml = modelToYaml(model);
    compile(backendUrl, yaml);
  }, [getActiveModel, backendUrl, compile]);

  if (!isConnected) return null;

  const isCompiling = compileStatus === "compiling";
  const errorCount = compileErrors.length;
  const tooltip = resolveCompileTooltip(compileStatus, errorCount);

  return (
    <button
      className={`compile-btn ${STATUS_CLASS[compileStatus]}`}
      onClick={handleCompile}
      disabled={!hasProject || isCompiling}
      title={tooltip}
      type="button"
    >
      <CompileStatusIcon status={compileStatus} />
      Compile
    </button>
  );
}
