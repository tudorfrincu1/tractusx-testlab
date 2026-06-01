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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { memo, useCallback } from "react";

export interface Annotation {
  nodeId: string;
  stageName: string;
  message: string;
  step?: string;
  severity?: "critical" | "warning" | "info";
}

export interface AnnotationsBarProps {
  annotations: Annotation[];
  onSelectAnnotation: (nodeId: string) => void;
}

const SEVERITY_ICONS: Record<string, string> = {
  critical: "X",
  warning: "!",
  info: "i",
} as const;

export const AnnotationsBar = memo(function AnnotationsBar({
  annotations,
  onSelectAnnotation,
}: AnnotationsBarProps) {
  if (annotations.length === 0) {
    return (
      <div className="annotations-bar annotations-bar--empty">
        <span className="annotations-bar__count">No annotations</span>
      </div>
    );
  }

  return (
    <div className="annotations-bar">
      <div className="annotations-bar__header">
        <span className="annotations-bar__count">
          Annotations ({annotations.length})
        </span>
      </div>
      <ul className="annotations-bar__list">
        {annotations.map((ann) => (
          <AnnotationItem
            key={`${ann.nodeId}-${ann.message}`}
            annotation={ann}
            onSelect={onSelectAnnotation}
          />
        ))}
      </ul>
    </div>
  );
});

/* ── Annotation item ────────────────────────────────────────────────────── */

interface AnnotationItemProps {
  annotation: Annotation;
  onSelect: (nodeId: string) => void;
}

const AnnotationItem = memo(function AnnotationItem({
  annotation,
  onSelect,
}: AnnotationItemProps) {
  const handleClick = useCallback(
    () => onSelect(annotation.nodeId),
    [onSelect, annotation.nodeId],
  );
  const icon = SEVERITY_ICONS[annotation.severity ?? "warning"];

  return (
    <li className="annotations-bar__item">
      <button type="button" className="annotations-bar__item-btn" onClick={handleClick}>
      <span className={`annotations-bar__severity annotations-bar__severity--${annotation.severity ?? "warning"}`}>
        {icon}
      </span>
      <span className="annotations-bar__stage">{annotation.stageName}</span>
      {annotation.step && (
        <span className="annotations-bar__step">· {annotation.step}</span>
      )}
      <span className="annotations-bar__message">{annotation.message}</span>
      </button>
    </li>
  );
});
