# Research Workspace Implementation Audit

Date: April 5, 2026
Status: Completed slice audit

## Verdict

`docs/plans/03-research-workspace-plan.md` is now materially implemented in the active codebase.

The shipped surface matches the plan's intended shape:

- the research workspace is a first-class routed product surface
- board composition uses `tldraw`
- canonical workspace items stay distinct from board-document state
- workspaces support multiple named boards
- chat excerpt promotion, link/file/media ingestion, and cross-surface board handoff are implemented
- board presentation mode and manual-first AI actions are both present

## What The Audit Confirmed

### Stream 1: Persistence is in place

- `workspace_items` persists canonical notes, links, files/media, and promoted excerpts
- `workspace_boards` persists workspace-scoped board shells
- `workspace_board_documents` persists `tldraw` snapshots separately from canonical objects
- Settings export/import includes the workspace surface payload

Primary files:

- `src/services/db/schema.ts`
- `src/services/db/repositories/WorkspaceItemRepository.ts`
- `src/services/db/repositories/WorkspaceBoardRepository.ts`
- `src/store/caseStore.ts`
- `src/services/maintenance/workspaceData.ts`

### Stream 2: Canonical workspace library is implemented

The library now covers:

- artifacts
- entities
- sources
- headlines/signals
- notes
- links
- files/media
- promoted excerpts

The audit also confirmed that workspace search indexes canonical workspace items, so newly created or promoted items are reusable outside the board surface.

### Stream 3: Board shell and multi-board behavior are implemented

- the workspace board is a dedicated routed surface
- each workspace can own multiple boards/pages
- board documents persist independently of canonical library records
- canonical items can be placed onto the board through click/drop flows
- native `tldraw` interactions provide move/resize/group/connect/shape behavior

### Stream 4: Ingestion and promotion flows are implemented

- chat retrieval attachments can be promoted into canonical excerpts
- links can be captured into the canonical library
- local files/media are ingested into the canonical library before placement
- promoted or ingested items can then be placed onto the board

### Stream 5: Cross-surface linking is implemented

- Chat can promote directly into the board/library
- Operation View can open the board or place inspected artifacts/entities/headlines on it
- Timeline can open the board or place timeline-selected references on it
- Network Graph can place inspected reports/entities/headlines on it
- the board inspector links back into report reading, workspace chat, timeline, network graph, source links, and provenance context

### Stream 6: Presentation mode and scoped AI actions are implemented

- boards support a scoped presentation/read-only mode
- AI actions are explicit manual commands only
- the audit pass tightened parity here so queued cross-surface placements no longer mutate a board while presentation mode is enabled
- board AI grounding now prefers fuller canonical item content instead of only short card summaries

## Residual Non-Goals

The current slice intentionally does not do the following:

- replace Timeline or Network Graph with the board
- introduce a second canonical persistence universe for board-native shapes
- add full presentation-authoring features beyond scoped readonly viewing
- auto-organize the board without explicit user action

## Follow-On Work

This slice is in a clean enough state to treat as the current baseline.

The next meaningful work should build on top of it rather than revisiting its foundation:

- richer custom board cards/shapes over time
- deeper timeline/network jump-back context from selected board items
- broader canonical media/embed workflows
- stronger board-specific interaction coverage if future changes make the canvas behavior more customized than stock `tldraw`
