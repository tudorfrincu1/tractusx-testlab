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

export interface BlockCatalogParam {
  name: string;
  type: string;
  item_type?: string;
  required: boolean;
  description: string;
  default?: unknown;
  options?: string[];
}

export interface BlockCatalogOutput {
  name: string;
  description: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface BlockCatalogEntry {
  type: string;
  label: string;
  description: string;
  template?: boolean;
  container?: boolean;
  custom_registration?: boolean;
  params: BlockCatalogParam[];
  outputs?: BlockCatalogOutput[];
  depends_on?: string[];
  dataspace_version?: string;
}

export interface BlockCatalogCategory {
  name: string;
  description?: string;
  service_type?: string;
  dataspace_version?: string;
  blocks: BlockCatalogEntry[];
}

export type BlockCatalog = BlockCatalogCategory[];

interface BlockIndexCategory {
  name: string;
  description?: string;
  service_type?: string;
  blocks: string[];
}

interface BlockIndex {
  version: string;
  categories: BlockIndexCategory[];
}

let catalogCache: BlockCatalog | null = null;

export async function loadBlockCatalog(): Promise<BlockCatalog> {
  if (catalogCache) return catalogCache;
  const base = import.meta.env.BASE_URL;

  try {
    const indexResp = await fetch(`${base}blocks/index.json`);
    if (indexResp.ok) {
      const index: BlockIndex = await indexResp.json();
      const categories: BlockCatalog = await Promise.all(
        index.categories.map(async (cat) => {
          const blocks: BlockCatalogEntry[] = await Promise.all(
            cat.blocks.map(async (path) => {
              const resp = await fetch(`${base}blocks/${path}`);
              return resp.json() as Promise<BlockCatalogEntry>;
            })
          );
          return {
            name: cat.name,
            description: cat.description,
            service_type: cat.service_type,
            blocks,
          };
        })
      );
      catalogCache = categories;
      return catalogCache;
    }
  } catch (err) {
    throw new Error(`Failed to load block catalog from ${base}blocks/index.json: ${err}`);
  }

  catalogCache = [];
  return catalogCache;
}

export function findCatalogEntry(stepType: string, catalog: BlockCatalog): BlockCatalogEntry | null {
  for (const cat of catalog) {
    for (const b of cat.blocks) {
      if (b.type === stepType) return b;
    }
  }
  return null;
}

/**
 * Search the catalog for an output whose name matches `variableName`
 * and return its schema definition (or `undefined`).
 */
export function findOutputSchema(
  variableName: string,
  catalog: BlockCatalog,
): Record<string, unknown> | undefined {
  for (const cat of catalog) {
    for (const block of cat.blocks) {
      for (const output of block.outputs ?? []) {
        if (output.name === variableName && output.schema) {
          return output.schema;
        }
      }
    }
  }
  return undefined;
}
