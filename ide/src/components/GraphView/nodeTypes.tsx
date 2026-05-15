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
import { theme } from "../../theme/tractusxTheme";

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

const baseStyle: React.CSSProperties = {
  padding: g.nodePadding,
  borderRadius: g.nodeRadius,
  fontSize: g.nodeFontSize,
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  fontWeight: 500,
  color: theme.colors.text,
  minWidth: g.nodeMinWidth,
  textAlign: "center",
  background: g.nodeBg,
  border: `1px solid ${g.nodeBorder}`,
  boxShadow: g.nodeShadow,
  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
};

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
    <div style={{ ...baseStyle, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={labelStyle(color)}>{d.stepType || "step"}</div>
        {d.serviceName && (
          <div
            style={{
              fontSize: 8,
              color: "#5EA8A8",
              fontWeight: 600,
              background: "rgba(94,168,168,0.12)",
              padding: "1px 5px",
              borderRadius: 4,
              letterSpacing: "0.04em",
            }}
          >
            ⚡ {d.serviceName}
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
    <div
      style={{
        ...baseStyle,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        fontWeight: 600,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color,
        opacity: g.phaseOpacity,
        minWidth: 100,
        padding: "6px 12px",
      }}
    >
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
    <div
      style={{
        ...baseStyle,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
      }}
    >
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
    <div
      style={{
        ...baseStyle,
        borderLeft: `3px solid ${color}`,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
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
    <div style={{ ...baseStyle, borderLeft: `3px solid ${color}` }}>
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>!include</div>
      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

export const TestNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#5C9A6B";
  return (
    <div style={{ ...baseStyle, borderLeft: `3px solid ${color}` }}>
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
    <div
      style={{
        ...baseStyle,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        background: "rgba(94,168,168,0.08)",
        minWidth: 140,
      }}
    >
      <Handle type="target" position={Position.Top} style={handleStyle(color)} />
      <div style={labelStyle(color)}>{d.serviceType || "service"}</div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>⚡ {d.label}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle(color)} />
    </div>
  );
});

const terminalStyle: React.CSSProperties = {
  ...baseStyle,
  borderRadius: 20,
  minWidth: 80,
  padding: "8px 20px",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  border: "none",
  boxShadow: "none",
};

export const StartNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const color = "#5C9A6B";
  return (
    <div style={{ ...terminalStyle, background: "rgba(92, 154, 107, 0.15)", color }}>
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
    <div style={{ ...terminalStyle, background: isCleanup ? "rgba(201, 107, 122, 0.15)" : "rgba(153, 153, 153, 0.1)", color }}>
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
