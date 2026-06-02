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

import { useMemo } from "react";
import { subTypesForTarget, type RegisterTarget } from "./categories";
import { TARGET_META, TARGET_ORDER } from "./registerTargets";
import { SubCardGrid, type SubCardEntry } from "./SubCardGrid";
import type { PocPrecondition } from "./types";

export interface RegisterTargetGridProps {
  items: PocPrecondition[];
  onSelect: (target: RegisterTarget) => void;
}

/** L2 for Register: pick the target system whose artifacts you'll configure. */
export function RegisterTargetGrid({ items, onSelect }: Readonly<RegisterTargetGridProps>) {
  const entries = useMemo<SubCardEntry[]>(
    () =>
      TARGET_ORDER.map((target) => {
        const subTypes = subTypesForTarget(target);
        const count = items.filter((item) => subTypes.includes(item.subType)).length;
        return {
          id: target,
          label: TARGET_META[target].label,
          description: TARGET_META[target].description,
          Icon: TARGET_META[target].Icon,
          tone: "register",
          count: subTypes.length > 0 ? count : undefined,
          disabled: subTypes.length === 0,
        };
      }),
    [items],
  );

  return (
    <SubCardGrid
      heading="Which target system?"
      subheading="Choose where these objects must be registered."
      entries={entries}
      onSelect={(id) => onSelect(id as RegisterTarget)}
    />
  );
}
