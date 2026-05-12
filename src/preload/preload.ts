import { contextBridge, ipcRenderer } from "electron";
import { workspaceIpcChannels, type WorkspaceApi } from "../shared/workspaceApi";

const workspaceApi: WorkspaceApi = {
  selectFolder: () => ipcRenderer.invoke(workspaceIpcChannels.selectFolder),
  scanFolder: (folderPath) => ipcRenderer.invoke(workspaceIpcChannels.scanFolder, folderPath)
};

contextBridge.exposeInMainWorld("workspaceApi", workspaceApi);
