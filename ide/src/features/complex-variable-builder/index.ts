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

// Public surface of the complex-variable builder engine. The Environment
// Configuration view composes a complex variable's policy/provide document by
// driving the ConfigurationDetail authoring flow and serialising the result
// through the JSON / ODRL codecs.
export { ConfigurationDetail } from "./configuration";
export type { ConfigurationDetailProps } from "./configuration";
export { CopyButton } from "./configuration/header/CopyButton";
export { policyToJson, validateJsonText } from "./configuration/json/jsonCodec";
export { policyToOdrlJson } from "./configuration/odrl";
export { createPrecondition } from "./model";
export { SUBTYPE_META } from "./model";
export {
  EnvVariableProvider,
  useEnvVariables,
} from "./editors/templates/ui/EnvVariableProvider";
export type {
  EnvVariableContextValue,
  EnvVariableProviderProps,
} from "./editors/templates/ui/EnvVariableProvider";
export { envReference } from "./editors/templates/ui/envVariables";
export type { EnvVariable } from "./editors/templates/ui/envVariables";
export type {
  PocPrecondition,
  PolicyPayload,
  ProvidePayload,
  PreconditionSubType,
} from "./model";
