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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { create } from "zustand";
import type {
  InternalServiceConfig,
  ExternalServiceConfig,
  AdditionalServiceConfig,
  EnvironmentVariable,
  EnvironmentConfig,
  AuthConfig,
} from "../../models/environment";
import { createEmptyEnvironment } from "../../models/environment";

// ── State & Actions ──────────────────────────────────────────────────────────

interface EnvironmentState {
  internal: InternalServiceConfig[];
  external: ExternalServiceConfig[];
  additional: AdditionalServiceConfig[];
  variables: EnvironmentVariable[];
}

interface EnvironmentActions {
  // Internal services
  updateInternalService: (index: number, updates: Partial<Omit<InternalServiceConfig, "name">>) => void;
  updateInternalAuth: (index: number, auth: AuthConfig) => void;
  toggleInternalEnabled: (index: number) => void;

  // External services
  updateExternalService: (index: number, updates: Partial<Omit<ExternalServiceConfig, "name">>) => void;
  toggleExternalEnabled: (index: number) => void;

  // Additional services
  addAdditionalService: () => void;
  updateAdditionalService: (id: string, updates: Partial<AdditionalServiceConfig>) => void;
  deleteAdditionalService: (id: string) => void;

  // Variables
  addVariable: (variable: EnvironmentVariable) => void;
  updateVariable: (index: number, updates: Partial<EnvironmentVariable>) => void;
  deleteVariable: (index: number) => void;
  toggleVariableEnabled: (index: number) => void;
  toggleVariableSecret: (index: number) => void;

  // Bulk
  loadEnvironment: (config: EnvironmentConfig) => void;
  getEnvironmentConfig: () => EnvironmentConfig;
  reset: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

const initialState: EnvironmentState = createEmptyEnvironment();

export const useEnvironmentStore = create<EnvironmentState & EnvironmentActions>()((set, get) => ({
  ...initialState,

  // ── Internal services ────────────────────────────────────────────────────

  updateInternalService: (index, updates) =>
    set((state) => ({
      internal: state.internal.map((svc, i) =>
        i === index ? { ...svc, ...updates, name: svc.name } : svc,
      ),
    })),

  updateInternalAuth: (index, auth) =>
    set((state) => ({
      internal: state.internal.map((svc, i) =>
        i === index ? { ...svc, auth } : svc,
      ),
    })),

  toggleInternalEnabled: (index) =>
    set((state) => ({
      internal: state.internal.map((svc, i) =>
        i === index ? { ...svc, enabled: !svc.enabled } : svc,
      ),
    })),

  // ── External services ────────────────────────────────────────────────────

  updateExternalService: (index, updates) =>
    set((state) => ({
      external: state.external.map((svc, i) =>
        i === index ? { ...svc, ...updates, name: svc.name } : svc,
      ),
    })),

  toggleExternalEnabled: (index) =>
    set((state) => ({
      external: state.external.map((svc, i) =>
        i === index ? { ...svc, enabled: !svc.enabled } : svc,
      ),
    })),

  // ── Additional services ──────────────────────────────────────────────────

  addAdditionalService: () =>
    set((state) => ({
      additional: [
        ...state.additional,
        {
          id: crypto.randomUUID(),
          name: "",
          type: "",
          url: "",
          config: {},
          enabled: true,
        },
      ],
    })),

  updateAdditionalService: (id, updates) =>
    set((state) => ({
      additional: state.additional.map((svc) =>
        svc.id === id ? { ...svc, ...updates } : svc,
      ),
    })),

  deleteAdditionalService: (id) =>
    set((state) => ({
      additional: state.additional.filter((svc) => svc.id !== id),
    })),

  // ── Variables ────────────────────────────────────────────────────────────

  addVariable: (variable) =>
    set((state) => ({
      variables: [...state.variables, variable],
    })),

  updateVariable: (index, updates) =>
    set((state) => ({
      variables: state.variables.map((v, i) =>
        i === index ? { ...v, ...updates } : v,
      ),
    })),

  deleteVariable: (index) =>
    set((state) => ({
      variables: state.variables.filter((_, i) => i !== index),
    })),

  toggleVariableEnabled: (index) =>
    set((state) => ({
      variables: state.variables.map((v, i) =>
        i === index ? { ...v, enabled: !v.enabled } : v,
      ),
    })),

  toggleVariableSecret: (index) =>
    set((state) => ({
      variables: state.variables.map((v, i) =>
        i === index ? { ...v, secret: !v.secret } : v,
      ),
    })),

  // ── Bulk operations ──────────────────────────────────────────────────────

  loadEnvironment: (config) =>
    set({
      internal: config.internal,
      external: config.external,
      additional: config.additional,
      variables: config.variables,
    }),

  getEnvironmentConfig: () => {
    const { internal, external, additional, variables } = get();
    return { internal, external, additional, variables };
  },

  reset: () => set(createEmptyEnvironment()),
}));
