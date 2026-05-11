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

import { useState, useRef, useCallback } from "react";

interface DragState {
  name: string;
  pos: "top" | "bottom";
}

export function useTestDragReorder(
  testOrder: string[],
  reorderTest: (name: string, newIndex: number) => void,
) {
  const [dragOver, setDragOver] = useState<DragState | null>(null);
  const dragItem = useRef<string | null>(null);

  const handleDragStart = useCallback((name: string) => {
    dragItem.current = name;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, name: string) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      setDragOver({ name, pos: e.clientY < mid ? "top" : "bottom" });
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetName: string) => {
      e.preventDefault();
      setDragOver(null);
      const src = dragItem.current;
      if (!src || src === targetName) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const targetIdx = testOrder.indexOf(targetName);
      const insertIdx = e.clientY < mid ? targetIdx : targetIdx + 1;
      const srcIdx = testOrder.indexOf(src);
      const adjusted = srcIdx < insertIdx ? insertIdx - 1 : insertIdx;
      reorderTest(src, adjusted);
      dragItem.current = null;
    },
    [testOrder, reorderTest],
  );

  return { dragOver, handleDragStart, handleDragOver, handleDragLeave, handleDrop };
}
