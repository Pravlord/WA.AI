import { useEffect, useMemo, useState } from "react";
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
};

export function ManualProcessRunner({
  processRuns,
  onAddStep,
  onUpdateEdges,
  onUpdateGraph
}: ManualProcessRunnerProps) {
  const [activeRunId, setActiveRunId] = useState<string | null>(processRuns[0]?.id ?? null);

  const activeRun = useMemo(
    () => processRuns.find((run) => run.id === activeRunId) ?? processRuns[0] ?? null,
    [activeRunId, processRuns]
  );

  useEffect(() => {
    if (!activeRun && processRuns[0]) {
      setActiveRunId(processRuns[0].id);
    }
  }, [activeRun, processRuns]);

  if (!activeRun) {
    return <section className="visual-flowchart-shell visual-flowchart-shell-empty" />;
  }

  function handleAddRootBlock() {
    const title = `Agent ${activeRun.steps.length + 1}`;
    onAddStep(activeRun.id, title, "", [], {
      position: defaultRootPosition()
    });
  }

  function handleAppendChainedBlock(parentId: string) {
    const title = `Agent ${activeRun.steps.length + 1}`;
    const nextPos = nextStackedChildPosition(parentId, activeRun.edges, activeRun.graph.nodePositions);
    const position =
      nextPos ??
      (() => {
        const parentPos = activeRun.graph.nodePositions[parentId];
        return parentPos
          ? { x: parentPos.x, y: parentPos.y + 160 }
          : defaultRootPosition();
      })();

    onAddStep(activeRun.id, title, "", [parentId], {
      position,
      chainEdgePorts: { sourcePort: "bl", targetPort: "tl" }
    });
  }

  function handleAddDetachedBlockAt(position: { x: number; y: number }) {
    const title = `Agent ${activeRun.steps.length + 1}`;
    onAddStep(activeRun.id, title, "", [], {
      position: {
        x: Math.max(8, position.x),
        y: Math.max(8, position.y)
      }
    });
  }

  function handleMoveBlock(stepId: string, position: { x: number; y: number }) {
    onUpdateGraph(activeRun.id, {
      nodePositions: {
        [stepId]: position
      }
    });
  }

  return (
    <section className="visual-flowchart-shell">
      <header className="visual-flowchart-shell-header">
        <select
          aria-label="Process"
          className="visual-flowchart-run-picker"
          value={activeRun.id}
          onChange={(event) => setActiveRunId(event.target.value)}
        >
          {processRuns.map((run, runIndex) => (
            <option key={run.id} value={run.id}>
              {String(runIndex + 1).padStart(2, "0")}
            </option>
          ))}
        </select>
      </header>

      <div className="visual-flowchart-shell-body">
        <VisualAgentFlowchartCanvas
          run={activeRun}
          onAddDetachedBlockAt={handleAddDetachedBlockAt}
          onAddRootBlock={handleAddRootBlock}
          onAppendChainedBlock={handleAppendChainedBlock}
          onMoveBlock={handleMoveBlock}
          onPersistScroll={(scroll) =>
            onUpdateGraph(activeRun.id, {
              canvasScroll: scroll
            })
          }
          onUpdateEdges={(edges) => onUpdateEdges(activeRun.id, edges)}
        />
      </div>
    </section>
  );
}
