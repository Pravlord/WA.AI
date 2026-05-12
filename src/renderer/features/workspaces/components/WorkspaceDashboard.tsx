import type {
  Workspace,
  WorkspacePriority,
  WorkspaceType
} from "../../../../shared/workspace";
import type { FileRegistryEntry } from "../../../../shared/fileRegistry";
import type { WorkspaceProcessRun } from "../../../../shared/processRunner";
import { FileRegistry } from "../../file-registry/components/FileRegistry";
import { SummaryCard } from "./SummaryCard";

type WorkspaceDashboardProps = {
  error: string | null;
  files: FileRegistryEntry[];
  processRuns: WorkspaceProcessRun[];
  workspace: Workspace;
  onClose: () => void;
  onRefreshRegistry: () => void;
  onShowWorkbench: () => void;
  onTogglePin: (file: FileRegistryEntry) => void;
  onUpdateWorkspace: (patch: Partial<Workspace>) => void;
};

export function WorkspaceDashboard({
  error,
  files,
  processRuns,
  workspace,
  onClose,
  onRefreshRegistry,
  onShowWorkbench,
  onTogglePin,
  onUpdateWorkspace
}: WorkspaceDashboardProps) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Active Workspace</p>
          <h2>{workspace.name}</h2>
          <p className="path-label">{workspace.path}</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button" type="button" onClick={onShowWorkbench}>
            Open Workbench
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close Workspace
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="summary-grid">
        <SummaryCard label="Indexed Files" value={String(files.length)} />
        <SummaryCard label="Pinned Paths" value={String(workspace.pinnedPaths.length)} />
        <SummaryCard label="Process Runs" value={String(processRuns.length)} />
        <SummaryCard label="Priority" value={workspace.priority} />
      </div>

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">Workspace Metadata</p>
          <h3>Folder-based operating context</h3>
          <p>
            This stores app metadata outside the user's documents while keeping the root folder as
            the visible source of work.
          </p>
        </div>
        <div className="metadata-form">
          <label>
            Type
            <select
              value={workspace.type}
              onChange={(event) =>
                onUpdateWorkspace({ type: event.target.value as WorkspaceType })
              }
            >
              <option value="general">general</option>
              <option value="document">document</option>
              <option value="spreadsheet">spreadsheet</option>
              <option value="browser">browser</option>
              <option value="mixed">mixed</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={workspace.priority}
              onChange={(event) =>
                onUpdateWorkspace({ priority: event.target.value as WorkspacePriority })
              }
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>
            Tags
            <input
              placeholder="office, monthly, portal"
              value={workspace.tags.join(", ")}
              onChange={(event) =>
                onUpdateWorkspace({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                })
              }
            />
          </label>
        </div>
      </section>

      <FileRegistry files={files} onRefresh={onRefreshRegistry} onTogglePin={onTogglePin} />

      <section className="panel" id="instructions">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workspace Instructions</p>
            <h3>Durable memory for this folder</h3>
          </div>
          <span className="pill">Saved locally</span>
        </div>
        <textarea
          placeholder="Write durable instructions for this workspace. Example: never overwrite original Excel files; always create revised copies first."
          value={workspace.instructions}
          onChange={(event) => onUpdateWorkspace({ instructions: event.target.value })}
        />
      </section>

      <section className="panel split-panel" id="history">
        <div>
          <p className="eyebrow">Process History</p>
          <h3>Workspace run log</h3>
          <p>Manual process runs track visible office work before agents automate any step.</p>
        </div>
        <div className="history-list">
          {processRuns.map((run) => (
            <article className="history-item" key={run.id}>
              <strong>{run.title}</strong>
              <span>
                {run.mode} - {run.status}
              </span>
              <small>
                {run.steps.length} steps - updated {new Date(run.updatedAt).toLocaleString()}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">Pinned Paths</p>
          <h3>Important files and folders</h3>
          <p>Pinned paths become the first context agents should inspect inside this workspace.</p>
        </div>
        <div className="history-list">
          {workspace.pinnedPaths.length === 0 ? (
            <p className="muted">Pin files from the registry to keep them visible here.</p>
          ) : (
            workspace.pinnedPaths.map((pin) => (
              <article className="history-item" key={pin.id}>
                <strong>{pin.name}</strong>
                <span>{pin.kind}</span>
                <small>{pin.path}</small>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
