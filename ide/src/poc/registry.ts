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

import type { ComponentType } from "react";
import { PreconditionEditorPoc } from "./pocs/preconditions-editor";

/** A single proof-of-concept registered in the gallery. */
export interface PocEntry {
  /** URL slug used in the hash route (#/<id>). */
  id: string;
  title: string;
  description: string;
  Component: ComponentType;
}

/**
 * Data-driven catalog of POCs. Add an entry here to surface a new POC in the
 * gallery — the router and sidebar are generated from this list.
 */
export const POC_REGISTRY: readonly PocEntry[] = [
  {
    id: "preconditions-editor",
    title: "Preconditions Editor",
    description: "Schema-aware, card-based precondition editor (replaces the raw-JSON input).",
    Component: PreconditionEditorPoc,
  },
] as const;

export function findPoc(id: string | null): PocEntry | undefined {
  return POC_REGISTRY.find((poc) => poc.id === id);
}
