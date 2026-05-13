import { normalizeHex } from "./colorUtils";
import {
  BUILTIN_THEME_PROFILES,
  DRAFT_PROFILE_ID
} from "./themeProfiles";
import type { WorkspaceTheme } from "./workspaceTheme";
import { DEFAULT_WORKSPACE_THEME } from "./workspaceTheme";

const STORAGE_KEY_V2 = "wa.ai.themePreferences";
const LEGACY_THEME_KEY = "wa.ai.workspaceTheme";

export type CustomThemeProfile = {
  id: string;
  name: string;
  createdAt: number;
  theme: WorkspaceTheme;
};

export type ThemePreferences = {
  version: 1;
  activeProfileId: string;
  customProfiles: CustomThemeProfile[];
  theme: WorkspaceTheme;
};

function sanitizeTheme(raw: Partial<WorkspaceTheme>): WorkspaceTheme {
  const next: WorkspaceTheme = { ...DEFAULT_WORKSPACE_THEME };
  const colorKeys = [
    "accent",
    "accentSecondary",
    "background",
    "surface",
    "text"
  ] as const;
  for (const k of colorKeys) {
    const v = raw[k];
    const h = typeof v === "string" ? normalizeHex(v) : null;
    if (h) {
      next[k] = h;
    }
  }
  if (raw.font === "jetbrains" || raw.font === "system") {
    next.font = raw.font;
  }
  return next;
}

function defaultPreferences(): ThemePreferences {
  const first = BUILTIN_THEME_PROFILES[0];
  return {
    version: 1,
    activeProfileId: first.id,
    customProfiles: [],
    theme: { ...first.theme }
  };
}

function sanitizePreferences(raw: unknown): ThemePreferences {
  const base = defaultPreferences();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const o = raw as Record<string, unknown>;

  let theme = base.theme;
  if (o.theme && typeof o.theme === "object") {
    theme = sanitizeTheme(o.theme as Partial<WorkspaceTheme>);
  }

  let customProfiles: CustomThemeProfile[] = [];
  if (Array.isArray(o.customProfiles)) {
    customProfiles = o.customProfiles
      .map((entry): CustomThemeProfile | null => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const e = entry as Record<string, unknown>;
        const id = typeof e.id === "string" ? e.id : "";
        const name = typeof e.name === "string" ? e.name.trim() : "";
        const createdAt =
          typeof e.createdAt === "number" && Number.isFinite(e.createdAt)
            ? e.createdAt
            : Date.now();
        if (!id.startsWith("custom:") || name.length === 0) {
          return null;
        }
        return {
          id,
          name: name.slice(0, 64),
          createdAt,
          theme: sanitizeTheme((e.theme as Partial<WorkspaceTheme>) ?? {})
        };
      })
      .filter((x): x is CustomThemeProfile => x !== null);
  }

  let activeProfileId =
    typeof o.activeProfileId === "string" ? o.activeProfileId : base.activeProfileId;

  const validIds = new Set<string>([
    DRAFT_PROFILE_ID,
    ...BUILTIN_THEME_PROFILES.map((p) => p.id),
    ...customProfiles.map((c) => c.id)
  ]);
  if (!validIds.has(activeProfileId)) {
    activeProfileId = DRAFT_PROFILE_ID;
  }

  return {
    version: 1,
    activeProfileId,
    customProfiles,
    theme
  };
}

function migrateFromLegacy(): ThemePreferences | null {
  try {
    const item = localStorage.getItem(LEGACY_THEME_KEY);
    if (!item) {
      return null;
    }
    const data = JSON.parse(item) as Partial<WorkspaceTheme>;
    const theme = sanitizeTheme(data);
    return {
      version: 1,
      activeProfileId: DRAFT_PROFILE_ID,
      customProfiles: [],
      theme
    };
  } catch {
    return null;
  }
}

export function loadThemePreferences(): ThemePreferences {
  try {
    const item = localStorage.getItem(STORAGE_KEY_V2);
    if (item) {
      return sanitizePreferences(JSON.parse(item));
    }
  } catch {
    /* fall through */
  }

  const migrated = migrateFromLegacy();
  if (migrated) {
    saveThemePreferences(migrated);
    try {
      localStorage.removeItem(LEGACY_THEME_KEY);
    } catch {
      /* ignore */
    }
    return migrated;
  }

  return defaultPreferences();
}

export function saveThemePreferences(prefs: ThemePreferences): void {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(prefs));
}
