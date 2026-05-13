import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProcessGraphEdge, WorkspaceProcessRun } from "../../../../shared/processRunner";
import type { AddProcessStepOptions } from "../processRunActions";
import { defaultRootPosition, nextStackedChildPosition } from "../visualFlowchartGeometry";
import { VisualAgentFlowchartCanvas } from "./VisualAgentFlowchartCanvas";

type ManualProcessRunnerProps = {
  processRuns: WorkspaceProcessRun[];
  onAddStep: (
    runId: string,
    title: string,
    input: string,
    dependsOn: string[],
    options?: AddProcessStepOptions
  ) => void;
  onUpdateEdges: (runId: string, edges: ProcessGraphEdge[]) => void;
  onUpdateGraph: (
    runId: string,
    graph: Partial<WorkspaceProcessRun["graph"]>
  ) => void;
  onAddEmptyProcessGraph: () => string;
  onDuplicateProcessGraph: (runId: string) => string | null;
  onRemoveProcessGraph: (runId: string) => string | null;
};

export function ManualProcessRunner({
  processRuns,
  onAddStep,
  onUpdateEdges,
  onUpdateGraph,
  onAddEmptyProcessGraph,
  onDuplicateProcessGraph,
  onRemoveProcessGraph
}: ManualProcessRunnerProps) {
  /** Oldest-first so labels 01, 02, 03 match creation order (snapshot order is usually newest-first). */
  const orderedRuns = useMemo(
    () => [...processRuns].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [processRuns]
  );

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runPickerOpen, setRunPickerOpen] = useState(false);
  /** Per-run increment so “Fit to view” never applies another graph’s token. */
  const [fitNonceByRun, setFitNonceByRun] = useState<Record<string, number>>({});
  const actionsMenuRef = useRef<HTMLDetailsElement>(null);
  const runPickerRootRef = useRef<HTMLDivElement>(null);
  const runPickerTriggerRef = useRef<HTMLButtonElement>(null);

  const displayRunId = useMemo(() => {
    if (orderedRuns.length === 0) {
      return "";
    }

    if (activeRunId && orderedRuns.some((run) => run.id === activeRunId)) {
      return activeRunId;
    }

    return orderedRuns[0]!.id;
  }, [orderedRuns, activeRunId]);

  const flowchartFitNonce = fitNonceByRun[displayRunId] ?? 0;

  useEffect(() => {
    if (orderedRuns.length === 0) {
      if (activeRunId !== null) {
        setActiveRunId(null);
      }
      return;
    }

    const valid = activeRunId !== null && orderedRuns.some((run) => run.id === activeRunId);
    if (!valid) {
      setActiveRunId(orderedRuns[0]!.id);
    }
  }, [orderedRuns, activeRunId]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const menu = actionsMenuRef.current;
      if (!menu?.open) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && menu.contains(target)) {
        return;
      }

      menu.removeAttribute("open");
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    if (!runPickerOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = runPickerRootRef.current;
      if (!root || !(event.target instanceof Node) || root.contains(event.target)) {
        return;
      }

      setRunPickerOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [runPickerOpen]);

  useEffect(() => {
    if (!runPickerOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRunPickerOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [runPickerOpen]);

  function closeActionsMenu() {
    actionsMenuRef.current?.removeAttribute("open");
  }

  /**
   * Native <select> in Electron often stops opening its popup after sync + confirm()
   * until the window refocuses. Use a button-based picker instead; this recenters focus safely too.
   */
  function moveFocusToRunPickerTrigger() {
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const menu = actionsMenuRef.current;
        const active = document.activeElement;
        if (active instanceof HTMLElement && menu?.contains(active)) {
          active.blur();
        }
        runPickerTriggerRef.current?.focus({ preventScroll: true });
      });
    });
  }

  function toggleRunPicker() {
    setRunPickerOpen((open) => {
      if (!open) {
        closeActionsMenu();
      }
      return !open;
    });
  }

  if (orderedRuns.length === 0) {
    return <section className="visual-flowchart-shell visual-flowchart-shell-empty" />;
  }

  const currentRun = orderedRuns.find((run) => run.id === displayRunId) ?? orderedRuns[0]!;

  function handleMenuAddGraph() {
    const newId = onAddEmptyProcessGraph();
    if (newId) {
      setActiveRunId(newId);
    }
    closeActionsMenu();
    setRunPickerOpen(false);
    moveFocusToRunPickerTrigger();
  }

  function handleMenuDuplicateGraph() {
    const newId = onDuplicateProcessGraph(currentRun.id);
    if (newId) {
      setActiveRunId(newId);
    }
    closeActionsMenu();
    setRunPickerOpen(false);
    moveFocusToRunPickerTrigger();
  }

  function handleMenuDeleteGraph() {
    const title = currentRun.title || "this graph";
    if (!window.confirm(`Delete process graph "${title}"? This cannot be undone.`)) {
      closeActionsMenu();
      moveFocusToRunPickerTrigger();
      return;
    }

    const nextId = onRemoveProcessGraph(currentRun.id);
    if (nextId) {
      setActiveRunId(nextId);
    }
    closeActionsMenu();
    setRunPickerOpen(false);
    moveFocusToRunPickerTrigger();
  }

  function handleAddRootBlock() {
    const title = `Agent ${currentRun.steps.length + 1}`;
    onAddStep(currentRun.id, title, "", [], {
      position: defaultRootPosition()
    });
  }

  function handleAppendChainedBlock(parentId: string) {
    const title = `Agent ${currentRun.steps.length + 1}`;
    const nextPos = nextStackedChildPosition(parentId, currentRun.edges, currentRun.graph.nodePositions);
    const position =
      nextPos ??
      (() => {
        const parentPos = currentRun.graph.nodePositions[parentId];
        return parentPos
          ? { x: parentPos.x, y: parentPos.y + 160 }
          : defaultRootPosition();
      })();

    onAddStep(currentRun.id, title, "", [parentId], {
      position,
      chainEdgePorts: { sourcePort: "bl", targetPort: "tl" }
    });
  }

  function handleAddDetachedBlockAt(position: { x: number; y: number }) {
    const title = `Agent ${currentRun.steps.length + 1}`;
    onAddStep(currentRun.id, title, "", [], {
      position: {
        x: Math.max(8, position.x),
        y: Math.max(8, position.y)
      }
    });
  }

  function handleMoveBlock(stepId: string, position: { x: number; y: number }) {
    onUpdateGraph(currentRun.id, {
      nodePositions: {
        [stepId]: position
      }
    });
  }

  const currentRunIndex = orderedRuns.findIndex((run) => run.id === displayRunId);
  const runPickerLabel = String((currentRunIndex >= 0 ? currentRunIndex : 0) + 1).padStart(2, "0");

  return (
    <section className="visual-flowchart-shell">
      <header className="visual-flowchart-shell-header">
        <div ref={runPickerRootRef} className="visual-flowchart-run-picker-menu">
          <button
            ref={runPickerTriggerRef}
            aria-expanded={runPickerOpen}
            aria-haspopup="listbox"
            aria-label="Active process graph"
            className="visual-flowchart-run-picker-trigger"
            type="button"
            onClick={() => toggleRunPicker()}
          >
            <span className="visual-flowchart-run-picker-value">{runPickerLabel}</span>
            <ChevronDown aria-hidden className="visual-flowchart-run-picker-trigger-chevron" size={16} strokeWidth={2} />
          </button>

          {runPickerOpen ? (
            <div className="visual-flowchart-run-picker-panel" role="listbox" aria-label="Process graphs">
              {orderedRuns.map((run, runIndex) => {
                const num = String(runIndex + 1).padStart(2, "0");
                const selected = run.id === displayRunId;
                return (
                  <button
                    key={run.id}
                    className={`visual-flowchart-run-picker-option${selected ? " is-selected" : ""}`}
                    role="option"
                    type="button"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveRunId(run.id);
                      setRunPickerOpen(false);
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <details
          ref={actionsMenuRef}
          className="visual-flowchart-actions-menu"
          onToggle={(event) => {
            const el = event.currentTarget;
            if (el.open) {
              setRunPickerOpen(false);
            }
          }}
        >
          <summary className="visual-flowchart-actions-trigger" aria-label="Graph actions">
            <ChevronDown aria-hidden focusable={false} size={18} strokeWidth={2} />
          </summary>
          <div className="visual-flowchart-actions-panel" role="menu">
            <button className="visual-flowchart-actions-item" type="button" role="menuitem" onClick={handleMenuAddGraph}>
              Add
            </button>
            <button className="visual-flowchart-actions-item" type="button" role="menuitem" onClick={handleMenuDuplicateGraph}>
              Duplicate
            </button>
            <button
              className="visual-flowchart-actions-item"
              type="button"
              role="menuitem"
              onClick={() => {
                setFitNonceByRun((prev) => ({
                  ...prev,
                  [currentRun.id]: (prev[currentRun.id] ?? 0) + 1
                }));
                closeActionsMenu();
              }}
            >
              Fit to view
            </button>
            <button
              className="visual-flowchart-actions-item visual-flowchart-actions-item-danger"
              type="button"
              role="menuitem"
              onClick={handleMenuDeleteGraph}
            >
              Delete
            </button>
          </div>
        </details>
      </header>

      <div className="visual-flowchart-shell-body">
        <VisualAgentFlowchartCanvas
          key={currentRun.id}
          run={currentRun}
          fitAllRequestId={flowchartFitNonce}
          onAddDetachedBlockAt={handleAddDetachedBlockAt}
          onAddRootBlock={handleAddRootBlock}
          onAppendChainedBlock={handleAppendChainedBlock}
          onMoveBlock={handleMoveBlock}
          onPersistScroll={(scroll) =>
            onUpdateGraph(currentRun.id, {
              canvasScroll: scroll
            })
          }
          onUpdateEdges={(edges) => onUpdateEdges(currentRun.id, edges)}
        />
      </div>
    </section>
  );
}
