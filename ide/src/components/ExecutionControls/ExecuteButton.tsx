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
import { modelToYaml } from "../../sync/modelToYaml";
import "./ExecutionControls.css";

/**
 * Execute / Cancel button for the top bar.
 * Hidden when no backend URL is configured.
 */
export function ExecuteButton() {
  const backendUrl = useExecutionStore((s) => s.backendUrl);
  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const execute = useExecutionStore((s) => s.execute);
  const cancel = useExecutionStore((s) => s.cancel);
  const hasProject = useProjectStore((s) => s.hasProject);
  const testCase = useProjectStore((s) => s.testCase);

  const handleExecute = useCallback(() => {
    const yaml = modelToYaml(testCase);
    execute(yaml);
  }, [testCase, execute]);

  if (!backendUrl) return null;

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

  return (
    <button
      className="execute-btn execute-btn--run"
      onClick={handleExecute}
      disabled={!hasProject}
      type="button"
    >
      <PlayArrowIcon sx={{ fontSize: 14 }} />
      Execute
    </button>
  );
}
