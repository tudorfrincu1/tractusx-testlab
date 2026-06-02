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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { describeView, type PocView } from "./navigation";
import type { PocPrecondition } from "./types";

export interface TopbarProps {
  view: PocView;
  active: PocPrecondition | null;
  onBack: () => void;
}

/** Context-aware top bar: the back affordance and title follow the level. */
export function Topbar({ view, active, onBack }: Readonly<TopbarProps>) {
  const { title, backLabel } = describeView(view, active);
  const isLanding = view.level === "landing";
  return (
    <header className="precond-poc__topbar">
      {isLanding ? (
        <span className="precond-poc__back precond-poc__back--muted">
          <ArrowBackIcon fontSize="small" />
          {backLabel}
        </span>
      ) : (
        <button type="button" className="precond-poc__back" onClick={onBack}>
          <ArrowBackIcon fontSize="small" />
          {backLabel}
        </button>
      )}
      <span className="precond-poc__title">{title}</span>
    </header>
  );
}
