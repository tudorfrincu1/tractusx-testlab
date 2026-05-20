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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: GPT-5.3-Codex).
// It was reviewed and tested by a human committer.

const RUNTIME_TO_CATALOG_STEP_TYPE: Record<string, string> = {
  http_request: "http_call",
  dataplane_call: "http_call_dataplane",
  delete_contract_definition: "delete_contract_def",
};

const CATALOG_TO_RUNTIME_STEP_TYPE: Record<string, string> = {
  http_call: "http_request",
  http_call_dataplane: "dataplane_call",
  delete_contract_def: "delete_contract_definition",
};

export function toCatalogStepType(runtimeType: string): string {
  return RUNTIME_TO_CATALOG_STEP_TYPE[runtimeType] ?? runtimeType;
}

export function toRuntimeStepType(catalogType: string): string {
  return CATALOG_TO_RUNTIME_STEP_TYPE[catalogType] ?? catalogType;
}