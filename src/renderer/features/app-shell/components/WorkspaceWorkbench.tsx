import { useMemo, useState } from "react";
import type { FileRegistryEntry } from "../../../../shared/fileRegistry";
import type { WorkspaceProcessRun } from "../../../../shared/processRunner";
import type { Workspace } from "../../../../shared/workspace";
import { searchFileRegistry } from "../../file-registry/fileRegistrySearch";

type ChatTab = "chat" | "plan" | "runs";

type WorkspaceWorkbenchProps = {
  files: FileRegistryEntry[];
  processRuns: WorkspaceProcessRun[];
  workspace: Workspace;
  onRefreshRegistry: () => void;
};

export function WorkspaceWorkbench({
  files,
  processRuns,
  workspace,
  onRefreshRegistry
}: WorkspaceWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [openFiles, setOpenFiles] = useState<FileRegistryEntry[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeChatTab, setActiveChatTab] = useState<ChatTab>("chat");
  const visibleFiles = useMemo(() => searchFileRegistry(files, query, "all"), [files, query]);
  const activeFile = openFiles.find((file) => file.id === activeFileId) ?? openFiles[0] ?? null;

  function openFile(file: FileRegistryEntry) {
    setOpenFiles((currentFiles) =>
      currentFiles.some((currentFile) => currentFile.id === file.id)
        ? currentFiles
        : [...currentFiles, file]
    );
    setActiveFileId(file.id);
  }

  function closeFile(fileId: string) {
    setOpenFiles((currentFiles) => currentFiles.filter((file) => file.id !== fileId));

    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((file) => file.id !== fileId);
      setActiveFileId(remainingFiles[0]?.id ?? null);
    }
  }

  return (
    <section className="cursor-workbench">
      <aside className="explorer-panel">
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
                className={`file-tree-item ${file.id === activeFile?.id ? "active" : ""}`}
                key={file.id}
                type="button"
                title={file.path}
                onClick={() => openFile(file)}
              >
                <span className="file-icon">{getFileIcon(file)}</span>
                <span>{file.name}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="editor-region">
        <nav className="editor-tabs" aria-label="Open files">
          {openFiles.length === 0 ? (
            <span className="editor-tab-placeholder">No files open</span>
          ) : (
            openFiles.map((file) => (
              <div
                className={`editor-tab ${file.id === activeFile?.id ? "active" : ""}`}
                key={file.id}
              >
                <button type="button" onClick={() => setActiveFileId(file.id)}>
                  {file.name}
                </button>
                <button
                  className="tab-close"
                  type="button"
                  aria-label={`Close ${file.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeFile(file.id);
                  }}
                >
                  x
                </button>
              </div>
            ))
          )}
        </nav>

        <div className="editor-surface">
          {activeFile ? (
            <FilePreview file={activeFile} workspace={workspace} />
          ) : (
            <div className="empty-editor">
              <p className="eyebrow">Workspace</p>
              <h2>{workspace.name}</h2>
              <p>Select a file from the explorer to open it in this work area.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="chat-panel">
        <nav className="chat-tabs" aria-label="Assistant tabs">
          <button
            className={activeChatTab === "chat" ? "active" : ""}
            type="button"
            onClick={() => setActiveChatTab("chat")}
          >
            Chat
          </button>
          <button
            className={activeChatTab === "plan" ? "active" : ""}
            type="button"
            onClick={() => setActiveChatTab("plan")}
          >
            Plan
          </button>
          <button
            className={activeChatTab === "runs" ? "active" : ""}
            type="button"
            onClick={() => setActiveChatTab("runs")}
          >
            Runs
          </button>
        </nav>
        <div className="chat-body">
          <ChatTabContent activeTab={activeChatTab} processRuns={processRuns} workspace={workspace} />
        </div>
        <div className="chat-input-shell">
          <textarea placeholder="Ask WA.AI to inspect, plan, automate, or explain this workspace." />
          <button className="primary-button" type="button">
            Send
          </button>
        </div>
      </aside>
    </section>
  );
}

type FilePreviewProps = {
  file: FileRegistryEntry;
  workspace: Workspace;
};

function FilePreview({ file, workspace }: FilePreviewProps) {
  return (
    <article className="file-preview">
      <p className="eyebrow">{file.category}</p>
      <h2>{file.name}</h2>
      <dl>
        <div>
          <dt>Path</dt>
          <dd>{file.path}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{file.status}</dd>
        </div>
        <div>
          <dt>Workspace</dt>
          <dd>{workspace.name}</dd>
        </div>
        <div>
          <dt>Last Modified</dt>
          <dd>{new Date(file.modifiedAt).toLocaleString()}</dd>
        </div>
      </dl>
      <div className="editor-placeholder">
        File preview and editing adapters will plug in here. Word, Excel, PDF, browser, and generated
        automation protocols can each provide their own editor surface later.
      </div>
    </article>
  );
}

type ChatTabContentProps = {
  activeTab: ChatTab;
  processRuns: WorkspaceProcessRun[];
  workspace: Workspace;
};

function ChatTabContent({ activeTab, processRuns, workspace }: ChatTabContentProps) {
  if (activeTab === "plan") {
    return (
      <div className="chat-message">
        <strong>Plan</strong>
        <p>Plans will show proposed steps, approvals, and dry-run output for {workspace.name}.</p>
      </div>
    );
  }

  if (activeTab === "runs") {
    return (
      <div className="chat-message run-summary-list">
        <strong>Runs</strong>
        {processRuns.length === 0 ? (
          <p>No process runs yet. Use the process graph mode to create a manual run.</p>
        ) : (
          processRuns.slice(0, 4).map((run) => (
            <article className="run-summary-item" key={run.id}>
              <span>{run.title}</span>
              <small>
                {run.status} - {run.steps.length} steps
              </small>
            </article>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="chat-message">
      <strong>WA.AI</strong>
      <p>Ready to help with this workspace. Open files on the left, then ask for a plan or action.</p>
    </div>
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
