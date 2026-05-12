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
        scrollTop: graph.canvasScroll?.scrollTop ?? run.graph.canvasScroll?.scrollTop ?? 0
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

