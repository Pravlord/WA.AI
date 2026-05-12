# Vision

## Product Goal

Build a Cursor-like AI operating workspace for non-coding PC work.

The app should help users automate normal workplace tasks across folders, files, Word documents, Excel sheets, PDFs, browser-based portals, and other desktop workflows.

## Scope Direction

The product should be general purpose from the start.

It may later specialize in legal, accounting, logistics, HR, admin, or other office domains, but the foundation should not be tied to one industry. The main goal is to automate work that people normally do manually on a computer outside of software development.

## Core Idea

The system should simulate a capable workplace team.

A user gives a goal, and the app should be able to:

- understand the task
- inspect the relevant files, folders, websites, and context
- break the work into sub-tasks
- assign those sub-tasks to role-based agents
- show the process visually
- let the user review inputs, outputs, and proposed actions
- run safely in demo mode before changing real files or websites
- recover cleanly when something goes wrong

## Product Principles

- Keep original files safe.
- Treat real-world file and website changes as high-trust actions.
- Prefer visible suggestions and reviewable actions over silent changes.
- Make every file change reversible where possible.
- Treat each workspace as a folder-based operating context, similar to a Cursor project.
- Allow multiple workspaces to stay open at once.
- Allow workspace processes to interact only when the user or workflow permits it.
- Let users pause, stop, interrupt, or redirect the process at any time.
- Preserve important workspace instructions even when chat history is cleared.
- Make workflows reusable for repeated office tasks.
- Make the agent hierarchy and process state understandable to a human supervisor.

## Working Definition

The product is a secure, agentic PC-work automation platform that manages folders, files, documents, websites, workflows, and AI-driven task execution in one visible workspace system.

