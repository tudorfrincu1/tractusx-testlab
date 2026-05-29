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

import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import { VAR_REF_PATTERN } from "./jsonVarRefs";

export interface HighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * Transparent textarea layered over a highlighted backdrop.
 * Variable references (`@name`) render in a distinct accent color.
 */
export function HighlightedEditor({
  value,
  onChange,
  textareaRef,
}: HighlightedEditorProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    const bd = backdropRef.current;
    if (ta && bd) {
      bd.scrollTop = ta.scrollTop;
      bd.scrollLeft = ta.scrollLeft;
    }
  }, [textareaRef]);

  return (
    <div className="json-highlight-container">
      <div
        ref={backdropRef}
        className="json-highlight-backdrop"
        aria-hidden="true"
      >
        <pre className="json-highlight-pre">
          <code>{renderHighlighted(value)}</code>
        </pre>
      </div>
      <textarea
        ref={textareaRef}
        className="json-editor-textarea json-highlight-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder='{ "key": "value" }'
      />
    </div>
  );
}

/** Split text into plain segments and highlighted `@var` spans. */
function renderHighlighted(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  // Reset regex state since it's global
  VAR_REF_PATTERN.lastIndex = 0;
  let match = VAR_REF_PATTERN.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <span key={match.index} className="json-highlight-var">
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
    match = VAR_REF_PATTERN.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  // Ensure trailing newline so backdrop height matches textarea
  if (text.endsWith("\n") || text === "") {
    nodes.push("\n");
  }

  return nodes;
}
