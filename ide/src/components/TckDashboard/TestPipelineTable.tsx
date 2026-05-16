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

import { useCallback, useMemo, useRef, useState } from "react";
import { useProjectStore, type ActiveFile, type TestSummary } from "../../store/slices/useProjectStore";
import { theme } from "../../theme/tractusxTheme";
import { SectionCard } from "./MetadataSection";
import { IconButton, OrderBadge } from "./TestPipelineWidgets";

import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";

interface TestPipelineTableProps {
  onSelectFile: (file: ActiveFile) => void;
}

export function TestPipelineTable({ onSelectFile }: TestPipelineTableProps) {
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);
  const tck = useProjectStore((s) => s.tck);
  const addTest = useProjectStore((s) => s.addTest);
  const removeTest = useProjectStore((s) => s.removeTest);
  const duplicateTest = useProjectStore((s) => s.duplicateTest);
  const reorderTest = useProjectStore((s) => s.reorderTest);

  const summaries = useMemo(
    () => useProjectStore.getState().getTestSummaries(),
    [tests, testOrder, tck],
  );

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragRef.current = index;
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    const fromIndex = dragRef.current;
    if (fromIndex !== null && fromIndex !== dropIndex) {
      const name = summaries[fromIndex]?.name;
      if (name) reorderTest(name, dropIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  }, [summaries, reorderTest]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  }, []);

  const handleNavigate = useCallback((name: string) => {
    onSelectFile({ type: "test", name });
  }, [onSelectFile]);

  const handleAdd = useCallback(() => { addTest(); }, [addTest]);

  return (
    <SectionCard
      title={`Test Pipeline (${summaries.length})`}
      extra={
        <button
          onClick={handleAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: theme.colors.primary,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <AddIcon sx={{ fontSize: 12 }} /> Add Test
        </button>
      }
    >
      {summaries.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.colors.textMuted, padding: "12px 0", textAlign: "center" }}>
          No tests yet. Click "Add Test" to create one.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {summaries.map((summary, index) => (
            <PipelineRow
              key={summary.name}
              summary={summary}
              index={index}
              total={summaries.length}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onNavigate={() => handleNavigate(summary.name)}
              onDuplicate={() => duplicateTest(summary.name)}
              onRemove={() => removeTest(summary.name)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Pipeline Row ───────────────────────────────────────────────────────── */

function PipelineRow({ summary, index, total, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onNavigate, onDuplicate, onRemove,
}: {
  summary: TestSummary;
  index: number;
  total: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onNavigate: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const isLast = index === total - 1;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        display: "flex",
        alignItems: "stretch",
        opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
        transition: "opacity 0.15s",
      }}
    >
      {/* Connector column */}
      <div style={{
        width: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <OrderBadge order={summary.order} />
        {!isLast && <div style={{ flex: 1, width: 2, background: theme.colors.primary, opacity: 0.3 }} />}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 8px 8px 4px",
        borderBottom: isLast ? "none" : `1px solid ${theme.colors.border}`,
        minHeight: 44,
      }}>
        <DragIndicatorIcon sx={{ fontSize: 14, color: theme.colors.textMuted, opacity: 0.4, cursor: "grab" }} />

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={onNavigate}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.colors.text,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.text; }}
          >
            {summary.name}
          </button>
          {summary.description && (
            <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 1 }}>
              {summary.description}
            </div>
          )}
          <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 1 }}>
            Prerequisites: {summary.prerequisiteTests.length > 0 ? summary.prerequisiteTests.join(", ") : "none"}
          </div>
        </div>

        {/* Step count */}
        <span style={{
          fontSize: 10,
          color: theme.colors.textMuted,
          whiteSpace: "nowrap",
        }}>
          {summary.stepCount} step{summary.stepCount !== 1 ? "s" : ""}
        </span>

        <span style={{
          fontSize: 10,
          color: theme.colors.textMuted,
          whiteSpace: "nowrap",
        }}>
          {summary.inputCount} in / {summary.outputCount} out
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: 2 }}>
          <IconButton icon={<EditIcon sx={{ fontSize: 13 }} />} title="Edit" onClick={onNavigate} />
          <IconButton icon={<ContentCopyIcon sx={{ fontSize: 13 }} />} title="Duplicate" onClick={onDuplicate} />
          <IconButton icon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />} title="Remove" onClick={onRemove} color={theme.colors.error} />
        </div>
      </div>
    </div>
  );
}
