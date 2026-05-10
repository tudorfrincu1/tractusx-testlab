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

import { useState, useEffect, useCallback } from "react";
import { theme } from "../../theme/tractusxTheme";
import { useProjectStore } from "../../store/useProjectStore";

const REPO_BASE = "https://api.github.com/repos/eclipse-tractusx/sldt-semantic-models/contents";
const RAW_BASE = "https://raw.githubusercontent.com/eclipse-tractusx/sldt-semantic-models/main";

interface GitHubEntry {
  name: string;
  type: "file" | "dir";
  path: string;
}

interface SemanticModel {
  name: string;
  versions: string[];
}

type DialogStep = "models" | "versions" | "downloading";

interface SchemaDownloadDialogProps {
  onClose: () => void;
}

export function SchemaDownloadDialog({ onClose }: SchemaDownloadDialogProps) {
  const [step, setStep] = useState<DialogStep>("models");
  const [models, setModels] = useState<SemanticModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<SemanticModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<SemanticModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSchema = useProjectStore((s) => s.addSchema);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(REPO_BASE, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (!resp.ok) {
        if (resp.status === 403) {
          throw new Error("GitHub API rate limit exceeded (60 req/hour). Try again later.");
        }
        throw new Error(`GitHub API returned ${resp.status}`);
      }
      const entries: GitHubEntry[] = await resp.json();
      const dirs = entries
        .filter((e) => e.type === "dir" && e.name.startsWith("io.catenax."))
        .map((e) => ({ name: e.name, versions: [] }));
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      setModels(dirs);
      setFilteredModels(dirs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredModels(models.filter((m) => m.name.toLowerCase().includes(q)));
  }, [searchQuery, models]);

  const handleSelectModel = async (model: SemanticModel) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${REPO_BASE}/${model.name}`, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (!resp.ok) {
        if (resp.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Try again in a few minutes.");
        }
        throw new Error(`GitHub API returned ${resp.status}`);
      }
      const entries: GitHubEntry[] = await resp.json();
      const versions = entries
        .filter((e) => e.type === "dir" && /^\d+/.test(e.name))
        .map((e) => e.name)
        .sort((a, b) => compareVersions(b, a));
      if (versions.length === 0) {
        throw new Error(`No versions found for ${model.name}`);
      }
      setSelectedModel({ ...model, versions });
      setStep("versions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSchema = async (version: string) => {
    if (!selectedModel) return;
    setStep("downloading");
    setLoading(true);
    setError(null);
    try {
      // List the gen/ folder to find the actual schema file name
      const genUrl = `${REPO_BASE}/${selectedModel.name}/${version}/gen`;
      const genResp = await fetch(genUrl, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (!genResp.ok) {
        if (genResp.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Try again in a few minutes.");
        }
        throw new Error(`No gen/ folder found for ${version} (${genResp.status})`);
      }
      const genEntries: GitHubEntry[] = await genResp.json();
      const schemaFile = genEntries.find(
        (e) => e.type === "file" && e.name.endsWith("-schema.json")
      );
      if (!schemaFile) {
        throw new Error(`No *-schema.json file found in ${selectedModel.name}/${version}/gen/`);
      }

      const rawUrl = `${RAW_BASE}/${schemaFile.path}`;
      const resp = await fetch(rawUrl);
      if (!resp.ok) throw new Error(`Failed to download schema (${resp.status})`);
      const content = await resp.text();
      const name = `${selectedModel.name}-${version}`;
      addSchema(name, content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setStep("versions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            Download Semantic Schema
          </span>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {step === "models" && (
          <>
            <div style={{ padding: "8px 16px" }}>
              <input
                type="text"
                placeholder="Search models (e.g. pcf, serial, batch...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
                autoFocus
              />
            </div>
            <div style={listContainerStyle}>
              {loading && <div style={statusStyle}>Loading models...</div>}
              {error && <div style={{ ...statusStyle, color: theme.colors.error }}>
                {error}
              </div>}
              {!loading && !error && filteredModels.map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleSelectModel(m)}
                  style={listItemStyle}
                >
                  <span style={{ color: theme.colors.primary }}>⬡</span>
                  <span>{m.name}</span>
                </button>
              ))}
              {!loading && !error && filteredModels.length === 0 && (
                <div style={statusStyle}>No models match your search</div>
              )}
            </div>
          </>
        )}

        {step === "versions" && selectedModel && (
          <>
            <div style={{ padding: "8px 16px" }}>
              <button onClick={() => { setStep("models"); setError(null); }} style={backButtonStyle}>
                ← Back to models
              </button>
              <div style={{ marginTop: 8, fontSize: 13, color: theme.colors.textMuted }}>
                Select version for <strong style={{ color: theme.colors.text }}>{selectedModel.name}</strong>
              </div>
            </div>
            <div style={listContainerStyle}>
              {loading && <div style={statusStyle}>Loading versions...</div>}
              {error && <div style={{ ...statusStyle, color: theme.colors.error }}>
                {error}
              </div>}
              {!loading && !error && selectedModel.versions.length === 0 && (
                <div style={statusStyle}>No versions found for this model</div>
              )}
              {!loading && !error && selectedModel.versions.map((v) => (
                <button
                  key={v}
                  onClick={() => handleDownloadSchema(v)}
                  style={listItemStyle}
                >
                  <span style={{ color: theme.colors.primary }}>v</span>
                  <span>{v}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "downloading" && (
          <div style={{ ...statusStyle, padding: 32 }}>Downloading schema...</div>
        )}

        <div style={footerStyle}>
          <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
            Source: eclipse-tractusx/sldt-semantic-models
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.6)",
};

const dialogStyle: React.CSSProperties = {
  background: theme.colors.bgLighter,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 8,
  width: 480,
  maxHeight: "70vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: `1px solid ${theme.colors.border}`,
  color: theme.colors.text,
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  fontSize: 16,
  padding: "2px 6px",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 4,
  border: `1px solid ${theme.colors.border}`,
  background: theme.colors.bg,
  color: theme.colors.text,
  fontSize: 13,
  outline: "none",
};

const listContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "4px 8px",
  minHeight: 200,
  maxHeight: 400,
};

const listItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  background: "transparent",
  color: theme.colors.text,
  fontSize: 13,
  cursor: "pointer",
  textAlign: "left",
};

const statusStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "center",
  fontSize: 13,
  color: theme.colors.textMuted,
};

const backButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: theme.colors.primary,
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
};

const footerStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderTop: `1px solid ${theme.colors.border}`,
  textAlign: "right",
};
