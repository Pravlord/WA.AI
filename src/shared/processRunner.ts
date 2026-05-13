export type ProcessRunMode = "manual" | "demo" | "live";

export type ProcessRunStatus = "waiting" | "running" | "complete" | "failed" | "blocked";

export type ProcessStepStatus = "waiting" | "running" | "complete" | "failed" | "blocked";

export type ProcessStepKind = "manual" | "agent" | "tool" | "approval";

/** Connection anchors at block corners (manual wiring). */
export type FlowchartCornerPort = "tl" | "tr" | "bl" | "br";

export type ProcessGraphEdge = {
  id: string;
  source: string;
  target: string;
  sourcePort?: FlowchartCornerPort;
  targetPort?: FlowchartCornerPort;
};

export type ProcessGraphViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type ProcessGraphLayout = {
  nodePositions: Record<string, { x: number; y: number }>;
  viewport: ProcessGraphViewport;
  selectedStepId: string | null;
  inspectorWidth: number;
  historyCollapsed: boolean;
  /** Scroll offsets and zoom for the manual flowchart viewport (scale defaults to 1 when omitted). */
  canvasScroll?: { scrollLeft: number; scrollTop: number; scale?: number };
};

export type WorkspaceProcessStep = {
  id: string;
  title: string;
  kind: ProcessStepKind;
  status: ProcessStepStatus;
  input: string;
  output: string;
  dependsOn: string[];
  agentRole?: string;
  toolName?: string;
  proposedActionIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProcessRunHistoryEntry = {
  id: string;
  message: string;
  createdAt: string;
};

export type WorkspaceProcessRun = {
  id: string;
  workspaceId: string;
  templateId: string | null;
  title: string;
  mode: ProcessRunMode;
  status: ProcessRunStatus;
  steps: WorkspaceProcessStep[];
  edges: ProcessGraphEdge[];
  graph: ProcessGraphLayout;
  history: ProcessRunHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type ProcessTemplateStep = {
  title: string;
  input: string;
  dependsOn: number[];
};

export type WorkspaceProcessTemplate = {
  id: string;
  title: string;
  description: string;
  steps: ProcessTemplateStep[];
  createdAt: string;
  updatedAt: string;
};
