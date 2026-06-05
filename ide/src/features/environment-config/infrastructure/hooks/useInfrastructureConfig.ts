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

import { useCallback, useMemo } from "react";
import { useProjectStore } from "@/store";
import {
  createInfrastructureModel,
  type CapabilityKey,
  type DataspaceContext,
  type InfrastructureModel,
  type SideKey,
  type Standard,
} from "../model";

/** The state + typed updaters that drive the infrastructure form and preview. */
export interface InfrastructureConfigController {
  model: InfrastructureModel;
  updateDataspace: (patch: Partial<DataspaceContext>) => void;
  setRequired: (side: SideKey, capability: CapabilityKey, required: boolean) => void;
  toggleStandard: (side: SideKey, capability: CapabilityKey, enabled: boolean) => void;
  updateStandard: (side: SideKey, capability: CapabilityKey, patch: Partial<Standard>) => void;
}

/**
 * Store-backed state for the Infrastructure tab. The infra config lives on the
 * project model as `tck.infrastructure`, so every edit goes through
 * `updateTckField` — the same convention as the other TCK fields — which marks
 * the project dirty and persists it. The YAML preview recomputes whenever the
 * stored model changes. Projects that predate the field fall back to the
 * factory default until the user makes their first edit.
 */
export function useInfrastructureConfig(): InfrastructureConfigController {
  const stored = useProjectStore((state) => state.tck.infrastructure);
  const updateTckField = useProjectStore((state) => state.updateTckField);

  const model = useMemo(() => stored ?? createInfrastructureModel(), [stored]);

  const commit = useCallback(
    (next: InfrastructureModel) => updateTckField("infrastructure", next),
    [updateTckField],
  );

  const readModel = useCallback(
    () => useProjectStore.getState().tck.infrastructure ?? createInfrastructureModel(),
    [],
  );

  const updateDataspace = useCallback(
    (patch: Partial<DataspaceContext>) => {
      const prev = readModel();
      commit({ ...prev, dataspace: { ...prev.dataspace, ...patch } });
    },
    [commit, readModel],
  );

  const setRequired = useCallback(
    (side: SideKey, capability: CapabilityKey, required: boolean) => {
      commit(mapRequirement(readModel(), side, capability, (current) => ({ ...current, required })));
    },
    [commit, readModel],
  );

  const toggleStandard = useCallback(
    (side: SideKey, capability: CapabilityKey, enabled: boolean) => {
      commit(
        mapRequirement(readModel(), side, capability, (current) =>
          enabled ? { ...current, standard: current.standard ?? { id: "" } } : stripStandard(current),
        ),
      );
    },
    [commit, readModel],
  );

  const updateStandard = useCallback(
    (side: SideKey, capability: CapabilityKey, patch: Partial<Standard>) => {
      commit(
        mapRequirement(readModel(), side, capability, (current) => ({
          ...current,
          standard: { ...(current.standard ?? { id: "" }), ...patch },
        })),
      );
    },
    [commit, readModel],
  );

  return { model, updateDataspace, setRequired, toggleStandard, updateStandard };
}

/** Drops the `standard` key without leaving `standard: undefined` behind. */
function stripStandard(current: { required: boolean; standard?: Standard }) {
  const { standard: _omitted, ...rest } = current;
  return rest;
}

/** Applies a pure transform to one capability requirement, preserving the rest. */
function mapRequirement(
  model: InfrastructureModel,
  side: SideKey,
  capability: CapabilityKey,
  transform: (current: { required: boolean; standard?: Standard }) => {
    required: boolean;
    standard?: Standard;
  },
): InfrastructureModel {
  const sideValue = model.infrastructure[side];
  const current = sideValue[capability] ?? { required: false };
  return {
    ...model,
    infrastructure: {
      ...model.infrastructure,
      [side]: { ...sideValue, [capability]: transform(current) },
    },
  };
}
