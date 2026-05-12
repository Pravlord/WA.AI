import type {
  AppShellLayoutState,
  MainBlockGroup,
  MainBlockLayout,
  MainBlockTab,
  WorkspaceLayoutState,
  WorkspaceViewId
} from "../../../shared/appShell";
import type { FileRegistryEntry } from "../../../shared/fileRegistry";

export const DEFAULT_EXPLORER_WIDTH = 270;
export const DEFAULT_CHAT_WIDTH = 360;

export function createDefaultWorkspaceLayout(): WorkspaceLayoutState {
  return {
    shell: {
      explorerWidth: DEFAULT_EXPLORER_WIDTH,
      chatWidth: DEFAULT_CHAT_WIDTH,
      explorerCollapsed: false,
      chatCollapsed: false,
      mainBlock: createDefaultMainBlockLayout()
    }
  };
}

export function createDefaultMainBlockLayout(): MainBlockLayout {
  const group = createMainBlockGroup([createViewTab("workspace", "Workspace", "menu")]);

  return {
    orientation: "horizontal",
    groups: [group],
    activeGroupId: group.id
  };
}

export function normalizeWorkspaceLayout(layout?: Partial<WorkspaceLayoutState>): WorkspaceLayoutState {
  const fallback = createDefaultWorkspaceLayout();
  const mainBlock = normalizeMainBlockLayout(layout?.shell?.mainBlock);

  return {
    shell: {
      explorerWidth: clampNumber(layout?.shell?.explorerWidth, 220, 520, fallback.shell.explorerWidth),
      chatWidth: clampNumber(layout?.shell?.chatWidth, 280, 620, fallback.shell.chatWidth),
      explorerCollapsed: Boolean(layout?.shell?.explorerCollapsed),
      chatCollapsed: Boolean(layout?.shell?.chatCollapsed),
      mainBlock
    }
  };
}

export function createViewTab(id: string, title: string, view: WorkspaceViewId): MainBlockTab {
  return {
    id,
    kind: view === "menu" || view === "files" ? "workspace" : view,
    title,
    view,
    pinned: view !== "files"
  };
}

export function createFileTab(file: FileRegistryEntry): MainBlockTab {
  return {
    id: `file:${file.id}`,
    kind: "file",
    title: file.name,
    fileId: file.id,
    view: "files"
  };
}

export function createMainBlockGroup(tabs: MainBlockTab[] = []): MainBlockGroup {
  return {
    id: crypto.randomUUID(),
    tabs,
    activeTabId: tabs[0]?.id ?? null
  };
}

function normalizeMainBlockLayout(layout?: Partial<MainBlockLayout>): MainBlockLayout {
  const fallback = createDefaultMainBlockLayout();
  const groups = (layout?.groups ?? [])
    .filter((group): group is MainBlockGroup => Boolean(group?.id))
    .map((group) => ({
      id: group.id,
      tabs: group.tabs ?? [],
      activeTabId:
        group.activeTabId && group.tabs?.some((tab) => tab.id === group.activeTabId)
          ? group.activeTabId
          : group.tabs?.[0]?.id ?? null
    }));

  if (groups.length === 0) {
    return fallback;
  }

  return {
    orientation: layout?.orientation === "vertical" ? "vertical" : "horizontal",
    groups,
    activeGroupId: groups.some((group) => group.id === layout?.activeGroupId)
      ? layout?.activeGroupId ?? groups[0].id
      : groups[0].id
  };
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
