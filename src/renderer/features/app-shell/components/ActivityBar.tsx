export type WorkspaceView = "files" | "menu" | "safety" | "graph";

type ActivityBarProps = {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
};

export function ActivityBar({ activeView, onChangeView }: ActivityBarProps) {
  return (
    <aside className="activity-bar" aria-label="Workspace modes">
      <button
        className={`activity-button ${activeView === "files" ? "active" : ""}`}
        type="button"
        title="Files"
        onClick={() => onChangeView("files")}
      >
        FI
      </button>
      <button
        className={`activity-button ${activeView === "menu" ? "active" : ""}`}
        type="button"
        title="Workspace menu"
        onClick={() => onChangeView("menu")}
      >
        WS
      </button>
      <button
        className={`activity-button ${activeView === "graph" ? "active" : ""}`}
        type="button"
        title="Process graph"
        onClick={() => onChangeView("graph")}
      >
        PG
      </button>
      <button
        className={`activity-button ${activeView === "safety" ? "active" : ""}`}
        type="button"
        title="Safety"
        onClick={() => onChangeView("safety")}
      >
        SF
      </button>
    </aside>
  );
}
