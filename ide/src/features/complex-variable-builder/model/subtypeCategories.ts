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
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AppRegistrationOutlinedIcon from "@mui/icons-material/AppRegistrationOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import type { PreconditionCategory, PreconditionSubType, SystemId } from "./preconditionTypes";

/** Reused across category and sub-type registries to colour badges/icons. */
export type Tone = "generate" | "register" | "input" | "check";

/**
 * POC-local target system an item preconfigures. Kept as an alias of the
 * canonical {@link SystemId} so existing imports of `RegisterTarget` keep
 * working while the systems registry becomes the single source of truth.
 */
export type RegisterTarget = SystemId;

/** Shared call-to-action label rendered on every landing tile. */
export const CATEGORY_CTA_LABEL = "Configure" as const;

/** Static, schema-like metadata for each precondition category (data-driven). */
export interface CategoryMeta {
  /** Compact label used on badges, topbar titles and search placeholders. */
  label: string;
  /** Functional landing-tile heading (e.g. "Configuration Requirements"). */
  tileLabel: string;
  direction: string;
  description: string;
  /** Short call-to-action shown in the detail header (value vs. object). */
  actionLabel?: string;
  /** CSS class suffix used to colour badges/icons via the SCSS partial. */
  tone: Tone;
  Icon: ComponentType<SvgIconProps>;
}

export const CATEGORY_META: Record<PreconditionCategory, CategoryMeta> = {
  generate: {
    label: "Generate",
    tileLabel: "Generate values",
    direction: "TestLab → User",
    description: "TestLab produces a value and shows it to you for SUT configuration.",
    actionLabel: "Copy this value into your SUT",
    tone: "generate",
    Icon: AutoAwesomeOutlinedIcon,
  },
  register: {
    label: "Register",
    tileLabel: "Configuration Requirements",
    direction: "TestLab → User",
    description: "An object defined in YAML for you to register in your SUT.",
    actionLabel: "Register this object in your SUT",
    tone: "register",
    Icon: AppRegistrationOutlinedIcon,
  },
  input: {
    label: "Input",
    tileLabel: "Your details",
    direction: "User → TestLab",
    description: "A value you must supply before test execution begins.",
    tone: "input",
    Icon: LoginOutlinedIcon,
  },
  check: {
    label: "Check",
    tileLabel: "Check readiness",
    direction: "TestLab → SUT",
    description: "Automated verification that infrastructure is ready before tests run.",
    tone: "check",
    Icon: FactCheckOutlinedIcon,
  },
};

/**
 * Static metadata for each sub-type, mirroring the CATEGORY_META pattern.
 * `label` is the plural section heading; `addLabel` is the singular noun used
 * on the contextual "+ Add <addLabel>" button beneath each section.
 */
export interface SubTypeMeta {
  label: string;
  addLabel: string;
  /** Short class word shown as the per-item badge in a system's flat list. */
  classLabel: string;
  category: PreconditionCategory;
  /** POC-local target system this artifact registers into (register only). */
  target?: RegisterTarget;
  tone: Tone;
  Icon: ComponentType<SvgIconProps>;
}

export const SUBTYPE_META: Record<PreconditionSubType, SubTypeMeta> = {
  access_policy: {
    label: "Access Policies",
    addLabel: "Access Policy",
    classLabel: "policy",
    category: "register",
    target: "connector",
    tone: "register",
    Icon: ShieldOutlinedIcon,
  },
  usage_policy: {
    label: "Usage Policies",
    addLabel: "Usage Policy",
    classLabel: "policy",
    category: "register",
    target: "connector",
    tone: "register",
    Icon: GavelOutlinedIcon,
  },
  asset_template: {
    label: "Asset Templates",
    addLabel: "Asset Template",
    classLabel: "asset",
    category: "register",
    target: "connector",
    tone: "register",
    Icon: DescriptionOutlinedIcon,
  },
  aas_descriptor: {
    label: "AAS Descriptors",
    addLabel: "AAS Descriptor",
    classLabel: "descriptor",
    category: "register",
    target: "dtr",
    tone: "register",
    Icon: AccountTreeOutlinedIcon,
  },
  generated_value: {
    label: "Generated Values",
    addLabel: "Generated Value",
    classLabel: "value",
    category: "generate",
    tone: "generate",
    Icon: AutoAwesomeOutlinedIcon,
  },
  operator_input: {
    label: "Operator Inputs",
    addLabel: "Operator Input",
    classLabel: "input",
    category: "input",
    tone: "input",
    Icon: LoginOutlinedIcon,
  },
  readiness_check: {
    label: "Readiness Checks",
    addLabel: "Readiness Check",
    classLabel: "check",
    category: "check",
    tone: "check",
    Icon: FactCheckOutlinedIcon,
  },
};

/** Stable display order for sub-type sub-headers within a category view. */
export const SUBTYPE_ORDER: readonly PreconditionSubType[] = [
  "access_policy",
  "usage_policy",
  "asset_template",
  "aas_descriptor",
  "generated_value",
  "operator_input",
  "readiness_check",
] as const;
