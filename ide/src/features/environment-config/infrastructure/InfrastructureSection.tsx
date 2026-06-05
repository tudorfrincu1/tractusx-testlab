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

import { DataspaceFields } from "./components/DataspaceFields";
import { SideEditor } from "./components/SideEditor";
import { InfrastructureYamlPreview } from "./InfrastructureYamlPreview";
import { useInfrastructureConfig } from "./hooks/useInfrastructureConfig";
import { SIDE_REGISTRY } from "./model";

/**
 * The Infrastructure tab (ADR-0019 §1). A scrollable form column — dataspace
 * context plus the engine and SUT capability requirements — beside a live YAML
 * preview column rendering the two top-level `dataspace:` / `infrastructure:`
 * blocks. v1 scope omits `bindings` (secrets) by design.
 */
export function InfrastructureSection() {
  const { model, updateDataspace, setRequired, toggleStandard, updateStandard } =
    useInfrastructureConfig();

  return (
    <div className="vars-poc__infra">
      <div className="infra-form">
        <DataspaceFields dataspace={model.dataspace} onChange={updateDataspace} />
        {SIDE_REGISTRY.map((descriptor) => (
          <SideEditor
            key={descriptor.key}
            descriptor={descriptor}
            side={model.infrastructure[descriptor.key]}
            onRequiredChange={(capability, required) => setRequired(descriptor.key, capability, required)}
            onStandardToggle={(capability, enabled) => toggleStandard(descriptor.key, capability, enabled)}
            onStandardChange={(capability, patch) => updateStandard(descriptor.key, capability, patch)}
          />
        ))}
      </div>
      <aside className="infra-preview">
        <InfrastructureYamlPreview model={model} />
      </aside>
    </div>
  );
}
