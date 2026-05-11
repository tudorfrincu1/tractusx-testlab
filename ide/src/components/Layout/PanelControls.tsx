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
 * https://www.apache.org/licenses/LICENSE-2.0
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

import type { ReactNode } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LockIcon from "@mui/icons-material/Lock";

export interface PanelHeaderProps {
  title: string;
  icon: ReactNode;
  afterTitle?: ReactNode;
  extra?: ReactNode;
}

export function PanelHeader({ title, icon, afterTitle, extra }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <span className="panel-header__icon">{icon}</span>
      {title}
      {afterTitle}
      <div className="panel-header__spacer" />
      {extra}
    </div>
  );
}

export interface IconBtnProps {
  title: string;
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
}

export function IconBtn({ title, onClick, isActive, children }: IconBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`icon-btn${isActive ? " icon-btn--active" : ""}`}
    >
      {children}
    </button>
  );
}

export const PANEL_TABS: { id: "yaml" | "graph"; label: string; icon: ReactNode }[] = [
  { id: "yaml", label: "YAML Editor", icon: <EditNoteIcon sx={{ fontSize: 14 }} /> },
  { id: "graph", label: "Graph", icon: <AccountTreeIcon sx={{ fontSize: 14 }} /> },
];

export interface PanelTabBarProps {
  activeTab: "yaml" | "graph";
  onTabChange: (tab: "yaml" | "graph" | "none") => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
}

export function PanelTabBar({ activeTab, onTabChange, isReadOnly, onToggleReadOnly }: PanelTabBarProps) {
  return (
    <div className="panel-tab-bar">
      {PANEL_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`panel-tab${isActive ? " panel-tab--active" : ""}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
      {activeTab === "yaml" && (
        <>
          <div className="panel-tab-bar__spacer" />
          <div
            className="readonly-toggle"
            title={isReadOnly ? "Click to enable editing" : "Click to lock"}
            onClick={onToggleReadOnly}
          >
            <span className={`readonly-toggle__label${!isReadOnly ? " readonly-toggle__label--on" : ""}`}>
              Locked
            </span>
            <div className={`readonly-toggle__track${!isReadOnly ? " readonly-toggle__track--on" : ""}`}>
              <div className={`readonly-toggle__knob${!isReadOnly ? " readonly-toggle__knob--on" : ""}`}>
                {isReadOnly && <LockIcon sx={{ fontSize: 8, color: "var(--tx-border)" }} />}
              </div>
            </div>
            <span className={`readonly-toggle__label${!isReadOnly ? " readonly-toggle__label--on" : ""}`}>
              Edit
            </span>
          </div>
        </>
      )}
    </div>
  );
}
