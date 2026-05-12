import type { FileRegistryEntry } from "../../../shared/fileRegistry";

export function searchFileRegistry(
  files: FileRegistryEntry[],
  query: string,
  category: string
): FileRegistryEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  return files.filter((file) => {
    const matchesCategory = category === "all" || file.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      file.name.toLowerCase().includes(normalizedQuery) ||
      file.path.toLowerCase().includes(normalizedQuery) ||
      file.extension.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
