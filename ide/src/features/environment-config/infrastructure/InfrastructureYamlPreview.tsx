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

import { useMemo } from "react";
import { CopyButton } from "@/features/complex-variable-builder";
import { buildInfrastructureYaml } from "../yaml";
import type { InfrastructureModel } from "./model";

export interface InfrastructureYamlPreviewProps {
  model: InfrastructureModel;
}

/**
 * The live YAML preview column for the Infrastructure tab. Reuses the variable
 * preview's `.vars-yaml` shell and the shared {@link CopyButton}; it is always
 * expanded because it is a dedicated column, not an inline disclosure.
 */
export function InfrastructureYamlPreview({ model }: Readonly<InfrastructureYamlPreviewProps>) {
  const yaml = useMemo(() => buildInfrastructureYaml(model), [model]);

  return (
    <section className="vars-yaml infra-yaml">
      <div className="vars-yaml__bar infra-yaml__bar">
        <span className="vars-yaml__title">Infrastructure YAML</span>
        <CopyButton text={yaml} />
      </div>
      <pre className="vars-yaml__code infra-yaml__code">{yaml}</pre>
    </section>
  );
}
