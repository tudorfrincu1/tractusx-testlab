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

import { useEffect, useRef, useState } from "react";
import "./TopBarHamburgerMenu.css";

export interface HamburgerMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  dividerBefore?: boolean;
}

interface TopBarHamburgerMenuProps {
  items: HamburgerMenuItem[];
}

export function TopBarHamburgerMenu({ items }: TopBarHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownTop, setDropdownTop] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom + 8);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: HamburgerMenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="hamburger" ref={menuRef}>
      <button
        ref={buttonRef}
        className={`hamburger__button ${isOpen ? "hamburger__button--open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger__icon" aria-hidden="true">&#9776;</span>
      </button>

      {isOpen && (
        <div className="hamburger__dropdown" style={{ top: dropdownTop }}>
          {items.map((item, idx) => (
            <div key={idx}>
              {item.dividerBefore && <div className="hamburger__divider" />}
              <button
                className={`hamburger__item ${item.active ? "hamburger__item--active" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="hamburger__item-icon">{item.icon}</span>
                <span className="hamburger__item-label">{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
