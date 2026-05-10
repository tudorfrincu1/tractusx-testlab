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

import { useRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { yamlToModel } from "../../sync/yamlToModel";
import { importProjectZip, importExampleFolder } from "../../store/projectIO";
import { theme } from "../../theme/tractusxTheme";

import AddIcon from "@mui/icons-material/Add";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import HttpIcon from "@mui/icons-material/Http";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorageIcon from "@mui/icons-material/Storage";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ScienceIcon from "@mui/icons-material/Science";

/* ── Example definitions ────────────────────────────────────────────────── */

interface ExampleEntry {
  file: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "test" | "test-case";
}

const EXAMPLES: ExampleEntry[] = [
  { file: "connector-ping-v1.0/index.yaml", label: "Connector Ping", description: "Verify connector responds to catalog query", icon: <HttpIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "dtr-ping-v1.0/index.yaml", label: "DTR Ping", description: "Negotiate dataplane access to DTR", icon: <StorageIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "industry-core-validation-v1.0/index.yaml", label: "Industry Core Validation", description: "Shell descriptors + submodel schema validation", icon: <AccountTreeIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "traceability-notification-v1.0/index.yaml", label: "Traceability Notification", description: "Quality investigation + alert notification flows", icon: <NotificationsActiveIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "certificate-management-v1.0/index.yaml", label: "Certificate Management", description: "CCMAPI offer, validation, and feedback", icon: <PlaylistAddIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "special-characteristics-v1.0/index.yaml", label: "Special Characteristics", description: "Notification + data transfer validation", icon: <SwapHorizIcon sx={{ fontSize: 20 }} />, category: "test-case" },
  { file: "product-carbon-footprint-v1.0/index.yaml", label: "Product Carbon Footprint", description: "PCF data discovery + schema validation", icon: <ScienceIcon sx={{ fontSize: 20 }} />, category: "test-case" },
];

/* ── Component ──────────────────────────────────────────────────────────── */

export function WelcomeScreen() {
  const createProject = useProjectStore((s) => s.createProject);
  const loadFromDocument = useProjectStore((s) => s.loadFromDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewProject = () => createProject();

  const handleOpenFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (/\.zip$/i.test(file.name)) {
      const project = await importProjectZip(file);
      if (project) {
        useProjectStore.setState({
          hasProject: true,
          projectName: project.projectName,
          testCase: project.testCase,
          tests: project.tests,
          schemas: project.schemas,
          testOrder: project.testOrder,
          activeFile: { type: "test-case", name: "index" },
          dirty: new Map(),
        });
        useProjectStore.getState().saveToLocalStorage();
      }
    } else {
      const text = await file.text();
      const result = yamlToModel(text);
      if (result.ok) {
        loadFromDocument(result.model, result.model.name);
      }
    }
    e.target.value = "";
  };

  const handleLoadExample = async (file: string) => {
    try {
      const project = await importExampleFolder(file);
      if (project) {
        useProjectStore.setState({
          hasProject: true,
          projectName: project.projectName,
          projectGeneration: useProjectStore.getState().projectGeneration + 1,
          testCase: project.testCase,
          tests: project.tests,
          schemas: project.schemas,
          testOrder: project.testOrder,
          activeFile: { type: "test-case", name: "index" },
          dirty: new Map(),
          workspaceStates: {},
        });
      }
    } catch {
      // Example not available
    }
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme.colors.bg,
      overflow: "auto",
    }}>
      <div style={{ maxWidth: 720, width: "100%", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: theme.colors.primary,
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Tractus-X TestLab
          </h1>
          <p style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 8 }}>
            Visual test authoring for Eclipse Tractus-X dataspaces
          </p>
        </div>

        {/* Start actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, justifyContent: "center" }}>
          <ActionCard
            icon={<AddIcon sx={{ fontSize: 24, color: theme.colors.primary }} />}
            title="New Project"
            description="Start with a blank test case"
            onClick={handleNewProject}
            isPrimary
          />
          <ActionCard
            icon={<FileOpenIcon sx={{ fontSize: 24, color: theme.colors.text }} />}
            title="Open File"
            description="Import a .yaml or .zip project"
            onClick={handleOpenFile}
          />
        </div>

        {/* Examples */}
        <div style={{ marginTop: 8 }}>
          <h3 style={{
            fontSize: 11,
            fontWeight: 600,
            color: theme.colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
            paddingLeft: 4,
          }}>
            Templates &amp; Examples
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {EXAMPLES.map((ex) => (
              <ExampleCard
                key={ex.file}
                icon={ex.icon}
                label={ex.label}
                description={ex.description}
                category={ex.category}
                onClick={() => handleLoadExample(ex.file)}
              />
            ))}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.zip"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ActionCard({ icon, title, description, onClick, isPrimary }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isPrimary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "24px 32px",
        background: isPrimary ? "rgba(255, 215, 0, 0.08)" : theme.colors.bgLight,
        border: `1px solid ${isPrimary ? theme.colors.primaryDark : theme.colors.border}`,
        borderRadius: 10,
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        minWidth: 180,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
        e.currentTarget.style.background = isPrimary
          ? "rgba(255, 215, 0, 0.14)"
          : theme.colors.bgLighter;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isPrimary
          ? theme.colors.primaryDark
          : theme.colors.border;
        e.currentTarget.style.background = isPrimary
          ? "rgba(255, 215, 0, 0.08)"
          : theme.colors.bgLight;
      }}
    >
      {icon}
      <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textBright }}>{title}</span>
      <span style={{ fontSize: 11, color: theme.colors.textMuted }}>{description}</span>
    </button>
  );
}

function ExampleCard({ icon, label, description, category, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  category: "test" | "test-case";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: theme.colors.bgLight,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.borderLight;
        e.currentTarget.style.background = theme.colors.bgLighter;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
        e.currentTarget.style.background = theme.colors.bgLight;
      }}
    >
      <div style={{ color: theme.colors.textMuted, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{label}</span>
          <span style={{
            fontSize: 9,
            fontWeight: 500,
            padding: "1px 5px",
            borderRadius: 3,
            background: category === "test-case" ? "rgba(255, 215, 0, 0.12)" : theme.colors.bgLightest,
            color: category === "test-case" ? theme.colors.primary : theme.colors.textMuted,
            textTransform: "uppercase",
          }}>
            {category === "test-case" ? "suite" : "test"}
          </span>
        </div>
        <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>{description}</div>
      </div>
    </button>
  );
}
