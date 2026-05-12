# Workspaces and Agents

## Agentic Workspace Model

The product should feel like Cursor for non-coding work.

A user should be able to:

- open a folder as a workspace
- keep several workspaces open at once
- give a task in natural language
- let the AI inspect files, folders, documents, spreadsheets, and websites
- let the system break the task into sub-tasks
- have the software create role-based agents for the work
- see the active process as a visual graph
- inspect each agent's input, output, reasoning summary, and proposed actions
- pause, stop, redirect, or add instructions mid-task
- reuse the workspace later for the same kind of job

## Multiple Workspaces

A workspace is a folder-based operating context, similar to a project tab.

The system should support:

- multiple open workspaces
- separate active processes per workspace
- workspace-specific instructions and memory
- workspace-specific permissions
- optional cross-workspace communication
- clear indicators when one workspace process depends on another

Cross-workspace automation should be explicit. Agents should not silently move information or actions between workspaces unless the workflow or user allows it.

## Agent Hierarchy

The system should simulate corporate hierarchy through agents.

Useful role patterns include:

- coordinator or manager agent
- department or process lead agents
- specialist agents for files, Word, Excel, PDF, browser, research, review, and data entry
- reviewer or quality-control agents
- user approval as the final authority for risky actions

The hierarchy should be visible. A user should be able to understand who is responsible for each part of the process and what each agent produced.

## Permissions

Only the user should be able to approve trusted automation levels.

The system should never silently promote an agent into a trusted operator. Different workflows may have different permission levels, but the user should be able to see and change what the agents are allowed to do.

Useful permission levels include:

- read-only inspection
- demo or dry-run execution
- propose changes
- create revised copies
- edit real files after approval
- run browser actions after approval
- trusted repeated workflow mode for low-risk tasks

## Multi-Agent Behavior

The system should eventually support:

- agent-to-agent communication
- specialist agents for different apps, files, websites, and task types
- a visible flowchart of active agents and task flow
- clickable nodes to inspect or talk to individual agents
- agents that can stop the process and ask the user for clarification
- human-in-the-loop control for uncertain or risky steps
- agents that can create, test, and run small helper tools or mini software

## Workflow Graph Model

Agent execution should feel like a workflow graph rather than a hidden chat or flat task list.

The graph should support:

- horizontal flow for ordered steps
- vertical grouping for subprocesses or departments
- parallel branches for independent work
- dependency-based execution where an agent waits for upstream results
- nested processes that can be expanded or collapsed
- visible inputs and outputs for each node
- visible proposed actions before real execution

This graph is part of the trust model. It lets the user supervise the simulated office team, inspect work before it touches real files, and understand why the next step is happening.

## Grouping and Nesting

Users should be able to select multiple agents and place them inside a process block.

The interface should support:

- box select
- shift-click selection
- dragging selected agents into a group
- nested subprocesses inside other subprocesses
- preserved input and output connections through group boundaries

When agents are grouped, the system should preserve the connections instead of breaking them. External links should be remapped through the group boundary so the group behaves like a real workflow block, not just a visual folder.

## Execution Ordering

The system should understand ordering rules between agents.

In practice that means:

- an upstream agent runs first
- its summary, extracted data, or proposed action is passed to the next dependent agent
- independent agents can run in parallel
- a coordinator decides whether a step should wait, branch, continue, retry, or ask the user
- the graph shows what is waiting, running, blocked, complete, or failed

This allows the platform to behave more like an office process chain, where one agent's output becomes another agent's input when needed.

## AI Assistant Behavior

The AI command box should be able to:

- understand user commands
- search workspace files and folders
- read documents and summarize them
- inspect spreadsheet data
- reason about website or browser workflow steps
- identify missing, duplicate, outdated, or inconsistent files
- suggest updates to files, spreadsheets, forms, and workflow state
- decide when to spawn helper agents
- route sub-tasks to specialized agents
- explain what will happen before real execution

## Reusable Workspaces and Workflows

The software should treat workspaces as repeatable task environments.

That means it should be able to:

- store the instructions for a task or workspace
- delete only chat history while keeping durable instructions
- reuse a previous workspace for a similar task
- look up an existing workflow when a generic task is given
- start the same workflow again without rebuilding it from scratch
- save a task template or workflow blueprint for reuse
- export workspace metadata and workflow definitions
- import workspace metadata and workflow definitions

## Agent Memory Rules

Each workspace should have memory rules for what it keeps and what it forgets.

That means the system should be able to:

- remember workspace instructions and reusable workflow structure
- keep important decisions for repeat tasks
- keep references to important files and websites
- forget temporary chat history when requested
- keep a clean distinction between long-term workspace memory and short-lived task chat

## Search Scope

Search should work across the whole workspace system, not just files.

Users should be able to search:

- files
- folders
- tasks
- prompts
- workflows
- process runs
- agent inputs
- agent outputs
- proposed actions
- accepted or rejected changes

## Agent Tool and Protocol Capability

Agents should not only reason about work or use built-in tools. They should also be able to create their own automation protocols when the available tools are not enough.

This capability should allow agents to:

- use browser automation
- use document and spreadsheet automation
- write small helper scripts or mini software components
- create repeatable automation protocols for specific apps, websites, files, or workflows
- test generated automations in sandbox or demo mode
- run those automations in a controlled way
- use the output of those automations to continue the task
- save successful automations as reusable workflow components
- treat tool and protocol creation as one of several possible work strategies

An automation protocol could describe how to complete a repeated process, how to interact with a website, how to transform spreadsheet data, how to prepare a Word document, or how to coordinate several tools together.

Generated code and protocols should be reviewable. The user should be able to see what the agent created, what permissions it needs, what files or websites it will touch, and what result it expects before real execution.

Tool and protocol execution should be sandboxed or approval-gated when it can affect real files, websites, external systems, or cross-workspace data.

## Failure Handling

The system should define what happens when an agent gets stuck, errors, or conflicts with another agent.

At a high level, that means:

- the agent should stop and report the issue
- the coordinator should decide whether to retry, reroute, or ask the user
- conflicting agent outputs should be surfaced instead of hidden
- failed steps should remain visible in the workflow graph
- the user should be able to inspect the failed node's input, output, and attempted action

## Risk and Sandbox Behavior

Some actions should be treated as higher risk than others.

The system should be able to:

- show confidence or risk levels for actions
- require approval for dangerous operations like large file changes, website submissions, uploads, deletions, or database changes
- run workflows in sandbox or demo mode before touching real files or websites
- keep risky automation separate from safe review-only actions
- show the exact proposed file, spreadsheet, Word, or browser action before execution

