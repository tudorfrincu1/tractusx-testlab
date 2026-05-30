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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store";

const DISPLAY_DURATION_MS = 2000;

/**
 * Returns whether the "Saved" indicator should be visible.
 * Shows for 2 seconds after each successful save.
 */
export function useSaveIndicator(): boolean {
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastSavedAt === null) return;
    setIsVisible(true);
    const timer = window.setTimeout(() => setIsVisible(false), DISPLAY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [lastSavedAt]);

  return isVisible;
}
