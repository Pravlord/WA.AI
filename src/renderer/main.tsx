import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import { App } from "./App";
import { applyWorkspaceTheme } from "./features/preferences/theme/applyWorkspaceTheme";
import { loadThemePreferences } from "./features/preferences/theme/themePreferences";
import "./styles.css";

applyWorkspaceTheme(loadThemePreferences().theme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
