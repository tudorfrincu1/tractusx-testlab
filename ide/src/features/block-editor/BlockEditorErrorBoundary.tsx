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

/**
 * Error boundary for the Blockly workspace.
 *
 * React Error Boundaries require a class component — no hooks API exists.
 * This is the sole exception to the "functional components only" rule.
 */

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { theme } from "@/shared/theme/tractusxTheme";
import { useEditorStore } from "@/store";
import { createEmptyTest, createEmptyTck } from "@/models/schema";

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
    const kind = useEditorStore.getState().model.kind;
    const emptyModel = kind === "tck" ? createEmptyTck() : createEmptyTest();
    useEditorStore.getState().loadModel(emptyModel);
    this.setState({ hasError: false, errorMessage: "", errorCount: 0, lastErrorTime: 0 });
  };

  private get isRepeatedCrash(): boolean {
    return this.state.errorCount >= MAX_RAPID_ERRORS;
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="block-editor-error" style={{
        background: theme.colors.bg, color: theme.colors.textMuted,
      }}>
        <span className="block-editor-error__title" style={{ color: theme.colors.warning }}>
          Block editor encountered an error
        </span>
        {this.state.errorMessage && (
          <span className="block-editor-error__message">
            {this.state.errorMessage}
          </span>
        )}
        <button
          onClick={this.isRepeatedCrash ? this.handleReset : this.handleReload}
          className="block-editor-error__button"
          style={{
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.primary,
          }}
        >
          {this.isRepeatedCrash ? "Reset to empty workspace" : "Reload workspace"}
        </button>
      </div>
    );
  }
}
