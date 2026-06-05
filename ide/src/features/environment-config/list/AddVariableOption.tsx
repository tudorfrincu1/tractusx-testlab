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

import { forwardRef } from "react";
import type { ComponentType, KeyboardEvent } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";

export interface AddVariableOptionProps {
  /** Leading glyph shown in the tinted tile — signals the option's intent. */
  Icon: ComponentType<SvgIconProps>;
  /** Primary, clickable title of the option. */
  label: string;
  /** One-line explanation shown beneath the title. */
  description: string;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * A single, obviously-clickable entry in the Add-variable menu. The whole row
 * is a button (icon tile + title + description) with hover and focus
 * affordances, so every option reads as interactive — never as static text.
 */
export const AddVariableOption = forwardRef<HTMLButtonElement, AddVariableOptionProps>(
  function AddVariableOption({ Icon, label, description, onSelect, onKeyDown }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className="vars-add__option"
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        <span className="vars-add__option-icon" aria-hidden>
          <Icon fontSize="small" />
        </span>
        <span className="vars-add__option-body">
          <span className="vars-add__option-label">{label}</span>
          <span className="vars-add__option-hint">{description}</span>
        </span>
      </button>
    );
  },
);
