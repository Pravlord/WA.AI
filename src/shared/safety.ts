export type SafetyMode = "demo" | "live";

export type SafetyActionStatus = "proposed" | "accepted" | "applied" | "rejected" | "archived";

export type SafetyRiskLevel = "low" | "medium" | "high";

export type SafetyActionType =
  | "file-change"
  | "browser-submit"
  | "workspace-reset"
  | "backup"
  | "restore"
  | "archive";

export type SafetyAction = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: SafetyActionType;
  risk: SafetyRiskLevel;
  status: SafetyActionStatus;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  appliedAt?: string;
  backupId?: string;
};

export type BackupRecord = {
  id: string;
  workspaceId: string;
  label: string;
  reason: string;
  kind: "manual" | "automatic";
  createdAt: string;
  restoredAt?: string;
};

export type SafetyState = {
  mode: SafetyMode;
  actions: SafetyAction[];
  backups: BackupRecord[];
  lastResetAt?: string;
};
