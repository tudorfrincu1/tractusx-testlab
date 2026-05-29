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

import { useRef } from "react";
import { useProjectStore } from "@/store/project/useProjectStore";
import { useEditorStore } from "@/store/editor/useEditorStore";
import { useServiceStore } from "@/store/environment/useServiceStore";
import { yamlToModel } from "@/services";
import { importProjectZip, importExampleFolder } from "@/store/project/projectIO";
import { theme } from "@/shared/theme/tractusxTheme";

import AddIcon from "@mui/icons-material/Add";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import HttpIcon from "@mui/icons-material/Http";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorageIcon from "@mui/icons-material/Storage";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ScienceIcon from "@mui/icons-material/Science";
import { ActionCard, ExampleCard } from "./WelcomeCards";
import "./WelcomeScreen.css";

/* ── Example definitions ────────────────────────────────────────────────── */

interface ExampleEntry {
  file: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "template" | "tck";
}

const EXAMPLES: ExampleEntry[] = [
  { file: "connector-ping-v1.0/index.yaml", label: "Connector Ping", description: "Verify connector responds to catalog query", icon: <HttpIcon sx={{ fontSize: 20 }} />, category: "template" },
  { file: "dtr-ping-v1.0/index.yaml", label: "DTR Ping", description: "Negotiate dataplane access to DTR", icon: <StorageIcon sx={{ fontSize: 20 }} />, category: "template" },
  { file: "certificate-management-v2.0/index.yaml", label: "Certificate Management", description: "CCMAPI offer, validation, and feedback", icon: <PlaylistAddIcon sx={{ fontSize: 20 }} />, category: "tck" },
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
          tck: project.tck,
          tests: project.tests,
          schemas: project.schemas,
          testdata: project.testdata ?? new Map(),
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
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
          tck: project.tck,
          tests: project.tests,
          schemas: project.schemas,
          testdata: project.testdata ?? new Map(),
          testOrder: project.testOrder,
          activeFile: { type: "tck", name: "index" },
          dirty: new Map(),
          workspaceStates: {},
        });

        const services = project.tck.env?.services ?? [];
        useServiceStore.getState().setServices(services);

        const activeModel = useProjectStore.getState().getActiveModel();
        if (activeModel) {
          useEditorStore.getState().loadModel(activeModel);
        }
        useProjectStore.getState().saveToLocalStorage();
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.warn('[WelcomeScreen] Failed to load example', error);
    }
  };

  return (
    <div className="welcome-screen" style={{ background: theme.colors.bg }}>
      <div className="welcome-screen__content">
        {/* Header */}
        <div className="welcome-screen__header">
          <img
            src={`${import.meta.env.BASE_URL}test-lab-app-logo-white-claim.png`}
            alt="Tractus-X TestLab"
            className="welcome-screen__logo"
          />
          <p className="welcome-screen__subtitle" style={{ color: theme.colors.textMuted }}>
            Design, validate, and execute TCK certification tests
          </p>
        </div>

        {/* Start actions */}
        <div className="welcome-screen__actions">
          <ActionCard
            icon={<AddIcon sx={{ fontSize: 24, color: theme.colors.primary }} />}
            title="New Project"
            description="Start with a blank TCK"
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
        <div className="welcome-screen__examples">
          <h3
            className="welcome-screen__examples-title"
            style={{ color: theme.colors.textMuted }}
          >
            Templates &amp; Examples
          </h3>
          <div className="welcome-screen__examples-grid">
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
          className="welcome-screen__hidden-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}


