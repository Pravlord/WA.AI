/// <reference types="vite/client" />

import type { WorkspaceApi } from "../shared/workspaceApi";

declare global {
  interface Window {
    /** Present only when the renderer runs inside Electron (preload). */
    workspaceApi?: WorkspaceApi;
  }
}
