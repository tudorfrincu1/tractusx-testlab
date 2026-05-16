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

import { useMemo } from "react";
import { useProjectStore } from "../../store/slices/useProjectStore";
import { theme } from "../../theme/tractusxTheme";
import { buildDataFlow, type FlowNode, type FlowEdge } from "./dataFlowBuilder";

import StorageIcon from "@mui/icons-material/Storage";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import ScienceIcon from "@mui/icons-material/Science";

export function DataFlowView() {
  const tck = useProjectStore((s) => s.tck);
  const tests = useProjectStore((s) => s.tests);
  const testOrder = useProjectStore((s) => s.testOrder);

  const flow = useMemo(
    () => buildDataFlow(testOrder, tests, tck.variables),
    [testOrder, tests, tck.variables],
  );

  if (flow.nodes.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 200, color: theme.colors.textMuted, fontSize: 13,
      }}>
        No tests in the pipeline. Add tests to see data flow.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 }}>
      {flow.sharedVariables.length > 0 && (
        <SharedVariablesBanner variables={flow.sharedVariables} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {flow.nodes.map((node, idx) => {
          const incomingEdges = flow.edges.filter((e) => e.to === node.id);
          const outgoingEdges = flow.edges.filter((e) => e.from === node.id);
          return (
            <div key={node.id}>
              {incomingEdges.length > 0 && <EdgeConnector edges={incomingEdges} direction="in" />}
              <FlowNodeCard node={node} index={idx} />
              {outgoingEdges.length > 0 && <EdgeConnector edges={outgoingEdges} direction="out" />}
              {idx < flow.nodes.length - 1 && <PipelineConnector />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SharedVariablesBanner({ variables }: { variables: string[] }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 6,
      background: "rgba(255, 215, 0, 0.08)",
      border: `1px solid rgba(255, 215, 0, 0.2)`,
    }}>
      <StorageIcon sx={{ fontSize: 14, color: theme.colors.primary }} />
      <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 500 }}>
        Shared variables:
      </span>
      {variables.map((v) => (
        <VariableChip key={v} name={v} color="rgba(255, 215, 0, 0.15)" textColor={theme.colors.primary} />
      ))}
    </div>
  );
}

function FlowNodeCard({ node, index }: { node: FlowNode; index: number }) {
  return (
    <div style={{
      background: theme.colors.bgLight,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%",
          background: theme.colors.primary, color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {index + 1}
        </span>
        <ScienceIcon sx={{ fontSize: 14, color: theme.colors.primary }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textBright }}>
          {node.name}
        </span>
        <span style={{
          fontSize: 10, color: theme.colors.textMuted, marginLeft: "auto",
        }}>
          {node.stepCount} step{node.stepCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ padding: "10px 14px", display: "flex", gap: 16 }}>
        {node.variables.length > 0 && (
          <PortGroup icon={<InputIcon sx={{ fontSize: 12 }} />} label="Inputs" names={node.variables}
            chipBg="rgba(66, 165, 245, 0.15)" chipColor="#42a5f5" />
        )}
        {node.outputs.length > 0 && (
          <PortGroup icon={<OutputIcon sx={{ fontSize: 12 }} />} label="Outputs" names={node.outputs}
            chipBg="rgba(102, 187, 106, 0.15)" chipColor="#66bb6a" />
        )}
        {node.services.length > 0 && (
          <PortGroup icon={<StorageIcon sx={{ fontSize: 12 }} />} label="Services" names={node.services}
            chipBg="rgba(255, 167, 38, 0.15)" chipColor="#ffa726" />
        )}
      </div>
    </div>
  );
}

function PortGroup({ icon, label, names, chipBg, chipColor }: {
  icon: React.ReactNode;
  label: string;
  names: string[];
  chipBg: string;
  chipColor: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 4,
      }}>
        {icon} {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {names.map((n) => <VariableChip key={n} name={n} color={chipBg} textColor={chipColor} />)}
      </div>
    </div>
  );
}

function EdgeConnector({ edges, direction }: { edges: FlowEdge[]; direction: "in" | "out" }) {
  const allVars = edges.flatMap((e) => e.variables);
  const label = direction === "in" ? "receives" : "produces";
  const arrowColor = direction === "in" ? "#42a5f5" : "#66bb6a";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "4px 0 4px 32px",
    }}>
      <div style={{
        width: 2, height: 16, background: arrowColor, borderRadius: 1, flexShrink: 0,
      }} />
      <span style={{ fontSize: 10, color: theme.colors.textMuted, fontStyle: "italic" }}>
        {label}:
      </span>
      {allVars.map((v) => (
        <VariableChip key={v} name={v}
          color={direction === "in" ? "rgba(66, 165, 245, 0.12)" : "rgba(102, 187, 106, 0.12)"}
          textColor={arrowColor}
        />
      ))}
    </div>
  );
}

function PipelineConnector() {
  return (
    <div style={{
      display: "flex", justifyContent: "center", padding: "2px 0",
    }}>
      <div style={{
        width: 2, height: 20, background: theme.colors.primary, borderRadius: 1, opacity: 0.4,
      }} />
    </div>
  );
}

function VariableChip({ name, color, textColor }: { name: string; color: string; textColor: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 3,
      background: color, color: textColor, whiteSpace: "nowrap",
    }}>
      {name}
    </span>
  );
}
