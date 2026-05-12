import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FlowchartCornerPort,
  ProcessGraphEdge,
  WorkspaceProcessRun,
  WorkspaceProcessStep
} from "../../../../shared/processRunner";
import {
  anchorPoint,
  computeSurfaceSize,
  elbowPath,
  FLOWCHART_BLOCK_HEIGHT,
  FLOWCHART_BLOCK_WIDTH
} from "../visualFlowchartGeometry";

const CORNERS: FlowchartCornerPort[] = ["tl", "tr", "bl", "br"];

export type VisualAgentFlowchartCanvasProps = {
  run: WorkspaceProcessRun;
  onAddRootBlock: () => void;
  onAppendChainedBlock: (parentStepId: string) => void;
  onAddDetachedBlockAt: (position: { x: number; y: number }) => void;
  onMoveBlock: (stepId: string, position: { x: number; y: number }) => void;
  onUpdateEdges: (edges: ProcessGraphEdge[]) => void;
  onPersistScroll: (scroll: { scrollLeft: number; scrollTop: number }) => void;
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
  onPersistScroll
}: VisualAgentFlowchartCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ stepId: string; dx: number; dy: number; pointerId: number } | null>(null);
  const scrollPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  const [wireDraft, setWireDraft] = useState<WireDraft | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const positions = run.graph.nodePositions;

  const surfaceSize = useMemo(
    () => computeSurfaceSize(run.steps.map((s) => s.id), positions),
    [positions, run.steps]
  );

  const clientToSurface = useCallback((clientX: number, clientY: number) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return { x: 0, y: 0 };
    }
    const rect = scrollEl.getBoundingClientRect();
    return {
      x: scrollEl.scrollLeft + (clientX - rect.left),
      y: scrollEl.scrollTop + (clientY - rect.top)
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const cs = run.graph.canvasScroll;
    if (!el || !cs) {
      return;
    }
    el.scrollLeft = cs.scrollLeft;
    el.scrollTop = cs.scrollTop;
  }, [run.id]);

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

  function schedulePersistScroll() {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    if (scrollPersistTimerRef.current) {
      clearTimeout(scrollPersistTimerRef.current);
    }
    scrollPersistTimerRef.current = setTimeout(() => {
      scrollPersistTimerRef.current = null;
      onPersistScroll({
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop
      });
    }, 160);
  }

  function edgeSignature(edge: Pick<ProcessGraphEdge, "source" | "target" | "sourcePort" | "targetPort">) {
    return `${edge.source}:${edge.sourcePort}:${edge.target}:${edge.targetPort}`;
  }

  function beginWire(sourceId: string, sourcePort: FlowchartCornerPort, pointerId: number, clientX: number, clientY: number) {
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
            strokeWidth={2}
          />
        );
      }
    }

    return paths;
  }

  const empty = run.steps.length === 0;

  return (
    <section className="visual-flowchart">
      <div
        ref={scrollRef}
        className="visual-flowchart-scroll"
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
        onPointerDown={() => setContextMenu(null)}
        onScroll={schedulePersistScroll}
      >
        <div
          className="visual-flowchart-surface"
          style={{ width: surfaceSize.width, height: surfaceSize.height }}
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
