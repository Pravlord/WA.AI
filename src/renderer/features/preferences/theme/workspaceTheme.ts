export type WorkspaceFontId = "jetbrains" | "system";

export type WorkspaceTheme = {
  accent: string;
  accentSecondary: string;
  background: string;
  surface: string;
  text: string;
  font: WorkspaceFontId;
};

export const DEFAULT_WORKSPACE_THEME: WorkspaceTheme = {
  accent: "#38bdf8",
  accentSecondary: "#a7f3d0",
  background: "#08111f",
  surface: "#0f172a",
  text: "#e5edf8",
  font: "jetbrains"
};
