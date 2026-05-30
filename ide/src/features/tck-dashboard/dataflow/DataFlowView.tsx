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
import { useProjectStore } from "@/store";
import { theme } from "@/shared/theme/tractusxTheme";
import { buildDataFlow, type FlowNode, type FlowEdge } from "./builder/dataFlowBuilder";

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
      <div className="data-flow-view__empty">
        No tests in the pipeline. Add tests to see data flow.
      </div>
    );
  }

  return (
    <div className="data-flow-view__container">
      {flow.sharedVariables.length > 0 && (
        <SharedVariablesBanner variables={flow.sharedVariables} />
      )}
      <div className="data-flow-view__nodes">
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

function SharedVariablesBanner({ variables }: Readonly<{ variables: string[] }>) {
  return (
    <div className="data-flow-view__shared-banner">
      <StorageIcon sx={{ fontSize: 14, color: theme.colors.primary }} />
      <span className="data-flow-view__shared-label">
        Shared variables:
      </span>
      {variables.map((v) => (
        <VariableChip key={v} name={v} color="rgba(255, 215, 0, 0.15)" textColor={theme.colors.primary} />
      ))}
    </div>
  );
}

function FlowNodeCard({ node, index }: Readonly<{ node: FlowNode; index: number }>) {
  return (
    <div className="flow-node-card">
      <div className="flow-node-card__header">
        <span className="flow-node-card__badge">
          {index + 1}
        </span>
        <ScienceIcon sx={{ fontSize: 14, color: theme.colors.primary }} />
        <span className="flow-node-card__name">
          {node.name}
        </span>
        <span className="flow-node-card__step-count">
          {node.stepCount} step{node.stepCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flow-node-card__ports">
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

function PortGroup({ icon, label, names, chipBg, chipColor }: Readonly<{
  icon: React.ReactNode;
  label: string;
  names: string[];
  chipBg: string;
  chipColor: string;
}>) {
  return (
    <div className="port-group">
      <div className="port-group__label">
        {icon} {label}
      </div>
      <div className="port-group__chips">
        {names.map((n) => <VariableChip key={n} name={n} color={chipBg} textColor={chipColor} />)}
      </div>
    </div>
  );
}

function EdgeConnector({ edges, direction }: Readonly<{ edges: FlowEdge[]; direction: "in" | "out" }>) {
  const allVars = edges.flatMap((e) => e.variables);
  const label = direction === "in" ? "receives" : "produces";
  const arrowColor = direction === "in" ? "#42a5f5" : "#66bb6a";

  return (
    <div className="edge-connector">
      <div className="edge-connector__line" style={{ background: arrowColor }} />
      <span className="edge-connector__label">
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
    <div className="pipeline-connector">
      <div className="pipeline-connector__line" />
    </div>
  );
}

function VariableChip({ name, color, textColor }: Readonly<{ name: string; color: string; textColor: string }>) {
  return (
    <span className="variable-chip" style={{ background: color, color: textColor }}>
      {name}
    </span>
  );
}
