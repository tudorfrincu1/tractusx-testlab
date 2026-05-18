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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { ScriptKind } from "../../../models/schema";
import type { BlockCatalog, BlockCatalogCategory } from "../blocks";
import { useServiceStore } from "../../../store/slices/useServiceStore";
import { blockColors, getCategoryColor } from "../config/blockColors";
import { PHASE_DEFINITIONS, type PhaseBlockGroup } from "./phaseConfig";

export const SERVICE_TYPE_RESOLUTION: Record<string, string[]> = {
  edc_connector: ["edc_connector_saturn", "edc_connector_jupiter"],
  dtr: ["aas"],
  discovery_finder: ["discovery_finder", "edc_discovery", "bpn_discovery"],
};

const SERVICE_TO_DATASPACE: Record<string, string> = {
  edc_connector_saturn: "saturn",
  edc_connector_jupiter: "jupiter",
};

export function getActiveDataspaceVersions(): Set<string> {
  const { services } = useServiceStore.getState();
  const versions = new Set<string>();
  for (const s of services) {
    const v = SERVICE_TO_DATASPACE[s.type];
    if (v) versions.add(v);
  }
  return versions;
}

/** EDC block ordering with label separators. */
const EDC_CONSUMER_BLOCKS = ["step_query_catalog", "step_query_catalog_with_filters", "step_negotiate", "step_initiate_transfer"];
const EDC_PROVIDER_BLOCKS = ["step_create_asset", "step_create_policy", "step_create_contract_def"];
const EDC_STRUCTURE_BLOCKS = [
  "filter_expression", "asset_criterion",
  "odrl_permission", "odrl_prohibition", "odrl_obligation",
  "odrl_logical_constraint", "odrl_constraint",
];

/** Build the EDC Connector category with nested sub-categories. */
function buildEdcConnectorCategory(
  cat: BlockCatalogCategory,
  activeVersions: Set<string>,
): object {
  const available = new Set(
    cat.blocks
      .filter(
        (b) =>
          !b.custom_registration &&
          (!b.dataspace_version ||
            activeVersions.size === 0 ||
            activeVersions.has(b.dataspace_version)),
      )
      .map((b) => `step_${b.type}`),
  );

  const colour = getCategoryColor(cat.name);

  const consumerContents = EDC_CONSUMER_BLOCKS
    .filter((t) => available.has(t))
    .map((t) => ({ kind: "block", type: t }));

  const providerContents = EDC_PROVIDER_BLOCKS
    .filter((t) => available.has(t))
    .map((t) => ({ kind: "block", type: t }));

  const structureContents = EDC_STRUCTURE_BLOCKS
    .map((t) => ({ kind: "block", type: t }));

  const subCategories: object[] = [];
  if (consumerContents.length > 0) {
    subCategories.push({ kind: "category", name: "Data Consumer", colour, contents: consumerContents });
  }
  if (providerContents.length > 0) {
    subCategories.push({ kind: "category", name: "Data Provider", colour, contents: providerContents });
  }
  if (structureContents.length > 0) {
    subCategories.push({ kind: "category", name: "Data Structures", colour, contents: structureContents });
  }

  return {
    kind: "category",
    name: cat.name,
    colour,
    contents: subCategories,
  };
}

/** Build a toolbox category object from a single catalog category. */
function buildCatalogCategory(
  cat: BlockCatalogCategory,
  activeVersions: Set<string>,
): object {
  if (cat.name === "EDC Connector") {
    return buildEdcConnectorCategory(cat, activeVersions);
  }
  return {
    kind: "category",
    name: cat.name,
    colour: getCategoryColor(cat.name),
    contents: cat.blocks
      .filter(
        (b) =>
          !b.custom_registration &&
          (!b.dataspace_version ||
            activeVersions.size === 0 ||
            activeVersions.has(b.dataspace_version)),
      )
      .map((b) => ({ kind: "block", type: `step_${b.type}` })),
  };
}

/** Build a map from category name to its toolbox category object. */
function buildCategoryMap(catalog: BlockCatalog): Map<string, object> {
  const activeVersions = getActiveDataspaceVersions();
  const map = new Map<string, object>();
  for (const cat of catalog) {
    map.set(cat.name, buildCatalogCategory(cat, activeVersions));
  }
  return map;
}

/** Build the Inputs block group with nested sub-categories. */
function buildInputsCategory(blocks: readonly string[], variables: string[]): object {
  const colour = blockColors.valueString;

  const literalValues: object[] = [];
  for (const t of ["value_string", "value_number", "value_boolean", "value_json", "key_value_pair"]) {
    if (blocks.includes(t)) literalValues.push({ kind: "block", type: t });
  }

  const extractors: object[] = [];
  for (const t of ["value_json_path", "value_api_path"]) {
    if (blocks.includes(t)) extractors.push({ kind: "block", type: t });
  }

  const variableContents: object[] = [];
  if (blocks.includes("variable_def")) variableContents.push({ kind: "block", type: "variable_def" });
  if (variables.length > 0) {
    variableContents.push({ kind: "sep", gap: "8" });
    for (const v of variables) {
      variableContents.push({ kind: "block", type: "variable_get", fields: { VAR_NAME: v } });
    }
    variableContents.push({ kind: "sep", gap: "8" });
  }
  if (blocks.includes("variable_get")) variableContents.push({ kind: "block", type: "variable_get" });

  return {
    kind: "category",
    name: "Inputs",
    colour,
    contents: [
      { kind: "category", name: "Literal Values", colour, contents: literalValues },
      { kind: "category", name: "Extractors", colour, contents: extractors },
      { kind: "category", name: "Variables", colour, contents: variableContents },
    ],
  };
}

/** Build the Validation block group with nested sub-categories. */
function buildValidationCategory(blocks: readonly string[]): object {
  const colour = blockColors.assertion;

  const groups: { name: string; types: string[] }[] = [
    { name: "Extract", types: ["step_validate_path"] },
    { name: "Equality", types: ["assert_equals", "assert_not_equals", "assert_contains", "assert_not_contains", "assert_matches"] },
    { name: "Schema", types: ["assert_schema", "assert_validates_schema"] },
    { name: "Comparison", types: ["assert_compare", "assert_between"] },
    { name: "Presence", types: ["assert_not_null", "assert_not_empty"] },
    { name: "Structure", types: ["assert_field"] },
  ];

  return {
    kind: "category",
    name: "Validation",
    colour,
    contents: groups.map((g) => ({
      kind: "category",
      name: g.name,
      colour,
      contents: g.types
        .filter((t) => blocks.includes(t))
        .map((t) => ({ kind: "block", type: t })),
    })).filter((c) => (c.contents as object[]).length > 0),
  };
}

/** Build a toolbox category from a phase block group definition. */
function buildBlockGroupCategory(group: PhaseBlockGroup, variables: string[]): object {
  if (group.name === "Inputs") {
    return buildInputsCategory(group.blocks, variables);
  }
  if (group.name === "Validation") {
    return buildValidationCategory(group.blocks);
  }
  return {
    kind: "category",
    name: group.name,
    colour: group.colour,
    contents: group.blocks.map((type) => ({ kind: "block", type })),
  };
}

/** Build nested phase-group categories for the step-editor toolbox. */
function buildPhaseGroups(catalog: BlockCatalog, variables: string[]): object[] {
  const categoryMap = buildCategoryMap(catalog);
  const phases: object[] = [];

  for (const phase of PHASE_DEFINITIONS) {
    const children: object[] = [];
    for (const catName of phase.categories) {
      const cat = categoryMap.get(catName);
      if (cat) children.push(cat);
    }
    if (phase.blockGroups) {
      for (const group of phase.blockGroups) {
        children.push(buildBlockGroupCategory(group, variables));
      }
    }
    if (children.length > 0) {
      phases.push({
        kind: "category",
        name: phase.name,
        colour: phase.colour,
        expanded: "true",
        contents: children,
      });
    }
  }

  return phases;
}

export function buildToolbox(catalog: BlockCatalog, _kind?: ScriptKind, variables?: string[]): object {
  const vars = variables || [];
  const phaseGroups = buildPhaseGroups(catalog, vars);

  return {
    kind: "categoryToolbox",
    contents: [
      ...phaseGroups,
      { kind: "sep" },
      {
        kind: "category",
        name: "Authentication",
        colour: blockColors.authentication,
        contents: [
          { kind: "block", type: "auth_oauth2" },
          { kind: "block", type: "auth_api_key" },
        ],
      },
    ],
  };
}
