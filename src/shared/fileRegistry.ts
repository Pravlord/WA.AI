export type FileRegistryEntry = {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  extension: string;
  category: FileCategory;
  status: FileStatus;
  sizeBytes: number;
  modifiedAt: string;
  indexedAt: string;
};

export type FileCategory =
  | "document"
  | "spreadsheet"
  | "pdf"
  | "image"
  | "text"
  | "folder"
  | "other";

export type FileStatus = "indexed" | "pinned" | "ignored" | "needs-review";

export type WorkspaceFolderScan = {
  rootPath: string;
  entries: ScannedFileEntry[];
  scannedAt: string;
};

export type ScannedFileEntry = {
  name: string;
  path: string;
  extension: string;
  kind: "file" | "folder";
  category: FileCategory;
  sizeBytes: number;
  modifiedAt: string;
};
