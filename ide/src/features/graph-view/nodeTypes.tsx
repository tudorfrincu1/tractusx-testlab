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

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { theme } from "@/shared/theme/tractusxTheme";

interface CustomNodeData {
  label: string;
  stepType?: string;
  color?: string;
  phase?: string;
  serviceName?: string;
  serviceType?: string;
  [key: string]: unknown;
}

const g = theme.graph;

const handleStyle = (color: string): React.CSSProperties => ({
  background: color,
  width: 6,
  height: 6,
  border: "none",
  minWidth: 6,
  minHeight: 6,
});

const labelStyle = (color: string): React.CSSProperties => ({
  fontSize: 9,
  color,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 3,
  opacity: 0.85,
});

export const StepNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = d.color || theme.colors.primary;
  return (
    <div className="graph-node" style={{ color: theme.colors.text, background: g.nodeBg, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div className="graph-node__header">
        <div style={labelStyle(color)}>{d.stepType || "step"}</div>
        {d.serviceName && (
          <div className="graph-node__service-badge">
            {d.serviceName}
          </div>
        )}
      </div>
      <div>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const PhaseNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const phaseColors: Record<string, string> = {
    setup: "#5C9A6B",
    steps: theme.colors.primary,
    cleanup: "#C96B7A",
  };
  const color = phaseColors[d.phase || "steps"] || theme.colors.primary;
  return (
    <div className="graph-node graph-node--phase" style={{ color, opacity: g.phaseOpacity }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      {d.label}
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const VariableNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#9B8EC4";
  return (
    <div className="graph-node graph-node--variable" style={{ color: theme.colors.text, background: g.nodeBg, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>variable</div>
      <div>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const TckNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = theme.colors.primary;
  return (
    <div className="graph-node graph-node--tck" style={{ color: theme.colors.text, background: g.nodeBg, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>TCK</div>
      <div>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const IncludeNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#5EA8A8";
  return (
    <div className="graph-node" style={{ color: theme.colors.text, background: g.nodeBg, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>!include</div>
      <div className="graph-node__include-label">{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const TestNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#5C9A6B";
  return (
    <div className="graph-node" style={{ color: theme.colors.text, background: g.nodeBg, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>test</div>
      <div>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const ServiceNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = d.color || "#5EA8A8";
  return (
    <div className="graph-node graph-node--service" style={{ color: theme.colors.text, border: `1px solid ${g.nodeBorder}`, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>{d.serviceType || "service"}</div>
      <div className="graph-node__service-label">{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const StartNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#5C9A6B";
  return (
    <div className="graph-node graph-node--terminal" style={{ background: "rgba(92, 154, 107, 0.15)", color }}>
      {d.label}
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const EndNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const isCleanup = d.autoCleanup;
  const color = isCleanup ? "#C96B7A" : theme.colors.textMuted;
  return (
    <div className="graph-node graph-node--terminal" style={{ background: isCleanup ? "rgba(201, 107, 122, 0.15)" : "rgba(153, 153, 153, 0.1)", color }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      {d.label}
    </div>
  );
});

export const nodeTypes = {
  step: StepNode,
  phase: PhaseNode,
  variable: VariableNode,
  testcase: TckNode,
  include: IncludeNode,
  test: TestNode,
  service: ServiceNode,
  start: StartNode,
  end: EndNode,
};
