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

import { useState, useMemo } from "react";
import { useExecutionStore } from "@/store";
import { useResizablePanel } from "@/shared/hooks/useResizablePanel";
import { StepCard } from "./StepCard";
import { StepFlowView } from "./StepFlowView";
import type { ExecutionPhase } from "@/models/execution";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";

/* ── Phase tab definitions ──────────────────────────────────────────────── */

interface PhaseTab {
  readonly phase: ExecutionPhase;
  readonly label: string;
}

const PHASE_TABS: readonly PhaseTab[] = [
  { phase: "precondition", label: "Precondition" },
  { phase: "setup", label: "Setup" },
  { phase: "main", label: "Steps" },
  { phase: "cleanup", label: "Cleanup" },
] as const;

/* ── Component ──────────────────────────────────────────────────────────── */

export function ExecutionPanel() {
  const jobId = useExecutionStore((s) => s.jobId);
  const jobStatus = useExecutionStore((s) => s.jobStatus);
  const currentPhase = useExecutionStore((s) => s.currentPhase);
  const steps = useExecutionStore((s) => s.steps);
  const clearResults = useExecutionStore((s) => s.clearResults);

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<ExecutionPhase>("precondition");
  const [viewMode, setViewMode] = useState<"list" | "flow">("flow");
  const { height: panelHeight, handleMouseDown } = useResizablePanel({
    minHeight: 80,
    maxHeightVh: 70,
    defaultHeight: 200,
  });

  // Auto-follow the current phase
  const activePhase = currentPhase ?? selectedPhase;
  const displayPhase = selectedPhase;

  // When currentPhase changes, auto-switch to it
  useMemo(() => {
    if (currentPhase) {
      setSelectedPhase(currentPhase);
    }
  }, [currentPhase]);

  const phaseSteps = useMemo(
    () => steps.filter((s) => s.phase === displayPhase),
    [steps, displayPhase],
  );

  const stepCountByPhase = useMemo(() => {
    const counts: Record<ExecutionPhase, number> = {
      precondition: 0,
      setup: 0,
      main: 0,
      cleanup: 0,
    };
    for (const s of steps) {
      counts[s.phase]++;
    }
    return counts;
  }, [steps]);

  const panelClass = `execution-panel execution-panel--${isExpanded ? "expanded" : "collapsed"}`;
  const statusClass = jobStatus ? `execution-panel__status-badge--${jobStatus}` : "";

  const panelStyle = isExpanded ? { height: panelHeight } : undefined;

  return (
    <div className={panelClass} style={panelStyle}>
      {/* Resize handle */}
      {isExpanded && (
        <div
          className="execution-panel__resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Header */}
      <div
        className="execution-panel__header"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <span className="execution-panel__title">
          Execution
        </span>
        {jobStatus && (
          <span className={`execution-panel__status-badge ${statusClass}`}>
            {jobStatus}
          </span>
        )}
        {jobId && (
          <span className="execution-panel__job-id">{jobId}</span>
        )}
        <span className="execution-panel__spacer" />
        <button
          className="execution-panel__view-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setViewMode((m) => (m === "list" ? "flow" : "list"));
          }}
          title={viewMode === "list" ? "Switch to flow view" : "Switch to list view"}
        >
          {viewMode === "list"
            ? <GridViewIcon sx={{ fontSize: 14 }} />
            : <ViewListIcon sx={{ fontSize: 14 }} />}
        </button>
        <button
          className="execution-panel__collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((v) => !v);
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded
            ? <ExpandMoreIcon sx={{ fontSize: 16 }} />
            : <ExpandLessIcon sx={{ fontSize: 16 }} />}
        </button>
        <button
          className="execution-panel__close-btn"
          onClick={(e) => {
            e.stopPropagation();
            clearResults();
          }}
          title="Close execution panel"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Phase tabs + step list (only when expanded) */}
      {isExpanded && (
        <>
          <div className="execution-panel__tabs">
            {PHASE_TABS.map(({ phase, label }) => {
              const isActive = displayPhase === phase;
              const isCurrent = activePhase === phase;
              const count = stepCountByPhase[phase];
              let tabClass = "execution-panel__tab";
              if (isActive) tabClass += " execution-panel__tab--active";
              if (isCurrent && !isActive) tabClass += " execution-panel__tab--current";
              return (
                <button
                  key={phase}
                  className={tabClass}
                  onClick={() => setSelectedPhase(phase)}
                >
                  {label}
                  {count > 0 && (
                    <span className="execution-panel__tab-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="execution-panel__steps">
            {phaseSteps.length === 0 ? (
              <div className="execution-panel__empty">
                No steps in this phase yet
              </div>
            ) : viewMode === "flow" ? (
              <StepFlowView steps={phaseSteps} />
            ) : (
              phaseSteps.map((step) => (
                <StepCard key={step.index} step={step} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
