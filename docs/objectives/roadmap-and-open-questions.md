# Roadmap and Open Questions

## Product Direction

Build a Cursor-like operating workspace for non-coding PC work.

The app should automate normal office work across folders, files, Word, Excel, PDFs, websites, browser portals, and repeatable business processes. It should not be tied to one industry at the foundation.

The system should simulate a corporate hierarchy through agents: coordinators, process leads, specialists, reviewers, and user approval as the final authority for risky actions.

## Build Order

If you want to build this from top to bottom, build it in this order:

1. Desktop shell and multi-workspace navigation
2. Folder-based workspace model and local data storage
3. File registry, indexing, and workspace search
4. Safety core: action log, backup, restore, approval gates, and sandbox mode
5. Manual process runner with visible steps
6. AI command box and single coordinator agent
7. Runtime workflow graph with node input/output inspection
8. Document and spreadsheet reading
9. Word, Excel, and PDF action proposal flows
10. Browser automation in demo mode
11. Real file and browser execution with approval gates
12. Multi-agent hierarchy and reusable workflow templates
13. Cross-workspace process coordination
14. Advanced desktop automation, generated code, and custom protocols

## Phase 1: App Foundation

Start with the smallest possible working desktop app.

Build:

- Electron shell
- React UI
- TypeScript app structure
- SQLite database
- basic app navigation
- multiple workspace tabs
- local app data conventions

Goal:

- the app opens
- a folder can be opened as a workspace
- multiple workspaces can stay open
- workspace metadata persists locally

## Phase 2: Workspace and File Core

Build the core folder-based workspace system next.

Add:

- workspace metadata
- root folder linking
- pinned files and folders
- file registry
- file categories and statuses
- local file indexing
- basic search
- workspace instructions
- workspace process history

Goal:

- a user can open a folder like a project
- the app can understand what files are in the workspace
- the user can search and organize the workspace without moving files

## Phase 3: Safety Core

Add safety before real automation becomes powerful.

Build:

- action logs
- manual backup
- automatic backup before risky changes
- restore / undo where practical
- archive instead of delete
- proposed / accepted / applied / rejected action states
- approval gating for risky actions
- sandbox or demo process mode
- workspace reset for app state, not user files

Goal:

- the app can inspect and plan freely, but real changes are visible, recoverable, and controlled

## Phase 4: Manual Process Runner

Before full AI autonomy, build a visible process system.

Add:

- manually created process steps
- step statuses
- input and output fields per step
- dependency ordering
- blocked / waiting / running / complete / failed states
- process run history
- reusable process templates

Goal:

- the app can represent office work as a visible process, even before agents automate it

## Phase 5: AI Command Box and Coordinator

Add a simple agentic entry point.

Start with:

- natural language commands
- one coordinator agent
- task planning
- task status display
- user interruption
- ask-for-clarification flow
- read-only workspace inspection
- proposed action generation

Goal:

- one prompt can create a controlled plan and process run without silently changing real files

## Phase 6: Runtime Workflow Graph

Make the process understandable as a visual system.

Add:

- visible graph of steps and agents
- node input inspection
- node output inspection
- proposed action inspection
- dependency lines
- nested subprocess blocks
- parallel branches
- user approval checkpoints

Goal:

- the user can supervise the simulated office team and understand what each agent is doing before execution affects real work

## Phase 7: Document and Spreadsheet Understanding

Make the app useful for actual office files.

Add:

- TXT and MD reading
- PDF text extraction
- DOCX reading
- XLSX and CSV reading
- file preview where practical
- document summary output
- spreadsheet summary output
- OCR later if needed

Goal:

- the app can inspect real documents and spreadsheets, extract useful context, and feed that context into workflows

## Phase 8: Office Action Proposals

Move from reading files to proposing changes.

Add:

- proposed Word edits
- proposed Excel edits
- revised-copy creation
- before-and-after review
- generated drafts
- structured extracted data
- validation and review steps

Goal:

- the app can prepare office work without overwriting originals or applying changes silently

## Phase 9: Browser Automation

Add website and portal automation carefully.

Start with:

- embedded browser or controlled browser sessions
- page reading
- form understanding
- browser action plans
- demo-mode browser workflows
- upload and download tracking
- approval before submission, upload, deletion, payment, or account changes

Goal:

- the system can work inside websites and browser portals while keeping the user in control of irreversible actions

## Phase 10: Multi-Agent Hierarchy

Now make the AI behave like a workplace team.

Add:

- coordinator or manager agents
- specialist agents
- reviewer agents
- agent-to-agent handoff
- parallel execution
- dependency-based execution
- role-specific memory rules
- failure handling
- reroute / retry / ask-user behavior
- search across tasks, prompts, workflows, process runs, and agent outputs

Goal:

- one task can spawn several agents that work together through a visible hierarchy

## Phase 11: Reusable Workflow Library

Turn successful processes into reusable operating procedures.

Add:

- workflow templates
- role templates
- reusable prompt and instruction blocks
- workflow import/export
- versioned workflow definitions
- template search
- template duplication and customization

Goal:

- repeated office work can be saved, improved, and rerun without rebuilding the process each time

## Phase 12: Cross-Workspace Automation

Cross-workspace automation should be a platform capability, but it should remain explicit and controlled.

This would let the system:

- reuse automation across multiple workspaces
- coordinate related tasks in different folders
- pass approved outputs from one workspace process into another
- run shared workflows in more than one workspace when appropriate
- show when one workspace process depends on another

Goal:

- separate workspaces can cooperate without losing boundaries, permissions, or traceability

## Phase 13: Advanced Automation, Code, and Protocols

Later, expand into deeper automation.

Consider:

- stronger OCR and scanned document support
- richer Excel automation
- Word track changes support
- more browser portal integrations
- desktop app automation beyond browser and Office
- custom helper scripts and mini tools
- agent-written automation protocols
- generated code for task-specific automation
- sandbox testing for generated automations
- reusable protocol components that can become workflow blocks
- permission manifests for generated tools and protocols
- richer agent visualizations
- specialized workflow packs for accounting, logistics, legal, HR, and admin

Goal:

- agents can create, test, review, and reuse their own automation methods instead of being limited to built-in tools

## Workflow Editor Direction

The workflow graph has two roles:

- runtime supervision
- workflow design

Runtime supervision should come early. The user needs to inspect agent inputs, outputs, proposed actions, and status before trusting automation.

Full visual editing can come later. Eventually the workflow editor should behave like a grid or canvas for agent and process design.

That would allow:

- arranging agents horizontally for step order
- stacking subprocesses vertically
- showing dependency lines between tasks
- collapsing a subflow into a single process block
- expanding it again without losing the internal structure
- passing results from one process block into the next
- turning a successful process run into a reusable template

## Open Questions to Discuss Next

- What should the first demo workflow be?
- Should the first automation target Word, Excel, browser forms, PDFs, or folder organization?
- What file actions should require approval every time?
- Which actions can become trusted repeated workflow actions?
- How should sandbox mode represent browser actions that cannot be fully simulated?
- How should the app store workspace metadata without polluting the user's folders?
- How much cross-workspace interaction should be allowed in the first version?
- What should the first version of the workflow graph show: steps, agents, files, or all three?
- Which Office automation approach should be used first on Windows?
- What audit trail is needed for real workplace trust?

