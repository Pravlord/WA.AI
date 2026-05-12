import type { ReactNode } from "react";
import type { AppShellLayoutState } from "../../../../shared/appShell";

type AppShellLayoutProps = {
  layout: AppShellLayoutState;
  explorer: ReactNode;
  main: ReactNode;
  chat: ReactNode;
  onChangeLayout: (layout: AppShellLayoutState) => void;
};

const MIN_EXPLORER_WIDTH = 220;
const MAX_EXPLORER_WIDTH = 520;
const MIN_CHAT_WIDTH = 280;
const MAX_CHAT_WIDTH = 620;

export function AppShellLayout({
  layout,
  explorer,
  main,
  chat,
  onChangeLayout
}: AppShellLayoutProps) {
  const explorerWidth = layout.explorerCollapsed ? 0 : layout.explorerWidth;
  const chatWidth = layout.chatCollapsed ? 0 : layout.chatWidth;

  function startResize(side: "explorer" | "chat", startX: number) {
    const startExplorerWidth = layout.explorerWidth;
    const startChatWidth = layout.chatWidth;

    function handlePointerMove(event: PointerEvent) {
      if (side === "explorer") {
        onChangeLayout({
          ...layout,
          explorerCollapsed: false,
          explorerWidth: clamp(startExplorerWidth + event.clientX - startX, MIN_EXPLORER_WIDTH, MAX_EXPLORER_WIDTH)
        });
        return;
      }

      onChangeLayout({
        ...layout,
        chatCollapsed: false,
        chatWidth: clamp(startChatWidth - (event.clientX - startX), MIN_CHAT_WIDTH, MAX_CHAT_WIDTH)
      });
    }

    function stopResize() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  }

  return (
    <section
      className="universal-workspace-layout"
      style={{
        gridTemplateColumns: `${explorerWidth}px 6px minmax(0, 1fr) 6px ${chatWidth}px`
      }}
    >
      <aside className={`universal-rail explorer-rail ${layout.explorerCollapsed ? "collapsed" : ""}`}>
        {explorer}
      </aside>
      <button
        aria-label="Resize explorer"
        className="global-splitter"
        type="button"
        onDoubleClick={() =>
          onChangeLayout({
            ...layout,
            explorerCollapsed: !layout.explorerCollapsed
          })
        }
        onPointerDown={(event) => startResize("explorer", event.clientX)}
      />
      <div className="main-rail">{main}</div>
      <button
        aria-label="Resize chat"
        className="global-splitter"
        type="button"
        onDoubleClick={() =>
          onChangeLayout({
            ...layout,
            chatCollapsed: !layout.chatCollapsed
          })
        }
        onPointerDown={(event) => startResize("chat", event.clientX)}
      />
      <aside className={`universal-rail chat-rail ${layout.chatCollapsed ? "collapsed" : ""}`}>
        {chat}
      </aside>
    </section>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
