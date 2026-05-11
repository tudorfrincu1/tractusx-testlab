/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type * as BlocklyType from "blockly";
import { ICON_INFO } from "./icons";

const ICON_SIZE = 16;

export interface InfoShowRequest {
  text: string;
  position: { x: number; y: number };
}

let _onShowInfo: ((req: InfoShowRequest) => void) | null = null;

/**
 * Registers a callback invoked when an info icon is clicked.
 * Returns a cleanup function that unregisters the callback.
 */
export function setupInfoCallback(
  onShowInfo: (req: InfoShowRequest) => void,
): () => void {
  _onShowInfo = onShowInfo;
  return () => {
    _onShowInfo = null;
  };
}

/**
 * Creates a FieldImage info icon (ℹ) that, when clicked, triggers the
 * registered info callback with the given description text.
 */
export function createInfoIconField(
  Blockly: typeof BlocklyType,
  description: string,
): InstanceType<typeof BlocklyType.FieldImage> {
  return new Blockly.FieldImage(
    ICON_INFO,
    ICON_SIZE,
    ICON_SIZE,
    "ℹ Info",
    (field: InstanceType<typeof BlocklyType.FieldImage>) => {
      if (!_onShowInfo) return;
      const svgRoot = field.getSvgRoot();
      const rect = svgRoot?.getBoundingClientRect();
      if (!rect) return;
      setTimeout(() => {
        _onShowInfo?.({
          text: description,
          position: { x: rect.right + 8, y: rect.top - 4 },
        });
      }, 0);
    },
  );
}
