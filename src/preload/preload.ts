import { contextBridge, ipcRenderer } from "electron";
import type { WorkspaceApi } from "../shared/workspaceApi";

// Sandboxed preload cannot require() other project files (Electron 20+). Keep these
// strings in sync with `workspaceIpcChannels` in `shared/workspaceApi.ts`.
const workspaceIpcChannels = {
  selectFolder: "workspace:select-folder",
  scanFolder: "workspace:scan-folder"
} as const;

const workspaceApi: WorkspaceApi = {
  selectFolder: () => ipcRenderer.invoke(workspaceIpcChannels.selectFolder),
  scanFolder: (folderPath) => ipcRenderer.invoke(workspaceIpcChannels.scanFolder, folderPath)
};

contextBridge.exposeInMainWorld("workspaceApi", workspaceApi);
