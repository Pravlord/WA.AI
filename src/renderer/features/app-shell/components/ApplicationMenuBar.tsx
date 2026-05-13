import { useCallback, useEffect, useRef, useState } from "react";

type ApplicationMenuBarProps = {
  onOpenWorkspace: () => void;
  onOpenPreferences: () => void;
};

type MenuKey =
  | "file"
  | "edit"
  | "selection"
  | "view"
  | "go"
  | "run"
  | "terminal"
  | "help";

function getPreferencesShortcutLabel(): string {
  if (typeof navigator === "undefined") {
    return "Ctrl+,";
  }

  return /Mac|Darwin/i.test(navigator.userAgent) ? "⌘," : "Ctrl+,";
}

export function ApplicationMenuBar({ onOpenWorkspace, onOpenPreferences }: ApplicationMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const closeMenus = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root?.contains(event.target as Node)) {
        closeMenus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [closeMenus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isAccel = event.ctrlKey || event.metaKey;
      if (isAccel && event.key === ",") {
        event.preventDefault();
        closeMenus();
        onOpenPreferences();
      }

      if (event.key === "Escape") {
        closeMenus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenus, onOpenPreferences]);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <header className="app-menu-bar" ref={rootRef}>
      <nav aria-label="Application menu">
        <div className="menu-bar-menu-root">
          <button
            type="button"
            className={`menu-bar-trigger ${openMenu === "file" ? "active" : ""}`}
            aria-expanded={openMenu === "file"}
            aria-haspopup="menu"
            onClick={() => toggleMenu("file")}
          >
            File
          </button>
          {openMenu === "file" ? (
            <div className="menu-bar-dropdown" role="menu">
              <button
                type="button"
                className="menu-bar-dropdown-item"
                role="menuitem"
                onClick={() => {
                  closeMenus();
                  onOpenWorkspace();
                }}
              >
                Open Folder…
              </button>
              <button
                type="button"
                className="menu-bar-dropdown-item menu-bar-dropdown-item-with-hint"
                role="menuitem"
                onClick={() => {
                  closeMenus();
                  onOpenPreferences();
                }}
              >
                <span>Preferences…</span>
                <span className="menu-bar-shortcut" aria-hidden>
                  {getPreferencesShortcutLabel()}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <StubMenu label="Edit" menuKey="edit" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="Selection" menuKey="selection" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="View" menuKey="view" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="Go" menuKey="go" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="Run" menuKey="run" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="Terminal" menuKey="terminal" openMenu={openMenu} onToggle={toggleMenu} />
        <StubMenu label="Help" menuKey="help" openMenu={openMenu} onToggle={toggleMenu} />
      </nav>
      <strong>WA.AI</strong>
      <button className="primary-button" type="button" onClick={onOpenWorkspace}>
        Open Folder
      </button>
    </header>
  );
}

function StubMenu({
  label,
  menuKey,
  openMenu,
  onToggle
}: {
  label: string;
  menuKey: MenuKey;
  openMenu: MenuKey | null;
  onToggle: (key: MenuKey) => void;
}) {
  const isOpen = openMenu === menuKey;

  return (
    <div className="menu-bar-menu-root">
      <button
        type="button"
        className={`menu-bar-trigger ${isOpen ? "active" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => onToggle(menuKey)}
      >
        {label}
      </button>
      {isOpen ? (
        <div className="menu-bar-dropdown menu-bar-dropdown-stub" role="menu">
          <div className="menu-bar-dropdown-hint" role="presentation">
            Actions for {label} are not wired yet.
          </div>
        </div>
      ) : null}
    </div>
  );
}
