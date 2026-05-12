import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import type { FileCategory, ScannedFileEntry, WorkspaceFolderScan } from "../shared/fileRegistry";
import { workspaceIpcChannels } from "../shared/workspaceApi";

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined || !app.isPackaged;
const MAX_SCAN_ENTRIES = 200;

function createMainWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: "WA.AI",
    backgroundColor: "#0f172a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });

  if (isDev) {
    void window.loadURL("http://127.0.0.1:5173");
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void window.loadFile(path.join(__dirname, "../renderer/index.html"));
}

ipcMain.handle(workspaceIpcChannels.selectFolder, async () => {
  const result = await dialog.showOpenDialog({
    title: "Open workspace folder",
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];

  return {
    name: path.basename(folderPath),
    path: folderPath
  };
});

ipcMain.handle(
  workspaceIpcChannels.scanFolder,
  async (_event, folderPath: string): Promise<WorkspaceFolderScan> => {
    const directoryEntries = await fs.readdir(folderPath, { withFileTypes: true });
    const scannedAt = new Date().toISOString();
    const entries: ScannedFileEntry[] = [];

    for (const directoryEntry of directoryEntries.slice(0, MAX_SCAN_ENTRIES)) {
      const entryPath = path.join(folderPath, directoryEntry.name);
      const stats = await fs.stat(entryPath);
      const extension = directoryEntry.isFile()
        ? path.extname(directoryEntry.name).replace(".", "").toLowerCase()
        : "";

      entries.push({
        name: directoryEntry.name,
        path: entryPath,
        extension,
        kind: directoryEntry.isDirectory() ? "folder" : "file",
        category: directoryEntry.isDirectory() ? "folder" : getFileCategory(extension),
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString()
      });
    }

    return {
      rootPath: folderPath,
      entries,
      scannedAt
    };
  }
);

function getFileCategory(extension: string): FileCategory {
  if (["doc", "docx", "rtf", "odt"].includes(extension)) {
    return "document";
  }

  if (["csv", "xls", "xlsx"].includes(extension)) {
    return "spreadsheet";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(extension)) {
    return "image";
  }

  if (["md", "txt", "json", "xml", "log"].includes(extension)) {
    return "text";
  }

  return "other";
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
