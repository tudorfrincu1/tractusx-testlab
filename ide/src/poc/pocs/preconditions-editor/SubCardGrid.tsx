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
import type { SvgIconProps } from "@mui/material/SvgIcon";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { Tone } from "./categories";

/** One data-driven portrait tile rendered by {@link SubCardGrid}. */
export interface SubCardEntry {
  id: string;
  label: string;
  description: string;
  Icon: ComponentType<SvgIconProps>;
  tone: Tone;
  /** Optional count chip (e.g. number of artifacts for a target). */
  count?: number;
  /** Optional class badge (e.g. a generator's output class). */
  badge?: string;
  /** Greys the tile out and blocks selection (e.g. future placeholders). */
  disabled?: boolean;
}

export interface SubCardGridProps {
  heading: string;
  subheading: string;
  entries: readonly SubCardEntry[];
  onSelect: (id: string) => void;
}

/**
 * Reusable L2 grid of portrait tiles sharing the landing card's visual
 * language. Used by every category for its middle level (targets, generators,
 * templates) so the drill-down feels uniform across the configurator.
 */
export function SubCardGrid({
  heading,
  subheading,
  entries,
  onSelect,
}: Readonly<SubCardGridProps>) {
  return (
    <div className="precond-subgrid">
      <header className="precond-subgrid__head">
        <h2 className="precond-subgrid__title">{heading}</h2>
        <p className="precond-subgrid__sub">{subheading}</p>
      </header>
      <div className="precond-subgrid__grid">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="precond-card precond-card--sub"
            disabled={entry.disabled}
            onClick={() => onSelect(entry.id)}
          >
            <span className={`precond-card__icon precond-card__icon--${entry.tone}`}>
              <entry.Icon fontSize="inherit" />
            </span>
            <span className="precond-card__body">
              <span className="precond-card__label">{entry.label}</span>
              <span className="precond-card__desc">{entry.description}</span>
            </span>
            <span className="precond-card__meta">
              {entry.badge && (
                <span className={`precond-card__badge precond-card__badge--${entry.tone}`}>
                  {entry.badge}
                </span>
              )}
              {entry.count !== undefined && (
                <span className={`precond-card__count precond-card__count--${entry.tone}`}>
                  {entry.count}
                </span>
              )}
              {!entry.disabled && (
                <ChevronRightIcon fontSize="small" className="precond-card__chevron" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
