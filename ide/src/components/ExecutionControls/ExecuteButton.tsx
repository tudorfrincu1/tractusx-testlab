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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import { useExecutionStore } from "../../store/slices/useExecutionStore";
import { useProjectStore } from "../../store/slices/useProjectStore";
import { useCompileStore } from "../../store/slices/useCompileStore";
import { modelToYaml } from "../../sync";
import "./ExecutionControls.css";

/**
 * Execute / Pause / Resume / Stop button group for the top bar.
 * Hidden when no backend URL is configured.
 * Disabled until the current YAML compiles successfully.
 */
export function ExecuteButton() {
  const isConnected = useExecutionStore((s) => s.connectionStatus === "connected");
  const isExecuting = useExecutionStore((s) => s.isExecuting);
  const jobStatus = useExecutionStore((s) => s.jobStatus);
  const execute = useExecutionStore((s) => s.execute);
  const cancel = useExecutionStore((s) => s.cancel);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const hasProject = useProjectStore((s) => s.hasProject);
  const tck = useProjectStore((s) => s.tck);
  const compileStatus = useCompileStore((s) => s.compileStatus);

  const handleExecute = useCallback(() => {
    if (!tck) return;
    const yaml = modelToYaml(tck);
    execute(yaml);
  }, [tck, execute]);

  const handlePause = useCallback(() => { pause(); }, [pause]);
  const handleResume = useCallback(() => { resume(); }, [resume]);

  if (!isConnected) return null;

  if (isExecuting) {
    const showPause = jobStatus === "running";
    const showResume = jobStatus === "paused";
    const showSpinner = !jobStatus || jobStatus === "queued";

    return (
      <div className="execute-btn-group">
        {showPause && (
          <button
            className="execute-btn execute-btn--pause"
            onClick={handlePause}
            type="button"
            title="Pause execution"
          >
            <PauseIcon sx={{ fontSize: 14 }} />
            Pause
          </button>
        )}
        {showResume && (
          <button
            className="execute-btn execute-btn--resume"
            onClick={handleResume}
            type="button"
            title="Resume execution"
          >
            <PlayArrowIcon sx={{ fontSize: 14 }} />
            Resume
          </button>
        )}
        <button
          className="execute-btn execute-btn--cancel"
          onClick={cancel}
          type="button"
          title="Stop execution"
        >
          <StopIcon sx={{ fontSize: 14 }} />
          {showSpinner && <span className="execute-spinner" />}
          Stop
        </button>
      </div>
    );
  }

  const isCompileOk = compileStatus === "ok";

  return (
    <button
      className="execute-btn execute-btn--run"
      onClick={handleExecute}
      disabled={!hasProject || !isCompileOk}
      title={isCompileOk ? "Execute test" : "Compile first"}
      type="button"
    >
      <PlayArrowIcon sx={{ fontSize: 14 }} />
      Execute
    </button>
  );
}
