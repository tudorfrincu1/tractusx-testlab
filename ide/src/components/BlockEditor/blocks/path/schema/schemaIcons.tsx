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
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#b388ff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 15V8M2 4.5L8 8L14 4.5" stroke="#b388ff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ArrayIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <path d="M4 2H2v12h2M12 2h2v12h-2" stroke="#f4a261" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="8" r="1" fill="#f4a261" />
      <circle cx="10" cy="8" r="1" fill="#f4a261" />
    </svg>
  );
}

function StringIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <path d="M5 3H9.5C10.9 3 12 4.1 12 5.5S10.9 8 9.5 8H5V3Z" stroke="#06d6a0" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 8H10.5C11.9 8 13 9.1 13 10.5S11.9 13 10.5 13H5V8Z" stroke="#06d6a0" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 2v12" stroke="#06d6a0" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function NumberIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <path d="M6 3v10M10 3v10" stroke="#48cae4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3 6h10M3 10h10" stroke="#48cae4" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BooleanIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" stroke="#ffd166" strokeWidth="1.3" />
      <circle cx="11" cy="8" r="2.5" fill="#ffd166" />
    </svg>
  );
}

function UnknownIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#888" strokeWidth="1.3" />
      <path d="M6 6.5a2 2 0 0 1 3.5 1.5c0 1-1.5 1.5-1.5 1.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.8" fill="#888" />
    </svg>
  );
}

const TYPE_ICON_MAP: Record<string, () => ReactNode> = {
  object: ObjectIcon,
  array: ArrayIcon,
  string: StringIcon,
  number: NumberIcon,
  integer: NumberIcon,
  boolean: BooleanIcon,
} as const;

/** Render an SVG icon for a JSON Schema type. */
export function schemaTypeIcon(type: string): ReactNode {
  const Icon = TYPE_ICON_MAP[type] ?? UnknownIcon;
  return <Icon />;
}

/** CSS class for a type badge. */
export function typeBadgeClass(type: string): string {
  switch (type) {
    case "string": return "schema-badge-string";
    case "object": return "schema-badge-object";
    case "array": return "schema-badge-array";
    case "number":
    case "integer": return "schema-badge-number";
    case "boolean": return "schema-badge-boolean";
    default: return "schema-badge-unknown";
  }
}
