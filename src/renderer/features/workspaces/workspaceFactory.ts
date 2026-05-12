import type { Workspace, WorkspaceDraft } from "../../../shared/workspace";

export function createWorkspace(draft: WorkspaceDraft): Workspace {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: draft.name,
    path: draft.path,
    status: "active",
    type: "general",
    priority: "normal",
    tags: [],
    instructions: "",
    pinnedPaths: [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  };
}
