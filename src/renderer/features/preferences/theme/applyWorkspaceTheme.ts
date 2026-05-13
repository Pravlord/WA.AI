import { mixHex, normalizeHex, pickContrastingFg } from "./colorUtils";
import type { WorkspaceFontId, WorkspaceTheme } from "./workspaceTheme";

const FONT_STACK: Record<WorkspaceFontId, string> = {
  jetbrains: `"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace`,
  system: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
};

export function applyWorkspaceTheme(theme: WorkspaceTheme): void {
  const root = document.documentElement;
  const accent = normalizeHex(theme.accent) ?? theme.accent;
  const accentSecondary = normalizeHex(theme.accentSecondary) ?? theme.accentSecondary;
  const background = normalizeHex(theme.background) ?? theme.background;
  const surface = normalizeHex(theme.surface) ?? theme.surface;
  const text = normalizeHex(theme.text) ?? theme.text;

  const bgMid = mixHex(background, "#ffffff", 0.09);
  const bgEnd = mixHex(background, "#ffffff", 0.15);
  const fgMuted = mixHex(text, "#64748b", 0.52);
  const fgSecondary = mixHex(text, "#ffffff", 0.22);
  const fgHeading = mixHex(text, "#ffffff", 0.94);
  const accentSoft = mixHex(accent, "#ffffff", 0.38);
  const borderBase = mixHex(surface, text, 0.18);
  const fgOnAccent = pickContrastingFg(accent);
  const pillFg = mixHex(accent, "#ffffff", 0.72);

  const chromeBg = mixHex(background, "#000000", 0.14);
  const chromeBorder = mixHex(surface, "#000000", 0.35);
  const chromeTabActive = mixHex(surface, background, 0.55);
  const chromeDesk = mixHex(background, "#000000", 0.12);
  const activityBar = mixHex(background, "#000000", 0.22);
  const activityHover = mixHex(chromeBorder, accent, 0.14);
  const explorerPanel = mixHex(surface, "#000000", 0.25);

  root.style.setProperty("--wa-accent", accent);
  root.style.setProperty("--wa-accent-secondary", accentSecondary);
  root.style.setProperty("--wa-accent-soft", accentSoft);
  root.style.setProperty("--wa-bg-deep", background);
  root.style.setProperty("--wa-bg-mid", bgMid);
  root.style.setProperty("--wa-bg-end", bgEnd);
  root.style.setProperty("--wa-surface-base", surface);
  root.style.setProperty("--wa-border-base", borderBase);
  root.style.setProperty("--wa-fg", text);
  root.style.setProperty("--wa-fg-muted", fgMuted);
  root.style.setProperty("--wa-fg-secondary", fgSecondary);
  root.style.setProperty("--wa-fg-heading", fgHeading);
  root.style.setProperty("--wa-fg-on-accent", fgOnAccent);
  root.style.setProperty("--wa-pill-fg", pillFg);
  root.style.setProperty("--wa-chrome-bg", chromeBg);
  root.style.setProperty("--wa-chrome-border", chromeBorder);
  root.style.setProperty("--wa-chrome-tab-active-bg", chromeTabActive);
  root.style.setProperty("--wa-chrome-desk", chromeDesk);
  root.style.setProperty("--wa-activity-bar", activityBar);
  root.style.setProperty("--wa-activity-hover-bg", activityHover);
  root.style.setProperty("--wa-explorer-bg", explorerPanel);
  root.style.setProperty("--wa-font-stack", FONT_STACK[theme.font] ?? FONT_STACK.jetbrains);
}
