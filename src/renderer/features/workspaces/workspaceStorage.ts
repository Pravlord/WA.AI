import type { FileRegistryEntry } from "../../../shared/fileRegistry";
import type { WorkspaceProcessRun, WorkspaceProcessTemplate } from "../../../shared/processRunner";
import type { Workspace } from "../../../shared/workspace";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import {
  createHistoryEntry,
  createInitialProcessTemplates,
  deriveProcessRunStatus,
  normalizeProcessRunStatus,
  normalizeProcessStepStatus
} from "../process-runner/processRunFactory";
import { createInitialSafetyState } from "../safety/safetyFactory";

const STORAGE_KEY = "wa.ai.workspace-snapshots";

export function readWorkspaceSnapshots(): WorkspaceSnapshot[] {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return (JSON.parse(storedValue) as WorkspaceSnapshot[]).map(normalizeWorkspaceSnapshot);
  } catch {
    return [];
  }
}

export function writeWorkspaceSnapshots(snapshots: WorkspaceSnapshot[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export function getWorkspaces(snapshots: WorkspaceSnapshot[]): Workspace[] {
  return snapshots.map((snapshot) => snapshot.workspace);
}

export function getWorkspaceFiles(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string
): FileRegistryEntry[] {
  return snapshots.find((snapshot) => snapshot.workspace.id === workspaceId)?.files ?? [];
}

export function getWorkspaceProcessRuns(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string
): WorkspaceProcessRun[] {
  return snapshots.find((snapshot) => snapshot.workspace.id === workspaceId)?.processRuns ?? [];
}

export function getWorkspaceProcessTemplates(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string
): WorkspaceProcessTemplate[] {
  return snapshots.find((snapshot) => snapshot.workspace.id === workspaceId)?.processTemplates ?? [];
}

function normalizeWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  const processRuns = (snapshot.processRuns ?? []).map((run) => {
    const now = run.updatedAt ?? run.createdAt ?? new Date().toISOString();
    const steps = (run.steps ?? []).map((step) => ({
      ...step,
      status: normalizeProcessStepStatus(step.status),
      input: step.input ?? "",
      output: step.output ?? "",
      dependsOn: step.dependsOn ?? [],
      createdAt: step.createdAt ?? now,
      updatedAt: step.updatedAt ?? now
    }));

    return {
      ...run,
      templateId: run.templateId ?? null,
      status: steps.length > 0 ? deriveProcessRunStatus(steps) : normalizeProcessRunStatus(run.status),
      steps,
      history:
        run.history?.length > 0
          ? run.history
          : [createHistoryEntry("Legacy process run restored into manual runner.", now)],
      createdAt: run.createdAt ?? now,
      updatedAt: now
    };
  });

  return {
    ...snapshot,
    processRuns,
    processTemplates: snapshot.processTemplates ?? createInitialProcessTemplates(),
    safety: snapshot.safety ?? createInitialSafetyState()
  };
}
