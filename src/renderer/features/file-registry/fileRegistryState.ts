import type { FileRegistryEntry } from "../../../shared/fileRegistry";

export function mergePinnedFileState(
  previousFiles: FileRegistryEntry[],
  nextFiles: FileRegistryEntry[]
): FileRegistryEntry[] {
  const pinnedPaths = new Set(
    previousFiles.filter((file) => file.status === "pinned").map((file) => file.path)
  );

  return nextFiles.map((file) => ({
    ...file,
    status: pinnedPaths.has(file.path) ? "pinned" : file.status
  }));
}
