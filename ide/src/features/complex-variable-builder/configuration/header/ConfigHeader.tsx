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

// Shared header for a Configuration item: the item name, its class badge and
// the operator-facing verb. An optional trailing slot carries per-mode
// controls (e.g. the policy Advanced toggle) without each host re-deriving the
// header markup.
import type { ReactNode } from "react";
import { CATEGORY_META, SUBTYPE_META } from "../../model";
import type { PocPrecondition } from "../../model";
import { headerVerbFor } from "./headerVerbs";

export interface ConfigHeaderProps {
  item: PocPrecondition;
  trailing?: ReactNode;
}

export function ConfigHeader({ item, trailing }: Readonly<ConfigHeaderProps>) {
  const category = CATEGORY_META[item.category];
  const subType = SUBTYPE_META[item.subType];
  return (
    <header className="precond-detail__header precond-detail__header--config">
      <span className="precond-detail__id-static">
        <subType.Icon fontSize="inherit" />
        {item.name}
      </span>
      <span className={`precond-detail__badge precond-detail__badge--${category.tone}`}>
        {subType.classLabel}
      </span>
      {trailing}
      <span className="precond-detail__verb">{headerVerbFor(item.subType)}</span>
    </header>
  );
}
