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

import { createComplexVariableItem } from "@/features/complex-variable-builder";
import type { Variable } from "./types";

/** Seed variables covering every source mode and a complex builder. */
export const MOCK_VARIABLES: Variable[] = [
  {
    kind: "simple",
    id: "var_consumer_bpn",
    name: "consumer_bpn",
    type: "str",
    format: "bpn",
    description: "BPN of the consumer participant under test.",
    source: "input",
    placeholder: "BPNL000000000000",
  },
  {
    kind: "simple",
    id: "var_dataspace_version",
    name: "dataspace_version",
    type: "str",
    description: "Negotiated dataspace protocol version.",
    source: "value",
    value: "saturn",
  },
  {
    kind: "simple",
    id: "var_asset_id",
    name: "asset_id",
    type: "str",
    format: "uuid",
    description: "Identifier generated for the offered asset.",
    source: "generated",
    generator: "uuid_v4",
  },
  {
    kind: "complex",
    id: "cvar_access_policy",
    name: "access_policy",
    description: "BPN-based access control policy.",
    type: "connector_policy",
    container: "atomic",
    source: "value",
    value: createComplexVariableItem("access_policy"),
  },
];
