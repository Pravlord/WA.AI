# Safety and Recovery

## Safety Principle

The system should assume that real files, spreadsheets, Word documents, websites, and browser portals are valuable workplace assets.

Agents should be able to inspect and propose freely, but real changes should be visible, reversible where possible, and approval-gated based on risk.

## Change Safety

The system should reduce risk during file changes by including:

- automatic backup before file changes
- manual backup option
- version history
- restore or undo
- trash or archive instead of permanent delete
- approval before risky actions
- log of AI actions
- revised copies instead of overwriting originals when practical
- clear distinction between proposed, accepted, applied, and rejected changes

## Prompt and Workspace Recovery

In addition to file backup, the system should support prompt and workspace recovery.

This should include:

- backing up the folder or workspace before work begins
- restoring the previous prompt state if needed
- keeping a recoverable record of what the AI was asked to do
- allowing undo for both file actions and task execution context
- restoring or replaying a previous process run where practical

## Change Visibility

The interface should make AI changes easy to review in the same way Cursor shows edits.

That means showing:

- green highlighting for added content
- red highlighting for removed content
- clear before-and-after views for file changes
- a way to inspect what the AI changed before accepting it
- a way to keep the files and revisions visible during review
- a way to inspect each agent's input and output in the workflow graph
- a list of proposed Word, Excel, file, or browser actions before execution

## User Control

The user should always be able to:

- pause the agentic process
- stop the task midway
- insert new instructions
- ask the system to hold for clarification
- switch a workflow from demo mode to real execution
- reject one proposed action without cancelling the whole process
- approve a low-risk repeated workflow mode when appropriate

## Risk Awareness

Some actions should be treated as high risk.

The system should show confidence or risk levels when the AI is about to do something sensitive, especially:

- database changes
- large deletions
- destructive file operations
- anything that could alter many records at once
- Word or Excel edits that overwrite original files
- uploads to external websites
- form submissions
- payments or purchases
- messages or emails sent to other people
- actions that move information between workspaces

## Sandbox Mode

The system should support a demo or sandbox mode for testing workflows before they touch real files, spreadsheets, documents, or websites.

That would let the user:

- run a workflow safely
- see what the agents would do
- catch mistakes before real changes happen
- test automations without affecting live work
- inspect the process graph, node inputs, node outputs, and proposed actions
- approve the final plan before applying it to real work

## Browser and Website Safety

Browser automation should be treated as sensitive because it can affect external systems.

The system should require review or approval before:

- submitting forms
- uploading files
- deleting records
- sending messages
- confirming payments or orders
- changing account settings
- accepting legal or business commitments

The app should keep a log of important browser actions, including the target site, action type, timestamp, and related workflow run.

## Office Document Safety

Word and Excel automation should default to reviewable outputs.

The system should prefer:

- extracting and summarizing before editing
- proposed changes before applied changes
- revised copies before overwriting originals
- visible diffs where possible
- clear backup and restore points before real edits

