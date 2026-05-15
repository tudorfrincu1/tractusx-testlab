/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
import type { BlockCatalog, BlockCatalogCategory } from "../blocks/catalogLoader";
import { useServiceStore } from "../../../store/useServiceStore";
import { blockColors, getCategoryColor } from "../blockColors";
import { PHASE_DEFINITIONS } from "./phaseConfig";

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

/** Build a toolbox category object from a single catalog category. */
function buildCatalogCategory(
  cat: BlockCatalogCategory,
  activeVersions: Set<string>,
): object {
  return {
    kind: "category",
    name: cat.name,
    colour: getCategoryColor(cat.name),
    contents: cat.blocks
      .filter(
        (b) =>
          !b.dataspace_version ||
          activeVersions.size === 0 ||
          activeVersions.has(b.dataspace_version),
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

/** Build nested phase-group categories for the step-editor toolbox. */
function buildPhaseGroups(catalog: BlockCatalog): object[] {
  const categoryMap = buildCategoryMap(catalog);
  const phases: object[] = [];

  for (const phase of PHASE_DEFINITIONS) {
    const children: object[] = [];
    for (const catName of phase.categories) {
      const cat = categoryMap.get(catName);
      if (cat) {
        children.push(cat);
      }
    }
    if (phase.blockGroups) {
      for (const group of phase.blockGroups) {
        children.push({
          kind: "category",
          name: group.name,
          colour: group.colour,
          contents: group.blocks.map((type) => ({ kind: "block", type })),
        });
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

export function buildToolbox(catalog: BlockCatalog, kind?: ScriptKind, variables?: string[]): object {
  if (kind === "tck") {
    const serviceCategories = [...buildCategoryMap(catalog).values()];
    return {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: "Tests",
          colour: blockColors.testRef,
          contents: [{ kind: "block", type: "test_ref" }],
        },
        {
          kind: "category",
          name: "Variables",
          colour: blockColors.variableDef,
          contents: [{ kind: "block", type: "variable_def" }],
        },
        {
          kind: "category",
          name: "Preconditions",
          colour: blockColors.precondition,
          contents: [{ kind: "block", type: "precondition" }],
        },
        {
          kind: "category",
          name: "Authentication",
          colour: blockColors.authentication,
          contents: [
            { kind: "block", type: "auth_oauth2" },
            { kind: "block", type: "auth_api_key" },
          ],
        },
        ...serviceCategories,
      ],
    };
  }

  const vars = variables || [];

  const variableContents: object[] = [];
  if (vars.length > 0) {
    variableContents.push({ kind: "label", text: "Defined Variables" });
    for (const v of vars) {
      variableContents.push({
        kind: "block",
        type: "variable_get",
        fields: { VAR_NAME: v },
      });
    }
    variableContents.push({ kind: "sep", gap: "8" });
  }
  variableContents.push({ kind: "block", type: "variable_get" });

  const phaseGroups = buildPhaseGroups(catalog);

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
      {
        kind: "category",
        name: "Variables",
        colour: blockColors.variableDef,
        contents: [
          { kind: "block", type: "schema_import" },
          { kind: "sep", gap: "16" },
          { kind: "block", type: "variable_def" },
          { kind: "sep", gap: "16" },
          ...variableContents,
        ],
      },
      {
        kind: "category",
        name: "Values",
        colour: blockColors.valueString,
        contents: [
          { kind: "block", type: "value_string" },
          { kind: "block", type: "value_number" },
          { kind: "block", type: "value_boolean" },
          { kind: "block", type: "value_json_path" },
        ],
      },
      {
        kind: "category",
        name: "Assertions",
        colour: blockColors.assertion,
        contents: [
          { kind: "block", type: "assert_equals" },
          { kind: "block", type: "assert_not_equals" },
          { kind: "block", type: "assert_contains" },
          { kind: "block", type: "assert_not_contains" },
          { kind: "block", type: "assert_matches" },
          { kind: "block", type: "assert_schema" },
          { kind: "block", type: "assert_validates_schema" },
          { kind: "block", type: "assert_compare" },
          { kind: "block", type: "assert_between" },
          { kind: "block", type: "assert_not_null" },
          { kind: "block", type: "assert_not_empty" },
        ],
      },
      {
        kind: "category",
        name: "JSON",
        colour: blockColors.json,
        contents: [{ kind: "block", type: "key_value_pair" }],
      },
      {
        kind: "category",
        name: "EDC Structures",
        colour: "#374151",
        contents: [
          { kind: "block", type: "asset_criterion" },
          { kind: "block", type: "odrl_permission" },
          { kind: "block", type: "odrl_prohibition" },
          { kind: "block", type: "odrl_obligation" },
          { kind: "block", type: "odrl_logical_constraint" },
          { kind: "block", type: "odrl_constraint" },
        ],
      },
    ],
  };
}
