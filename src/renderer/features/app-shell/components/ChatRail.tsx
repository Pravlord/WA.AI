import { useState } from "react";
import type { WorkspaceProcessRun } from "../../../../shared/processRunner";
import type { Workspace } from "../../../../shared/workspace";
import type { CoordinatorCommandResult } from "../../agents/coordinatorAgent";

type ChatTab = "chat" | "plan" | "runs";

type ChatRailProps = {
  coordinatorResults: CoordinatorCommandResult[];
  processRuns: WorkspaceProcessRun[];
  workspace: Workspace;
  onSubmitCommand: (command: string) => CoordinatorCommandResult | null;
};

export function ChatRail({
  coordinatorResults,
  processRuns,
  workspace,
  onSubmitCommand
}: ChatRailProps) {
  const [activeChatTab, setActiveChatTab] = useState<ChatTab>("chat");
  const [command, setCommand] = useState("");

  function handleSubmitCommand() {
    const trimmedCommand = command.trim();

    if (!trimmedCommand) {
      return;
    }

    const result = onSubmitCommand(trimmedCommand);

    if (result) {
      setActiveChatTab("plan");
    }

    setCommand("");
  }

  return (
    <>
      <nav className="chat-tabs" aria-label="Assistant tabs">
        {(["chat", "plan", "runs"] as const).map((tab) => (
          <button
            className={activeChatTab === tab ? "active" : ""}
            key={tab}
            type="button"
            onClick={() => setActiveChatTab(tab)}
          >
            {tab[0].toUpperCase()}
            {tab.slice(1)}
          </button>
        ))}
      </nav>
      <div className="chat-body">
        <ChatTabContent
          activeTab={activeChatTab}
          coordinatorResults={coordinatorResults}
          processRuns={processRuns}
          workspace={workspace}
        />
      </div>
      <div className="chat-input-shell">
        <textarea
          placeholder="Ask WA.AI to inspect, plan, automate, or explain this workspace."
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              handleSubmitCommand();
            }
          }}
        />
        <button className="primary-button" type="button" onClick={handleSubmitCommand}>
          Send
        </button>
      </div>
    </>
  );
}

type ChatTabContentProps = {
  activeTab: ChatTab;
  coordinatorResults: CoordinatorCommandResult[];
  processRuns: WorkspaceProcessRun[];
  workspace: Workspace;
};

function ChatTabContent({ activeTab, coordinatorResults, processRuns, workspace }: ChatTabContentProps) {
  const latestResult = coordinatorResults[0] ?? null;

  if (activeTab === "plan") {
    return (
      <div className="chat-message plan-result">
        <strong>Plan</strong>
        {latestResult ? (
          <>
            <p>{latestResult.message}</p>
            <article className="coordinator-plan-card">
              <span>{latestResult.runTitle}</span>
              <small>
                {latestResult.safetyActionIds.length} proposed action
                {latestResult.safetyActionIds.length === 1 ? "" : "s"} - open Process Graph to inspect nodes
              </small>
            </article>
            <div className="tool-use-list">
              {latestResult.toolUses.map((toolUse) => (
                <details key={toolUse.id}>
                  <summary>
                    {toolUse.label} <span>{toolUse.name}</span>
                  </summary>
                  <p>{toolUse.output}</p>
                </details>
              ))}
            </div>
          </>
        ) : (
          <p>Plans will show proposed steps, approvals, and dry-run output for {workspace.name}.</p>
        )}
      </div>
    );
  }

  if (activeTab === "runs") {
    return (
      <div className="chat-message run-summary-list">
        <strong>Runs</strong>
        {processRuns.length === 0 ? (
          <p>No process runs yet. Use the process graph mode to create a manual run.</p>
        ) : (
          processRuns.slice(0, 4).map((run) => (
            <article className="run-summary-item" key={run.id}>
              <span>{run.title}</span>
              <small>
                {run.status} - {run.steps.length} steps
              </small>
            </article>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="chat-thread">
      <div className="chat-message">
        <strong>WA.AI</strong>
        <p>Ready to help with this workspace. Open files on the left, then ask for a plan or action.</p>
      </div>
      {coordinatorResults.map((result) => (
        <article className="chat-message coordinator-result" key={result.id}>
          <strong>You</strong>
          <p>{result.command}</p>
          <strong>Coordinator</strong>
          <p>{result.message}</p>
          <small>{new Date(result.createdAt).toLocaleString()}</small>
        </article>
      ))}
    </div>
  );
}
