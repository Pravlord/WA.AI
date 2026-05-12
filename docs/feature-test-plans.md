# Feature Test Plans

This is the living test plan for feature work added through prompts.

For each feature prompt, add a new section before or during implementation. The section should explain what changed, what must be manually tested, and what result the user confirmed.

## Testing Workflow

1. Agent adds or updates a test-plan section for the feature prompt.
2. Agent implements the feature.
3. Agent runs available automated checks, such as typecheck, build, and linter diagnostics.
4. User manually tests the app and reports results.
5. Agent records the confirmed result and any follow-up fixes.

## Status Values

- `Planned`: test plan exists before implementation is complete.
- `Ready for user test`: implementation is complete and waiting for manual verification.
- `Passed`: user confirmed the expected behavior.
- `Failed`: user found a problem that needs fixing.
- `Changed`: feature direction changed and the test plan must be updated.

## Test Plan Template

```md
## Prompt: <short feature name>

Status: Planned

### Scope

- <What this feature adds or changes>

### Automated Checks

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Linter diagnostics checked for edited files

### Manual Test Steps

1. <Open or navigate to the feature>
2. <Perform the main user action>
3. <Verify the expected result>

### Expected Result

- <What should happen if the feature works>

### User Confirmation

- Result: Pending
- Notes:
```

## Prompt: Desktop Shell And Multi-Workspace Navigation

Status: Ready for user test

### Scope

- Electron desktop shell.
- React/Vite renderer.
- Workspace tabs.
- Native folder picker.
- Local persistence for open workspaces.

### Automated Checks

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Linter diagnostics checked for edited files

### Manual Test Steps

1. Run `npm run dev`.
2. Click `Open Folder`.
3. Select a local folder.
4. Confirm a workspace tab appears below the app menu.
5. Close and reopen the app.
6. Confirm the workspace remains available from local persistence.

### Expected Result

- The app opens as a desktop window.
- A selected folder becomes a workspace tab.
- Workspace state persists locally.

### User Confirmation

- Result: Pending
- Notes:

## Prompt: Workspace And File Core

Status: Ready for user test

### Scope

- Workspace metadata.
- Durable workspace instructions.
- Folder scan and file registry.
- File search and category filtering.
- Pin and unpin workspace files.
- Process history scaffold.

### Automated Checks

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Linter diagnostics checked for edited files

### Manual Test Steps

1. Run `npm run dev`.
2. Open a folder with a mix of files.
3. Confirm the file explorer shows indexed files.
4. Switch to `WS` mode from the left activity strip.
5. Edit workspace type, priority, tags, and instructions.
6. Search and filter files in the registry.
7. Pin a file and confirm it appears under pinned paths.
8. Refresh the file index and confirm pinned state remains.

### Expected Result

- Workspace metadata edits persist.
- Files are indexed from the selected folder.
- Search and filtering narrow the registry.
- Pinned paths remain visible and survive index refresh.

### User Confirmation

- Result: Pending
- Notes:

## Prompt: Cursor-Like Workbench UI

Status: Ready for user test

### Scope

- Cursor-like top app menu.
- Workspace tabs under the menu.
- Universal left activity strip.
- File explorer mode.
- Opened-file editor tabs.
- Right chat panel with `Chat`, `Plan`, and `Runs` tabs.
- Workspace menu and graph modes accessible from the left strip.

### Automated Checks

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Linter diagnostics checked for edited files

### Manual Test Steps

1. Run `npm run dev`.
2. Confirm the top app menu appears above workspace tabs.
3. Open a workspace folder.
4. Confirm the left activity strip remains visible.
5. Click `FI`, `WS`, and `PG`.
6. Confirm the main content changes while the left strip stays in place.
7. In `FI`, click files in the explorer.
8. Confirm files open as tabs in the center editor area.
9. Confirm the right chat panel has separate `Chat`, `Plan`, and `Runs` tabs.

### Expected Result

- The mode strip is universal.
- Workspace tabs only switch workspaces.
- Mode switching happens through the left strip.
- File explorer, editor tabs, and chat panel behave like the intended Cursor-like layout.

### User Confirmation

- Result: Pending
- Notes:

## Prompt: JetBrains Mono Font

Status: Ready for user test

### Scope

- Local JetBrains Mono font package.
- App-wide font stack updated to use JetBrains Mono.

### Automated Checks

- [x] `npm run typecheck`
- [ ] `npm run build`
- [x] Linter diagnostics checked for edited files

### Manual Test Steps

1. Run or refresh the app.
2. Confirm menu text, tabs, explorer, editor preview, and chat UI use JetBrains Mono.

### Expected Result

- The UI uses JetBrains Mono from the local app bundle.

### User Confirmation

- Result: Pending
- Notes:

## Prompt: Phase 3 Safety Core

Status: Ready for user test

### Scope

- Action logs.
- Manual backup.
- Automatic backup before risky changes.
- Restore or undo where practical.
- Archive instead of delete.
- Proposed, accepted, applied, and rejected action states.
- Approval gates for risky actions.
- Sandbox or demo process mode.
- Workspace reset for app state, not user files.

### Automated Checks

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Linter diagnostics checked for edited files

### Manual Test Steps

1. Run `npm run dev`.
2. Open a workspace folder.
3. Click `SF` in the left activity strip.
4. Confirm Safety Core opens and the left strip remains visible.
5. Toggle between `Demo` and `Live` mode.
6. Click `Propose Safe Action`.
7. Confirm the action appears as `proposed`.
8. Approve it and confirm it moves to `accepted`.
9. Apply it and confirm it moves to `applied`.
10. Click `Propose Risky File Action`.
11. Confirm the action is marked `high risk` and says approval is required.
12. Approve and apply the risky action.
13. Confirm an automatic backup record is created and linked to the action.
14. Create a manual backup.
15. Restore a backup and confirm it shows a restored timestamp.
16. Reject a newly proposed action and confirm it moves to `rejected`.
17. Archive an action and confirm it moves to `archived`.
18. Click `Reset Safety App State`.
19. Confirm safety actions and backups clear while the real folder files are untouched.

### Expected Result

- Real changes are gated by approval.
- Demo mode can show intended actions without touching real files.
- Action history is visible and stateful.
- Backup and restore paths are clear before risky work.
- Workspace reset affects app state only, not the user's folder contents.

### User Confirmation

- Result: Pending
- Notes:
