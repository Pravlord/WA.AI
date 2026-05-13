import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  FlowchartCornerPort,
  ProcessGraphEdge,
  WorkspaceProcessRun,
  WorkspaceProcessStep
} from "../../../../shared/processRunner";
import {
  anchorPoint,
  computeBlocksBounds,
  computeFitViewport,
  computeSurfaceSize,
  elbowPath,
  FLOWCHART_BLOCK_HEIGHT,
  FLOWCHART_BLOCK_WIDTH,
  FLOWCHART_VIEW_MAX_SCALE,
  FLOWCHART_VIEW_MIN_SCALE
} from "../visualFlowchartGeometry";

const CORNERS: FlowchartCornerPort[] = ["tl", "tr", "bl", "br"];

export type VisualAgentFlowchartCanvasProps = {
  run: WorkspaceProcessRun;
  onAddRootBlock: () => void;
  onAppendChainedBlock: (parentStepId: string) => void;
  onAddDetachedBlockAt: (position: { x: number; y: number }) => void;
  onMoveBlock: (stepId: string, position: { x: number; y: number }) => void;
  onUpdateEdges: (edges: ProcessGraphEdge[]) => void;
  onPersistScroll: (scroll: { scrollLeft: number; scrollTop: number; scale: number }) => void;
  /** Increment from parent (e.g. “Fit to view”); resets when switching runs. */
  fitAllRequestId?: number;
};

type WireDraft = {
  sourceId: string;
  sourcePort: FlowchartCornerPort;
  pointerId: number;
  x: number;
  y: number;
};

type ContextMenuState = {
  clientX: number;
  clientY: number;
  surfaceX: number;
  surfaceY: number;
};

export function VisualAgentFlowchartCanvas({
  run,
  onAddRootBlock,
  onAppendChainedBlock,
  onAddDetachedBlockAt,
  onMoveBlock,
  onUpdateEdges,
  onPersistScroll,
  fitAllRequestId = 0
}: VisualAgentFlowchartCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ stepId: string; dx: number; dy: number; pointerId: number } | null>(null);
  /** Active empty-canvas viewport pan — blocks starting block / wire drags until released. */
  const viewportPanRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const wheelPersistRafRef = useRef<number | null>(null);
  const scrollPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  const scaleRef = useRef(1);
  const surfaceSizeRef = useRef({ width: 0, height: 0 });
  const onPersistScrollRef = useRef(onPersistScroll);
  onPersistScrollRef.current = onPersistScroll;

  const lastHandledFitIdRef = useRef(0);

  const [scale, setScale] = useState(1);
  const [wireDraft, setWireDraft] = useState<WireDraft | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const positions = run.graph.nodePositions;

  const surfaceSize = useMemo(
    () => computeSurfaceSize(run.steps.map((s) => s.id), positions),
    [positions, run.steps]
  );

  surfaceSizeRef.current = surfaceSize;

  const setScaleSynced = useCallback((s: number) => {
    const clamped = Math.max(FLOWCHART_VIEW_MIN_SCALE, Math.min(FLOWCHART_VIEW_MAX_SCALE, s));
    scaleRef.current = clamped;
    setScale(clamped);
    return clamped;
  }, []);

  const clientToSurface = useCallback((clientX: number, clientY: number) => {
    const scrollEl = scrollRef.current;
    const s = scaleRef.current;
    if (!scrollEl || s <= 0) {
      return { x: 0, y: 0 };
    }
    const rect = scrollEl.getBoundingClientRect();
    return {
      x: (scrollEl.scrollLeft + (clientX - rect.left)) / s,
      y: (scrollEl.scrollTop + (clientY - rect.top)) / s
    };
  }, []);

  const schedulePersistScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    if (scrollPersistTimerRef.current) {
      clearTimeout(scrollPersistTimerRef.current);
    }
    scrollPersistTimerRef.current = setTimeout(() => {
      scrollPersistTimerRef.current = null;
      onPersistScrollRef.current({
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        scale: scaleRef.current
      });
    }, 160);
  }, []);

  function persistViewportNow() {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    if (scrollPersistTimerRef.current) {
      clearTimeout(scrollPersistTimerRef.current);
      scrollPersistTimerRef.current = null;
    }
    onPersistScrollRef.current({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      scale: scaleRef.current
    });
  }

  /** Pointer target may start viewport pan only from “empty canvas” chrome (see handlers). */
  function isViewportPanPointerTarget(el: Element) {
    if (el.closest(".flowchart-block")) {
      return false;
    }
    if (el.closest(".flowchart-edge-hit")) {
      return false;
    }
    if (el.closest(".flowchart-corner-handle")) {
      return false;
    }
    if (el.closest(".flowchart-append-plus")) {
      return false;
    }
    if (el.closest(".flowchart-context-menu")) {
      return false;
    }
    return true;
  }

  function setViewportPanningClass(active: boolean) {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.classList.toggle("visual-flowchart-scroll--viewport-panning", active);
  }

  function endViewportPanTracking(event: PointerEvent) {
    const pan = viewportPanRef.current;
    if (!pan || event.pointerId !== pan.pointerId) {
      return;
    }
    viewportPanRef.current = null;
    setViewportPanningClass(false);
    const el = scrollRef.current;
    if (el?.hasPointerCapture(event.pointerId)) {
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    persistViewportNow();
    window.removeEventListener("pointermove", onViewportPanMove);
    window.removeEventListener("pointerup", endViewportPanTracking);
    window.removeEventListener("pointercancel", endViewportPanTracking);
  }

  function onViewportPanMove(event: PointerEvent) {
    const pan = viewportPanRef.current;
    if (!pan || event.pointerId !== pan.pointerId) {
      return;
    }
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollLeft = pan.startScrollLeft - (event.clientX - pan.startClientX);
    el.scrollTop = pan.startScrollTop - (event.clientY - pan.startClientY);
  }

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || run.steps.length === 0) {
      setScaleSynced(1);
      return;
    }

    const layoutPositions = run.graph.nodePositions;
    const layoutSurface = computeSurfaceSize(
      run.steps.map((s) => s.id),
      layoutPositions
    );

    const saved = run.graph.canvasScroll;
    const savedScale = saved?.scale;
    if (savedScale != null && Number.isFinite(savedScale) && savedScale > 0) {
      setScaleSynced(savedScale);
      el.scrollLeft = saved?.scrollLeft ?? 0;
      el.scrollTop = saved?.scrollTop ?? 0;
      return;
    }

    const bounds = computeBlocksBounds(
      run.steps.map((s) => s.id),
      layoutPositions
    );
    if (!bounds) {
      setScaleSynced(1);
      return;
    }

    const fit = computeFitViewport(el.clientWidth, el.clientHeight, bounds, layoutSurface, 80);
    setScaleSynced(fit.scale);
    el.scrollLeft = fit.scrollLeft;
    el.scrollTop = fit.scrollTop;
    queueMicrotask(() => {
      onPersistScrollRef.current({
        scrollLeft: fit.scrollLeft,
        scrollTop: fit.scrollTop,
        scale: fit.scale
      });
    });
  }, [run.id, run.steps.length, setScaleSynced]);

  useLayoutEffect(() => {
    if (!fitAllRequestId || fitAllRequestId === lastHandledFitIdRef.current) {
      return;
    }
    lastHandledFitIdRef.current = fitAllRequestId;

    const el = scrollRef.current;
    if (!el || run.steps.length === 0) {
      return;
    }

    const bounds = computeBlocksBounds(
      run.steps.map((s) => s.id),
      positions
    );
    if (!bounds) {
      return;
    }

    const fit = computeFitViewport(el.clientWidth, el.clientHeight, bounds, surfaceSize, 80);
    setScaleSynced(fit.scale);
    el.scrollLeft = fit.scrollLeft;
    el.scrollTop = fit.scrollTop;
    queueMicrotask(persistViewportNow);
  }, [fitAllRequestId, run.steps.length, positions, surfaceSize, setScaleSynced]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    function flushWheelPersistRaf() {
      wheelPersistRafRef.current = null;
      schedulePersistScroll();
    }

    function onWheel(event: WheelEvent) {
      const sc = scrollRef.current;
      if (!sc) {
        return;
      }
      event.preventDefault();

      let dy = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (event.deltaMode === 1) {
        dy *= 16;
      } else if (event.deltaMode === 2) {
        dy *= 100;
      }
      if (Math.abs(dy) < 1e-6) {
        return;
      }

      const rect = sc.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      const s0 = scaleRef.current;
      const factor = Math.exp(-dy * 0.00115);
      const s1 = setScaleSynced(s0 * factor);
      if (Math.abs(s1 - s0) < 1e-6) {
        return;
      }

      const wx = (sc.scrollLeft + mx) / s0;
      const wy = (sc.scrollTop + my) / s0;

      const sheet = surfaceSizeRef.current;
      let nextSl = wx * s1 - mx;
      let nextSt = wy * s1 - my;

      const vw = sc.clientWidth;
      const vh = sc.clientHeight;
      const maxSl = Math.max(0, sheet.width * s1 - vw);
      const maxSt = Math.max(0, sheet.height * s1 - vh);
      nextSl = Math.min(maxSl, Math.max(0, nextSl));
      nextSt = Math.min(maxSt, Math.max(0, nextSt));

      sc.scrollLeft = nextSl;
      sc.scrollTop = nextSt;

      /* Sync scale transform & sheet size imperatively so the paint matches
         the new scroll offset — otherwise React state lags by one frame. */
      const surfaceEl = sc.querySelector<HTMLElement>(".visual-flowchart-surface");
      const sheetEl = sc.querySelector<HTMLElement>(".visual-flowchart-scaled-sheet");
      if (surfaceEl) {
        surfaceEl.style.transform = `scale(${s1})`;
      }
      if (sheetEl) {
        sheetEl.style.width = `${sheet.width * s1}px`;
        sheetEl.style.height = `${sheet.height * s1}px`;
      }

      if (wheelPersistRafRef.current === null) {
        wheelPersistRafRef.current = window.requestAnimationFrame(flushWheelPersistRaf);
      }
    }

    scrollEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollEl.removeEventListener("wheel", onWheel);
      if (wheelPersistRafRef.current !== null) {
        cancelAnimationFrame(wheelPersistRafRef.current);
        wheelPersistRafRef.current = null;
      }
    };
  }, [run.id, schedulePersistScroll, setScaleSynced]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWireDraft(null);
        setContextMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function edgeSignature(edge: Pick<ProcessGraphEdge, "source" | "target" | "sourcePort" | "targetPort">) {
    return `${edge.source}:${edge.sourcePort}:${edge.target}:${edge.targetPort}`;
  }

  function beginWire(sourceId: string, sourcePort: FlowchartCornerPort, pointerId: number, clientX: number, clientY: number) {
    if (viewportPanRef.current) {
      return;
    }
    const origin = clientToSurface(clientX, clientY);
    const draft: WireDraft = {
      sourceId,
      sourcePort,
      pointerId,
      x: origin.x,
      y: origin.y
    };
    setWireDraft(draft);

    function move(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return;
      }
      const next = clientToSurface(event.clientX, event.clientY);
      setWireDraft((current) =>
        current && current.pointerId === pointerId ? { ...current, x: next.x, y: next.y } : current
      );
    }

    function finish(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return;
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);

      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const handleEl = hit?.closest("[data-flowchart-port]");
      const targetId = handleEl?.getAttribute("data-step-id");
      const targetPort = handleEl?.getAttribute("data-flowchart-port") as FlowchartCornerPort | null;

      const activeRun = runRef.current;

      if (!targetId || !targetPort || !CORNERS.includes(targetPort)) {
        setWireDraft(null);
        return;
      }

      if (targetId === sourceId) {
        setWireDraft(null);
        return;
      }

      const candidate: ProcessGraphEdge = {
        id: crypto.randomUUID(),
        source: sourceId,
        target: targetId,
        sourcePort,
        targetPort
      };

      const sig = edgeSignature(candidate);
      const exists = activeRun.edges.some((edge) => edgeSignature(edge) === sig);
      if (exists) {
        setWireDraft(null);
        return;
      }

      onUpdateEdges([...activeRun.edges, candidate]);
      setWireDraft(null);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  function removeEdge(edgeId: string) {
    const latest = runRef.current;
    onUpdateEdges(latest.edges.filter((edge) => edge.id !== edgeId));
  }

  function startDragBlock(stepId: string, pointerId: number, clientX: number, clientY: number) {
    if (viewportPanRef.current) {
      return;
    }
    const pos = positions[stepId];
    if (!pos) {
      return;
    }
    const { x, y } = clientToSurface(clientX, clientY);
    dragRef.current = {
      stepId,
      pointerId,
      dx: x - pos.x,
      dy: y - pos.y
    };

    function move(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const next = clientToSurface(event.clientX, event.clientY);
      onMoveBlock(drag.stepId, {
        x: Math.max(8, next.x - drag.dx),
        y: Math.max(8, next.y - drag.dy)
      });
    }

    function end(event: PointerEvent) {
      if (dragRef.current?.pointerId !== event.pointerId) {
        return;
      }
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function renderEdgesAndRubber() {
    const paths: React.ReactElement[] = [];

    for (const edge of run.edges) {
      const srcPos = positions[edge.source];
      const tgtPos = positions[edge.target];
      if (!srcPos || !tgtPos) {
        continue;
      }
      const sp = anchorPoint(srcPos.x, srcPos.y, edge.sourcePort ?? "bl");
      const tp = anchorPoint(tgtPos.x, tgtPos.y, edge.targetPort ?? "tl");
      const d = elbowPath(sp.x, sp.y, tp.x, tp.y);
      paths.push(
        <g key={edge.id}>
          <path
            aria-hidden
            className="flowchart-edge-hit"
            d={d}
            fill="none"
            stroke="transparent"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={18}
            onClick={(event) => {
              event.stopPropagation();
              removeEdge(edge.id);
            }}
          />
          <path
            className="flowchart-edge-line"
            d={d}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </g>
      );
    }

    if (wireDraft) {
      const srcPos = positions[wireDraft.sourceId];
      if (srcPos) {
        const sp = anchorPoint(srcPos.x, srcPos.y, wireDraft.sourcePort);
        const d = elbowPath(sp.x, sp.y, wireDraft.x, wireDraft.y);
        paths.push(
          <path
            key="rubber"
            className="flowchart-edge-rubber"
            d={d}
            fill="none"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        );
      }
    }

    return paths;
  }

  const empty = run.steps.length === 0;
  const zoomHint = Math.round(scale * 100);

  return (
    <section className="visual-flowchart">
      <div
        ref={scrollRef}
        className="visual-flowchart-scroll"
        title="Wheel zooms centered on cursor; drag empty space to pan; drag headers to move blocks."
        onContextMenu={(event) => {
          const hit = (event.target as HTMLElement).closest(".flowchart-block");
          if (hit) {
            return;
          }
          event.preventDefault();
          const surfacePos = clientToSurface(event.clientX, event.clientY);
          setContextMenu({
            clientX: event.clientX,
            clientY: event.clientY,
            surfaceX: surfacePos.x - FLOWCHART_BLOCK_WIDTH / 2,
            surfaceY: surfacePos.y - FLOWCHART_BLOCK_HEIGHT / 2
          });
        }}
        onPointerDown={(event) => {
          setContextMenu(null);
          if (empty || event.button !== 0 || viewportPanRef.current || dragRef.current) {
            return;
          }
          const t = event.target;
          if (!(t instanceof Element) || !isViewportPanPointerTarget(t)) {
            return;
          }

          event.preventDefault();
          const el = scrollRef.current;
          if (!el) {
            return;
          }

          viewportPanRef.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startScrollLeft: el.scrollLeft,
            startScrollTop: el.scrollTop
          };

          try {
            el.setPointerCapture(event.pointerId);
          } catch {
            /* ignore */
          }

          setViewportPanningClass(true);

          window.addEventListener("pointermove", onViewportPanMove);
          window.addEventListener("pointerup", endViewportPanTracking);
          window.addEventListener("pointercancel", endViewportPanTracking);
        }}
        onScroll={schedulePersistScroll}
      >
        <div
          className="visual-flowchart-scaled-sheet"
          style={{ width: surfaceSize.width * scale, height: surfaceSize.height * scale }}
        >
          <div
            className="visual-flowchart-surface"
            style={{
              width: surfaceSize.width,
              height: surfaceSize.height,
              transform: `scale(${scale})`
            }}
          >
            <svg
              aria-hidden
              className="visual-flowchart-svg"
              height={surfaceSize.height}
              width={surfaceSize.width}
            >
              {renderEdgesAndRubber()}
            </svg>

            {run.steps.map((step) => (
              <FlowchartBlockView
                key={step.id}
                positions={positions}
                step={step}
                onAppend={() => onAppendChainedBlock(step.id)}
                onCornerPointerDown={(port, event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  beginWire(step.id, port, event.pointerId, event.clientX, event.clientY);
                }}
                onDragHeader={(event) => {
                  event.preventDefault();
                  startDragBlock(step.id, event.pointerId, event.clientX, event.clientY);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {!empty ? (
        <div className="visual-flowchart-zoom-badge" aria-hidden>
          {zoomHint}%
        </div>
      ) : null}

      {empty ? (
        <div className="visual-flowchart-empty">
          <p className="visual-flowchart-empty-title">Create Agent Process</p>
          <button className="primary-button" type="button" onClick={onAddRootBlock}>
            Create
          </button>
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="flowchart-context-menu"
          role="menu"
          style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
        >
          <button
            type="button"
            onClick={() => {
              onAddDetachedBlockAt({ x: contextMenu.surfaceX, y: contextMenu.surfaceY });
              setContextMenu(null);
            }}
          >
            Add block
          </button>
        </div>
      ) : null}
    </section>
  );
}

type FlowchartBlockViewProps = {
  step: WorkspaceProcessStep;
  positions: Record<string, { x: number; y: number }>;
  onAppend: () => void;
  onCornerPointerDown: (port: FlowchartCornerPort, event: React.PointerEvent) => void;
  onDragHeader: (event: React.PointerEvent) => void;
};

function FlowchartBlockView({
  step,
  positions,
  onAppend,
  onCornerPointerDown,
  onDragHeader
}: FlowchartBlockViewProps) {
  const pos = positions[step.id] ?? { x: 40, y: 40 };

  return (
    <article
      className="flowchart-block"
      style={{
        left: pos.x,
        top: pos.y,
        width: FLOWCHART_BLOCK_WIDTH,
        height: FLOWCHART_BLOCK_HEIGHT
      }}
    >
      {CORNERS.map((port) => (
        <button
          key={port}
          aria-label={`Connect ${port}`}
          className={`flowchart-corner-handle flowchart-corner-${port}`}
          data-flowchart-port={port}
          data-step-id={step.id}
          type="button"
          onPointerDown={(event) => onCornerPointerDown(port, event)}
        />
      ))}
      <div className="flowchart-block-header" onPointerDown={onDragHeader}>
        <span className="flowchart-block-title">{step.title}</span>
      </div>
      <button
        aria-label="Add connected block below"
        className="flowchart-append-plus"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAppend();
        }}
      >
        +
      </button>
    </article>
  );
}
