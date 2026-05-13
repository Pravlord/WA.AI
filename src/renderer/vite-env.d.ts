/// <reference types="vite/client" />

import type { WorkspaceApi } from "../shared/workspaceApi";

declare global {
  interface Window {
    /** Present only when the renderer runs inside Electron (preload). */
    workspaceApi?: WorkspaceApi;

    /** File System Access API (browser fallback for folder selection). */
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }

  /** File System Access API handle types. */
  interface FileSystemDirectoryHandle {
    name: string;
    kind: "directory";
    entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
  }

  interface FileSystemFileHandle {
    kind: "file";
    name: string;
    getFile(): Promise<File>;
  }
}
