import { useEffect, useId, useRef, useState } from "react";
import {
  PREFERENCES_SECTIONS,
  type PreferencesSectionId
} from "../preferencesModel";
import { ThemeBuilder } from "./ThemeBuilder";

type PreferencesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState<PreferencesSectionId>("general");

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const node = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    node?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="preferences-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="preferences-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="preferences-dialog-header">
          <div>
            <p className="preferences-dialog-eyebrow">Settings</p>
            <h2 id={titleId} className="preferences-dialog-title">
              Preferences
            </h2>
          </div>
          <button type="button" className="preferences-dialog-close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="preferences-dialog-body">
          <nav className="preferences-nav" aria-label="Preference sections">
            {PREFERENCES_SECTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`preferences-nav-item ${section === entry.id ? "active" : ""}`}
                onClick={() => setSection(entry.id)}
              >
                <span className="preferences-nav-label">{entry.label}</span>
                <span className="preferences-nav-description">{entry.description}</span>
              </button>
            ))}
          </nav>

          <section className="preferences-panel" aria-labelledby={`${titleId}-${section}`}>
            {section === "general" ? (
              <>
                <h3 id={`${titleId}-general`} className="preferences-panel-heading">
                  General
                </h3>
                <p className="preferences-panel-lead">
                  Workspace snapshots and pinned paths stay on this machine. Open a folder from the
                  menu bar or the toolbar when you are ready to work.
                </p>
                <ul className="preferences-panel-list">
                  <li>Keyboard shortcut <kbd className="preferences-kbd">Ctrl</kbd>{" "}
                    <kbd className="preferences-kbd">,</kbd> opens Preferences on Windows and Linux.</li>
                  <li>
                    On macOS use <kbd className="preferences-kbd">⌘</kbd>{" "}
                    <kbd className="preferences-kbd">,</kbd> instead.
                  </li>
                </ul>
              </>
            ) : null}

            {section === "appearance" ? (
              <>
                <h3 id={`${titleId}-appearance`} className="preferences-panel-heading">
                  Appearance
                </h3>
                <ThemeBuilder />
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
