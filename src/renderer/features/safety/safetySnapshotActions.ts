import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import type { BackupRecord, SafetyAction, SafetyMode, SafetyState } from "../../../shared/safety";
import { createBackupRecord, createInitialSafetyState, createSafetyAction } from "./safetyFactory";

type SafetyUpdater = (safety: SafetyState) => SafetyState;

export function setSafetyMode(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  mode: SafetyMode
): WorkspaceSnapshot[] {
  return updateSafetyState(snapshots, workspaceId, (safety) => ({
    ...safety,
    mode
  }));
}

export function createDemoSafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  risk: SafetyAction["risk"]
): WorkspaceSnapshot[] {
  const isRisky = risk === "high";
  const action = createSafetyAction({
    workspaceId,
    risk,
    type: isRisky ? "file-change" : "archive",
    title: isRisky ? "Risky file rewrite proposal" : "Safe archive proposal",
    description: isRisky
      ? "Simulates a high-risk file change that must be approved before it can be applied."
      : "Simulates a safe review-only action that can move through the safety state machine."
  });

  return updateSafetyState(snapshots, workspaceId, (safety) => ({
    ...safety,
    actions: [action, ...safety.actions]
  }));
}

export function approveSafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  actionId: string
): WorkspaceSnapshot[] {
  return updateSafetyAction(snapshots, workspaceId, actionId, (action) => ({
    ...action,
    status: "accepted",
    decidedAt: new Date().toISOString()
  }));
}

export function rejectSafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  actionId: string
): WorkspaceSnapshot[] {
  return updateSafetyAction(snapshots, workspaceId, actionId, (action) => ({
    ...action,
    status: "rejected",
    decidedAt: new Date().toISOString()
  }));
}

export function archiveSafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  actionId: string
): WorkspaceSnapshot[] {
  return updateSafetyAction(snapshots, workspaceId, actionId, (action) => ({
    ...action,
    status: "archived"
  }));
}

export function applySafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  actionId: string
): WorkspaceSnapshot[] {
  return snapshots.map((snapshot) => {
    if (snapshot.workspace.id !== workspaceId) {
      return snapshot;
    }

    const safety = snapshot.safety;
    const action = safety.actions.find((candidate) => candidate.id === actionId);

    if (!action || action.status !== "accepted") {
      return snapshot;
    }

    const now = new Date().toISOString();
    const automaticBackup =
      action.risk === "high"
        ? createBackupRecord(
            workspaceId,
            "automatic",
            `Automatic checkpoint before applying: ${action.title}`
          )
        : null;

    return {
      ...snapshot,
      safety: {
        ...safety,
        backups: automaticBackup ? [automaticBackup, ...safety.backups] : safety.backups,
        actions: safety.actions.map((candidate) =>
          candidate.id === actionId
            ? {
                ...candidate,
                status: "applied",
                appliedAt: now,
                backupId: automaticBackup?.id ?? candidate.backupId,
                updatedAt: now
              }
            : candidate
        )
      }
    };
  });
}

export function createBackup(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  kind: BackupRecord["kind"],
  reason: string
): WorkspaceSnapshot[] {
  const backup = createBackupRecord(workspaceId, kind, reason);

  return updateSafetyState(snapshots, workspaceId, (safety) => ({
    ...safety,
    backups: [backup, ...safety.backups]
  }));
}

export function restoreBackup(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  backupId: string
): WorkspaceSnapshot[] {
  const now = new Date().toISOString();

  return updateSafetyState(snapshots, workspaceId, (safety) => ({
    ...safety,
    backups: safety.backups.map((backup) =>
      backup.id === backupId
        ? {
            ...backup,
            restoredAt: now
          }
        : backup
    )
  }));
}

export function resetSafetyAppState(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string
): WorkspaceSnapshot[] {
  return updateSafetyState(snapshots, workspaceId, () => ({
    ...createInitialSafetyState(),
    lastResetAt: new Date().toISOString()
  }));
}

function updateSafetyAction(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  actionId: string,
  updateAction: (action: SafetyAction) => SafetyAction
): WorkspaceSnapshot[] {
  return updateSafetyState(snapshots, workspaceId, (safety) => ({
    ...safety,
    actions: safety.actions.map((action) =>
      action.id === actionId
        ? {
            ...updateAction(action),
            updatedAt: new Date().toISOString()
          }
        : action
    )
  }));
}

function updateSafetyState(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  updateSafety: SafetyUpdater
): WorkspaceSnapshot[] {
  return snapshots.map((snapshot) =>
    snapshot.workspace.id === workspaceId
      ? {
          ...snapshot,
          safety: updateSafety(snapshot.safety)
        }
      : snapshot
  );
}
