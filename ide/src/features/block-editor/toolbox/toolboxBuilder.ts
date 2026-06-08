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

import { ScriptKind } from "@/models/schema";
import type { BlockCatalog, BlockCatalogCategory } from "../blocks";
import type { CategorizedVariables } from "../blocks";
import { useServiceStore } from "@/store";
import { blockColors, getCategoryColor } from "../config/blockColors";
import { PHASE_DEFINITIONS, type PhaseBlockGroup } from "./toolboxConfig";
import { buildConnectorCategory } from "./connectorCategory";

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
    const v = SERVICE_TO_DATASPACE[s.uses];
    if (v) versions.add(v);
  }
  return versions;
}

/** Build a toolbox category object from a single catalog category. */
function buildCatalogCategory(
  cat: BlockCatalogCategory,
  activeVersions: Set<string>,
): object {
  if (cat.name === "Connector") {
    return buildConnectorCategory(cat, activeVersions);
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

/** Build the Literal Values sub-category. */
function buildLiteralsCategory(blocks: readonly string[]): object {
  const types = ["value_string", "value_regex", "value_number", "value_boolean", "value_json", "value_list", "value_object", "key_value_pair"];
  return {
    kind: "category",
    name: "Literal Values",
    colour: blockColors.valueString,
    contents: types.filter((t) => blocks.includes(t)).map((t) => ({ kind: "block", type: t })),
  };
}

/** Build the Extractors sub-category. */
function buildExtractorsCategory(blocks: readonly string[]): object {
  const types = ["value_json_path", "value_api_path"];
  return {
    kind: "category",
    name: "Extractors",
    colour: blockColors.valueJsonPath,
    contents: types.filter((t) => blocks.includes(t)).map((t) => ({ kind: "block", type: t })),
  };
}

/** Build the Variables sub-category with domain-based children. */
function buildVariablesCategory(blocks: readonly string[], _categorizedVars: CategorizedVariables): object {
  const children: object[] = [];

  // Each variable sub-category shows exactly ONE base block.
  // The block's dynamic dropdown populates available variables at runtime.
  if (blocks.includes("var_env")) {
    children.push({ kind: "category", name: "Environment", colour: blockColors.varEnv, contents: [{ kind: "block", type: "var_env" }] });
  }

  const domainDefs: { name: string; colour: string; blockType: string }[] = [
    { name: "Service", colour: blockColors.varServices, blockType: "var_services" },
    { name: "Metadata", colour: blockColors.varMetadata, blockType: "var_metadata" },
    { name: "Execution", colour: blockColors.varExecution, blockType: "var_execution" },
  ];
  for (const d of domainDefs) {
    if (!blocks.includes(d.blockType)) continue;
    children.push({ kind: "category", name: d.name, colour: d.colour, contents: [{ kind: "block", type: d.blockType }] });
  }

  // Schema variables
  const schemaContents: object[] = [];
  if (blocks.includes("var_schema")) schemaContents.push({ kind: "block", type: "var_schema" });
  if (schemaContents.length > 0) {
    children.push({ kind: "category", name: "Schema", colour: blockColors.varSchema, contents: schemaContents });
  }

  // Testdata variables
  const testdataContents: object[] = [];
  if (blocks.includes("var_testdata")) testdataContents.push({ kind: "block", type: "var_testdata" });
  if (testdataContents.length > 0) {
    children.push({ kind: "category", name: "Testdata", colour: blockColors.varTestdata, contents: testdataContents });
  }

  return {
    kind: "category",
    name: "Variables",
    colour: blockColors.variableDef,
    contents: children,
  };
}

/** Build the Validation sub-categories (returned as array, not wrapped). */
function buildValidationSubcategories(blocks: readonly string[]): object[] {
  const colour = blockColors.assertion;

  const groups: { name: string; types: string[] }[] = [
    { name: "Extract", types: ["step_validate_path"] },
    { name: "Equality", types: ["assert_equals", "assert_not_equals", "assert_contains", "assert_not_contains", "assert_matches"] },
    { name: "Schema", types: ["assert_schema", "assert_validates_schema"] },
    { name: "Comparison", types: ["assert_compare", "assert_between"] },
    { name: "Presence", types: ["assert_not_null", "assert_not_empty"] },
    { name: "Structure", types: ["assert_field"] },
  ];

  return groups.map((g) => ({
    kind: "category",
    name: g.name,
    colour,
    contents: g.types
      .filter((t) => blocks.includes(t))
      .map((t) => ({ kind: "block", type: t })),
  })).filter((c) => (c.contents as object[]).length > 0);
}

/** Build a toolbox category from a phase block group definition. */
function buildBlockGroupCategory(group: PhaseBlockGroup, categorizedVars: CategorizedVariables): object | object[] {
  if (group.name === "Literal Values") {
    return buildLiteralsCategory(group.blocks);
  }
  if (group.name === "Extractors") {
    return buildExtractorsCategory(group.blocks);
  }
  if (group.name === "Variables") {
    return buildVariablesCategory(group.blocks, categorizedVars);
  }
  if (group.name === "Assertions") {
    return buildValidationSubcategories(group.blocks);
  }
  return {
    kind: "category",
    name: group.name,
    colour: group.colour,
    contents: group.blocks.map((type) => ({ kind: "block", type })),
  };
}

/** Build nested phase-group categories for the step-editor toolbox. */
function buildPhaseGroups(catalog: BlockCatalog, categorizedVars: CategorizedVariables): object[] {
  const categoryMap = buildCategoryMap(catalog);
  const phases: object[] = [];

  for (const phase of PHASE_DEFINITIONS) {
    const children = buildPhaseChildren(phase, categoryMap, categorizedVars);
    if (children.length > 0) {
      if (phases.length > 0) phases.push({ kind: "sep" });
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

function buildPhaseChildren(
  phase: (typeof PHASE_DEFINITIONS)[number],
  categoryMap: Map<string, object>,
  categorizedVars: CategorizedVariables,
): object[] {
  const children: object[] = [];
  for (const catName of phase.categories) {
    const cat = categoryMap.get(catName);
    if (cat) children.push(cat);
  }
  if (phase.blockGroups) {
    for (const group of phase.blockGroups) {
      const result = buildBlockGroupCategory(group, categorizedVars);
      if (Array.isArray(result)) {
        children.push(...result);
      } else {
        children.push(result);
      }
    }
  }
  return children;
}

const EMPTY_CATEGORIZED: CategorizedVariables = {
  environment: [],
  service: [],
  metadata: [],
  execution: [],
};

export function buildToolbox(catalog: BlockCatalog, _kind?: ScriptKind, variables?: string[] | CategorizedVariables): object {
  const categorizedVars: CategorizedVariables = isCategorizedVariables(variables)
    ? variables
    : legacyToCategorized(variables);
  const phaseGroups = buildPhaseGroups(catalog, categorizedVars);

  return {
    kind: "categoryToolbox",
    contents: phaseGroups,
  };
}

function isCategorizedVariables(v: unknown): v is CategorizedVariables {
  return typeof v === "object" && v !== null && "environment" in v && "service" in v;
}

function legacyToCategorized(variables?: string[]): CategorizedVariables {
  if (!variables || variables.length === 0) return EMPTY_CATEGORIZED;
  return { ...EMPTY_CATEGORIZED, environment: variables };
}
