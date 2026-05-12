
Before coding, follow WA.AI's modular architecture rule:

- Organize code by durable business function, not by roadmap phase or sprint.
- Treat roadmap phases as build order only. Do not create `phase-*` source folders or put new logic into a phase-shaped module.
- Place renderer feature code under `src/renderer/features/<function>`, where `<function>` is a stable capability such as `app-shell`, `workspace`, `file-registry`, `safety`, `process-runner`, `agents`, `documents`, or `browser-automation`.
- Keep shared contracts split by capability under `src/shared`. Do not grow one large shared type file for unrelated domains.
- Keep Electron IPC narrow, typed, and capability-owned. Put channel names and request/response types in shared contracts, expose only safe preload APIs, and keep renderer components away from Electron details.
- If a feature touches multiple functions, add the smallest explicit integration point instead of mixing the functions into one component or service.
- Prefer extracting pure state transitions and service helpers before adding UI wiring, especially for safety, file operations, process runs, and agent actions.
- Add or update focused tests for extracted domain logic when behavior changes.

After reading the current code, tell me which functional module owns the new behavior, which existing files should change, and whether any new shared contract or IPC channel is needed. Then implement within those boundaries.