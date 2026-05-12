import { useEffect, useMemo, useState } from "react";
import type {
  ProcessStepStatus,
  WorkspaceProcessRun,
  WorkspaceProcessStep,
  WorkspaceProcessTemplate
} from "../../../../shared/processRunner";

type ManualProcessRunnerProps = {
  processRuns: WorkspaceProcessRun[];
  processTemplates: WorkspaceProcessTemplate[];
  workspaceName: string;
  onAddStep: (runId: string, title: string, input: string, dependsOn: string[]) => void;
  onCreateRun: (title: string, templateId: string | null) => void;
  onSetStepStatus: (runId: string, stepId: string, status: ProcessStepStatus) => void;
  onUpdateStepDependencies: (runId: string, stepId: string, dependsOn: string[]) => void;
  onUpdateStepFields: (
    runId: string,
    stepId: string,
    patch: Pick<WorkspaceProcessStep, "input" | "output">
  ) => void;
};

const STEP_STATUSES: ProcessStepStatus[] = ["waiting", "running", "complete", "failed", "blocked"];

export function ManualProcessRunner({
  processRuns,
  processTemplates,
  workspaceName,
  onAddStep,
  onCreateRun,
  onSetStepStatus,
  onUpdateStepDependencies,
  onUpdateStepFields
}: ManualProcessRunnerProps) {
  const [activeRunId, setActiveRunId] = useState<string | null>(processRuns[0]?.id ?? null);
  const [newRunTitle, setNewRunTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepInput, setNewStepInput] = useState("");
  const [newStepDependencies, setNewStepDependencies] = useState<string[]>([]);

  const activeRun = useMemo(
    () => processRuns.find((run) => run.id === activeRunId) ?? processRuns[0] ?? null,
    [activeRunId, processRuns]
  );

  useEffect(() => {
    if (!activeRun && processRuns[0]) {
      setActiveRunId(processRuns[0].id);
    }
  }, [activeRun, processRuns]);

  function handleCreateRun() {
    const template = processTemplates.find((candidate) => candidate.id === selectedTemplateId) ?? null;
    const title = newRunTitle.trim() || template?.title || "Manual process run";

    onCreateRun(title, template?.id ?? null);
    setNewRunTitle("");
    setSelectedTemplateId("blank");
  }

  function handleAddStep() {
    if (!activeRun || !newStepTitle.trim()) {
      return;
    }

    onAddStep(activeRun.id, newStepTitle.trim(), newStepInput.trim(), newStepDependencies);
    setNewStepTitle("");
    setNewStepInput("");
    setNewStepDependencies([]);
  }

  return (
    <section className="process-runner">
      <header className="process-runner-header">
        <div>
          <p className="eyebrow">Manual Process Runner</p>
          <h2>Visible process work for {workspaceName}</h2>
          <p>
            Create reusable run structures, capture step inputs and outputs, and advance work through
            waiting, running, complete, failed, and blocked states.
          </p>
        </div>
        <div className="process-runner-create">
          <input
            aria-label="New process run title"
            placeholder="New run title"
            value={newRunTitle}
            onChange={(event) => setNewRunTitle(event.target.value)}
          />
          <select
            aria-label="Process template"
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
          >
            <option value="blank">Blank run</option>
            {processTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
          <button className="primary-button" type="button" onClick={handleCreateRun}>
            Create Run
          </button>
        </div>
      </header>

      <div className="process-runner-layout">
        <aside className="process-run-list" aria-label="Process runs">
          <div className="panel-heading compact-heading">
            <div>
              <p className="eyebrow">Runs</p>
              <h3>History</h3>
            </div>
            <span className="pill">{processRuns.length}</span>
          </div>
          {processRuns.length === 0 ? (
            <p className="muted">Create a manual run to start modeling work.</p>
          ) : (
            processRuns.map((run) => (
              <button
                className={`process-run-list-item ${run.id === activeRun?.id ? "active" : ""}`}
                key={run.id}
                type="button"
                onClick={() => setActiveRunId(run.id)}
              >
                <strong>{run.title}</strong>
                <span>{run.status}</span>
                <small>
                  {run.steps.length} steps - {new Date(run.updatedAt).toLocaleString()}
                </small>
              </button>
            ))
          )}
        </aside>

        {activeRun ? (
          <div className="process-run-detail">
            <section className="process-run-summary">
              <div>
                <p className="eyebrow">Active Run</p>
                <h3>{activeRun.title}</h3>
                <p>
                  {activeRun.mode} mode - {activeRun.status} - {activeRun.steps.length} visible steps
                </p>
              </div>
              <div className="process-run-stats">
                {STEP_STATUSES.map((status) => (
                  <span key={status}>
                    {status}: {activeRun.steps.filter((step) => step.status === status).length}
                  </span>
                ))}
              </div>
            </section>

            <section className="process-step-composer">
              <div className="panel-heading compact-heading">
                <div>
                  <p className="eyebrow">Manual Step</p>
                  <h3>Add work item</h3>
                </div>
              </div>
              <div className="process-step-form">
                <input
                  aria-label="New process step title"
                  placeholder="Step title"
                  value={newStepTitle}
                  onChange={(event) => setNewStepTitle(event.target.value)}
                />
                <textarea
                  aria-label="New process step input"
                  placeholder="Inputs, instructions, or acceptance criteria for this step"
                  value={newStepInput}
                  onChange={(event) => setNewStepInput(event.target.value)}
                />
                <DependencyChecklist
                  currentStepId={null}
                  dependsOn={newStepDependencies}
                  steps={activeRun.steps}
                  onChange={setNewStepDependencies}
                />
                <button className="secondary-button" type="button" onClick={handleAddStep}>
                  Add Step
                </button>
              </div>
            </section>

            <section className="process-step-grid" aria-label="Process steps">
              {activeRun.steps.map((step, index) => (
                <ProcessStepCard
                  index={index}
                  key={step.id}
                  run={activeRun}
                  step={step}
                  onSetStepStatus={onSetStepStatus}
                  onUpdateStepDependencies={onUpdateStepDependencies}
                  onUpdateStepFields={onUpdateStepFields}
                />
              ))}
            </section>

            <section className="process-history-panel">
              <div className="panel-heading compact-heading">
                <div>
                  <p className="eyebrow">Run History</p>
                  <h3>Timeline</h3>
                </div>
              </div>
              <div className="process-history-list">
                {activeRun.history.map((entry) => (
                  <article className="process-history-item" key={entry.id}>
                    <strong>{entry.message}</strong>
                    <small>{new Date(entry.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="process-empty-state">
            <p className="eyebrow">No Runs</p>
            <h3>Create a manual run to begin.</h3>
          </div>
        )}
      </div>
    </section>
  );
}

type ProcessStepCardProps = {
  index: number;
  run: WorkspaceProcessRun;
  step: WorkspaceProcessStep;
  onSetStepStatus: (runId: string, stepId: string, status: ProcessStepStatus) => void;
  onUpdateStepDependencies: (runId: string, stepId: string, dependsOn: string[]) => void;
  onUpdateStepFields: (
    runId: string,
    stepId: string,
    patch: Pick<WorkspaceProcessStep, "input" | "output">
  ) => void;
};

function ProcessStepCard({
  index,
  run,
  step,
  onSetStepStatus,
  onUpdateStepDependencies,
  onUpdateStepFields
}: ProcessStepCardProps) {
  const dependencyLabels = step.dependsOn
    .map((dependencyId) => run.steps.find((candidate) => candidate.id === dependencyId)?.title)
    .filter(Boolean);

  return (
    <article className={`process-step-card status-${step.status}`}>
      <div className="process-step-title">
        <span className="node-index">{index + 1}</span>
        <div>
          <h4>{step.title}</h4>
          <small>{dependencyLabels.length > 0 ? `After ${dependencyLabels.join(", ")}` : "No dependencies"}</small>
        </div>
      </div>

      <div className="process-status-row" aria-label={`${step.title} status`}>
        {STEP_STATUSES.map((status) => (
          <button
            className={step.status === status ? "active" : ""}
            key={status}
            type="button"
            onClick={() => onSetStepStatus(run.id, step.id, status)}
          >
            {status}
          </button>
        ))}
      </div>

      <label>
        Input
        <textarea
          value={step.input}
          onChange={(event) =>
            onUpdateStepFields(run.id, step.id, {
              input: event.target.value,
              output: step.output
            })
          }
        />
      </label>
      <label>
        Output
        <textarea
          value={step.output}
          onChange={(event) =>
            onUpdateStepFields(run.id, step.id, {
              input: step.input,
              output: event.target.value
            })
          }
        />
      </label>
      <DependencyChecklist
        currentStepId={step.id}
        dependsOn={step.dependsOn}
        steps={run.steps}
        onChange={(dependsOn) => onUpdateStepDependencies(run.id, step.id, dependsOn)}
      />
    </article>
  );
}

type DependencyChecklistProps = {
  currentStepId: string | null;
  dependsOn: string[];
  steps: WorkspaceProcessStep[];
  onChange: (dependsOn: string[]) => void;
};

function DependencyChecklist({ currentStepId, dependsOn, steps, onChange }: DependencyChecklistProps) {
  const dependencyOptions = steps.filter((step) => step.id !== currentStepId);

  if (dependencyOptions.length === 0) {
    return <p className="muted compact">No dependency options yet.</p>;
  }

  return (
    <fieldset className="dependency-checklist">
      <legend>Depends on</legend>
      {dependencyOptions.map((step) => (
        <label key={step.id}>
          <input
            checked={dependsOn.includes(step.id)}
            type="checkbox"
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...dependsOn, step.id]
                  : dependsOn.filter((dependencyId) => dependencyId !== step.id)
              )
            }
          />
          <span>{step.title}</span>
        </label>
      ))}
    </fieldset>
  );
}
