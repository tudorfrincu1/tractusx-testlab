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
import { INPUT_TEMPLATES } from "./inputTemplates";

export interface InputTemplateGridProps {
  onSelect: (templateId: string) => void;
}

/** L2 for Input: predefined form templates the operator can fill in. */
export function InputTemplateGrid({ onSelect }: Readonly<InputTemplateGridProps>) {
  const entries: SubCardEntry[] = INPUT_TEMPLATES.map((template) => ({
    id: template.id,
    label: template.label,
    description: template.description,
    Icon: template.Icon,
    tone: "input",
    count: template.fields.length,
  }));

  return (
    <SubCardGrid
      heading="Pick a form to fill in"
      subheading="Each template groups the details TestLab needs from you."
      entries={entries}
      onSelect={onSelect}
    />
  );
}
