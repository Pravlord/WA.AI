export type WorkspaceViewId = "files" | "menu" | "safety" | "graph";

export type MainBlockTabKind = "file" | "workspace" | "graph" | "safety";

export type MainBlockTab = {
  id: string;
  kind: MainBlockTabKind;
  title: string;
  fileId?: string;
  view: WorkspaceViewId;
  pinned?: boolean;
};

export type MainBlockGroup = {
  id: string;
  tabs: MainBlockTab[];
  activeTabId: string | null;
};

export type MainBlockLayout = {
  orientation: "horizontal" | "vertical";
  groups: MainBlockGroup[];
  activeGroupId: string;
};

export type AppShellLayoutState = {
  explorerWidth: number;
  chatWidth: number;
  explorerCollapsed: boolean;
  chatCollapsed: boolean;
  mainBlock: MainBlockLayout;
};

export type WorkspaceLayoutState = {
  shell: AppShellLayoutState;
};
