# WA.AI — Blueprint Graph & Universal Layout (Implementation Prompt)

Use this document as the master prompt for the next implementation pass. It merges the blueprint-style process graph, top-down flow, manual “add block” entry point, universal VS Code–style resizable panels, and local nested panels (especially for selected agent blocks).

---

## 1. Goals

- Replace text-heavy process UI with a **visual blueprint / node graph** (Unreal-style flowchart): nodes, pins, and **connections as the only dependency model** (no separate dependency checklists).
- **Flow direction**: agents and steps start at the **top**; edges flow **downward** naturally (like a vertical DAG or layered blueprint).
- **Universal chrome**: **File explorer** and **AI chat** are **always available** across workspace modes (**FI**, **WS**, **PG**, **SF**) with **draggable splitters** to resize panes (Cursor / VS_code behavior).
- **Mode-specific center**: Only the **main block** (center column) swaps content when switching activity-bar modes (Files, Workspace menu, Process graph, Safety).
- **Local nesting**: The center can contain **additional split regions** (e.g. graph + detail panel) that are **not** global—only for that mode or that interaction.

---

## 2. Global Layout (Three Columns)

Default structure:

```text
| File Explorer | Main Block (mode content) | AI Chat |
```

- **Left**: File explorer (tree, search, pins). **Resizable** via a vertical splitter between explorer and main block.
- **Center**: **Main Block** — hosts the current mode’s primary UI (files editor area, workspace dashboard, **blueprint graph**, safety center, etc.).
- **Right**: **AI chat** (command box, threads, plan/runs tabs as needed). **Resizable** via a splitter between main block and chat.

**Requirements**

- Persist splitter positions **per workspace** (or global app preference—decide in implementation).
- Minimum widths so no pane collapses to zero accidentally (optional double-click to maximize one column).
- Explorer and chat remain **visible and functional** in **FI**, **WS**, **PG**, **SF** unless the user explicitly collapses a side (optional future: hide chevron).

---

## 3. Process Graph (PG) — Blueprint Behavior

### 3.1 Visual model

- **Nodes** represent: agents, tools, approval gates, and **user-created manual blocks** (see §3.3).
- **Edges** (wires) encode **control flow and ordering**; **dependencies are defined only by connections**, not checklists.
- **Layout**: Primary layout is **top → bottom** (layers). Consider auto-layout (e.g. layered DAG) on first insert from AI, with **manual drag** to nudge nodes; save `(x, y)` per node.
- **Active run**: Highlight **current** node, dim completed, show **failed/blocked** state on nodes and optionally pulse edges (“active flowchart”).

### 3.2 AI-built structure

- When the coordinator (or model) decides **which agents do what** and **how they connect**, emit a **graph spec** (nodes + edges + kinds + metadata).
- Renderer builds the blueprint from that spec; **same** persistence is the source of truth for the run.

### 3.3 Manual step — “Click to add block”

- In the **empty center** of the graph canvas (or a dedicated affordance), show a **plus** control with short copy, e.g. **“Click to add agent block”** or **“Click to start a new agent block”**.
- On activate: create a **new node block** with:
  - **Name** (short title)
  - **Basic description** (small subtitle or tooltip; expandable in inspector)
- That block participates in the graph like any other node: **user wires it** to predecessors/successors on the canvas (or AI suggests wires later).

### 3.4 Run history

- **Remove** redundant history UIs: **no** tall left sidebar whose primary job is “run list + duplicate timeline.”
- **Single** compact **run history** strip: **small window at the bottom** of the graph area (or of the whole PG main block), collapsible/expandable.
- Optional: run switcher in **toolbar** (dropdown) instead of a permanent left list.

---

## 4. Selecting an Agent Block — Nested Split Panel (Local)

When the user **clicks a node** (agent block) in the process graph:

- Open a **local** sub-layout in the **Main Block** (center): e.g. **split view** with **draggable horizontal or vertical divider** (implementation choice: right-side inspector vs bottom drawer vs side-by-side).

**Suggested content for the node detail region**

- **Prompt** (what this block is instructed to do)
- **Input** / **Output** (structured or text areas)
- Actions: **Run this step manually**, **Run chain** (this block **and** downstream blocks in order), **Run from here** (this block as entry, rest of chain below)
- Room for future: logs, tool calls, linked safety actions, approvals

**Important**: This splitter and panel are **local to PG** (and to “node selected” state), **not** the same as the global explorer | main | chat splitters.

---

## 5. Chat & File Explorer Rework

- **Chat** is not embedded only inside “Files” workbench; it becomes the **universal right rail**, always available with consistent behavior (threads, send, coordinator hooks).
- **File explorer** is the **universal left rail** (index, open file, refresh), not duplicated per mode in incompatible ways.
- Any **mode-specific** file list duplication should be reduced: prefer **one explorer** driving selection, with the center showing previews/editors per file.

---

## 6. Main Block — “Multiple Smaller Blocks”

- The **center column** is a **composition surface**:
  - **Files mode**: editor tabs + preview (existing direction).
  - **PG mode**: blueprint canvas + (when selected) **node detail split** + bottom **history** strip.
  - **WS / SF**: dashboard or safety panels as single or stacked regions.
- Allow **nested** resizable regions inside Main Block only where product needs them (graph + inspector is the first instance).

---

## 7. IDE & Editor Parity (Cursor / VS Code)

Treat the **Main Block** as a **workspace compositor** similar to VS Code and Cursor: tabs, editor groups, split panes, drag-and-drop docking, and lightweight motion—not a single fixed surface.

### 7.1 Tabs and multi-document

- **Multiple open items** in the Main Block: files, graph view, safety detail panels, custom pages—each as a **tab** in a **tab strip** (with close, dirty indicator, pin optional).
- **Multiple files open at once**: same behavior as editors—each file (or virtual document) is a tab; switching tabs preserves scroll and state.
- **Tab bar behavior**: overflow scroll, optional “show all tabs” picker, middle-click to close (desktop convention), context menu (close others, close to the right, copy path).

### 7.2 Editor groups & splits inside the Main Block

- Support **splitting** the Main Block into **multiple editor groups** (horizontal and vertical): e.g. two files side-by-side, or graph left + node inspector right + third doc below—**nested splitters** with persisted ratios **per workspace**.
- **Drag tab between groups** to move or copy (optional) a document; **drag tab to edge** to create a new group (dock zones), matching VS Code-style drop targets.
- **Maximize group** (toggle) to focus one pane; **reset layout** command to restore a default grid.

### 7.3 Secondary windows / auxiliary panels (optional phases)

- **Phase A (in-app only)**: everything stays inside one window; “multiple windows” means **multiple editor groups** or **auxiliary side panels** docked inside Main Block.
- **Phase B (optional)**: **detach tab to new window** (Electron `BrowserWindow`) for power users—same session state, same workspace; align with roadmap if deferred.

### 7.4 Movement, animation, and polish

- **Splitters**: smooth drag; **snap** to min/max; optional **double-click** on splitter to even splits or maximize one side.
- **Tab strip**: subtle **transition** when reordering tabs; optional **slide** when switching active tab (keep performant, respect `prefers-reduced-motion`).
- **Blueprint graph**: **pan/zoom** with inertia optional; **node drag** with slight easing on drop; **edge** creation with **temporary rubber-band** or preview line; **execution highlight** as a short **pulse** or glow on active node/edge (not noisy).
- **Panel show/hide**: explorer/chat collapse could use **width animation** or instant toggle—user setting.
- **Loading / busy**: scoped skeletons or thin progress in tab or status bar—not blocking the whole app for single-file operations.

### 7.5 Command palette & keyboard affordances (IDE hygiene)

- **Command palette** (or quick open) for: open file, switch tab, toggle panels, run coordinator command, reset layout—parity with “don’t hunt UI.”
- **Keyboard**: shortcuts for **split editor**, **focus next group**, **toggle explorer/chat** (when implemented), **close tab**—mirror common VS Code defaults where it does not conflict with app-specific keys.

### 7.6 State persistence

- Persist: **open tabs**, **active tab per group**, **split ratios**, **group orientation tree** (serialized layout), and **scroll/cursor** where cheap; restore on workspace reopen.
- Distinguish **global layout** (explorer | main | chat) from **Main Block internal** layout (groups + PG local splits).

### 7.7 Success criteria additions (IDE parity)

- User can open **several files** as **tabs** in the Main Block and **split** the Main Block into **at least two** visible editor groups with **draggable** splitters.
- Tabs can be **reordered**; moving a tab to a **drop zone** creates or targets a **new group** (behavior matches VS Code / Cursor expectations as closely as practical for v1).
- **Animations and motion** are **subtle**, **interruptible**, and respect accessibility (**reduced motion**).

---

## 8. Implementation Notes (Non-binding)

- Prefer a established **node/graph library** (e.g. React Flow / xyflow) for zoom, pan, edges, and hit-testing rather than a bespoke SVG layer v1.
- Consider **explicit `edges[]`** in domain model vs deriving only from `dependsOn[]` — single representation avoids desync between checklist-era and graph-era.
- Store **node positions** and **viewport** in workspace snapshot or run metadata so layouts restore after reload.

---

## 9. Out of Scope / Later

- Full visual subgraph collapse (nested blueprint inside a node) — align with roadmap “nested subprocess blocks.”
- Multi-user cursors, real-time collaboration.
- Minimap, snap-to-grid, ELK auto-layout polish — nice follow-ons.

---

## 10. Success Criteria (Acceptance)

- User can resize **explorer | main | chat** with **splitters** in every activity mode.
- PG shows a **top-down** blueprint; **dependencies = wires** only.
- User can **add a block** via centered **plus / “add agent block”** affordance; block has **name + short description**.
- **One** bottom **run history**; **no** duplicate run/history sidebar unless justified as optional collapsed UI.
- Clicking a node opens a **local** split with **prompt / I/O / run / run chain / run from here**.
- Main Block supports **multiple open documents** as **tabs** with **close**, overflow, and state preserved when switching tabs.
- User can **split** the Main Block into **multiple editor groups** (horizontal/vertical), resize via **splitters**, and **drag tabs** between groups / to dock zones (VS Code / Cursor–class behavior, as far as v1 allows).
- Layout and tab state **persist** per workspace (global three-column widths + internal group tree).
- Motion is **subtle** and respects **`prefers-reduced-motion`**; graph and panels use **lightweight** transitions where they aid orientation, not distraction.

---

*Temporary spec file for WA.AI UI iteration — lives at repo root for easy reference; relocate into `docs/` when stabilized.*
