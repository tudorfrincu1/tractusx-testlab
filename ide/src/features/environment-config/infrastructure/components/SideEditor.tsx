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

import { CapabilityRow } from "./CapabilityRow";
import {
  CAPABILITY_REGISTRY,
  type CapabilityKey,
  type Side,
  type SideDescriptor,
  type Standard,
} from "../model";

export interface SideEditorProps {
  descriptor: SideDescriptor;
  side: Side;
  onRequiredChange: (capability: CapabilityKey, required: boolean) => void;
  onStandardToggle: (capability: CapabilityKey, enabled: boolean) => void;
  onStandardChange: (capability: CapabilityKey, patch: Partial<Standard>) => void;
}

/** One side block (engine / sut) — its capability rows from the registry. */
export function SideEditor({
  descriptor,
  side,
  onRequiredChange,
  onStandardToggle,
  onStandardChange,
}: Readonly<SideEditorProps>) {
  return (
    <section className="infra-block">
      <header className="infra-block__head">
        <h2 className="infra-block__title">{descriptor.label}</h2>
        <p className="infra-block__desc">{descriptor.description}</p>
      </header>
      <div className="infra-block__caps">
        {CAPABILITY_REGISTRY[descriptor.key].map((capability) => (
          <CapabilityRow
            key={capability.key}
            descriptor={capability}
            requirement={side[capability.key] ?? { required: false }}
            onRequiredChange={(required) => onRequiredChange(capability.key, required)}
            onStandardToggle={(enabled) => onStandardToggle(capability.key, enabled)}
            onStandardChange={(patch) => onStandardChange(capability.key, patch)}
          />
        ))}
      </div>
    </section>
  );
}
