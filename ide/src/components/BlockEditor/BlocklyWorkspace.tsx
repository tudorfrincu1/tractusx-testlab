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

import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocklyWorkspace } from "./hooks/useBlocklyWorkspace";
import { setupWarningTooltip, type WarningShowRequest } from "./fields/bubblePatch";
import { setupInfoCallback, type InfoShowRequest } from "./blocks/infoIconField";
import { BlockTooltip } from "./ui/WarningTooltip";
import "./BlocklyWorkspace.css";

export function BlocklyWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { workspace } = useBlocklyWorkspace(containerRef);
  const [warning, setWarning] = useState<WarningShowRequest | null>(null);
  const [info, setInfo] = useState<InfoShowRequest | null>(null);

  const handleWarningClose = useCallback(() => setWarning(null), []);
  const handleInfoClose = useCallback(() => setInfo(null), []);

  const handleShowWarning = useCallback((req: WarningShowRequest) => {
    setInfo(null);
    setWarning(req);
  }, []);

  const handleShowInfo = useCallback((req: InfoShowRequest) => {
    setWarning(null);
    setInfo(req);
  }, []);

  useEffect(() => {
    if (!workspace) return;
    return setupWarningTooltip(workspace, handleShowWarning);
  }, [workspace, handleShowWarning]);

  useEffect(() => {
    return setupInfoCallback(handleShowInfo);
  }, [handleShowInfo]);

  return (
    <>
      <div ref={containerRef} className="blockly-workspace-container" />
      {warning && (
        <BlockTooltip
          text={warning.text}
          position={warning.position}
          variant="warning"
          onClose={handleWarningClose}
        />
      )}
      {info && (
        <BlockTooltip
          text={info.text}
          position={info.position}
          variant="info"
          onClose={handleInfoClose}
        />
      )}
    </>
  );
}
