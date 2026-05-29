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

import type { ReactNode } from "react";

const ICON_SIZE = 14;

function ObjectIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16">
      <text x="8" y="12" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#b388ff">obj</text>
    </svg>
  );
}

function ArrayIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16">
      <text x="8" y="12" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#f4a261">[ ]</text>
    </svg>
  );
}

function ValueIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16">
      <text x="8" y="12" textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#aaa">data</text>
    </svg>
  );
}

const TYPE_ICON_MAP: Record<string, () => ReactNode> = {
  object: ObjectIcon,
  array: ArrayIcon,
} as const;

/** Render an SVG icon for a JSON Schema type. */
export function schemaTypeIcon(type: string): ReactNode {
  const Icon = TYPE_ICON_MAP[type] ?? ValueIcon;
  return <Icon />;
}

/** CSS class for a type badge. */
export function typeBadgeClass(type: string): string {
  switch (type) {
    case "object": return "schema-badge-object";
    case "array": return "schema-badge-array";
    default: return "schema-badge-value";
  }
}
