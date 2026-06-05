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

import { GENERATOR_MANIFEST, type GeneratorManifestEntry } from "./generatorCatalog";

/** The result shape of {@link useGeneratorCatalog}, ready for an async swap. */
export interface GeneratorCatalogState {
  generators: readonly GeneratorManifestEntry[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Returns the generator catalog. For the POC this resolves synchronously from a
 * static manifest, but the result is shaped like an async resource (loading +
 * error) so a later change can replace the body with a `fetch('/generators')`
 * without touching any consumer.
 */
export function useGeneratorCatalog(): GeneratorCatalogState {
  return { generators: GENERATOR_MANIFEST.generators, isLoading: false, error: null };
}

/**
 * Filters the catalog to generators whose `output_type` matches the requested
 * variable type or format (ADR OQ-2: 1:1 compatibility). A missing `format`
 * falls back to the variable's primitive type.
 */
export function generatorsFor(
  generators: readonly GeneratorManifestEntry[],
  outputType: string,
): readonly GeneratorManifestEntry[] {
  return generators.filter((generator) => generator.output_type === outputType);
}
