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

import { useGeneratorCatalog, generatorsFor } from "../../catalog";

export interface GeneratorPickerProps {
  /** The variable's output type/format used to filter compatible generators. */
  outputType: string;
  value: string;
  onChange: (generatorId: string) => void;
}

/**
 * A picker over the generator catalog, filtered to generators whose output type
 * matches the variable. Driven by {@link useGeneratorCatalog} so the static POC
 * catalog can later be swapped for the backend `GET /generators` endpoint.
 */
export function GeneratorPicker({ outputType, value, onChange }: Readonly<GeneratorPickerProps>) {
  const { generators, isLoading, error } = useGeneratorCatalog();
  const compatible = generatorsFor(generators, outputType);

  if (isLoading) {
    return <p className="vars-field__hint">Loading generators…</p>;
  }
  if (error) {
    return <p className="vars-field__hint vars-field__hint--error">{error}</p>;
  }
  if (compatible.length === 0) {
    return (
      <p className="vars-field__hint">
        No generator produces <code>{outputType}</code>. Choose a different type or format.
      </p>
    );
  }

  return (
    <div className="vars-genpicker">
      {compatible.map((generator) => {
        const active = generator.id === value;
        return (
          <button
            key={generator.id}
            type="button"
            className={active ? "vars-genpicker__opt vars-genpicker__opt--active" : "vars-genpicker__opt"}
            onClick={() => onChange(generator.id)}
          >
            <span className="vars-genpicker__label">{generator.label}</span>
            <code className="vars-genpicker__type">{generator.output_type}</code>
          </button>
        );
      })}
    </div>
  );
}
