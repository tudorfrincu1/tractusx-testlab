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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { PreconditionDefinition } from "@/models/schema";

export interface PreconditionTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconClass: string;
  create: () => PreconditionDefinition;
}

export const POLICY_TEMPLATES: PreconditionTemplate[] = [
  {
    id: "generate",
    label: "Generate",
    description: "Auto-generate a value (UUID, BPN, URL, etc.)",
    icon: "G",
    iconClass: "access",
    create: () => ({
      id: "new_generate",
      uses: "precondition/generate",
      name: "New Generated Value",
      returns: { value: { type: "string", class: "uuid", generator: "uuid" } },
    }),
  },
  {
    id: "provide",
    label: "Provide",
    description: "Provide a static template object (policy, payload, etc.)",
    icon: "P",
    iconClass: "usage",
    create: () => ({
      id: "new_provide",
      uses: "precondition/provide",
      name: "New Static Template",
      with: { value: {} },
      returns: { template: { type: "object" } },
    }),
  },
  {
    id: "input",
    label: "Input",
    description: "Request a value from the user at runtime",
    icon: "I",
    iconClass: "policy",
    create: () => ({
      id: "new_input",
      uses: "precondition/input",
      name: "New User Input",
      returns: { value: { type: "string", label: "Value", placeholder: "Enter value..." } },
    }),
  },
  {
    id: "check",
    label: "Check",
    description: "Run a health check or connectivity validation",
    icon: "C",
    iconClass: "contract",
    create: () => ({
      id: "new_check",
      uses: "connector/health_check",
      name: "New Health Check",
      with: {},
    }),
  },
];
