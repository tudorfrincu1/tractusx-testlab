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

import { SimpleVariableEditor } from "./simple";
import { ComplexVariableEditor } from "./complex";
import { VariableYamlPreview } from "./VariableYamlPreview";
import type { Variable } from "../model";

export interface VariableDetailProps {
  variable: Variable | null;
  onChange: (next: Variable) => void;
}

/** Routes the selected variable to its editor by `kind`. */
export function VariableDetail({ variable, onChange }: Readonly<VariableDetailProps>) {
  if (!variable) {
    return (
      <section className="vars-detail vars-detail--empty">
        <p>Select a variable, or add one to begin.</p>
      </section>
    );
  }

  if (variable.kind === "simple") {
    return (
      <>
        <SimpleVariableEditor variable={variable} onChange={onChange} />
        <VariableYamlPreview variable={variable} />
      </>
    );
  }

  return (
    <>
      <ComplexVariableEditor variable={variable} onChange={onChange} />
      <VariableYamlPreview variable={variable} />
    </>
  );
}
