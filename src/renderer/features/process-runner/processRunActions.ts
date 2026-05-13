import type {
  FlowchartCornerPort,
  ProcessGraphEdge,
  ProcessGraphLayout,
  ProcessStepStatus,
  WorkspaceProcessRun,
  WorkspaceProcessStep,
  WorkspaceProcessTemplate
} from "../../../shared/processRunner";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import {
  createHistoryEntry,
  createDefaultProcessGraphLayout,
  createManualProcessRun,
  createManualProcessStep,
  deriveProcessRunStatus
} from "./processRunFactory";

function cloneProcessRun(source: WorkspaceProcessRun): WorkspaceProcessRun {
  const now = new Date().toISOString();
  const idMap = new Map<string, string>();

  for (const step of source.steps) {
    idMap.set(step.id, crypto.randomUUID());
  }

  const steps = source.steps.map((step) => ({
    ...step,
    id: idMap.get(step.id)!,
    dependsOn: step.dependsOn
      .map((dependencyId) => idMap.get(dependencyId))
      .filter((dependencyId): dependencyId is string => Boolean(dependencyId)),
    createdAt: now,
    updatedAt: now
  }));

  const edges: ProcessGraphEdge[] = source.edges.map((edge) => ({
    id: crypto.randomUUID(),
    source: idMap.get(edge.source)!,
    target: idMap.get(edge.target)!,
    sourcePort: edge.sourcePort,
    targetPort: edge.targetPort
  }));

  const nodePositions: Record<string, { x: number; y: number }> = {};
  for (const [stepId, position] of Object.entries(source.graph.nodePositions)) {
    const nextId = idMap.get(stepId);
    if (nextId) {
      nodePositions[nextId] = position;
    }
  }

  const selectedStepId =
    source.graph.selectedStepId && idMap.has(source.graph.selectedStepId)
      ? idMap.get(source.graph.selectedStepId)!
      : null;

  return {
    ...source,
    id: crypto.randomUUID(),
    title: `${source.title} (copy)`,
    steps,
    edges,
    graph: {
      ...source.graph,
      nodePositions,
      selectedStepId
    },
    history: [...source.history, createHistoryEntry("Process graph duplicated.", now)],
    createdAt: now,
    updatedAt: now,
    status: deriveProcessRunStatus(steps)
  };
}

export type AddProcessStepOptions = {
  position?: { x: number; y: number };
  chainEdgePorts?: { sourcePort: FlowchartCornerPort; targetPort: FlowchartCornerPort };
};

export function createProcessRunFromTemplate(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  title: string,
  template: WorkspaceProcessTemplate | null
): WorkspaceSnapshot[] {
  const run = createManualProcessRun(workspaceId, title, template);

  return updateProcessRuns(snapshots, workspaceId, (runs) => [run, ...runs]);
}

export function addEmptyManualProcessRun(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string
): { snapshots: WorkspaceSnapshot[]; newRunId: string } {
  const snapshot = snapshots.find((entry) => entry.workspace.id === workspaceId);
  const ordinal = (snapshot?.processRuns.length ?? 0) + 1;
  const title = `Process graph ${String(ordinal).padStart(2, "0")}`;
  const run = finalizeProcessRun(createManualProcessRun(workspaceId, title, null));

  return {
    snapshots: updateProcessRuns(snapshots, workspaceId, (runs) => [run, ...runs]),
    newRunId: run.id
  };
}

export function duplicateProcessRun(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string
): { snapshots: WorkspaceSnapshot[]; newRunId: string } | null {
  const snapshot = snapshots.find((entry) => entry.workspace.id === workspaceId);
  const source = snapshot?.processRuns.find((run) => run.id === runId);

  if (!source) {
    return null;
  }

  const run = finalizeProcessRun(cloneProcessRun(source));

  return {
    snapshots: updateProcessRuns(snapshots, workspaceId, (runs) => [run, ...runs]),
    newRunId: run.id
  };
}

export function removeProcessRun(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string
): { snapshots: WorkspaceSnapshot[]; focusRunId: string } | null {
  const snapshot = snapshots.find((entry) => entry.workspace.id === workspaceId);
  if (!snapshot) {
    return null;
  }

  const runs = snapshot.processRuns;
  const removeIndex = runs.findIndex((run) => run.id === runId);

  if (removeIndex === -1) {
    return null;
  }

  let nextRuns = runs.filter((run) => run.id !== runId);

  if (nextRuns.length === 0) {
    const blank = finalizeProcessRun(createManualProcessRun(workspaceId, "Process graph 01", null));
    nextRuns = [blank];
  }

  const focusIndex = Math.min(removeIndex, nextRuns.length - 1);
  const focusRunId = nextRuns[focusIndex]!.id;

  return {
    snapshots: updateProcessRuns(snapshots, workspaceId, () => nextRuns),
    focusRunId
  };
}

export function addProcessStep(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  title: string,
  input: string,
  dependsOn: string[],
  options?: AddProcessStepOptions
): WorkspaceSnapshot[] {
  const step = createManualProcessStep(title, input, dependsOn);

  return updateProcessRun(snapshots, workspaceId, runId, (run) => {
    const position =
      options?.position ?? {
        x: 180 + (run.steps.length % 2) * 280,
        y: 100 + run.steps.length * 180
      };

    let nextEdges: ProcessGraphEdge[] = [...run.edges];
    if (dependsOn.length === 1 && options?.chainEdgePorts) {
      nextEdges.push({
        id: crypto.randomUUID(),
        source: dependsOn[0],
        target: step.id,
        sourcePort: options.chainEdgePorts.sourcePort,
        targetPort: options.chainEdgePorts.targetPort
      });
    } else if (dependsOn.length > 0) {
      nextEdges = [
        ...nextEdges,
        ...dependsOn.map((source) => ({
          id: crypto.randomUUID(),
          source,
          target: step.id,
          sourcePort: "bl" as FlowchartCornerPort,
          targetPort: "tl" as FlowchartCornerPort
        }))
      ];
    }

    return {
      ...run,
      steps: [...run.steps, step],
      edges: nextEdges,
      graph: {
        ...run.graph,
        nodePositions: {
          ...run.graph.nodePositions,
          [step.id]: position
        }
      },
      history: [...run.history, createHistoryEntry(`Step added: ${step.title}.`)]
    };
  });
}

export function updateProcessStepFields(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  stepId: string,
  patch: Pick<WorkspaceProcessStep, "input" | "output">
): WorkspaceSnapshot[] {
  return updateProcessRun(snapshots, workspaceId, runId, (run) => ({
    ...run,
    steps: run.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        : step
    )
  }));
}

export function setProcessStepStatus(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  stepId: string,
  status: ProcessStepStatus
): WorkspaceSnapshot[] {
  return updateProcessRun(snapshots, workspaceId, runId, (run) => {
    const step = run.steps.find((currentStep) => currentStep.id === stepId);

    return {
      ...run,
      steps: run.steps.map((currentStep) =>
        currentStep.id === stepId
          ? {
              ...currentStep,
              status,
              updatedAt: new Date().toISOString()
            }
          : currentStep
      ),
      history: step ? [...run.history, createHistoryEntry(`${step.title} marked ${status}.`)] : run.history
    };
  });
}

export function updateProcessStepDependencies(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  stepId: string,
  dependsOn: string[]
): WorkspaceSnapshot[] {
  return updateProcessRun(snapshots, workspaceId, runId, (run) => ({
    ...run,
    steps: run.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            dependsOn,
            updatedAt: new Date().toISOString()
          }
        : step
    ),
    edges: [
      ...run.edges.filter((edge) => edge.target !== stepId),
      ...dependsOn.map((source) => ({
        id: crypto.randomUUID(),
        source,
        target: stepId,
        sourcePort: "bl" as FlowchartCornerPort,
        targetPort: "tl" as FlowchartCornerPort
      }))
    ],
    history: [...run.history, createHistoryEntry("Step dependency ordering updated.")]
  }));
}

export function updateProcessRunEdges(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  edges: ProcessGraphEdge[]
): WorkspaceSnapshot[] {
  return updateProcessRun(snapshots, workspaceId, runId, (run) => ({
    ...run,
    edges,
    steps: run.steps.map((step) => ({
      ...step,
      dependsOn: edges.filter((edge) => edge.target === step.id).map((edge) => edge.source),
      updatedAt: new Date().toISOString()
    }))
  }));
}

export function updateProcessGraphLayout(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  graph: Partial<ProcessGraphLayout>
): WorkspaceSnapshot[] {
  return updateProcessRun(snapshots, workspaceId, runId, (run) => ({
    ...run,
    graph: {
      ...createDefaultProcessGraphLayout(run.steps),
      ...run.graph,
      ...graph,
      nodePositions: {
        ...run.graph.nodePositions,
        ...graph.nodePositions
      },
      viewport: {
        ...run.graph.viewport,
        ...graph.viewport
      },
      canvasScroll: {
        scrollLeft: graph.canvasScroll?.scrollLeft ?? run.graph.canvasScroll?.scrollLeft ?? 0,
        scrollTop: graph.canvasScroll?.scrollTop ?? run.graph.canvasScroll?.scrollTop ?? 0,
        ...(graph.canvasScroll && "scale" in graph.canvasScroll && graph.canvasScroll.scale !== undefined
          ? { scale: graph.canvasScroll.scale }
          : run.graph.canvasScroll?.scale !== undefined
            ? { scale: run.graph.canvasScroll.scale }
            : {})
      }
    }
  }));
}

function updateProcessRun(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  runId: string,
  updateRun: (run: WorkspaceProcessRun) => WorkspaceProcessRun
): WorkspaceSnapshot[] {
  return updateProcessRuns(snapshots, workspaceId, (runs) =>
    runs.map((run) => (run.id === runId ? finalizeProcessRun(updateRun(run)) : run))
  );
}

function updateProcessRuns(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  updateRuns: (runs: WorkspaceProcessRun[]) => WorkspaceProcessRun[]
): WorkspaceSnapshot[] {
  return snapshots.map((snapshot) =>
    snapshot.workspace.id === workspaceId
      ? {
          ...snapshot,
          processRuns: updateRuns(snapshot.processRuns),
          workspace: {
            ...snapshot.workspace,
            updatedAt: new Date().toISOString()
          }
        }
      : snapshot
  );
}

function finalizeProcessRun(run: WorkspaceProcessRun): WorkspaceProcessRun {
  return {
    ...run,
    status: deriveProcessRunStatus(run.steps),
    updatedAt: new Date().toISOString()
  };
}

