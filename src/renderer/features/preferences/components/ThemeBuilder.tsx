import { useEffect, useState } from "react";
import { applyWorkspaceTheme } from "../theme/applyWorkspaceTheme";
import { normalizeHex } from "../theme/colorUtils";
import { BUILTIN_THEME_PROFILES, DRAFT_PROFILE_ID, getBuiltinProfile } from "../theme/themeProfiles";
import {
  loadThemePreferences,
  saveThemePreferences,
  type ThemePreferences
} from "../theme/themePreferences";
import type { WorkspaceFontId, WorkspaceTheme } from "../theme/workspaceTheme";
import { DEFAULT_WORKSPACE_THEME } from "../theme/workspaceTheme";

function coalesceTheme(t: WorkspaceTheme): WorkspaceTheme {
  const fix = (s: string, fallback: string) => normalizeHex(s) ?? fallback;
  return {
    ...t,
    accent: fix(t.accent, DEFAULT_WORKSPACE_THEME.accent),
    accentSecondary: fix(t.accentSecondary, DEFAULT_WORKSPACE_THEME.accentSecondary),
    background: fix(t.background, DEFAULT_WORKSPACE_THEME.background),
    surface: fix(t.surface, DEFAULT_WORKSPACE_THEME.surface),
    text: fix(t.text, DEFAULT_WORKSPACE_THEME.text)
  };
}

function ColorRow({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [hexDraft, setHexDraft] = useState(value);
  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  return (
    <div className="theme-builder-row">
      <label className="theme-builder-label" htmlFor={id}>
        {label}
      </label>
      <div className="theme-builder-color-inputs">
        <input
          id={id}
          className="theme-builder-swatch"
          type="color"
          value={value}
          aria-label={`${label} color`}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="theme-builder-hex"
          type="text"
          spellCheck={false}
          maxLength={7}
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={() => {
            const h = normalizeHex(hexDraft);
            if (h) {
              onChange(h);
            } else {
              setHexDraft(value);
            }
          }}
        />
      </div>
    </div>
  );
}

export function ThemeBuilder() {
  const [prefs, setPrefs] = useState<ThemePreferences>(() => loadThemePreferences());
  const [newProfileName, setNewProfileName] = useState("");

  const displayTheme = coalesceTheme(prefs.theme);

  useEffect(() => {
    const t = coalesceTheme(prefs.theme);
    applyWorkspaceTheme(t);
    saveThemePreferences({ ...prefs, theme: t });
  }, [prefs]);

  function patchTheme(partial: Partial<WorkspaceTheme>) {
    setPrefs((p) => {
      const nextId = p.activeProfileId.startsWith("custom:")
        ? p.activeProfileId
        : DRAFT_PROFILE_ID;
      return {
        ...p,
        activeProfileId: nextId,
        theme: { ...p.theme, ...partial }
      };
    });
  }

  function selectBuiltin(id: string) {
    const profile = getBuiltinProfile(id);
    if (!profile) {
      return;
    }
    setPrefs((p) => ({
      ...p,
      activeProfileId: id,
      theme: { ...profile.theme }
    }));
  }

  function selectCustom(id: string) {
    setPrefs((p) => {
      const c = p.customProfiles.find((x) => x.id === id);
      if (!c) {
        return p;
      }
      return {
        ...p,
        activeProfileId: id,
        theme: { ...c.theme }
      };
    });
  }

  function saveAsNewProfile() {
    const name = newProfileName.trim();
    if (!name) {
      return;
    }
    const id = `custom:${crypto.randomUUID()}`;
    setPrefs((p) => {
      const t = coalesceTheme(p.theme);
      return {
        ...p,
        activeProfileId: id,
        theme: t,
        customProfiles: [
          ...p.customProfiles,
          { id, name: name.slice(0, 64), createdAt: Date.now(), theme: { ...t } }
        ]
      };
    });
    setNewProfileName("");
  }

  function updateActiveCustomProfile() {
    setPrefs((p) => {
      if (!p.activeProfileId.startsWith("custom:")) {
        return p;
      }
      const t = coalesceTheme(p.theme);
      return {
        ...p,
        theme: t,
        customProfiles: p.customProfiles.map((c) =>
          c.id === p.activeProfileId ? { ...c, theme: { ...t } } : c
        )
      };
    });
  }

  function deleteCustomProfile(id: string) {
    setPrefs((p) => {
      const nextList = p.customProfiles.filter((c) => c.id !== id);
      if (p.activeProfileId !== id) {
        return { ...p, customProfiles: nextList };
      }
      const first = BUILTIN_THEME_PROFILES[0];
      return {
        ...p,
        customProfiles: nextList,
        activeProfileId: first.id,
        theme: { ...first.theme }
      };
    });
  }

  function restoreBuiltinDefaults() {
    const first = BUILTIN_THEME_PROFILES[0];
    setPrefs((p) => ({
      ...p,
      activeProfileId: first.id,
      theme: { ...first.theme }
    }));
  }

  const activeCustom = prefs.customProfiles.find((c) => c.id === prefs.activeProfileId);
  const isDraft = prefs.activeProfileId === DRAFT_PROFILE_ID;
  const onCustomProfile = prefs.activeProfileId.startsWith("custom:");

  return (
    <div className="theme-builder">
      <p className="preferences-panel-lead theme-builder-lead">
        Pick a curated profile or refine colors yourself. Custom profiles are stored on this device
        only.
      </p>

      <div className="theme-profile-section">
        <h4 className="theme-builder-subheading">Built-in profiles</h4>
        <div className="theme-profile-grid" role="list">
          {BUILTIN_THEME_PROFILES.map((bp) => (
            <button
              key={bp.id}
              type="button"
              className={`theme-profile-card ${prefs.activeProfileId === bp.id ? "active" : ""}`}
              onClick={() => selectBuiltin(bp.id)}
              role="listitem"
            >
              <div className="theme-profile-swatches" aria-hidden="true">
                <span style={{ background: bp.theme.accent }} title="Accent" />
                <span
                  style={{ background: bp.theme.accentSecondary }}
                  title="Highlight"
                />
                <span style={{ background: bp.theme.background }} title="Background" />
              </div>
              <span className="theme-profile-name">{bp.name}</span>
              <span className="theme-profile-desc">{bp.description}</span>
            </button>
          ))}
        </div>
      </div>

      {prefs.customProfiles.length > 0 ? (
        <div className="theme-custom-section">
          <h4 className="theme-builder-subheading">Your profiles</h4>
          <ul className="theme-custom-list">
            {prefs.customProfiles.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`theme-custom-item ${prefs.activeProfileId === c.id ? "active" : ""}`}
                  onClick={() => selectCustom(c.id)}
                >
                  <span className="theme-custom-swatches" aria-hidden="true">
                    <span style={{ background: c.theme.accent }} />
                    <span style={{ background: c.theme.surface }} />
                  </span>
                  <span className="theme-custom-name">{c.name}</span>
                </button>
                <button
                  type="button"
                  className="theme-custom-remove"
                  onClick={() => deleteCustomProfile(c.id)}
                  aria-label={`Remove profile ${c.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="theme-builder-preview" aria-hidden="true">
        <div
          className="theme-builder-preview-gradient"
          style={{
            background: `linear-gradient(135deg, ${displayTheme.background}, ${displayTheme.surface})`
          }}
        >
          <span className="theme-builder-preview-chip" style={{ background: displayTheme.accent }} />
          <span
            className="theme-builder-preview-chip secondary"
            style={{ background: displayTheme.accentSecondary }}
          />
        </div>
        <div className="theme-builder-preview-copy" style={{ color: displayTheme.text }}>
          <strong style={{ color: displayTheme.text }}>Preview</strong>
          <span style={{ opacity: 0.72 }}>Muted body copy</span>
        </div>
      </div>

      <div className="theme-builder-grid">
        <ColorRow
          id="theme-accent"
          label="Accent"
          value={displayTheme.accent}
          onChange={(v) => patchTheme({ accent: v })}
        />
        <ColorRow
          id="theme-accent-2"
          label="Accent highlight"
          value={displayTheme.accentSecondary}
          onChange={(v) => patchTheme({ accentSecondary: v })}
        />
        <ColorRow
          id="theme-bg"
          label="Background"
          value={displayTheme.background}
          onChange={(v) => patchTheme({ background: v })}
        />
        <ColorRow
          id="theme-surface"
          label="Surfaces"
          value={displayTheme.surface}
          onChange={(v) => patchTheme({ surface: v })}
        />
        <ColorRow
          id="theme-text"
          label="Text"
          value={displayTheme.text}
          onChange={(v) => patchTheme({ text: v })}
        />
      </div>

      <div className="theme-builder-row theme-builder-row-font">
        <label className="theme-builder-label" htmlFor="theme-font">
          Interface font
        </label>
        <select
          id="theme-font"
          className="theme-builder-select"
          value={displayTheme.font}
          onChange={(e) => patchTheme({ font: e.target.value as WorkspaceFontId })}
        >
          <option value="jetbrains">JetBrains Mono</option>
          <option value="system">System UI</option>
        </select>
      </div>

      {isDraft ? (
        <p className="theme-builder-hint">
          Draft palette: your tweaks are saved automatically. Name and save them as a profile to reuse
          this look, or choose a preset above.
        </p>
      ) : null}

      <div className="theme-save-profile-row">
        <input
          type="text"
          className="theme-new-profile-input"
          placeholder="Name for new profile"
          value={newProfileName}
          maxLength={64}
          onChange={(e) => setNewProfileName(e.target.value)}
        />
        <button
          type="button"
          className="theme-builder-primary"
          disabled={!newProfileName.trim()}
          onClick={saveAsNewProfile}
        >
          Save current as profile
        </button>
        {onCustomProfile ? (
          <button type="button" className="theme-builder-secondary" onClick={updateActiveCustomProfile}>
            Update "{activeCustom?.name ?? "profile"}"
          </button>
        ) : null}
      </div>

      <div className="theme-builder-actions">
        <button type="button" className="theme-builder-reset" onClick={restoreBuiltinDefaults}>
          Restore Aurora preset
        </button>
      </div>
    </div>
  );
}
