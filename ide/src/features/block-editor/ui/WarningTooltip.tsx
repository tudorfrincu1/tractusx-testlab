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

import { useEffect, useRef } from "react";
import "./WarningTooltip.css";

export type TooltipVariant = "warning" | "info";

export interface BlockTooltipProps {
  text: string;
  position: { x: number; y: number };
  variant?: TooltipVariant;
  onClose: () => void;
}

/** Re-export for backward compatibility */
export type WarningTooltipProps = BlockTooltipProps;

export function BlockTooltip({ text, position, variant = "warning", onClose }: BlockTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`block-tooltip block-tooltip--${variant}`}
      style={{ top: position.y, left: position.x }}
    >
      <button className="block-tooltip__close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <span className="block-tooltip__text">{text}</span>
    </div>
  );
}

/** Backward-compatible alias */
export const WarningTooltip = BlockTooltip;
