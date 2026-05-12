import type { WorkspaceFolderScan } from "./fileRegistry";
import type { WorkspaceDraft } from "./workspace";

export const workspaceIpcChannels = {
  selectFolder: "workspace:select-folder",
  scanFolder: "workspace:scan-folder"
} as const;

export type WorkspaceApi = {
  selectFolder: () => Promise<WorkspaceDraft | null>;
  scanFolder: (folderPath: string) => Promise<WorkspaceFolderScan>;
};
