import type { FileCategory } from "../../../shared/fileRegistry";
import type { SafetyAction, SafetyActionType } from "../../../shared/safety";
import type { WorkspaceSnapshot } from "../../../shared/workspaceSnapshot";
import { createCoordinatorProcessRun, type ProcessStepDraft } from "../process-runner/processRunFactory";
import { createSafetyAction } from "../safety/safetyFactory";

export type CoordinatorToolName = "workspace.inspect" | "workflow.plan" | "safety.propose-actions";

export type CoordinatorToolUse = {
  id: string;
  name: CoordinatorToolName;
  label: string;
  input: string;
  output: string;
  status: "complete";
  createdAt: string;
};

export type CoordinatorCommandResult = {
  id: string;
  command: string;
  message: string;
  runId: string;
  runTitle: string;
  safetyActionIds: string[];
  toolUses: CoordinatorToolUse[];
  createdAt: string;
};

type CoordinatorDraft = {
  result: CoordinatorCommandResult;
  run: ReturnType<typeof createCoordinatorProcessRun>;
  safetyActions: SafetyAction[];
};

export function createCoordinatorDraft(snapshot: WorkspaceSnapshot, command: string): CoordinatorDraft {
  const now = new Date().toISOString();
  const trimmedCommand = command.trim();
  const workspaceSummary = summarizeWorkspace(snapshot);
  const proposedActions = createProposedActions(snapshot.workspace.id, trimmedCommand);
  const steps = createCoordinatorSteps(trimmedCommand, workspaceSummary, proposedActions);
  const run = createCoordinatorProcessRun(
    snapshot.workspace.id,
    createRunTitle(trimmedCommand),
    steps
  );
  const toolUses: CoordinatorToolUse[] = [
    createToolUse(
      "workspace.inspect",
      "Inspect workspace",
      snapshot.workspace.name,
      workspaceSummary,
      now
    ),
    createToolUse(
      "workflow.plan",
      "Draft controlled workflow",
      trimmedCommand,
      `${steps.length} graph nodes drafted for review before execution.`,
      now
    ),
    createToolUse(
      "safety.propose-actions",
      "Generate safety proposals",
      trimmedCommand,
      proposedActions.length > 0
        ? `${proposedActions.length} proposed action${proposedActions.length === 1 ? "" : "s"} created.`
        : "No risky action detected; the run stays read-only until the user asks for execution.",
      now
    )
  ];

  return {
    result: {
      id: crypto.randomUUID(),
      command: trimmedCommand,
      message:
        "I created a demo coordinator run with inspectable tool usage, dependencies, and approval checkpoints. No real workspace changes were applied.",
      runId: run.id,
      runTitle: run.title,
      safetyActionIds: proposedActions.map((action) => action.id),
      toolUses,
      createdAt: now
    },
    run,
    safetyActions: proposedActions
  };
}

export function applyCoordinatorDraft(
  snapshots: WorkspaceSnapshot[],
  workspaceId: string,
  draft: CoordinatorDraft
): WorkspaceSnapshot[] {
  return snapshots.map((snapshot) =>
    snapshot.workspace.id === workspaceId
      ? {
          ...snapshot,
          processRuns: [draft.run, ...snapshot.processRuns],
          safety: {
            ...snapshot.safety,
            actions: [...draft.safetyActions, ...snapshot.safety.actions]
          },
          workspace: {
            ...snapshot.workspace,
            updatedAt: new Date().toISOString()
          }
        }
      : snapshot
  );
}

function createCoordinatorSteps(
  command: string,
  workspaceSummary: string,
  proposedActions: SafetyAction[]
): ProcessStepDraft[] {
  const actionSummary =
    proposedActions.length > 0
      ? proposedActions.map((action) => `${action.title} (${action.risk} risk)`).join("\n")
      : "No proposed changes yet. Continue in read-only inspection mode.";

  return [
    {
      title: "Coordinator intake",
      kind: "agent",
      agentRole: "Coordinator",
      input: command,
      output: "Request captured and converted into a supervised workflow draft.",
      status: "complete",
      dependsOn: []
    },
    {
      title: "Inspect workspace context",
      kind: "tool",
      agentRole: "Coordinator",
      toolName: "workspace.inspect",
      input: "Read workspace metadata, file registry summary, pinned paths, and instructions.",
      output: workspaceSummary,
      status: "complete",
      dependsOn: [0]
    },
    {
      title: "Draft task plan",
      kind: "tool",
      agentRole: "Coordinator",
      toolName: "workflow.plan",
      input: "Break the request into visible steps that can be interrupted or reviewed.",
      output: createPlanSummary(command),
      status: "complete",
      dependsOn: [1]
    },
    {
      title: "Propose controlled actions",
      kind: "tool",
      agentRole: "Coordinator",
      toolName: "safety.propose-actions",
      input: "Identify actions that would need approval before touching files or external systems.",
      output: actionSummary,
      proposedActionIds: proposedActions.map((action) => action.id),
      status: "complete",
      dependsOn: [1]
    },
    {
      title: "User approval checkpoint",
      kind: "approval",
      agentRole: "User",
      input: "Review the plan, node outputs, and proposed safety actions before any live execution.",
      output: "Waiting for explicit user approval or clarification.",
      proposedActionIds: proposedActions.map((action) => action.id),
      dependsOn: [2, 3]
    },
    {
      title: "Manual execution handoff",
      kind: "manual",
      input: "After approval, perform or refine the visible steps under the manual process runner.",
      output: "Pending approval.",
      dependsOn: [4]
    }
  ];
}

function createProposedActions(workspaceId: string, command: string): SafetyAction[] {
  const normalizedCommand = command.toLowerCase();
  const riskyFileRequest = /\b(edit|change|update|delete|remove|rename|move|write|rewrite|replace|apply)\b/.test(
    normalizedCommand
  );
  const browserRequest = /\b(browser|website|portal|form|submit|upload|download|payment|send)\b/.test(
    normalizedCommand
  );
  const proposals: SafetyAction[] = [];

  if (riskyFileRequest) {
    proposals.push(
      createSafetyAction({
        workspaceId,
        type: "file-change",
        risk: "high",
        title: "Review file change proposal",
        description:
          "The coordinator detected a request that may alter local files. Approve only after reviewing the generated plan and backups."
      })
    );
  }

  if (browserRequest) {
    proposals.push(
      createSafetyAction({
        workspaceId,
        type: inferBrowserActionType(normalizedCommand),
        risk: normalizedCommand.includes("submit") || normalizedCommand.includes("payment") ? "high" : "medium",
        title: "Review browser automation proposal",
        description:
          "The coordinator detected possible browser or portal work. Demo-mode planning is allowed, but live submission needs approval."
      })
    );
  }

  if (proposals.length === 0) {
    proposals.push(
      createSafetyAction({
        workspaceId,
        type: "backup",
        risk: "low",
        title: "Read-only planning checkpoint",
        description:
          "The coordinator can inspect workspace context and prepare a plan without changing files or external systems."
      })
    );
  }

  return proposals;
}

function summarizeWorkspace(snapshot: WorkspaceSnapshot): string {
  const categoryCounts = snapshot.files.reduce<Record<FileCategory, number>>(
    (counts, file) => ({
      ...counts,
      [file.category]: counts[file.category] + 1
    }),
    {
      document: 0,
      spreadsheet: 0,
      pdf: 0,
      image: 0,
      text: 0,
      folder: 0,
      other: 0
    }
  );
  const fileSummary = Object.entries(categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");
  const instructions = snapshot.workspace.instructions.trim();

  return [
    `${snapshot.workspace.name}: ${snapshot.files.length} indexed item${snapshot.files.length === 1 ? "" : "s"}.`,
    fileSummary ? `Registry mix: ${fileSummary}.` : "Registry is empty; refresh files before detailed automation.",
    `${snapshot.workspace.pinnedPaths.length} pinned path${snapshot.workspace.pinnedPaths.length === 1 ? "" : "s"}.`,
    instructions ? `Workspace instructions: ${instructions}` : "No workspace instructions set."
  ].join("\n");
}

function createPlanSummary(command: string): string {
  return [
    "1. Confirm the requested outcome and missing inputs.",
    "2. Inspect workspace context with read-only tools.",
    "3. Draft proposed changes or browser actions as reviewable actions.",
    "4. Pause at the approval checkpoint before live execution.",
    `Original request: ${command}`
  ].join("\n");
}

function createToolUse(
  name: CoordinatorToolName,
  label: string,
  input: string,
  output: string,
  createdAt: string
): CoordinatorToolUse {
  return {
    id: crypto.randomUUID(),
    name,
    label,
    input,
    output,
    status: "complete",
    createdAt
  };
}

function createRunTitle(command: string): string {
  const cleanedCommand = command.replace(/\s+/g, " ").trim();

  if (!cleanedCommand) {
    return "Coordinator workspace plan";
  }

  return cleanedCommand.length > 54
    ? `Coordinator: ${cleanedCommand.slice(0, 51)}...`
    : `Coordinator: ${cleanedCommand}`;
}

function inferBrowserActionType(command: string): SafetyActionType {
  return command.includes("submit") || command.includes("upload") || command.includes("payment")
    ? "browser-submit"
    : "file-change";
}
