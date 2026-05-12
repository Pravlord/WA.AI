import type { WorkspaceLayoutState } from "./appShell";
import type { FileRegistryEntry } from "./fileRegistry";
import type { WorkspaceProcessRun, WorkspaceProcessTemplate } from "./processRunner";
import type { SafetyState } from "./safety";
import type { Workspace } from "./workspace";

export type WorkspaceSnapshot = {
  workspace: Workspace;
  files: FileRegistryEntry[];
  processRuns: WorkspaceProcessRun[];
  processTemplates: WorkspaceProcessTemplate[];
  safety: SafetyState;
  layout: WorkspaceLayoutState;
};
