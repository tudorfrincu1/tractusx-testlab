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

import { jsonValueToYamlLines, type JsonValue } from "./jsonToYaml";
import {
  CAPABILITY_REGISTRY,
  type CapabilityRequirement,
  type InfrastructureModel,
  type Side,
  type SideKey,
} from "../infrastructure/model";

/**
 * The ADR-0019 §1 infrastructure tree: the two top-level blocks `dataspace:` and
 * `infrastructure:` as one {@link JsonValue}. This is the single source of truth
 * consumed by both the Infrastructure tab preview and the TCK export serializer —
 * there is no second assembly.
 */
export interface InfrastructureObject {
  dataspace: JsonValue;
  infrastructure: JsonValue;
}

/**
 * Builds the ADR-0019 §1 `{ dataspace, infrastructure }` tree as JSON values.
 * `dataspace` uses the mapping form `{ ecosystem, version }` (the backend rejects
 * the legacy scalar form for this block).
 */
export function buildInfrastructureObject(model: InfrastructureModel): InfrastructureObject {
  return {
    dataspace: { ecosystem: model.dataspace.ecosystem, version: model.dataspace.version },
    infrastructure: {
      engine: sideToJson("engine", model.infrastructure.engine, model.dataspace.version),
      sut: sideToJson("sut", model.infrastructure.sut, model.dataspace.version),
    },
  };
}

/**
 * Serializes an {@link InfrastructureModel} into the ADR-0019 §1 YAML: two
 * top-level blocks, `dataspace:` and `infrastructure:`. The shape comes from
 * {@link buildInfrastructureObject} and is rendered through the shared
 * {@link jsonValueToYamlLines} serializer — there is no second YAML writer.
 */
export function buildInfrastructureYaml(model: InfrastructureModel): string {
  const { dataspace, infrastructure } = buildInfrastructureObject(model);
  return jsonValueToYamlLines({ dataspace, infrastructure }, 0).join("\n");
}

/** Renders one side, iterating the registry so capability key order is stable. */
function sideToJson(side: SideKey, value: Side, dataspaceVersion: string): JsonValue {
  const result: Record<string, JsonValue> = {};
  for (const capability of CAPABILITY_REGISTRY[side]) {
    const requirement = value[capability.key];
    if (requirement) {
      result[capability.key] = requirementToJson(requirement, dataspaceVersion);
    }
  }
  return result;
}

/**
 * Renders one capability requirement. The optional `standard` constraint is
 * only written when present; inside it `version` is omitted when it equals the
 * dataspace version (ADR-0019 inheritance rule) or is blank.
 */
function requirementToJson(requirement: CapabilityRequirement, dataspaceVersion: string): JsonValue {
  const result: Record<string, JsonValue> = { required: requirement.required };
  const standard = requirement.standard;
  if (standard) {
    const block: Record<string, JsonValue> = { id: standard.id };
    if (standard.version && standard.version !== dataspaceVersion) {
      block.version = standard.version;
    }
    result.standard = block;
  }
  return result;
}
