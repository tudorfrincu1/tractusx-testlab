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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: GPT-5.3-Codex).
// It was reviewed and tested by a human committer.

import type { ReactNode } from "react";
import { theme } from "../../theme/tractusxTheme";

export function OrderBadge({ order }: Readonly<{ order: number }>) {
  return (
    <div style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "rgba(255, 215, 0, 0.15)",
      color: theme.colors.primary,
      fontSize: 10,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 12,
    }}>
      {order}
    </div>
  );
}

export function IconButton({
  icon,
  title,
  onClick,
  color,
}: Readonly<{
  icon: ReactNode;
  title: string;
  onClick: () => void;
  color?: string;
}>) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 4,
        background: "transparent",
        border: "none",
        color: color ?? theme.colors.textMuted,
        cursor: "pointer",
        opacity: 0.5,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.5";
      }}
    >
      {icon}
    </button>
  );
}
