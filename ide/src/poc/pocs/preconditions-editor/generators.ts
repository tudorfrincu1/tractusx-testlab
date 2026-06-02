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
import FingerprintOutlinedIcon from "@mui/icons-material/FingerprintOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ApiOutlinedIcon from "@mui/icons-material/ApiOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";

/**
 * One entry in the generator catalog. `outputClass` is the typed class that a
 * resulting `@variable` carries (shown as a badge and in the variable preview).
 */
export interface GeneratorMeta {
  id: string;
  label: string;
  description: string;
  outputClass: string;
  defaultVar: string;
  Icon: ComponentType<SvgIconProps>;
}

export const GENERATORS: readonly GeneratorMeta[] = [
  {
    id: "uuid",
    label: "UUID",
    description: "A random RFC-4122 identifier for assets, policies or contracts.",
    outputClass: "uuid",
    defaultVar: "my_id",
    Icon: FingerprintOutlinedIcon,
  },
  {
    id: "bpn",
    label: "Business Partner Number",
    description: "A Catena-X BPN identifying a legal entity.",
    outputClass: "bpn",
    defaultVar: "my_bpn",
    Icon: BusinessOutlinedIcon,
  },
  {
    id: "did",
    label: "Decentralized Identifier",
    description: "A W3C DID for the participant's wallet.",
    outputClass: "did",
    defaultVar: "my_did",
    Icon: BadgeOutlinedIcon,
  },
  {
    id: "url",
    label: "URL",
    description: "A TestLab-hosted endpoint URL exposed to the SUT.",
    outputClass: "url",
    defaultVar: "my_url",
    Icon: LinkOutlinedIcon,
  },
  {
    id: "mock-endpoint",
    label: "Mock Endpoint",
    description: "A live mock endpoint the SUT can call during the test run.",
    outputClass: "endpoint",
    defaultVar: "my_endpoint",
    Icon: ApiOutlinedIcon,
  },
  {
    id: "dataspace_version",
    label: "Dataspace Version",
    description: "The negotiated DSP/dataspace protocol version (e.g. saturn).",
    outputClass: "version",
    defaultVar: "my_version",
    Icon: LayersOutlinedIcon,
  },
] as const;

export function findGenerator(id: string): GeneratorMeta | undefined {
  return GENERATORS.find((generator) => generator.id === id);
}
