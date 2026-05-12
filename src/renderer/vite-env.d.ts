/// <reference types="vite/client" />

import type { WorkspaceApi } from "../shared/workspaceApi";

declare global {
  interface Window {
    workspaceApi: WorkspaceApi;
  }
}
