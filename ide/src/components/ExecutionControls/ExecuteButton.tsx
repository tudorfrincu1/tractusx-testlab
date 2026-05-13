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

import { useCallback } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { useExecutionStore } from "../../store/useExecutionStore";
import { useProjectStore } from "../../store/useProjectStore";
import { useCompileStore } from "../../store/useCompileStore";
import { modelToYaml } from "../../sync/modelToYaml";
import "./ExecutionControls.css";

/**
 * Execute / Cancel button for the top bar.
 * Hidden when no backend URL is configured.
 * Disabled until the current YAML compiles successfully.
 */
export function ExecuteButton() {
  const isConnected = useExecutionStore((s) => s.connectionStatus === "connected");
  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const execute = useExecutionStore((s) => s.execute);
  const cancel = useExecutionStore((s) => s.cancel);
  const hasProject = useProjectStore((s) => s.hasProject);
  const getActiveModel = useProjectStore((s) => s.getActiveModel);
  const compileStatus = useCompileStore((s) => s.compileStatus);

  const handleExecute = useCallback(() => {
    const model = getActiveModel();
    if (!model) return;
    const yaml = modelToYaml(model);
    execute(yaml);
  }, [getActiveModel, execute]);

  if (!isConnected) return null;

  if (isExecuting) {
    return (
      <button
        className="execute-btn execute-btn--cancel"
        onClick={cancel}
        type="button"
      >
        <StopIcon sx={{ fontSize: 14 }} />
        <span className="execute-spinner" />
        Cancel
      </button>
    );
  }

  const isCompileOk = compileStatus === "ok";

  return (
    <button
      className="execute-btn execute-btn--run"
      onClick={handleExecute}
      disabled={!hasProject || !isCompileOk}
      title={!isCompileOk ? "Compile first" : "Execute test"}
      type="button"
    >
      <PlayArrowIcon sx={{ fontSize: 14 }} />
      Execute
    </button>
  );
}
