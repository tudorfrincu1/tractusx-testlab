/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
import type { ServiceDefinition, ServiceType, AuthDefinition, AuthType } from "../models/schema";

// ── Service Config Schemas (SDK constructor params) ───────────────────────────

export interface ServiceConfigSchema {
  type: ServiceType;
  label: string;
  defaultName: string;
  fields: ServiceFieldDef[];
}

export interface AuthConfigSchema {
  type: AuthType;
  label: string;
  fields: ServiceFieldDef[];
}

export interface ServiceFieldDef {
  name: string;
  label: string;
  type: "string" | "dropdown" | "key_value";
  required: boolean;
  default?: string;
  placeholder?: string;
  options?: string[];
  secret?: boolean;
}

export const SERVICE_SCHEMAS: ServiceConfigSchema[] = [
  {
    type: "edc_connector_saturn",
    label: "EDC Connector (Saturn)",
    defaultName: "saturn-connector",
    fields: [
      { name: "base_url", label: "Base URL", type: "string", required: true, placeholder: "https://saturn-edc.example.com" },
      { name: "dma_path", label: "DMA Path", type: "string", required: true, default: "/management", placeholder: "/management" },
    ],
  },
  {
    type: "edc_connector_jupiter",
    label: "EDC Connector (Jupiter)",
    defaultName: "jupiter-connector",
    fields: [
      { name: "base_url", label: "Base URL", type: "string", required: true, placeholder: "https://jupiter-edc.example.com" },
      { name: "dma_path", label: "DMA Path", type: "string", required: true, default: "/management", placeholder: "/management" },
    ],
  },
  {
    type: "aas",
    label: "AAS Registry (DTR)",
    defaultName: "dtr-registry",
    fields: [
      { name: "base_url", label: "Base URL", type: "string", required: true, placeholder: "https://dtr.example.com" },
      { name: "base_lookup_url", label: "Lookup URL", type: "string", required: true, placeholder: "https://dtr.example.com/lookup" },
      { name: "api_path", label: "API Path", type: "string", required: true, default: "/api/v3.0", placeholder: "/api/v3.0" },
    ],
  },
  {
    type: "discovery_finder",
    label: "Discovery Finder",
    defaultName: "discovery-finder",
    fields: [
      { name: "url", label: "URL", type: "string", required: true, placeholder: "https://discovery-finder.example.com" },
    ],
  },
  {
    type: "edc_discovery",
    label: "EDC Discovery",
    defaultName: "edc-discovery",
    fields: [
      { name: "connector_discovery_key", label: "Discovery Key", type: "string", required: false, default: "bpn", placeholder: "bpn" },
    ],
  },
  {
    type: "bpn_discovery",
    label: "BPN Discovery",
    defaultName: "bpn-discovery",
    fields: [
      { name: "base_path", label: "Base Path", type: "string", required: false, default: "/api/v1.0/administration/connectors/bpnDiscovery", placeholder: "/api/v1.0/administration/connectors/bpnDiscovery" },
      { name: "identifier_type", label: "Identifier Type", type: "string", required: false, default: "manufacturerPartId", placeholder: "manufacturerPartId" },
    ],
  },
];

export const AUTH_SCHEMAS: AuthConfigSchema[] = [
  {
    type: "oauth2",
    label: "OAuth2",
    fields: [
      { name: "auth_url", label: "Auth URL", type: "string", required: true, placeholder: "https://auth.example.com" },
      { name: "realm", label: "Realm", type: "string", required: true, placeholder: "master" },
      { name: "client_id", label: "Client ID", type: "string", required: true, placeholder: "my-client" },
      { name: "client_secret", label: "Client Secret", type: "string", required: true, secret: true, placeholder: "••••••••" },
    ],
  },
  {
    type: "api_key",
    label: "API Key",
    fields: [
      { name: "api_key", label: "API Key", type: "string", required: true, secret: true, placeholder: "sk-..." },
      { name: "header_name", label: "Header Name", type: "string", required: false, default: "X-Api-Key", placeholder: "X-Api-Key" },
    ],
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

interface ServiceState {
  services: ServiceDefinition[];
  authentications: AuthDefinition[];
  addService: (service: ServiceDefinition) => void;
  updateService: (name: string, service: ServiceDefinition) => void;
  removeService: (name: string) => void;
  setServices: (services: ServiceDefinition[]) => void;
  getServicesByType: (type: ServiceType) => ServiceDefinition[];
  hasServiceType: (type: ServiceType) => boolean;
  ensureServiceExists: (storeTypes: string[]) => ServiceDefinition | undefined;
  addAuth: (auth: AuthDefinition) => void;
  updateAuth: (name: string, auth: AuthDefinition) => void;
  removeAuth: (name: string) => void;
  setAuthentications: (auths: AuthDefinition[]) => void;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  authentications: [],

  addService: (service) =>
    set((state) => ({ services: [...state.services, service] })),

  updateService: (name, service) =>
    set((state) => ({
      services: state.services.map((s) => (s.name === name ? service : s)),
    })),

  removeService: (name) =>
    set((state) => ({
      services: state.services.filter((s) => s.name !== name),
    })),

  setServices: (services) => set({ services }),

  getServicesByType: (type) => get().services.filter((s) => s.type === type),

  hasServiceType: (type) => get().services.some((s) => s.type === type),

  ensureServiceExists: (storeTypes) => {
    const { services } = get();
    const existing = services.find((s) => storeTypes.includes(s.type));
    if (existing) return existing;

    const schema = SERVICE_SCHEMAS.find((sc) => storeTypes.includes(sc.type));
    if (!schema) return undefined;

    const config: Record<string, unknown> = {};
    for (const field of schema.fields) {
      config[field.name] = field.default ?? "";
    }

    const newService: ServiceDefinition = {
      name: `${schema.defaultName} (auto)`,
      type: schema.type,
      config,
    };

    set((state) => ({ services: [...state.services, newService] }));
    return newService;
  },

  addAuth: (auth) =>
    set((state) => ({ authentications: [...state.authentications, auth] })),

  updateAuth: (name, auth) =>
    set((state) => ({
      authentications: state.authentications.map((a) => (a.name === name ? auth : a)),
    })),

  removeAuth: (name) =>
    set((state) => ({
      authentications: state.authentications.filter((a) => a.name !== name),
    })),

  setAuthentications: (auths) => set({ authentications: auths }),
}));
