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

import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { POC_REGISTRY, findPoc } from "./registry";
import { useHashRoute, navigateToPoc } from "./useHashRoute";

/**
 * Dev-only gallery that hosts every registered React POC. A POC is selected via
 * the `#/<id>` hash route; when none is selected an index of available POCs is
 * shown. This component is reachable only from `poc.html`, never from the app.
 */
export function PocGallery() {
  const slug = useHashRoute();
  const active = findPoc(slug);

  return (
    <div className="poc-shell">
      <header className="poc-shell__bar">
        <span className="poc-shell__brand">
          <ScienceOutlinedIcon fontSize="small" />
          TestLab React POCs
        </span>
        <span className="poc-shell__badge">dev only — not shipped</span>
      </header>

      <nav className="poc-shell__tabs">
        {POC_REGISTRY.map((poc) => (
          <button
            key={poc.id}
            type="button"
            className={
              poc.id === active?.id
                ? "poc-shell__tab poc-shell__tab--active"
                : "poc-shell__tab"
            }
            onClick={() => navigateToPoc(poc.id)}
          >
            {poc.title}
          </button>
        ))}
      </nav>

      <main className="poc-shell__stage">
        {active ? <active.Component /> : <PocIndex />}
      </main>
    </div>
  );
}

function PocIndex() {
  return (
    <div className="poc-index">
      <h1 className="poc-index__heading">Choose a proof-of-concept</h1>
      <div className="poc-index__grid">
        {POC_REGISTRY.map((poc) => (
          <button
            key={poc.id}
            type="button"
            className="poc-index__card"
            onClick={() => navigateToPoc(poc.id)}
          >
            <span className="poc-index__card-title">{poc.title}</span>
            <span className="poc-index__card-desc">{poc.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
