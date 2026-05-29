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
import { DropdownItem } from "./TopBarButtons";
import "./TopBarExampleMenu.css";

import HttpIcon from "@mui/icons-material/Http";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorageIcon from "@mui/icons-material/Storage";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ScienceIcon from "@mui/icons-material/Science";

interface ExampleEntry {
  file: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  section: string;
}

const EXAMPLES: ExampleEntry[] = [
  { file: "connector-ping-v1.0/index.yaml", label: "Connector Ping", description: "Verify connector responds to catalog query", icon: <HttpIcon sx={{ fontSize: 16 }} />, section: "Base Tests" },
  { file: "dtr-ping-v1.0/index.yaml", label: "DTR Ping", description: "Negotiate dataplane access to DTR", icon: <StorageIcon sx={{ fontSize: 16 }} />, section: "Base Tests" },
  { file: "certificate-management-v2.0/index.yaml", label: "Certificate Management", description: "CCMAPI offer, validation, feedback", icon: <PlaylistAddIcon sx={{ fontSize: 16 }} />, section: "Use Cases" },
];

interface TopBarExampleMenuProps {
  onLoadExample: (file: string) => void;
}

export function TopBarExampleMenu({ onLoadExample }: TopBarExampleMenuProps) {
  // Group examples by section
  const sections = new Map<string, ExampleEntry[]>();
  for (const ex of EXAMPLES) {
    const list = sections.get(ex.section) ?? [];
    list.push(ex);
    sections.set(ex.section, list);
  }

  return (
    <div
      className="example-menu"
      style={{
        background: theme.colors.bgLighter,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {[...sections.entries()].map(([section, items], idx) => (
        <div key={section}>
          <div
            className="example-menu__section-header"
            style={{
              color: theme.colors.textMuted,
              borderTop: idx > 0 ? `1px solid ${theme.colors.border}` : undefined,
            }}
          >
            {section}
          </div>
          {items.map((ex) => (
            <DropdownItem
              key={ex.file}
              icon={ex.icon}
              label={ex.label}
              description={ex.description}
              onClick={() => onLoadExample(ex.file)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
