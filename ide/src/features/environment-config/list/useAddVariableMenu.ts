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

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * Drives the Add-variable popup menu: open/close state, outside-pointer
 * dismissal, and roving-focus keyboard navigation across `itemCount` menu
 * items. Keeps the menu component declarative — it only renders rows and wires
 * the handlers this hook returns.
 */
export function useAddVariableMenu(itemCount: number) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Move focus into the menu when it opens so keyboard users land on an option.
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  // Dismiss when the next pointer-down lands outside both the menu and trigger.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const focusItem = useCallback(
    (index: number) => {
      if (itemCount === 0) return;
      const wrapped = (index + itemCount) % itemCount;
      itemRefs.current[wrapped]?.focus();
    },
    [itemCount],
  );

  const registerItem = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );

  const makeItemKeyDownHandler = useCallback(
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const moves: Record<string, () => void> = {
        ArrowDown: () => focusItem(index + 1),
        ArrowUp: () => focusItem(index - 1),
        Home: () => focusItem(0),
        End: () => focusItem(itemCount - 1),
        Escape: () => close(true),
      };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        move();
      }
    },
    [focusItem, itemCount, close],
  );

  const handleTriggerKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  return {
    open,
    triggerRef,
    menuRef,
    toggle,
    close,
    registerItem,
    makeItemKeyDownHandler,
    handleTriggerKeyDown,
  };
}
