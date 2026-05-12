import type { BackupRecord, SafetyAction, SafetyMode, SafetyState } from "../../../../shared/safety";

type SafetyCenterProps = {
  safety: SafetyState;
  onArchiveAction: (actionId: string) => void;
  onApplyAction: (actionId: string) => void;
  onApproveAction: (actionId: string) => void;
  onCreateBackup: (kind: BackupRecord["kind"], reason: string) => void;
  onCreateDemoAction: (risk: SafetyAction["risk"]) => void;
  onRejectAction: (actionId: string) => void;
  onResetAppState: () => void;
  onRestoreBackup: (backupId: string) => void;
  onSetMode: (mode: SafetyMode) => void;
};

export function SafetyCenter({
  safety,
  onArchiveAction,
  onApplyAction,
  onApproveAction,
  onCreateBackup,
  onCreateDemoAction,
  onRejectAction,
  onResetAppState,
  onRestoreBackup,
  onSetMode
}: SafetyCenterProps) {
  return (
    <section className="safety-center">
      <header className="safety-header">
        <div>
          <p className="eyebrow">Safety Core</p>
          <h2>Review, approve, backup, and recover</h2>
          <p>
            This mode models safety state without changing real files. It is the approval and
            recovery foundation that real file operations will use later.
          </p>
        </div>
        <div className="mode-switch">
          <button
            className={safety.mode === "demo" ? "active" : ""}
            type="button"
            onClick={() => onSetMode("demo")}
          >
            Demo
          </button>
          <button
            className={safety.mode === "live" ? "active" : ""}
            type="button"
            onClick={() => onSetMode("live")}
          >
            Live
          </button>
        </div>
      </header>

      <div className="safety-grid">
        <article className="safety-card">
          <span>Mode</span>
          <strong>{safety.mode}</strong>
        </article>
        <article className="safety-card">
          <span>Actions</span>
          <strong>{safety.actions.length}</strong>
        </article>
        <article className="safety-card">
          <span>Backups</span>
          <strong>{safety.backups.length}</strong>
        </article>
        <article className="safety-card">
          <span>Pending Approval</span>
          <strong>{safety.actions.filter((action) => action.status === "proposed").length}</strong>
        </article>
      </div>

      <section className="safety-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Demo Actions</p>
            <h3>Create proposed actions</h3>
          </div>
        </div>
        <div className="safety-actions">
          <button className="secondary-button" type="button" onClick={() => onCreateDemoAction("low")}>
            Propose Safe Action
          </button>
          <button
            className="secondary-button danger-outline"
            type="button"
            onClick={() => onCreateDemoAction("high")}
          >
            Propose Risky File Action
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onCreateBackup("manual", "User-created manual safety checkpoint")}
          >
            Create Manual Backup
          </button>
          <button className="secondary-button danger-outline" type="button" onClick={onResetAppState}>
            Reset Safety App State
          </button>
        </div>
      </section>

      <section className="safety-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Action Log</p>
            <h3>Proposed, accepted, applied, rejected, archived</h3>
          </div>
        </div>
        <div className="safety-list">
          {safety.actions.length === 0 ? (
            <p className="muted">No safety actions yet. Create a demo action to test the flow.</p>
          ) : (
            safety.actions.map((action) => (
              <SafetyActionRow
                action={action}
                key={action.id}
                onArchiveAction={onArchiveAction}
                onApplyAction={onApplyAction}
                onApproveAction={onApproveAction}
                onRejectAction={onRejectAction}
              />
            ))
          )}
        </div>
      </section>

      <section className="safety-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Backups</p>
            <h3>Manual and automatic checkpoints</h3>
          </div>
        </div>
        <div className="safety-list">
          {safety.backups.length === 0 ? (
            <p className="muted">No backup records yet.</p>
          ) : (
            safety.backups.map((backup) => (
              <article className="backup-row" key={backup.id}>
                <div>
                  <strong>{backup.label}</strong>
                  <p>{backup.reason}</p>
                  <small>
                    {backup.kind} - {new Date(backup.createdAt).toLocaleString()}
                    {backup.restoredAt
                      ? ` - restored ${new Date(backup.restoredAt).toLocaleString()}`
                      : ""}
                  </small>
                </div>
                <button className="text-button" type="button" onClick={() => onRestoreBackup(backup.id)}>
                  Restore
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

type SafetyActionRowProps = {
  action: SafetyAction;
  onArchiveAction: (actionId: string) => void;
  onApplyAction: (actionId: string) => void;
  onApproveAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
};

function SafetyActionRow({
  action,
  onArchiveAction,
  onApplyAction,
  onApproveAction,
  onRejectAction
}: SafetyActionRowProps) {
  return (
    <article className={`safety-action-row risk-${action.risk}`}>
      <div>
        <div className="safety-row-title">
          <strong>{action.title}</strong>
          <span>{action.status}</span>
          <span>{action.risk} risk</span>
        </div>
        <p>{action.description}</p>
        <small>
          {action.type} - {action.requiresApproval ? "approval required" : "low-risk approval optional"}
          {action.backupId ? " - backup linked" : ""}
        </small>
      </div>
      <div className="row-actions">
        {action.status === "proposed" ? (
          <>
            <button className="text-button" type="button" onClick={() => onApproveAction(action.id)}>
              Approve
            </button>
            <button className="text-button danger-text" type="button" onClick={() => onRejectAction(action.id)}>
              Reject
            </button>
          </>
        ) : null}
        {action.status === "accepted" ? (
          <button className="text-button" type="button" onClick={() => onApplyAction(action.id)}>
            Apply
          </button>
        ) : null}
        {action.status !== "archived" ? (
          <button className="text-button" type="button" onClick={() => onArchiveAction(action.id)}>
            Archive
          </button>
        ) : null}
      </div>
    </article>
  );
}
