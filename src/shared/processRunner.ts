export type ProcessRunMode = "manual" | "demo" | "live";

export type ProcessRunStatus = "waiting" | "running" | "complete" | "failed" | "blocked";

export type ProcessStepStatus = "waiting" | "running" | "complete" | "failed" | "blocked";

export type WorkspaceProcessStep = {
  id: string;
  title: string;
  status: ProcessStepStatus;
  input: string;
  output: string;
  dependsOn: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProcessRunHistoryEntry = {
  id: string;
  message: string;
  createdAt: string;
};

export type WorkspaceProcessRun = {
  id: string;
  workspaceId: string;
  templateId: string | null;
  title: string;
  mode: ProcessRunMode;
  status: ProcessRunStatus;
  steps: WorkspaceProcessStep[];
  history: ProcessRunHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type ProcessTemplateStep = {
  title: string;
  input: string;
  dependsOn: number[];
};

export type WorkspaceProcessTemplate = {
  id: string;
  title: string;
  description: string;
  steps: ProcessTemplateStep[];
  createdAt: string;
  updatedAt: string;
};
