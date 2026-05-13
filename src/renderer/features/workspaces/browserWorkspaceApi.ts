import type { WorkspaceApi } from "../../../shared/workspaceApi";
import type { FileCategory, ScannedFileEntry, WorkspaceFolderScan } from "../../../shared/fileRegistry";
import type { WorkspaceDraft } from "../../../shared/workspace";

const directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();

/**
 * Browser fallback for the Electron WorkspaceApi.
 * Uses the File System Access API (showDirectoryPicker) so the app works
 * when opened in a normal browser tab or Cursor preview.
 */
async function pickAndCacheFolder(): Promise<WorkspaceDraft | null> {
  const picker = window.showDirectoryPicker;
  if (typeof picker !== "function") {
    return null;
  }

  const handle = await picker();
  if (!handle) {
    return null;
  }

  directoryHandleCache.set(handle.name, handle);

  return {
    name: handle.name,
    path: handle.name // no absolute path in browser, use handle name
  };
}

async function browserScanFolder(folderPath: string): Promise<WorkspaceFolderScan> {
  // In the browser fallback, folderPath is the handle name cached at pick time.
  const handle = directoryHandleCache.get(folderPath);
  if (!handle) {
    throw new Error("Folder handle lost. Please re-open the workspace folder.");
  }

  const entries: ScannedFileEntry[] = [];
  const scannedAt = new Date().toISOString();

  // FileSystemDirectoryHandle.entries() returns async iterator of [name, kind]
  for await (const [name, entry] of (handle as any).entries()) {
    const kind = entry.kind === "directory" ? "folder" : "file";
    const extension = kind === "file" ? name.split(".").pop()?.toLowerCase() ?? "" : "";
    const category = kind === "folder" ? "folder" : getFileCategory(extension);

    let sizeBytes = 0;
    if (kind === "file" && typeof entry.getFile === "function") {
      try {
        const file = await (entry as FileSystemFileHandle).getFile();
        sizeBytes = file.size;
      } catch {
        // ignore size read errors
      }
    }

    entries.push({
      name,
      path: name, // browser paths are relative to the selected directory
      extension,
      kind,
      category,
      sizeBytes,
      modifiedAt: scannedAt
    });
  }

  return {
    rootPath: folderPath,
    entries,
    scannedAt
  };
}

function getFileCategory(extension: string): FileCategory {
  if (["doc", "docx", "rtf", "odt"].includes(extension)) return "document";
  if (["csv", "xls", "xlsx"].includes(extension)) return "spreadsheet";
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(extension)) return "image";
  if (["md", "txt", "json", "xml", "log"].includes(extension)) return "text";
  return "other";
}

export const browserWorkspaceApi: WorkspaceApi = {
  selectFolder: () => pickAndCacheFolder(),
  scanFolder: (folderPath: string) => browserScanFolder(folderPath)
};
