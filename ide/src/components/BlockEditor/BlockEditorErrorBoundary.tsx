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

/**
 * Error boundary for the Blockly workspace.
 *
 * React Error Boundaries require a class component — no hooks API exists.
 * This is the sole exception to the "functional components only" rule.
 */

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { theme } from "../../theme/tractusxTheme";
import { useTestLabStore } from "../../store/useTestLabStore";
import { createEmptyTest, createEmptyTestCase } from "../../models/schema";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorCount: number;
  lastErrorTime: number;
}

const MAX_RAPID_ERRORS = 2;
const RAPID_ERROR_WINDOW_MS = 5000;

export class BlockEditorErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "", errorCount: 0, lastErrorTime: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const now = Date.now();
    const isRapid = now - this.state.lastErrorTime < RAPID_ERROR_WINDOW_MS;
    this.setState((prev) => ({
      errorCount: isRapid ? prev.errorCount + 1 : 1,
      lastErrorTime: now,
    }));
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[BlockEditorErrorBoundary]", error.message, info.componentStack);
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  private handleReset = () => {
    const kind = useTestLabStore.getState().model.kind;
    const emptyModel = kind === "test-case" ? createEmptyTestCase() : createEmptyTest();
    useTestLabStore.getState().loadModel(emptyModel);
    this.setState({ hasError: false, errorMessage: "", errorCount: 0, lastErrorTime: 0 });
  };

  private get isRepeatedCrash(): boolean {
    return this.state.errorCount >= MAX_RAPID_ERRORS;
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", gap: 16,
        background: theme.colors.bg, color: theme.colors.textMuted,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      }}>
        <span style={{ color: theme.colors.warning, fontSize: 14, fontWeight: 600 }}>
          Block editor encountered an error
        </span>
        {this.state.errorMessage && (
          <span style={{ maxWidth: 400, textAlign: "center", opacity: 0.7, fontSize: 12 }}>
            {this.state.errorMessage}
          </span>
        )}
        <button
          onClick={this.isRepeatedCrash ? this.handleReset : this.handleReload}
          style={{
            padding: "6px 16px", border: `1px solid ${theme.colors.primary}`,
            borderRadius: 4, background: "transparent", color: theme.colors.primary,
            cursor: "pointer", fontSize: 12, fontFamily: "inherit",
          }}
        >
          {this.isRepeatedCrash ? "Reset to empty workspace" : "Reload workspace"}
        </button>
      </div>
    );
  }
}
