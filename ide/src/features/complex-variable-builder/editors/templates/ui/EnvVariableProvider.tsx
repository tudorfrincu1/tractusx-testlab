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

// Environment-variable catalog for the complex-variable builder. A React
// context exposes the LIVE set of variables the operator authored in the
// Environment Configuration view to deeply-nested policy fields, so a
// constraint can bind to any real `${{ env.NAME }}` reference without
// prop-drilling. The provider is controlled: the Environment Configuration view
// owns the variables and passes them down — this provider never seeds, mocks,
// or mutates its own copy, so the picker always reflects the real state.
import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { EnvVariable } from "./envVariables";

export interface EnvVariableContextValue {
  /** The live catalog of variables the operator authored. */
  variables: EnvVariable[];
  /** Look up a variable's configured value, or `undefined` when unknown. */
  valueOf: (name: string) => string | undefined;
}

const EnvVariableContext = createContext<EnvVariableContextValue | null>(null);

export interface EnvVariableProviderProps {
  /** The authored variables, owned by the Environment Configuration view. */
  variables: EnvVariable[];
  children: ReactNode;
}

export function EnvVariableProvider({ variables, children }: Readonly<EnvVariableProviderProps>) {
  const valueOf = useCallback(
    (name: string) => variables.find((variable) => variable.name === name)?.value,
    [variables],
  );

  const value = useMemo<EnvVariableContextValue>(
    () => ({ variables, valueOf }),
    [variables, valueOf],
  );

  return <EnvVariableContext.Provider value={value}>{children}</EnvVariableContext.Provider>;
}

/** Access the live env catalog. Must be called within {@link EnvVariableProvider}. */
export function useEnvVariables(): EnvVariableContextValue {
  const context = useContext(EnvVariableContext);
  if (!context) {
    throw new Error("useEnvVariables must be used within an EnvVariableProvider");
  }
  return context;
}
