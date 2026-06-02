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

import { SubCardGrid, type SubCardEntry } from "./SubCardGrid";
import { GENERATORS } from "./generators";

export interface GeneratorCatalogProps {
  onSelect: (generatorId: string) => void;
}

/** L2 for Generate: a catalog of value generators to pick from. */
export function GeneratorCatalog({ onSelect }: Readonly<GeneratorCatalogProps>) {
  const entries: SubCardEntry[] = GENERATORS.map((generator) => ({
    id: generator.id,
    label: generator.label,
    description: generator.description,
    Icon: generator.Icon,
    tone: "generate",
    badge: generator.outputClass,
  }));

  return (
    <SubCardGrid
      heading="Pick a value to generate"
      subheading="TestLab produces the value; you give it a variable name to reuse."
      entries={entries}
      onSelect={onSelect}
    />
  );
}
