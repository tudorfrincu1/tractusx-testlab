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

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store";
import { modelToSequence } from "@/services";

const DEBOUNCE_MS = 300;
const SCALE_MIN = 0.25;
const SCALE_MAX = 3;
const ZOOM_STEP = 0.15;

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const INITIAL_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 };

let mermaidInstance: typeof import("mermaid").default | null = null;
let renderCounter = 0;

async function getMermaid(): Promise<typeof import("mermaid").default> {
  if (!mermaidInstance) {
    const mod = await import("mermaid");
    mermaidInstance = mod.default;
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: "dark",
      sequence: { actorMargin: 80, messageMargin: 40 },
    });
  }
  return mermaidInstance;
}

function clampScale(value: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
}

export function SequenceDiagram() {
  const model = useEditorStore((s) => s.model);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM);
  const [locked, setLocked] = useState(false);

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Reset transform when diagram content changes
  useEffect(() => {
    setTransform(INITIAL_TRANSFORM);
  }, [model]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const mm = await getMermaid();
        const def = modelToSequence(model);
        const id = `seq-${++renderCounter}`;
        const { svg } = await mm.render(id, def);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to render diagram";
          setError(message);
          if (containerRef.current) containerRef.current.innerHTML = "";
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [model]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (locked) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setTransform((prev) => {
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = clampScale(prev.scale + direction * ZOOM_STEP * prev.scale);
      const ratio = newScale / prev.scale;
      const newX = cursorX - ratio * (cursorX - prev.x);
      const newY = cursorY - ratio * (cursorY - prev.y);
      return { scale: newScale, x: newX, y: newY };
    });
  }, [locked]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [locked]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanning.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale + ZOOM_STEP) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale - ZOOM_STEP) }));
  }, []);

  const handleFitView = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
  }, []);

  const handleToggleLock = useCallback(() => {
    setLocked((prev) => !prev);
  }, []);

  const transformStyle = `scale(${transform.scale}) translate(${transform.x / transform.scale}px, ${transform.y / transform.scale}px)`;

  return (
    <div
      className="sequence-diagram"
      ref={wrapperRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {loading && (
        <div className="sequence-diagram__loading">Rendering diagram…</div>
      )}
      {error && !loading && (
        <div className="sequence-diagram__error">
          <span>⚠ Diagram render error</span>
          <pre>{error}</pre>
        </div>
      )}
      <div
        ref={containerRef}
        className="sequence-diagram__svg"
        style={{ transform: transformStyle, transformOrigin: "0 0" }}
      />
      <div
        className="react-flow__panel react-flow__controls vertical bottom left"
        style={{ background: "rgb(45, 45, 45)", border: "1px solid rgb(64, 64, 64)", borderRadius: "6px" }}
      >
        <button type="button" className="react-flow__controls-button react-flow__controls-zoomin" title="Zoom In" onClick={handleZoomIn}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z"></path>
          </svg>
        </button>
        <button type="button" className="react-flow__controls-button react-flow__controls-zoomout" title="Zoom Out" onClick={handleZoomOut}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5">
            <path d="M0 0h32v4.2H0z"></path>
          </svg>
        </button>
        <button type="button" className="react-flow__controls-button react-flow__controls-fitview" title="Fit View" onClick={handleFitView}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30">
            <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path>
          </svg>
        </button>
        <button type="button" className="react-flow__controls-button react-flow__controls-interactive" title={locked ? "Unlock interactions" : "Lock interactions"} onClick={handleToggleLock}>
          {locked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
              <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
              <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8.076 0 4.762 3.429 4.762 7.619v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
