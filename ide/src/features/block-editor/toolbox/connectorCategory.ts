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

import type { BlockCatalogCategory } from "../blocks";
import { getCategoryColor } from "../config/blockColors";

/**
 * Build the Connector category with nested sub-categories driven by the catalog.
 * Subcategories are read from `index.json` — never hardcoded here.
 */
export function buildConnectorCategory(
  cat: BlockCatalogCategory,
  activeVersions: Set<string>,
): object {
  const colour = getCategoryColor(cat.name);

  if (!cat.subcategories || cat.subcategories.length === 0) {
    const contents = filterBlocksByVersion(cat.blocks, activeVersions);
    return { kind: "category", name: cat.name, colour, contents };
  }

  const subCategories = buildSubCategories(cat.subcategories, activeVersions, colour);

  return {
    kind: "category",
    name: cat.name,
    colour,
    contents: subCategories,
  };
}

function filterBlocksByVersion(
  blocks: BlockCatalogCategory["blocks"],
  activeVersions: Set<string>,
): object[] {
  return blocks
    .filter(
      (b) =>
        !b.custom_registration &&
        (!b.dataspace_version ||
          activeVersions.size === 0 ||
          activeVersions.has(b.dataspace_version)),
    )
    .map((b) => ({ kind: "block", type: `step_${b.type}` }));
}

function buildSubCategories(
  subcategories: NonNullable<BlockCatalogCategory["subcategories"]>,
  activeVersions: Set<string>,
  colour: string,
): object[] {
  const result: object[] = [];

  for (const sub of subcategories) {
    const contents = buildSubCategoryContents(sub, activeVersions);
    if (contents.length > 0) {
      result.push({ kind: "category", name: sub.name, colour, contents });
    }
  }

  return result;
}

function buildSubCategoryContents(
  sub: { blocks: BlockCatalogCategory["blocks"]; programmatic_blocks?: string[] },
  activeVersions: Set<string>,
): object[] {
  const contents: object[] = [];

  for (const b of sub.blocks) {
    if (b.custom_registration) continue;
    if (b.dataspace_version && activeVersions.size > 0 && !activeVersions.has(b.dataspace_version)) continue;
    contents.push({ kind: "block", type: `step_${b.type}` });
  }

  if (sub.programmatic_blocks) {
    for (const blockType of sub.programmatic_blocks) {
      contents.push({ kind: "block", type: blockType });
    }
  }

  return contents;
}
