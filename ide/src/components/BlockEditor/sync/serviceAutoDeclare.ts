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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import * as Blockly from "blockly";
import type { BlockCatalog } from "../blocks";
import { SERVICE_TYPE_RESOLUTION } from "../toolbox/toolboxBuilder";
import { useServiceStore } from "../../../store/slices/useServiceStore";

/** Prefix used when registering catalog blocks. */
const STEP_PREFIX = "step_";

/**
 * Build a lookup from block type (e.g. "step_query_catalog") to its
 * catalog category `service_type` (e.g. "edc_connector").
 */
function buildServiceTypeIndex(
  catalog: BlockCatalog,
): Map<string, string> {
  const index = new Map<string, string>();
  for (const category of catalog) {
    if (!category.service_type) continue;
    for (const block of category.blocks) {
      index.set(`${STEP_PREFIX}${block.type}`, category.service_type);
    }
  }
  return index;
}

/**
 * Find the field key for the `service_ref` param on a catalog block.
 * Returns "PARAM_SERVICE" for a param named "service", etc.
 */
function findServiceFieldKey(
  catalog: BlockCatalog,
  blockType: string,
): string | undefined {
  const rawType = blockType.startsWith(STEP_PREFIX)
    ? blockType.slice(STEP_PREFIX.length)
    : blockType;

  for (const category of catalog) {
    for (const block of category.blocks) {
      if (block.type !== rawType) continue;
      const serviceParam = block.params.find((p) => p.type === "service_ref");
      return serviceParam
        ? `PARAM_${serviceParam.name.toUpperCase()}`
        : undefined;
    }
  }
  return undefined;
}

/**
 * Attach a workspace listener that auto-declares a service when a
 * service-category block is first dropped onto the canvas, and
 * auto-selects the service in the block's dropdown field.
 */
export function attachServiceAutoDeclareListener(
  ws: Blockly.WorkspaceSvg,
  catalog: BlockCatalog,
): void {
  const serviceTypeIndex = buildServiceTypeIndex(catalog);

  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type !== Blockly.Events.BLOCK_CREATE) return;

    const createEvent = event as Blockly.Events.BlockCreate;
    const blockId = createEvent.blockId;
    if (!blockId) return;

    const block = ws.getBlockById(blockId);
    if (!block) return;

    const categoryServiceType = serviceTypeIndex.get(block.type);
    if (!categoryServiceType) return;

    const storeTypes =
      SERVICE_TYPE_RESOLUTION[categoryServiceType] ?? [categoryServiceType];
    const service = useServiceStore.getState().ensureServiceExists(storeTypes);
    if (!service) return;

    const fieldKey = findServiceFieldKey(catalog, block.type);
    if (!fieldKey) return;

    const field = block.getField(fieldKey);
    if (field) {
      field.setValue(service.name);
    }
  });
}
