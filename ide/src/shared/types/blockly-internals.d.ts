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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

/**
 * Type declarations for Blockly internal APIs that are not exposed in the
 * public typings but are required for dropdown value manipulation.
 */

import type { Field } from "blockly";

/**
 * Extended Blockly Field with internal APIs used for dropdown manipulation.
 * These properties exist at runtime but are not in the public type definitions.
 */
export interface BlocklyFieldDropdownInternal extends Field {
  doClassValidation_: ((value: string) => string | null) | null;
  getOptions: (useCache: boolean) => Array<[string, string]>;
  selectedOption: [string, string];
  forceRerender?: () => void;
  menuGenerator_?: () => Array<[string, string]>;
}

/**
 * Extended Blockly Trashcan with the `contents` array used for trash tracking.
 */
export interface BlocklyTrashcanInternal {
  contents: unknown[];
}

/**
 * Augment Blockly's `Workspace` with the runtime `disposed` flag. The flag is
 * set by `Workspace.dispose()` at runtime but is not part of the public typings.
 * Dropdown option generators read it to bail out on a disposed workspace.
 */
declare module "blockly" {
  interface Workspace {
    readonly disposed: boolean;
  }
}
