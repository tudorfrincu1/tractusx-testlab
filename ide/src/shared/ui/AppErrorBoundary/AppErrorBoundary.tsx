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
 * Top-level error boundary for the entire application content area.
 *
 * React Error Boundaries require a class component — no hooks API exists.
 * This is one of only two exceptions to the "functional components only" rule
 * (the other being BlockEditorErrorBoundary).
 */

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[AppErrorBoundary]", error.message, info.componentStack);
    }
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-error-boundary">
        <span className="app-error-boundary__icon">!</span>
        <span className="app-error-boundary__title">Something went wrong</span>
        {this.state.errorMessage && (
          <div className="app-error-boundary__message">{this.state.errorMessage}</div>
        )}
        <div className="app-error-boundary__actions">
          <button
            className="app-error-boundary__btn app-error-boundary__btn--retry"
            onClick={this.handleTryAgain}
          >
            Try Again
          </button>
          <button
            className="app-error-boundary__btn app-error-boundary__btn--reload"
            onClick={this.handleReload}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
