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

import { theme } from "../../theme/tractusxTheme";

export const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.6)",
};

export const dialogStyle: React.CSSProperties = {
  background: theme.colors.bgLighter,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 8,
  width: 480,
  maxHeight: "70vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: `1px solid ${theme.colors.border}`,
  color: theme.colors.text,
};

export const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  fontSize: 16,
  padding: "2px 6px",
};

export const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 4,
  border: `1px solid ${theme.colors.border}`,
  background: theme.colors.bg,
  color: theme.colors.text,
  fontSize: 13,
  outline: "none",
};

export const listContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "4px 8px",
  minHeight: 200,
  maxHeight: 400,
};

export const listItemStyle: React.CSSProperties = {
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

export const statusStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "center",
  fontSize: 13,
  color: theme.colors.textMuted,
};

export const backButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: theme.colors.primary,
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
};

export const footerStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderTop: `1px solid ${theme.colors.border}`,
  textAlign: "right",
};

/** Compare two semantic version strings. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}
