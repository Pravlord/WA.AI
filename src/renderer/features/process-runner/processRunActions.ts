import type {
  ProcessStepStatus,
  WorkspaceProcessRun,
  WorkspaceProcessStep,
  WorkspaceProcessTemplate
} from "../../../shared/processRunner";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import {
  createHistoryEntry,
  createManualProcessRun,
  createManualProcessStep,
  deriveProcessRunStatus
} from "./processRunFactory";

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
  dependsOn: string[]
): WorkspaceSnapshot[] {
  const step = createManualProcessStep(title, input, dependsOn);

  return updateProcessRun(snapshots, workspaceId, runId, (run) => ({
    ...run,
    steps: [...run.steps, step],
    history: [...run.history, createHistoryEntry(`Step added: ${step.title}.`)]
  }));
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
    history: [...run.history, createHistoryEntry("Step dependency ordering updated.")]
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
