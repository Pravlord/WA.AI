import type { WorkspaceTheme } from "./workspaceTheme";
import { DEFAULT_WORKSPACE_THEME } from "./workspaceTheme";

export type BuiltinThemeProfile = {
  id: string;
  name: string;
  description: string;
  theme: WorkspaceTheme;
};

export const DRAFT_PROFILE_ID = "draft";

export const BUILTIN_THEME_PROFILES: BuiltinThemeProfile[] = [
  {
    id: "builtin:aurora",
    name: "Aurora",
    description: "Cool cyan and mint on deep navy.",
    theme: { ...DEFAULT_WORKSPACE_THEME }
  },
  {
    id: "builtin:ember",
    name: "Ember",
    description: "Warm amber highlights on cocoa shadows.",
    theme: {
      accent: "#fb923c",
      accentSecondary: "#fcd34d",
      background: "#130c07",
      surface: "#241812",
      text: "#fef2e8",
      font: "jetbrains"
    }
  },
  {
    id: "builtin:nebula",
    name: "Nebula",
    description: "Violet and magenta glow on cosmic purple.",
    theme: {
      accent: "#c084fc",
      accentSecondary: "#f0abfc",
      background: "#0c0618",
      surface: "#1a0f2e",
      text: "#f5eeff",
      font: "system"
    }
  },
  {
    id: "builtin:arctic",
    name: "Arctic",
    description: "Bright sky and frost on cool slate.",
    theme: {
      accent: "#7dd3fc",
      accentSecondary: "#e0f2fe",
      background: "#0c1220",
      surface: "#172033",
      text: "#f1f5f9",
      font: "jetbrains"
    }
  },
  {
    id: "builtin:moss",
    name: "Moss",
    description: "Emerald and spring green on forest charcoal.",
    theme: {
      accent: "#4ade80",
      accentSecondary: "#6ee7b7",
      background: "#07120d",
      surface: "#102018",
      text: "#ecfdf5",
      font: "jetbrains"
    }
  }
];

export function getBuiltinProfile(id: string): BuiltinThemeProfile | undefined {
  return BUILTIN_THEME_PROFILES.find((p) => p.id === id);
}
