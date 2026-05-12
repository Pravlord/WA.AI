type EmptyWorkspaceProps = {
  errorMessage?: string | null;
  onOpenWorkspace: () => void;
};

export function EmptyWorkspace({ errorMessage, onOpenWorkspace }: EmptyWorkspaceProps) {
  return (
    <div className="empty-state">
      <p className="eyebrow">No Workspace Selected</p>
      <h2>Open a folder to create your first workspace tab.</h2>
      <p>
        Workspaces are folder-based contexts for files, Office documents, websites, process
        runs, and agent hierarchy.
      </p>
      {errorMessage ? (
        <p className="error-banner" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button className="primary-button" type="button" onClick={onOpenWorkspace}>
        Open Workspace Folder
      </button>
    </div>
  );
}
