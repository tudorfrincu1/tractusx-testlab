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

import { useState } from "react";
import { useProjectStore, type ActiveFile } from "../../store/slices/useProjectStore";
import { theme } from "../../theme/tractusxTheme";
import { MetadataSection } from "./forms/MetadataSection";
import { VariablesOverview } from "./dataflow/VariablesOverview";
import { TestPipelineTable } from "./pipeline/TestPipelineTable";
import { PipelineGraphView } from "./dataflow/PipelineGraphView";

import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import TimelineIcon from "@mui/icons-material/Timeline";

type DashboardTab = "pipeline" | "dataflow";

interface TckDashboardProps {
  onSelectFile: (file: ActiveFile) => void;
}

export function TckDashboard({ onSelectFile }: TckDashboardProps) {
  const tck = useProjectStore((s) => s.tck);
  const [activeTab, setActiveTab] = useState<DashboardTab>("pipeline");

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: theme.colors.bg,
    }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <DashboardHeader
        name={tck.name}
        version={tck.version}
        dataspaceVersion={tck.dataspace_version}
      />

      {/* ── Tab bar ────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgLight,
        paddingLeft: 24,
      }}>
        <TabButton
          label="Pipeline"
          icon={<PlaylistAddIcon sx={{ fontSize: 14 }} />}
          isActive={activeTab === "pipeline"}
          onClick={() => setActiveTab("pipeline")}
        />
        <TabButton
          label="Data Flow"
          icon={<TimelineIcon sx={{ fontSize: 14 }} />}
          isActive={activeTab === "dataflow"}
          onClick={() => setActiveTab("dataflow")}
        />
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {activeTab === "pipeline" && (
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "20px 24px 40px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960 }}>
            <MetadataSection />
            <VariablesOverview />
            <TestPipelineTable onSelectFile={onSelectFile} />
          </div>
        </div>
      )}

      {activeTab === "dataflow" && (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <PipelineGraphView />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DashboardHeader({ name, version, dataspaceVersion }: {
  name: string;
  version?: string;
  dataspaceVersion?: string;
}) {
  return (
    <div style={{
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: theme.colors.bgLight,
      borderBottom: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
    }}>
      <PlaylistAddIcon sx={{ fontSize: 20, color: theme.colors.primary }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.textBright }}>
        {name}
      </span>
      {version && <Badge label={`v${version}`} color={theme.colors.textMuted} bg={theme.colors.bgLighter} />}
      {dataspaceVersion && <Badge label={dataspaceVersion} color={theme.colors.primary} bg="rgba(255, 215, 0, 0.12)" />}
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 4,
      color,
      background: bg,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

function TabButton({ label, icon, isActive, onClick, isDisabled }: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        color: isDisabled
          ? theme.colors.textMuted
          : isActive
            ? theme.colors.primary
            : theme.colors.text,
        background: "transparent",
        border: "none",
        borderBottom: isActive ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.4 : 1,
        transition: "color 0.15s, border-color 0.15s",
        marginBottom: -1,
      }}
    >
      {icon}
      {label}
      {isDisabled && (
        <span style={{ fontSize: 9, color: theme.colors.textMuted, fontStyle: "italic" }}>
          soon
        </span>
      )}
    </button>
  );
}
