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
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import type { SourceMode } from "./types";

/**
 * Data-driven presentation metadata for each source mode. Drives the segmented
 * toggle, the list source-mode icon and the run-configuration bucket headers,
 * so no component hardcodes a label, tone or icon.
 */
export interface SourceModeMeta {
  /** The run-start disposition this mode resolves to. */
  disposition: "KNOWN" | "REQUEST" | "GENERATE";
  /** Short label shown on the segmented toggle. */
  label: string;
  /** One-line explanation shown under the toggle. */
  hint: string;
  /** CSS tone suffix used to colour badges/icons via the SCSS partial. */
  tone: "value" | "input" | "generated";
  Icon: ComponentType<SvgIconProps>;
}

export const SOURCE_MODE_META: Record<SourceMode, SourceModeMeta> = {
  value: {
    disposition: "KNOWN",
    label: "Value",
    hint: "A fixed value, known before the run starts.",
    tone: "value",
    Icon: EditNoteOutlinedIcon,
  },
  input: {
    disposition: "REQUEST",
    label: "Input",
    hint: "Requested from the operator when the run starts.",
    tone: "input",
    Icon: LoginOutlinedIcon,
  },
  generated: {
    disposition: "GENERATE",
    label: "Generated",
    hint: "Produced by a generator at run start.",
    tone: "generated",
    Icon: AutoAwesomeOutlinedIcon,
  },
};

/** Ordered list of source modes for the segmented toggle (Value | Input | Generated). */
export const SOURCE_MODE_ORDER: readonly SourceMode[] = ["value", "input", "generated"] as const;
