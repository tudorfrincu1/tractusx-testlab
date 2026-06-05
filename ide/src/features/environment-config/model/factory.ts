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

import { createPrecondition } from "@/features/complex-variable-builder";
import { COMPLEX_BUILDER_CHOICES, type ComplexBuilderChoice } from "./complexBuilders";
import type { ComplexVariable, SimpleVariable } from "./types";

/** Auto-generates a short, unique, kind-prefixed id (no operator input). */
function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Builds a fresh simple variable defaulting to the KNOWN (value) source. */
export function createSimpleVariable(): SimpleVariable {
  return {
    kind: "simple",
    id: newId("var"),
    name: "new_variable",
    type: "str",
    description: "",
    source: "value",
    value: "",
  };
}

/**
 * Builds a fresh complex variable from a builder choice. The builder state is
 * the reused precondition item, so the existing left-formula / right-JSON
 * editor mounts unchanged.
 */
export function createComplexVariable(choice: ComplexBuilderChoice): ComplexVariable {
  const value = createPrecondition(choice.subType);
  return {
    kind: "complex",
    id: newId("cvar"),
    name: value.name.toLowerCase().replace(/\s+/g, "_"),
    description: value.description,
    type: choice.type,
    container: "atomic",
    source: "value",
    value,
  };
}

/** The default complex builder choice used when none is selected. */
export const DEFAULT_COMPLEX_CHOICE: ComplexBuilderChoice = COMPLEX_BUILDER_CHOICES[0];
