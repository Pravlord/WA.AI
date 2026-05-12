import { useMemo, useState } from "react";
import type { FileRegistryEntry } from "../../../../shared/fileRegistry";
import type { Workspace } from "../../../../shared/workspace";
import { searchFileRegistry } from "../../file-registry/fileRegistrySearch";

type ExplorerRailProps = {
  files: FileRegistryEntry[];
  workspace: Workspace;
  activeFileId: string | null;
  onOpenFile: (file: FileRegistryEntry) => void;
  onRefreshRegistry: () => void;
};

export function ExplorerRail({
  files,
  workspace,
  activeFileId,
  onOpenFile,
  onRefreshRegistry
}: ExplorerRailProps) {
  const [query, setQuery] = useState("");
  const visibleFiles = useMemo(() => searchFileRegistry(files, query, "all"), [files, query]);

  return (
    <>
      <div className="panel-title-row">
        <span>Explorer</span>
        <button className="icon-button" type="button" onClick={onRefreshRegistry}>
          R
        </button>
      </div>
      <div className="workspace-root">
        <strong>{workspace.name}</strong>
        <small>{workspace.path}</small>
      </div>
      <input
        aria-label="Search workspace files"
        className="explorer-search"
        placeholder="Search files"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="file-tree">
        {visibleFiles.length === 0 ? (
          <p className="muted compact">No indexed files yet.</p>
        ) : (
          visibleFiles.map((file) => (
            <button
              className={`file-tree-item ${file.id === activeFileId ? "active" : ""}`}
              key={file.id}
              type="button"
              title={file.path}
              onClick={() => onOpenFile(file)}
            >
              <span className="file-icon">{getFileIcon(file)}</span>
              <span>{file.name}</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function getFileIcon(file: FileRegistryEntry): string {
  if (file.category === "folder") {
    return ">";
  }

  if (file.category === "spreadsheet") {
    return "XL";
  }

  if (file.category === "document") {
    return "WD";
  }

  if (file.category === "pdf") {
    return "PDF";
  }

  return "FI";
}
