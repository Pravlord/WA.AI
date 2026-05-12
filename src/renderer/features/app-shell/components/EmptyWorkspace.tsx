type EmptyWorkspaceProps = {
  onOpenWorkspace: () => void;
};

export function EmptyWorkspace({ onOpenWorkspace }: EmptyWorkspaceProps) {
  return (
    <div className="empty-state">
      <p className="eyebrow">No Workspace Selected</p>
      <h2>Open a folder to create your first workspace tab.</h2>
      <p>
        Workspaces are folder-based contexts for files, Office documents, websites, process
        runs, and agent hierarchy.
      </p>
      <button className="primary-button" type="button" onClick={onOpenWorkspace}>
        Open Workspace Folder
      </button>
    </div>
  );
}
