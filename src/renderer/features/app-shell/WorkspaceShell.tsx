import { useEffect, useMemo, useState } from "react";
import type { AppShellLayoutState, MainBlockLayout, MainBlockTab } from "../../../shared/appShell";
import type { FileRegistryEntry } from "../../../shared/fileRegistry";
import type { PinnedPath, Workspace } from "../../../shared/workspace";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import {
  applyCoordinatorDraft,
  createCoordinatorDraft,
  type CoordinatorCommandResult
} from "../agents/coordinatorAgent";
import {
  createDefaultWorkspaceLayout,
  createFileTab,
  createViewTab
} from "./appShellLayout";
import { createFileRegistryEntries } from "../file-registry/fileRegistryFactory";
import { mergePinnedFileState } from "../file-registry/fileRegistryState";
import { ManualProcessRunner } from "../process-runner/components/ManualProcessRunner";
import {
  addProcessStep,
  addEmptyManualProcessRun,
  duplicateProcessRun,
  removeProcessRun,
  updateProcessGraphLayout,
  updateProcessRunEdges
} from "../process-runner/processRunActions";
import { createInitialProcessRuns, createInitialProcessTemplates } from "../process-runner/processRunFactory";
import { SafetyCenter } from "../safety/components/SafetyCenter";
import { createInitialSafetyState } from "../safety/safetyFactory";
import {
  applySafetyAction,
  approveSafetyAction,
  archiveSafetyAction,
  createBackup,
  createDemoSafetyAction,
  rejectSafetyAction,
  resetSafetyAppState,
  restoreBackup,
  setSafetyMode
} from "../safety/safetySnapshotActions";
import { WorkspaceDashboard } from "../workspaces/components/WorkspaceDashboard";
import { createWorkspace } from "../workspaces/workspaceFactory";
import {
  getWorkspaceFiles,
  getWorkspaceProcessRuns,
  getWorkspaces,
  readWorkspaceSnapshots,
  writeWorkspaceSnapshots
} from "../workspaces/workspaceStorage";
import { ActivityBar, type WorkspaceView } from "./components/ActivityBar";
import { ApplicationMenuBar } from "./components/ApplicationMenuBar";
import { AppShellLayout } from "./components/AppShellLayout";
import { ChatRail } from "./components/ChatRail";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { browserWorkspaceApi } from "../workspaces/browserWorkspaceApi";
import { ExplorerRail } from "./components/ExplorerRail";
import { FilePreview } from "./components/FilePreview";
import { MainBlockComposer } from "./components/MainBlockComposer";
import { PreferencesDialog } from "../preferences/components/PreferencesDialog";

export function WorkspaceShell() {
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>(readWorkspaceSnapshots);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => snapshots[0]?.workspace.id ?? null
  );
  const [workspaceViews, setWorkspaceViews] = useState<Record<string, WorkspaceView>>({});
  const [coordinatorResults, setCoordinatorResults] = useState<Record<string, CoordinatorCommandResult[]>>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [openWorkspaceError, setOpenWorkspaceError] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const workspaces = useMemo(() => getWorkspaces(snapshots), [snapshots]);
  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, snapshots]
  );

  useEffect(() => {
    writeWorkspaceSnapshots(snapshots);
  }, [snapshots]);

  useEffect(() => {
    if (activeWorkspaceId && workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      return;
    }

    setActiveWorkspaceId(workspaces[0]?.id ?? null);
  }, [activeWorkspaceId, workspaces]);

  async function handleOpenWorkspace() {
    setOpenWorkspaceError(null);

    let api = window.workspaceApi;
    if (typeof api?.selectFolder !== "function") {
      if (typeof window.showDirectoryPicker === "function") {
        api = browserWorkspaceApi;
      } else {
        const inElectron =
          typeof navigator !== "undefined" && navigator.userAgent.includes("Electron");
        setOpenWorkspaceError(
          inElectron
            ? "Folder selection is unavailable because the preload bridge did not load. If this persists, check the terminal for a preload error when the window opens."
            : "Folder selection only works in the desktop app. Use the WA.AI window from npm run dev, not a normal browser tab or embedded preview at 127.0.0.1:5173."
        );
        return;
      }
    }

    try {
      const selectedFolder = await api.selectFolder();

      if (!selectedFolder) {
        return;
      }

      const workspace = createWorkspace(selectedFolder);
      const files = await scanWorkspaceFiles(workspace.id, workspace.path);

      setSnapshots((currentSnapshots) => [
        {
          workspace,
          files,
          processRuns: createInitialProcessRuns(workspace.id),
          processTemplates: createInitialProcessTemplates(),
          safety: createInitialSafetyState(),
          layout: createDefaultWorkspaceLayout()
        },
        ...currentSnapshots
      ]);
      setActiveWorkspaceId(workspace.id);
    } catch (error) {
      setOpenWorkspaceError(
        error instanceof Error ? error.message : "Could not open the folder picker."
      );
    }
  }

  async function handleRefreshRegistry(workspace: Workspace) {
    const files = await scanWorkspaceFiles(workspace.id, workspace.path);

    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) =>
        snapshot.workspace.id === workspace.id
          ? {
              ...snapshot,
              workspace: {
                ...snapshot.workspace,
                updatedAt: new Date().toISOString()
              },
              files: mergePinnedFileState(snapshot.files, files)
            }
          : snapshot
      )
    );
  }

  function handleUpdateWorkspace(workspaceId: string, patch: Partial<Workspace>) {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) =>
        snapshot.workspace.id === workspaceId
          ? {
              ...snapshot,
              workspace: {
                ...snapshot.workspace,
                ...patch,
                updatedAt: new Date().toISOString()
              }
            }
          : snapshot
      )
    );
  }

  function handleTogglePin(workspaceId: string, file: FileRegistryEntry) {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) => {
        if (snapshot.workspace.id !== workspaceId) {
          return snapshot;
        }

        const existingPin = snapshot.workspace.pinnedPaths.find((pin) => pin.path === file.path);
        const newPin: PinnedPath = {
          id: crypto.randomUUID(),
          name: file.name,
          path: file.path,
          kind: file.category === "folder" ? "folder" : "file",
          pinnedAt: new Date().toISOString()
        };
        const pinnedPaths = existingPin
          ? snapshot.workspace.pinnedPaths.filter((pin) => pin.path !== file.path)
          : [...snapshot.workspace.pinnedPaths, newPin];

        return {
          ...snapshot,
          workspace: {
            ...snapshot.workspace,
            pinnedPaths,
            updatedAt: new Date().toISOString()
          },
          files: snapshot.files.map((entry) =>
            entry.path === file.path
              ? {
                  ...entry,
                  status: existingPin ? "indexed" : "pinned"
                }
              : entry
          )
        };
      })
    );
  }

  function handleCloseWorkspace(workspaceId: string) {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.filter((snapshot) => snapshot.workspace.id !== workspaceId)
    );
  }

  function setWorkspaceView(workspaceId: string, view: WorkspaceView) {
    setWorkspaceViews((currentViews) => ({
      ...currentViews,
      [workspaceId]: view
    }));
  }

  function activateWorkspaceView(workspaceId: string, view: WorkspaceView) {
    setWorkspaceView(workspaceId, view);
    updateWorkspaceLayout(workspaceId, (layout) => ({
      ...layout,
      shell: {
        ...layout.shell,
        mainBlock: ensureMainBlockTab(
          layout.shell.mainBlock,
          createViewTab(`view:${view}`, viewLabel(view), view)
        )
      }
    }));
  }

  function openFileInMain(workspaceId: string, file: FileRegistryEntry) {
    setWorkspaceView(workspaceId, "files");
    updateWorkspaceLayout(workspaceId, (layout) => ({
      ...layout,
      shell: {
        ...layout.shell,
        mainBlock: ensureMainBlockTab(layout.shell.mainBlock, createFileTab(file))
      }
    }));
  }

  function handleChangeShellLayout(workspaceId: string, shell: AppShellLayoutState) {
    updateWorkspaceLayout(workspaceId, (layout) => ({
      ...layout,
      shell
    }));
  }

  function handleChangeMainBlockLayout(workspaceId: string, mainBlock: MainBlockLayout) {
    updateWorkspaceLayout(workspaceId, (layout) => ({
      ...layout,
      shell: {
        ...layout.shell,
        mainBlock
      }
    }));
  }

  function updateWorkspaceLayout(
    workspaceId: string,
    updateLayout: (layout: WorkspaceSnapshot["layout"]) => WorkspaceSnapshot["layout"]
  ) {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) =>
        snapshot.workspace.id === workspaceId
          ? {
              ...snapshot,
              layout: updateLayout(snapshot.layout),
              workspace: {
                ...snapshot.workspace,
                updatedAt: new Date().toISOString()
              }
            }
          : snapshot
      )
    );
  }

  function handleCoordinatorCommand(command: string): CoordinatorCommandResult | null {
    if (!activeSnapshot || !command.trim()) {
      return null;
    }

    const draft = createCoordinatorDraft(activeSnapshot, command);

    setSnapshots((currentSnapshots) =>
      applyCoordinatorDraft(currentSnapshots, activeSnapshot.workspace.id, draft)
    );
    setCoordinatorResults((currentResults) => ({
      ...currentResults,
      [activeSnapshot.workspace.id]: [
        draft.result,
        ...(currentResults[activeSnapshot.workspace.id] ?? [])
      ]
    }));
    activateWorkspaceView(activeSnapshot.workspace.id, "graph");

    return draft.result;
  }

  async function scanWorkspaceFiles(workspaceId: string, folderPath: string) {
    try {
      setScanError(null);
      const api =
        window.workspaceApi ??
        (typeof window.showDirectoryPicker === "function" ? browserWorkspaceApi : undefined);

      if (typeof api?.scanFolder !== "function") {
        setScanError("Workspace scanning requires the preload bridge (open the app via npm run dev → Electron).");
        return [];
      }
      const scan = await api.scanFolder(folderPath);
      return createFileRegistryEntries(workspaceId, scan.entries);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Unable to scan workspace folder.");
      return [];
    }
  }

  function renderMainBlockTab(tab: MainBlockTab) {
    if (!activeSnapshot) {
      return null;
    }

    const workspaceId = activeSnapshot.workspace.id;
    const files = getWorkspaceFiles(snapshots, workspaceId);
    const processRuns = getWorkspaceProcessRuns(snapshots, workspaceId);

    if (tab.kind === "file") {
      const file = files.find((candidate) => candidate.id === tab.fileId);

      return file ? (
        <FilePreview file={file} workspace={activeSnapshot.workspace} />
      ) : (
        <div className="empty-editor">
          <p className="eyebrow">Missing File</p>
          <h2>{tab.title}</h2>
          <p>This file is no longer in the workspace registry.</p>
        </div>
      );
    }

    if (tab.view === "graph") {
      return (
        <ManualProcessRunner
          processRuns={processRuns}
          onAddStep={(runId, title, input, dependsOn, options) =>
            updateProcessRuns((currentSnapshots) =>
              addProcessStep(currentSnapshots, workspaceId, runId, title, input, dependsOn, options)
            )
          }
          onUpdateEdges={(runId, edges) =>
            updateProcessRuns((currentSnapshots) =>
              updateProcessRunEdges(currentSnapshots, workspaceId, runId, edges)
            )
          }
          onUpdateGraph={(runId, graph) =>
            updateProcessRuns((currentSnapshots) =>
              updateProcessGraphLayout(currentSnapshots, workspaceId, runId, graph)
            )
          }
          onAddEmptyProcessGraph={() => {
            let newRunId = "";
            updateProcessRuns((currentSnapshots) => {
              const next = addEmptyManualProcessRun(currentSnapshots, workspaceId);
              newRunId = next.newRunId;
              return next.snapshots;
            });
            return newRunId;
          }}
          onDuplicateProcessGraph={(runId) => {
            let newRunId: string | null = null;
            updateProcessRuns((currentSnapshots) => {
              const next = duplicateProcessRun(currentSnapshots, workspaceId, runId);
              if (!next) {
                return currentSnapshots;
              }
              newRunId = next.newRunId;
              return next.snapshots;
            });
            return newRunId;
          }}
          onRemoveProcessGraph={(runId) => {
            let focusRunId: string | null = null;
            updateProcessRuns((currentSnapshots) => {
              const next = removeProcessRun(currentSnapshots, workspaceId, runId);
              if (!next) {
                return currentSnapshots;
              }
              focusRunId = next.focusRunId;
              return next.snapshots;
            });
            return focusRunId;
          }}
        />
      );
    }

    if (tab.view === "safety") {
      return (
        <SafetyCenter
          safety={activeSnapshot.safety}
          onArchiveAction={(actionId) =>
            updateSafety((currentSnapshots) => archiveSafetyAction(currentSnapshots, workspaceId, actionId))
          }
          onApplyAction={(actionId) =>
            updateSafety((currentSnapshots) => applySafetyAction(currentSnapshots, workspaceId, actionId))
          }
          onApproveAction={(actionId) =>
            updateSafety((currentSnapshots) => approveSafetyAction(currentSnapshots, workspaceId, actionId))
          }
          onCreateBackup={(kind, reason) =>
            updateSafety((currentSnapshots) => createBackup(currentSnapshots, workspaceId, kind, reason))
          }
          onCreateDemoAction={(risk) =>
            updateSafety((currentSnapshots) => createDemoSafetyAction(currentSnapshots, workspaceId, risk))
          }
          onRejectAction={(actionId) =>
            updateSafety((currentSnapshots) => rejectSafetyAction(currentSnapshots, workspaceId, actionId))
          }
          onResetAppState={() =>
            updateSafety((currentSnapshots) => resetSafetyAppState(currentSnapshots, workspaceId))
          }
          onRestoreBackup={(backupId) =>
            updateSafety((currentSnapshots) => restoreBackup(currentSnapshots, workspaceId, backupId))
          }
          onSetMode={(mode) =>
            updateSafety((currentSnapshots) => setSafetyMode(currentSnapshots, workspaceId, mode))
          }
        />
      );
    }

    if (tab.view === "menu") {
      return (
        <WorkspaceDashboard
          error={scanError}
          files={files}
          processRuns={processRuns}
          workspace={activeSnapshot.workspace}
          onClose={() => handleCloseWorkspace(workspaceId)}
          onRefreshRegistry={() => handleRefreshRegistry(activeSnapshot.workspace)}
          onShowWorkbench={() => activateWorkspaceView(workspaceId, "files")}
          onTogglePin={(file) => handleTogglePin(workspaceId, file)}
          onUpdateWorkspace={(patch) => handleUpdateWorkspace(workspaceId, patch)}
        />
      );
    }

    return (
      <div className="empty-editor">
        <p className="eyebrow">Files</p>
        <h2>{activeSnapshot.workspace.name}</h2>
        <p>Select a file from the explorer to open it in this work area.</p>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <ApplicationMenuBar
        onOpenPreferences={() => setPreferencesOpen(true)}
        onOpenWorkspace={handleOpenWorkspace}
      />
      <PreferencesDialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />

      <nav className="workspace-tabs" aria-label="Open workspaces">
        {workspaces.length === 0 ? (
          <span className="tab-empty">No workspaces open</span>
        ) : (
          workspaces.map((workspace) => (
            <button
              className={`workspace-tab ${workspace.id === activeWorkspaceId ? "active" : ""}`}
              key={workspace.id}
              type="button"
              onClick={() => setActiveWorkspaceId(workspace.id)}
            >
              <span>{workspace.name}</span>
              <span className="status-dot" aria-label={`${workspace.status} workspace`} />
            </button>
          ))
        )}
      </nav>

      <section className="workspace-frame" id="workspace">
        {activeSnapshot ? (
          <div className="workspace-mode-layout">
            <ActivityBar
              activeView={workspaceViews[activeSnapshot.workspace.id] ?? "files"}
              onChangeView={(view) => activateWorkspaceView(activeSnapshot.workspace.id, view)}
            />
            <div className="workspace-mode-content">
              <AppShellLayout
                layout={activeSnapshot.layout.shell}
                explorer={
                  <ExplorerRail
                    activeFileId={getActiveFileId(activeSnapshot.layout.shell.mainBlock)}
                    files={getWorkspaceFiles(snapshots, activeSnapshot.workspace.id)}
                    workspace={activeSnapshot.workspace}
                    onOpenFile={(file) => openFileInMain(activeSnapshot.workspace.id, file)}
                    onRefreshRegistry={() => handleRefreshRegistry(activeSnapshot.workspace)}
                  />
                }
                main={
                  <MainBlockComposer
                    layout={activeSnapshot.layout.shell.mainBlock}
                    renderTab={renderMainBlockTab}
                    onChangeLayout={(mainBlock) =>
                      handleChangeMainBlockLayout(activeSnapshot.workspace.id, mainBlock)
                    }
                  />
                }
                chat={
                  <ChatRail
                    coordinatorResults={coordinatorResults[activeSnapshot.workspace.id] ?? []}
                    processRuns={getWorkspaceProcessRuns(snapshots, activeSnapshot.workspace.id)}
                    workspace={activeSnapshot.workspace}
                    onSubmitCommand={handleCoordinatorCommand}
                  />
                }
                onChangeLayout={(shell) => handleChangeShellLayout(activeSnapshot.workspace.id, shell)}
              />
            </div>
          </div>
        ) : (
          <EmptyWorkspace errorMessage={openWorkspaceError} onOpenWorkspace={handleOpenWorkspace} />
        )}
      </section>
    </main>
  );

  function updateSafety(
    updateSnapshots: (currentSnapshots: WorkspaceSnapshot[]) => WorkspaceSnapshot[]
  ) {
    setSnapshots(updateSnapshots);
  }

  function updateProcessRuns(
    updateSnapshots: (currentSnapshots: WorkspaceSnapshot[]) => WorkspaceSnapshot[]
  ) {
    setSnapshots(updateSnapshots);
  }
}

function ensureMainBlockTab(layout: MainBlockLayout, tab: MainBlockTab): MainBlockLayout {
  const activeGroupId = layout.activeGroupId;

  return {
    ...layout,
    groups: layout.groups.map((group) => {
      if (group.id !== activeGroupId) {
        return group;
      }

      const tabs = group.tabs.some((currentTab) => currentTab.id === tab.id)
        ? group.tabs
        : [...group.tabs, tab];

      return {
        ...group,
        tabs,
        activeTabId: tab.id
      };
    })
  };
}

function getActiveFileId(layout: MainBlockLayout): string | null {
  const activeGroup = layout.groups.find((group) => group.id === layout.activeGroupId);
  const activeTab = activeGroup?.tabs.find((tab) => tab.id === activeGroup.activeTabId);

  return activeTab?.kind === "file" ? activeTab.fileId ?? null : null;
}

function viewLabel(view: WorkspaceView): string {
  if (view === "menu") {
    return "Workspace";
  }

  if (view === "graph") {
    return "Process Graph";
  }

  if (view === "safety") {
    return "Safety";
  }

  return "Files";
}
