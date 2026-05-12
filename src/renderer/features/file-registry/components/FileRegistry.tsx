import { useMemo, useState } from "react";
import type { FileCategory, FileRegistryEntry } from "../../../../shared/fileRegistry";
import { searchFileRegistry } from "../fileRegistrySearch";

const categoryFilters: Array<FileCategory | "all"> = [
  "all",
  "document",
  "spreadsheet",
  "pdf",
  "image",
  "text",
  "folder",
  "other"
];

type FileRegistryProps = {
  files: FileRegistryEntry[];
  onRefresh: () => void;
  onTogglePin: (file: FileRegistryEntry) => void;
};

export function FileRegistry({ files, onRefresh, onTogglePin }: FileRegistryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FileCategory | "all">("all");
  const visibleFiles = useMemo(
    () => searchFileRegistry(files, query, category),
    [category, files, query]
  );

  return (
    <section className="panel" id="registry">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">File Registry</p>
          <h3>Indexed workspace files</h3>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh}>
          Refresh Index
        </button>
      </div>

      <div className="registry-controls">
        <input
          aria-label="Search file registry"
          placeholder="Search by file name, path, or extension"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label="Filter by file category"
          value={category}
          onChange={(event) => setCategory(event.target.value as FileCategory | "all")}
        >
          {categoryFilters.map((filter) => (
            <option key={filter} value={filter}>
              {filter}
            </option>
          ))}
        </select>
      </div>

      <div className="registry-table">
        <div className="registry-row registry-row-header">
          <span>Name</span>
          <span>Category</span>
          <span>Status</span>
          <span>Size</span>
          <span>Action</span>
        </div>
        {visibleFiles.length === 0 ? (
          <p className="muted">No files match this view.</p>
        ) : (
          visibleFiles.map((file) => (
            <div className="registry-row" key={file.id} title={file.path}>
              <span>
                <strong>{file.name}</strong>
                <small>{file.path}</small>
              </span>
              <span>{file.category}</span>
              <span>{file.status}</span>
              <span>{formatBytes(file.sizeBytes)}</span>
              <button className="text-button" type="button" onClick={() => onTogglePin(file)}>
                {file.status === "pinned" ? "Unpin" : "Pin"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
