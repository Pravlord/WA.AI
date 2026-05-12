export type Workspace = {
  id: string;
  name: string;
  path: string;
  status: "active" | "idle";
  type: WorkspaceType;
  priority: WorkspacePriority;
  tags: string[];
  instructions: string;
  pinnedPaths: PinnedPath[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
};

export type WorkspaceDraft = Pick<Workspace, "name" | "path">;

export type WorkspaceType = "general" | "document" | "spreadsheet" | "browser" | "mixed";

export type WorkspacePriority = "low" | "normal" | "high";

export type PinnedPath = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "folder";
  pinnedAt: string;
};
