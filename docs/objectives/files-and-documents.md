# Files and Documents

## Folder-Based Workspace Model

A workspace should behave like a Cursor project for non-coding work.

The user opens a folder, and the app treats the folder and its files as the workspace context. The app may keep metadata, indexes, workflow state, and agent history in its own local database, but the user's folder remains the visible source of work.

Each workspace should be able to hold:

- linked root folder
- workspace instructions
- pinned files or folders
- task-specific notes
- workflow templates
- active and past process runs
- file change history
- browser or website context when relevant

## Workspace Metadata

Each workspace should carry lightweight metadata so the user can understand it at a glance.

Useful fields include:

- workspace name
- root folder path
- workspace type
- status
- priority
- tags
- created date
- last updated date
- owner
- allowed automation level

These labels help organize work, but they should not replace the actual files, instructions, or workflow history inside the workspace.

## File Registry

Each workspace should have a file registry showing documents and other assets that matter to the current work.

The registry should track:

- file name
- file type/category
- file path
- cloud link if available
- date added
- last updated date
- version or revision marker
- file status
- related workflow or process run
- remarks

The registry should be indexable and searchable, but it should not require users to manually register every file before the workspace is useful.

## File Storage and Linking

The default model should be linked folders and files.

The system should support:

- opening a local folder as a workspace
- linking additional local folders
- linking cloud-synced folders
- storing app metadata outside the user's documents
- creating managed backup copies before risky edits
- creating revised copies instead of overwriting originals
- opening file locations
- opening files directly in their normal apps

The app should avoid moving, renaming, deleting, or rewriting user files unless the user approves the action or a trusted workflow explicitly allows it.

## Document and Office Support

The product should support common office files first:

- DOCX files
- DOC files where practical
- XLSX files
- CSV files
- PDF files
- TXT files
- MD files
- images and scanned documents later

It should be able to:

- open Word documents in Microsoft Word
- read DOCX contents
- inspect and summarize PDF contents
- inspect Excel and CSV data
- create revised copies of Word and Excel files
- propose edits before applying them
- support OCR later for scanned documents and images

## Website and Browser Artifacts

Many office workflows happen in browser portals.

The workspace should eventually be able to track:

- website URLs related to the task
- browser automation steps
- downloaded files
- uploaded files
- form-fill actions
- screenshots or page snapshots when useful
- portal-specific notes and credentials handling rules

Browser actions should be reviewable and should require approval before high-risk submissions, uploads, payments, deletions, or irreversible actions.

## Search

Users should be able to search by:

- file name
- file type
- document status
- folder path
- workspace
- workflow name
- task name
- prompt
- agent run
- extracted document text
- spreadsheet contents where indexed

