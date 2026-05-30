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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { memo, useCallback } from "react";
import type { FlowNode } from "../builder/dataFlowBuilder";
import type { PipelineStageStatus } from "../builder/types";
import "../PipelineGraphView.css";

export interface StageListSidebarProps {
  nodes: FlowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  /** Optional status map — keys are node IDs. */
  statusMap?: Record<string, PipelineStageStatus>;
}

const STATUS_ICONS: Record<PipelineStageStatus, string> = {
  idle: "○",
  running: "◉",
  passed: "✓",
  failed: "✗",
  skipped: "⊘",
} as const;

export const StageListSidebar = memo(function StageListSidebar({
  nodes,
  selectedNodeId,
  onSelectNode,
  statusMap = {},
}: StageListSidebarProps) {
  return (
    <aside className="stage-list-sidebar">
      <div className="stage-list-sidebar__header">Stages</div>
      <ul className="stage-list-sidebar__list">
        {nodes.map((node, index) => (
          <StageItem
            key={node.id}
            node={node}
            index={index}
            status={statusMap[node.id] ?? "idle"}
            isSelected={node.id === selectedNodeId}
            onSelect={onSelectNode}
          />
        ))}
      </ul>
    </aside>
  );
});

/* ── Stage item ─────────────────────────────────────────────────────────── */

interface StageItemProps {
  node: FlowNode;
  index: number;
  status: PipelineStageStatus;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

const StageItem = memo(function StageItem({
  node,
  index,
  status,
  isSelected,
  onSelect,
}: StageItemProps) {
  const handleClick = useCallback(() => onSelect(node.id), [onSelect, node.id]);
  const statusClass = `stage-item--${status}`;
  const selectedClass = isSelected ? "stage-item--selected" : "";

  return (
    <li className={`stage-item ${statusClass} ${selectedClass}`} onClick={handleClick}>
      <span className="stage-item__icon">{STATUS_ICONS[status]}</span>
      <div className="stage-item__info">
        <span className="stage-item__name">{index + 1}. {node.name}</span>
        <span className="stage-item__meta">
          {node.stepCount} step{node.stepCount !== 1 ? "s" : ""}
          {node.services.length > 0 && ` · ${node.services[0]}`}
        </span>
      </div>
    </li>
  );
});
