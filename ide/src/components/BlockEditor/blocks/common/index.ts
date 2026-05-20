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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

export {
  loadBlockCatalog,
  findCatalogEntry,
  findOutputSchema,
  type BlockCatalog,
  type BlockCatalogCategory,
  type BlockCatalogEntry,
  type BlockCatalogParam,
  type BlockCatalogOutput,
} from "./catalog/catalogLoader";

export { collectWorkspaceVariables } from "./catalog/variableCollection";

export {
  type TypedVariable,
  collectTypedUpstreamVariables,
  collectTypedWorkspaceVariables,
} from "./catalog/typedVariableCollection";

export {
  dynamicDropdown,
  typedVariableDropdown,
  collectMockEndpointIds,
  collectServiceRefs,
  collectSchemaVariables,
  collectSchemaPaths,
  collectTestFilePaths,
  collectExportedVariables,
} from "./fields/dropdownProviders";

export {
  setupInfoCallback,
  createInfoIconField,
  type InfoShowRequest,
} from "./fields/infoIconField";

export {
  blockIcon,
  deriveTestLabel,
  ICON_TEST,
  ICON_TCK,
  ICON_VARIABLE,
  ICON_PRECONDITION,
  ICON_STEP,
  ICON_JSON,
  ICON_STORE,
  ICON_MOCK,
  ICON_WAIT,
  ICON_LOCK,
  ICON_KEY,
  ICON_SCHEMA,
  ICON_INFO,
} from "./fields/icons";

export { attachOutputVariableBlocks } from "./outputDispenser";
