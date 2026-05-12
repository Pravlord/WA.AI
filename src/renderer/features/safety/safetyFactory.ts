import type {
  BackupRecord,
  SafetyAction,
  SafetyActionType,
  SafetyRiskLevel,
  SafetyState
} from "../../../shared/safety";

export function createInitialSafetyState(): SafetyState {
  return {
    mode: "demo",
    actions: [],
    backups: []
  };
}

type SafetyActionDraft = {
  workspaceId: string;
  title: string;
  description: string;
  type: SafetyActionType;
  risk: SafetyRiskLevel;
};

export function createSafetyAction(draft: SafetyActionDraft): SafetyAction {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    workspaceId: draft.workspaceId,
    title: draft.title,
    description: draft.description,
    type: draft.type,
    risk: draft.risk,
    status: "proposed",
    requiresApproval: draft.risk !== "low",
    createdAt: now,
    updatedAt: now
  };
}

export function createBackupRecord(
  workspaceId: string,
  kind: BackupRecord["kind"],
  reason: string
): BackupRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    workspaceId,
    label: `${kind === "manual" ? "Manual" : "Automatic"} backup ${new Date(now).toLocaleString()}`,
    reason,
    kind,
    createdAt: now
  };
}
