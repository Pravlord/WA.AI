import type { FileRegistryEntry } from "../../../../shared/fileRegistry";
import type { Workspace } from "../../../../shared/workspace";

type FilePreviewProps = {
  file: FileRegistryEntry;
  workspace: Workspace;
};

export function FilePreview({ file, workspace }: FilePreviewProps) {
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
