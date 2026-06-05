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

import FingerprintOutlinedIcon from "@mui/icons-material/FingerprintOutlined";
import { extractSpecificAssetIds } from "../json/jsonCodec";

export interface MustExistCalloutProps {
  /** The twin descriptor template JSON to parse specificAssetIds from. */
  template: string;
}

/**
 * Lists the specificAssetIds a digital twin must carry. Parsed live from the
 * template; renders nothing when the JSON has no parseable identifiers.
 */
export function MustExistCallout({ template }: Readonly<MustExistCalloutProps>) {
  const assetIds = extractSpecificAssetIds(template);
  if (assetIds.length === 0) {
    return null;
  }

  return (
    <aside className="precond-mustexist">
      <header className="precond-mustexist__head">
        <FingerprintOutlinedIcon fontSize="inherit" />
        Must exist with these IDs
      </header>
      <dl className="precond-mustexist__list">
        {assetIds.map((pair) => (
          <div className="precond-mustexist__row" key={`${pair.name}:${pair.value}`}>
            <dt className="precond-mustexist__name">{pair.name}</dt>
            <dd className="precond-mustexist__value">{pair.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
