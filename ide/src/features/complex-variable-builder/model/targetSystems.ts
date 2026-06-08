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
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import AppRegistrationOutlinedIcon from "@mui/icons-material/AppRegistrationOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { SUBTYPE_META, SUBTYPE_ORDER } from "./subtypeCategories";
import type { Tone } from "./subtypeCategories";
import { INPUT_TEMPLATES } from "./inputTemplates";
import type { ComplexVariableItem, VariableSubType, SystemId } from "./variableTypes";

/**
 * The PRIMARY axis of the configurator: the operator first chooses a system,
 * then sees one flat list of everything to preconfigure for it — regardless of
 * action type. This registry is the single source of truth tying every
 * sub-type, generator and input template to the system it belongs to.
 */
export interface SystemMeta {
  label: string;
  description: string;
  Icon: ComponentType<SvgIconProps>;
}

export const SYSTEM_META: Record<SystemId, SystemMeta> = {
  connector: {
    label: "Connector Config",
    description: "Policies, asset templates and connector values the SUT registers in its EDC.",
    Icon: HubOutlinedIcon,
  },
  dtr: {
    label: "Test Data Config (AAS, Submodel)",
    description: "Shell descriptors and submodel payloads the SUT serves through its DTR.",
    Icon: AccountTreeOutlinedIcon,
  },
  sut_other: {
    label: "System Under Test Config",
    description: "Asset identifiers and system-agnostic values describing what's under test.",
    Icon: DnsOutlinedIcon,
  },
};

/** Stable left-to-right order of the system cards on the landing grid. */
export const SYSTEM_ORDER: readonly SystemId[] = ["connector", "dtr", "sut_other"] as const;

/**
 * A concrete "thing the operator can add" inside a system. It is intentionally
 * action-agnostic at the call site: the system view shows a single Add menu
 * that mixes register sub-types and input templates as peers.
 */
export type AddAction =
  | { kind: "subtype"; subType: VariableSubType; label: string; Icon: ComponentType<SvgIconProps> }
  | { kind: "input"; templateId: string; label: string; Icon: ComponentType<SvgIconProps> };

/** The register sub-types that belong to a system, in stable display order. */
function registerSubTypesForSystem(system: SystemId): VariableSubType[] {
  return SUBTYPE_ORDER.filter((subType) => {
    const meta = SUBTYPE_META[subType];
    return meta.category === "register" && meta.target === system;
  });
}

/**
 * Every add-action a system supports, aggregated so a single "Add" menu can
 * offer register sub-types and input templates as peers (no action grouping).
 */
export function addActionsForSystem(system: SystemId): AddAction[] {
  const subtypeActions: AddAction[] = registerSubTypesForSystem(system).map((subType) => ({
    kind: "subtype",
    subType,
    label: SUBTYPE_META[subType].addLabel,
    Icon: SUBTYPE_META[subType].Icon,
  }));
  const inputActions: AddAction[] = INPUT_TEMPLATES.filter((t) => t.target === system).map((t) => ({
    kind: "input",
    templateId: t.id,
    label: `${t.label} input`,
    Icon: t.Icon,
  }));
  return [...subtypeActions, ...inputActions];
}

/** The system an existing item belongs to (explicit field, sub-type fallback). */
export function systemForItem(item: ComplexVariableItem): SystemId {
  return item.target ?? SUBTYPE_META[item.subType].target ?? "sut_other";
}

/** Items belonging to a system, preserving their insertion order. */
export function itemsForSystem(items: ComplexVariableItem[], system: SystemId): ComplexVariableItem[] {
  return items.filter((item) => systemForItem(item) === system);
}

/** The two visual buckets the L2 list groups items into. */
export type ItemSection = "configuration" | "input";

/**
 * Pure derivation of an item's L2 section from its sub-type category:
 * register artifacts are configuration, everything else (inputs/checks) is
 * operator-supplied input.
 */
export function sectionForItem(item: ComplexVariableItem): ItemSection {
  const { category } = SUBTYPE_META[item.subType];
  if (category === "register") return "configuration";
  return "input";
}

/** The section (TYPE) an add-action contributes to, mirroring sectionForItem. */
export function sectionForAddAction(action: AddAction): ItemSection {
  if (action.kind === "subtype") {
    return SUBTYPE_META[action.subType].category === "register" ? "configuration" : "input";
  }
  return "input";
}

/** Stable display order of the two types in the chooser and breadcrumb. */
export const SECTION_ORDER: readonly ItemSection[] = ["configuration", "input"] as const;

/** Static, schema-like metadata for each type — drives the chooser and L3 head. */
export interface SectionMeta {
  title: string;
  hint: string;
  description: string;
  tone: Tone;
  Icon: ComponentType<SvgIconProps>;
}

export const SECTION_META: Record<ItemSection, SectionMeta> = {
  configuration: {
    title: "Configuration",
    hint: "Objects to register in your system",
    description: "Policies, assets and descriptors TestLab defines for you to register.",
    tone: "register",
    Icon: AppRegistrationOutlinedIcon,
  },
  input: {
    title: "Input Data Required",
    hint: "Values you must supply before tests run",
    description: "Endpoints and identifiers you provide so TestLab can reach the SUT.",
    tone: "input",
    Icon: LoginOutlinedIcon,
  },
};

/** Add-actions whose target type matches the given section. */
export function addActionsForSection(system: SystemId, section: ItemSection): AddAction[] {
  return addActionsForSystem(system).filter((action) => sectionForAddAction(action) === section);
}

/** Items of a system belonging to a given type, in insertion order. */
export function itemsForSection(
  items: ComplexVariableItem[],
  system: SystemId,
  section: ItemSection,
): ComplexVariableItem[] {
  return itemsForSystem(items, system).filter((item) => sectionForItem(item) === section);
}

/**
 * The types available for a system, in stable order. A type is available when
 * it has at least one existing item OR at least one add-action mapping to it.
 */
export function availableSectionsForSystem(
  items: ComplexVariableItem[],
  system: SystemId,
): ItemSection[] {
  const fromItems = new Set(itemsForSystem(items, system).map(sectionForItem));
  const fromActions = new Set(addActionsForSystem(system).map(sectionForAddAction));
  return SECTION_ORDER.filter((section) => fromItems.has(section) || fromActions.has(section));
}
