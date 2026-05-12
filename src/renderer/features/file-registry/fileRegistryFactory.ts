import type { FileRegistryEntry, ScannedFileEntry } from "../../../shared/fileRegistry";

export function createFileRegistryEntries(
  workspaceId: string,
  scannedEntries: ScannedFileEntry[]
): FileRegistryEntry[] {
  const indexedAt = new Date().toISOString();

  return scannedEntries.map((entry) => ({
    id: `${workspaceId}:${entry.path}`,
    workspaceId,
    name: entry.name,
    path: entry.path,
    extension: entry.extension,
    category: entry.category,
    status: "indexed",
    sizeBytes: entry.sizeBytes,
    modifiedAt: entry.modifiedAt,
    indexedAt
  }));
}
