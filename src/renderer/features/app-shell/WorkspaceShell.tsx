import { useEffect, useMemo, useState } from "react";
import type { FileRegistryEntry } from "../../../shared/fileRegistry";
import type { PinnedPath, Workspace } from "../../../shared/workspace";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import { createFileRegistryEntries } from "../file-registry/fileRegistryFactory";
import { mergePinnedFileState } from "../file-registry/fileRegistryState";
import { ManualProcessRunner } from "../process-runner/components/ManualProcessRunner";
import {
  addProcessStep,
  createProcessRunFromTemplate,
  setProcessStepStatus,
  updateProcessStepDependencies,
  updateProcessStepFields
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
  getWorkspaceProcessTemplates,
  getWorkspaces,
  readWorkspaceSnapshots,
  writeWorkspaceSnapshots
} from "../workspaces/workspaceStorage";
import { ActivityBar, type WorkspaceView } from "./components/ActivityBar";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { WorkspaceWorkbench } from "./components/WorkspaceWorkbench";

export function WorkspaceShell() {
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>(readWorkspaceSnapshots);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => snapshots[0]?.workspace.id ?? null
  );
  const [workspaceViews, setWorkspaceViews] = useState<Record<string, WorkspaceView>>({});
  const [scanError, setScanError] = useState<string | null>(null);

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
    const selectedFolder = await window.workspaceApi.selectFolder();

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
        safety: createInitialSafetyState()
      },
      ...currentSnapshots
    ]);
    setActiveWorkspaceId(workspace.id);
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

  async function scanWorkspaceFiles(workspaceId: string, folderPath: string) {
    try {
      setScanError(null);
      const scan = await window.workspaceApi.scanFolder(folderPath);
      return createFileRegistryEntries(workspaceId, scan.entries);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Unable to scan workspace folder.");
      return [];
    }
  }

  return (
    <main className="app-shell">
      <header className="app-menu-bar">
        <nav aria-label="Application menu">
          <button type="button">File</button>
          <button type="button">Edit</button>
          <button type="button">Selection</button>
          <button type="button">View</button>
          <button type="button">Go</button>
          <button type="button">Run</button>
          <button type="button">Terminal</button>
          <button type="button">Help</button>
        </nav>
        <strong>WA.AI</strong>
        <button className="primary-button" type="button" onClick={handleOpenWorkspace}>
          Open Folder
        </button>
      </header>

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
              onChangeView={(view) => setWorkspaceView(activeSnapshot.workspace.id, view)}
            />
            <div className="workspace-mode-content">
              {(workspaceViews[activeSnapshot.workspace.id] ?? "files") === "menu" ? (
                <WorkspaceDashboard
                  error={scanError}
                  files={getWorkspaceFiles(snapshots, activeSnapshot.workspace.id)}
                  processRuns={getWorkspaceProcessRuns(snapshots, activeSnapshot.workspace.id)}
                  workspace={activeSnapshot.workspace}
                  onClose={() => handleCloseWorkspace(activeSnapshot.workspace.id)}
                  onRefreshRegistry={() => handleRefreshRegistry(activeSnapshot.workspace)}
                  onShowWorkbench={() => setWorkspaceView(activeSnapshot.workspace.id, "files")}
                  onTogglePin={(file) => handleTogglePin(activeSnapshot.workspace.id, file)}
                  onUpdateWorkspace={(patch) =>
                    handleUpdateWorkspace(activeSnapshot.workspace.id, patch)
                  }
                />
              ) : (workspaceViews[activeSnapshot.workspace.id] ?? "files") === "graph" ? (
                <ManualProcessRunner
                  processRuns={getWorkspaceProcessRuns(snapshots, activeSnapshot.workspace.id)}
                  processTemplates={getWorkspaceProcessTemplates(snapshots, activeSnapshot.workspace.id)}
                  workspaceName={activeSnapshot.workspace.name}
                  onAddStep={(runId, title, input, dependsOn) =>
                    updateProcessRuns((currentSnapshots) =>
                      addProcessStep(
                        currentSnapshots,
                        activeSnapshot.workspace.id,
                        runId,
                        title,
                        input,
                        dependsOn
                      )
                    )
                  }
                  onCreateRun={(title, templateId) =>
                    updateProcessRuns((currentSnapshots) =>
                      createProcessRunFromTemplate(
                        currentSnapshots,
                        activeSnapshot.workspace.id,
                        title,
                        getWorkspaceProcessTemplates(currentSnapshots, activeSnapshot.workspace.id).find(
                          (template) => template.id === templateId
                        ) ?? null
                      )
                    )
                  }
                  onSetStepStatus={(runId, stepId, status) =>
                    updateProcessRuns((currentSnapshots) =>
                      setProcessStepStatus(
                        currentSnapshots,
                        activeSnapshot.workspace.id,
                        runId,
                        stepId,
                        status
                      )
                    )
                  }
                  onUpdateStepDependencies={(runId, stepId, dependsOn) =>
                    updateProcessRuns((currentSnapshots) =>
                      updateProcessStepDependencies(
                        currentSnapshots,
                        activeSnapshot.workspace.id,
                        runId,
                        stepId,
                        dependsOn
                      )
                    )
                  }
                  onUpdateStepFields={(runId, stepId, patch) =>
                    updateProcessRuns((currentSnapshots) =>
                      updateProcessStepFields(
                        currentSnapshots,
                        activeSnapshot.workspace.id,
                        runId,
                        stepId,
                        patch
                      )
                    )
                  }
                />
              ) : (workspaceViews[activeSnapshot.workspace.id] ?? "files") === "safety" ? (
                <SafetyCenter
                  safety={activeSnapshot.safety}
                  onArchiveAction={(actionId) =>
                    updateSafety((currentSnapshots) =>
                      archiveSafetyAction(currentSnapshots, activeSnapshot.workspace.id, actionId)
                    )
                  }
                  onApplyAction={(actionId) =>
                    updateSafety((currentSnapshots) =>
                      applySafetyAction(currentSnapshots, activeSnapshot.workspace.id, actionId)
                    )
                  }
                  onApproveAction={(actionId) =>
                    updateSafety((currentSnapshots) =>
                      approveSafetyAction(currentSnapshots, activeSnapshot.workspace.id, actionId)
                    )
                  }
                  onCreateBackup={(kind, reason) =>
                    updateSafety((currentSnapshots) =>
                      createBackup(currentSnapshots, activeSnapshot.workspace.id, kind, reason)
                    )
                  }
                  onCreateDemoAction={(risk) =>
                    updateSafety((currentSnapshots) =>
                      createDemoSafetyAction(currentSnapshots, activeSnapshot.workspace.id, risk)
                    )
                  }
                  onRejectAction={(actionId) =>
                    updateSafety((currentSnapshots) =>
                      rejectSafetyAction(currentSnapshots, activeSnapshot.workspace.id, actionId)
                    )
                  }
                  onResetAppState={() =>
                    updateSafety((currentSnapshots) =>
                      resetSafetyAppState(currentSnapshots, activeSnapshot.workspace.id)
                    )
                  }
                  onRestoreBackup={(backupId) =>
                    updateSafety((currentSnapshots) =>
                      restoreBackup(currentSnapshots, activeSnapshot.workspace.id, backupId)
                    )
                  }
                  onSetMode={(mode) =>
                    updateSafety((currentSnapshots) =>
                      setSafetyMode(currentSnapshots, activeSnapshot.workspace.id, mode)
                    )
                  }
                />
              ) : (
                <WorkspaceWorkbench
                  files={getWorkspaceFiles(snapshots, activeSnapshot.workspace.id)}
                  processRuns={getWorkspaceProcessRuns(snapshots, activeSnapshot.workspace.id)}
                  workspace={activeSnapshot.workspace}
                  onRefreshRegistry={() => handleRefreshRegistry(activeSnapshot.workspace)}
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyWorkspace onOpenWorkspace={handleOpenWorkspace} />
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
