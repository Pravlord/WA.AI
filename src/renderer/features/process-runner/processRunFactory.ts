import type {
  ProcessRunHistoryEntry,
  ProcessRunStatus,
  ProcessStepStatus,
  WorkspaceProcessRun,
  WorkspaceProcessStep,
  WorkspaceProcessTemplate
} from "../../../shared/processRunner";

export function createInitialProcessRuns(workspaceId: string): WorkspaceProcessRun[] {
  const now = new Date().toISOString();

  return [
    {
      id: crypto.randomUUID(),
      workspaceId,
      templateId: "workspace-inspection",
      title: "Workspace file inspection",
      mode: "manual",
      status: "waiting",
      steps: createProcessStepsFromTemplate(
        [
          {
            title: "Collect source files",
            input: "Identify the files or folders that need inspection before work begins.",
            dependsOn: []
          },
          {
            title: "Summarize current state",
            input: "Record what is known, unclear, and blocked before proposing changes.",
            dependsOn: [0]
          }
        ],
        now
      ),
      history: [createHistoryEntry("Manual process run created from workspace inspection template.", now)],
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function createInitialProcessTemplates(): WorkspaceProcessTemplate[] {
  const now = new Date().toISOString();

  return [
    {
      id: "workspace-inspection",
      title: "Workspace inspection",
      description: "Review workspace files, capture findings, and decide the next manual action.",
      steps: [
        {
          title: "Collect source files",
          input: "List the documents, folders, or records that need inspection.",
          dependsOn: []
        },
        {
          title: "Summarize current state",
          input: "Capture known facts, missing information, and risks.",
          dependsOn: [0]
        },
        {
          title: "Choose next action",
          input: "Decide whether to edit, request clarification, or stop.",
          dependsOn: [1]
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "office-task-review",
      title: "Office task review",
      description: "Intake a request, verify dependencies, perform the work, and record output.",
      steps: [
        {
          title: "Intake request",
          input: "Describe the requested office task and the desired final artifact.",
          dependsOn: []
        },
        {
          title: "Verify inputs",
          input: "Confirm required files, credentials, dates, and business rules are available.",
          dependsOn: [0]
        },
        {
          title: "Perform manual work",
          input: "Run the human-controlled task while keeping visible notes.",
          dependsOn: [1]
        },
        {
          title: "Review output",
          input: "Check the result and note follow-up work or blockers.",
          dependsOn: [2]
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function createManualProcessRun(
  workspaceId: string,
  title: string,
  template: WorkspaceProcessTemplate | null
): WorkspaceProcessRun {
  const now = new Date().toISOString();
  const steps = template ? createProcessStepsFromTemplate(template.steps, now) : [];

  return {
    id: crypto.randomUUID(),
    workspaceId,
    templateId: template?.id ?? null,
    title,
    mode: "manual",
    status: steps.length > 0 ? "waiting" : "blocked",
    steps,
    history: [
      createHistoryEntry(
        template ? `Manual process run created from ${template.title} template.` : "Manual process run created.",
        now
      )
    ],
    createdAt: now,
    updatedAt: now
  };
}

export function createManualProcessStep(
  title: string,
  input: string,
  dependsOn: string[] = []
): WorkspaceProcessStep {
  return createProcessStep(title, input, dependsOn, new Date().toISOString());
}

export function createHistoryEntry(message: string, createdAt = new Date().toISOString()): ProcessRunHistoryEntry {
  return {
    id: crypto.randomUUID(),
    message,
    createdAt
  };
}

export function deriveProcessRunStatus(steps: WorkspaceProcessStep[]): ProcessRunStatus {
  if (steps.length === 0) {
    return "blocked";
  }

  if (steps.some((step) => step.status === "failed")) {
    return "failed";
  }

  if (steps.some((step) => step.status === "blocked")) {
    return "blocked";
  }

  if (steps.every((step) => step.status === "complete")) {
    return "complete";
  }

  if (steps.some((step) => step.status === "running")) {
    return "running";
  }

  return "waiting";
}

export function normalizeProcessRunStatus(status: string): ProcessRunStatus {
  if (isProcessRunStatus(status)) {
    return status;
  }

  if (status === "draft" || status === "queued") {
    return "waiting";
  }

  return "blocked";
}

export function normalizeProcessStepStatus(status: string): ProcessStepStatus {
  return isProcessStepStatus(status) ? status : "waiting";
}

function createProcessStep(
  title: string,
  input: string,
  dependsOn: string[] | number[],
  now: string
): WorkspaceProcessStep {
  return {
    id: crypto.randomUUID(),
    title,
    status: "waiting",
    input,
    output: "",
    dependsOn: dependsOn.map(String),
    createdAt: now,
    updatedAt: now
  };
}

function createProcessStepsFromTemplate(
  steps: Array<{ title: string; input: string; dependsOn: number[] }>,
  now: string
): WorkspaceProcessStep[] {
  const createdSteps = steps.map((step) => createProcessStep(step.title, step.input, [], now));

  return createdSteps.map((step, index) => ({
    ...step,
    dependsOn: steps[index].dependsOn
      .map((dependencyIndex) => createdSteps[dependencyIndex]?.id)
      .filter((dependencyId): dependencyId is string => Boolean(dependencyId))
  }));
}

function isProcessRunStatus(status: string): status is ProcessRunStatus {
  return ["waiting", "running", "complete", "failed", "blocked"].includes(status);
}

function isProcessStepStatus(status: string): status is ProcessStepStatus {
  return ["waiting", "running", "complete", "failed", "blocked"].includes(status);
}
