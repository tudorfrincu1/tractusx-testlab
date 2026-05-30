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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { theme } from "@/shared/theme/tractusxTheme";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import "./ExplorerHeader.css";

export interface ExplorerHeaderProps {
  onCollapse?: () => void;
}

export function ExplorerHeader({ onCollapse }: Readonly<ExplorerHeaderProps>) {
  return (
    <div
      className="explorer-header"
      style={{
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgLight,
      }}
    >
      <div className="explorer-header__left">
        <FolderSpecialIcon sx={{ fontSize: 16, color: theme.colors.primary }} />
        <span
          className="explorer-header__title"
          style={{ color: theme.colors.textMuted }}
        >
          Explorer
        </span>
      </div>
      {onCollapse && (
        <button
          title="Collapse Explorer"
          onClick={onCollapse}
          className="explorer-header__collapse-btn"
          style={{ color: theme.colors.textMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.text; e.currentTarget.style.background = theme.colors.bgLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; e.currentTarget.style.background = "transparent"; }}
        >
          <ChevronLeftIcon sx={{ fontSize: 14 }} />
          <VerticalSplitIcon sx={{ fontSize: 16, transform: "scaleX(-1)" }} />
        </button>
      )}
    </div>
  );
}
