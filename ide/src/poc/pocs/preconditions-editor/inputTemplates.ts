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
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

/** A single field the operator fills in within a predefined form template. */
export interface InputFieldMeta {
  key: string;
  label: string;
  placeholder: string;
  fieldClass: string;
}

/** A predefined collection of operator-input fields shown as one template. */
export interface InputTemplateMeta {
  id: string;
  label: string;
  description: string;
  Icon: ComponentType<SvgIconProps>;
  fields: readonly InputFieldMeta[];
}

export const INPUT_TEMPLATES: readonly InputTemplateMeta[] = [
  {
    id: "connector_details",
    label: "Connector Details",
    description: "The SUT connector's address and identity used to reach it.",
    Icon: HubOutlinedIcon,
    fields: [
      {
        key: "counter_party_address",
        label: "Counter-party address",
        placeholder: "https://sut-connector.example.org/api/dsp",
        fieldClass: "url",
      },
      {
        key: "counter_party_id",
        label: "Counter-party id",
        placeholder: "BPNL000000000000",
        fieldClass: "bpn",
      },
    ],
  },
  {
    id: "asset_info",
    label: "Asset Info",
    description: "Identifiers describing the data asset under test.",
    Icon: Inventory2OutlinedIcon,
    fields: [
      {
        key: "global_asset_id",
        label: "Global asset id",
        placeholder: "urn:uuid:…",
        fieldClass: "uuid",
      },
      {
        key: "manufacturer_part_id",
        label: "Manufacturer part id",
        placeholder: "PART-0001",
        fieldClass: "text",
      },
    ],
  },
] as const;

export function findInputTemplate(id: string): InputTemplateMeta | undefined {
  return INPUT_TEMPLATES.find((template) => template.id === id);
}
