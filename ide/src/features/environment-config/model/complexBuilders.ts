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

import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { SUBTYPE_META } from "@/features/complex-variable-builder";
import type { PreconditionSubType } from "@/features/complex-variable-builder";
import type { ComplexType } from "./types";

/**
 * Data-driven catalog of complex-variable builders. Each choice maps a
 * user-facing complex type to the existing precondition sub-type that backs
 * it, so the "+ Add complex variable" menu and the factory both read from one
 * source instead of branching on strings.
 */
export interface ComplexBuilderChoice {
  type: ComplexType;
  subType: PreconditionSubType;
  label: string;
  description: string;
  Icon: ComponentType<SvgIconProps>;
}

export const COMPLEX_BUILDER_CHOICES: readonly ComplexBuilderChoice[] = [
  {
    type: "connector_policy",
    subType: "access_policy",
    label: "Access Policy",
    description: "BPN-based access control ODRL policy.",
    Icon: SUBTYPE_META.access_policy.Icon,
  },
  {
    type: "connector_policy",
    subType: "usage_policy",
    label: "Usage Policy",
    description: "Usage purpose / framework agreement ODRL policy.",
    Icon: SUBTYPE_META.usage_policy.Icon,
  },
  {
    type: "connector_asset",
    subType: "asset_template",
    label: "Asset",
    description: "Asset definition registered in the provider connector.",
    Icon: SUBTYPE_META.asset_template.Icon,
  },
  {
    type: "digital_twin",
    subType: "aas_descriptor",
    label: "Digital Twin",
    description: "AAS shell descriptor registered in your DTR.",
    Icon: SUBTYPE_META.aas_descriptor.Icon,
  },
] as const;
