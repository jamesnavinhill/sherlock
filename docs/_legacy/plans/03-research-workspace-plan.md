# Research Workspace Plan

Date: 2026-04-05
Status: Implemented

## Objective

Build Sherlock's dedicated research workspace as a primary product surface by:

- introducing a multi-board workspace built on a canvas-first interaction model
- keeping canonical Sherlock research objects distinct from canvas-native composition objects
- making the workspace the place where reports, notes, sources, links, media, files, excerpts, and signals can be assembled into a cohesive working view
- preserving Timeline and NetworkGraph as specialized linked views rather than forcing them to become the board

This plan assumes the runtime, OpenRouter, and artifact/output baseline from [02-runtime-openrouter-research-output-plan.md](/mnt/c/Users/james/projects/sherlock/docs/plans/02-runtime-openrouter-research-output-plan.md) is already in place or is being completed first.

## Implementation Checkpoint

This plan is now implemented in the active codebase.

Shipped outcomes across the execution streams:

- board-specific persistence landed through `workspace_items`, `workspace_boards`, and `workspace_board_documents`
- the research workspace is a dedicated routed `tldraw` surface with multiple named boards per workspace
- canonical library coverage includes artifacts, entities, sources, signals, notes, links, files/media, and promoted excerpts
- chat excerpt promotion, link/file/media ingestion, and cross-surface handoff from Chat, Operation View, Timeline, and Network Graph are wired end to end
- presentation mode and manual-first AI actions are implemented on the board surface

The remaining work after this plan should be additive product expansion, not completion of the original slice.

## Dependency Boundary

This plan should consume the stronger artifact/runtime foundation from the runtime/OpenRouter/output expansion plan, not redesign it.

Specifically, it assumes:

- evidence-oriented artifacts already exist
- richer provenance already exists
- provider/runtime/model capability work is already settled
- minimal report/dossier refresh has already landed

This plan owns the workspace and board product layer, not the underlying provider/runtime redesign.

## Decisions Locked In

### 1. The workspace is intended to become a main product surface

Preferred direction:

- this is not a sidecar pinboard
- the board/workspace is where users should be able to compile research into a cohesive working view
- the roadmap should target a rich research canvas by the end of the plan

### 2. The board foundation should use `tldraw`

Preferred direction:

- optimize for the long-term board-as-primary-surface direction
- avoid building on a substrate likely to be torn down if the canvas becomes the center of the product
- accept the heavier integration cost in exchange for a stronger whiteboard-native future

### 3. The data model should be hybrid: canonical research objects plus canvas-native composition objects

Preferred direction:

- canonical Sherlock records should represent durable research objects
- canvas-native objects should represent layout, whiteboard structure, shapes, connectors, and similar board concerns
- the board should not become a second unsupervised data universe

### 4. The canonical workspace library should include a core research set

Preferred direction:

- artifacts
- entities
- sources
- headlines/signals
- notes
- links
- media/files
- promoted chat excerpts

### 5. Chat excerpts should be promotable into canonical workspace items

Preferred direction:

- do not leave useful excerpts trapped as chat-only attachments
- let users promote high-value excerpts into durable workspace objects with provenance

### 6. Files and media should enter the canonical workspace library first

Preferred direction:

- ingest into the workspace library
- then place or reference them on the board
- do not create board-only ghost assets as the default flow

### 7. Workspaces should support multiple boards/pages

Preferred direction:

- avoid forcing every case into one overcrowded canvas
- support multiple named boards per workspace
- allow users to organize by theme, timeline, theory, evidence cluster, or narrative

### 8. Timeline and NetworkGraph should remain specialized linked views

Preferred direction:

- keep them as valuable analytical lenses
- link them deeply into the board and back out of it
- do not rush into replacing them before the board fully earns that role

### 9. The board plan should include a scoped read-only/presentation mode

Preferred direction:

- support review, briefing, and presentation-friendly viewing
- keep the scope reasonable
- do not turn this into a full presentation-authoring suite in v1

### 10. AI assistance should be manual-first and scoped

Preferred direction:

- the board remains researcher-controlled
- add a limited set of AI-assisted actions by the end of the roadmap
- examples:
  - summarize a selected cluster
  - suggest grouping
  - draft a note from selected items
  - propose relationships between chosen items

## Execution Streams

### Stream 1: Workspace And Board Persistence

Primary targets:

- new schema and repository modules under `src/services/db/*`
- `docs/operations/DATA_PERSISTENCE.md`
- workspace-facing type definitions in `src/types/index.ts`

Required work:

1. Add board-specific persistence instead of overloading the current manual graph schema.
2. Support multiple boards/pages per workspace.
3. Persist canvas composition state separately from canonical workspace records.
4. Define clear boundaries between:
   - canonical library records
   - board placement/layout state
   - connectors/groups/shapes and other canvas-native objects
5. Document the new persistence model in operations docs when implemented.

### Stream 2: Canonical Workspace Library Expansion

Primary targets:

- `src/types/index.ts`
- repository and store layers under `src/services/db/*` and `src/store/*`
- dossier/library-facing UI surfaces

Required work:

1. Introduce or formalize canonical record support for:
   - notes
   - links
   - media/files
   - promoted chat excerpts
2. Preserve explicit provenance for promoted or ingested items.
3. Ensure canonical workspace items can be reused across board placement, report references, and future search flows.
4. Keep board placement as references to canonical items wherever appropriate.

### Stream 3: Board Shell And Core Interaction Model

Primary targets:

- new board feature modules under `src/components/features/WorkspaceBoard/*`
- workspace navigation/app-shell entry points
- store integration seams

Required work:

1. Add the dedicated workspace board surface.
2. Implement multi-board/page navigation inside a workspace.
3. Support core interactions:
   - place items on board
   - move
   - resize
   - group/frame
   - connect with lines/arrows
   - create note cards
   - create or place shapes
4. Support drag/drop from the workspace library into the board.
5. Keep canvas behavior and canonical object lifecycle clearly separated.

### Stream 4: Ingestion And Promotion Flows

Primary targets:

- chat surfaces
- dossier/library surfaces
- workspace board surfaces
- relevant repository and store modules

Required work:

1. Add promotion flows from chat excerpts into canonical workspace items.
2. Add link/media/file ingestion into the canonical library before board placement.
3. Support board placement from:
   - reports/artifacts
   - entities
   - sources
   - headlines
   - notes
   - links
   - media/files
   - promoted excerpts
4. Ensure newly ingested or promoted items are searchable and reusable, not board-only.

### Stream 5: Cross-Surface Linking

Primary targets:

- `TimelineView`
- `NetworkGraph`
- `OperationView`
- chat surfaces
- new board surface

Required work:

1. Link reports, timeline events, graph nodes, and chat-derived items into the board.
2. Add pathways from the board back into:
   - report reading
   - timeline context
   - graph analysis
   - chat provenance
3. Reuse canonical record identifiers so cross-navigation stays stable.

### Stream 6: Read-Only Mode And AI-Assisted Actions

Primary targets:

- board feature modules
- action/command surfaces
- provenance and metadata handling where needed

Required work:

1. Add a scoped read-only or presentation mode for boards.
2. Add limited AI-assisted actions without turning the board into an auto-organized black box.
3. Keep user agency primary and make AI actions explicit and reversible.

## Suggested Delivery Order

1. Land board persistence and multi-board/page structure.
2. Expand the canonical workspace library to support the needed object set.
3. Ship the board shell and core placement/interactions.
4. Add ingestion and promotion flows.
5. Link Timeline, NetworkGraph, reports, and chat into the board.
6. Finish with read-only mode and scoped AI-assisted actions.

This should remain staged and dependency-aware even though the plan targets a rich end-state.

## Non-Goals

- Do not redesign provider/runtime/output foundations here; that belongs to [02-runtime-openrouter-research-output-plan.md](/mnt/c/Users/james/projects/sherlock/docs/plans/02-runtime-openrouter-research-output-plan.md).
- Do not force Timeline or NetworkGraph to become the board.
- Do not make every canvas object canonical by default.
- Do not over-model full presentation tooling before the core board and library loops are stable.

## Cross-Plan Notes

This plan deliberately depends on the stronger artifact and provenance baseline from [02-runtime-openrouter-research-output-plan.md](/mnt/c/Users/james/projects/sherlock/docs/plans/02-runtime-openrouter-research-output-plan.md).

In particular, the board should inherit:

- evidence-rich artifacts
- richer citations/provenance metadata
- promoted excerpt-friendly chat lineage
- a coherent minimal dossier/report experience

That dependency should remain explicit during implementation so board work does not re-open already-settled runtime concerns.

## Validation Expectations

Before closing implementation work under this plan:

- `npm run lint`
- targeted tests covering:
  - new board persistence and repositories
  - board interaction state
  - ingestion/promotion flows
  - cross-surface linking behavior
- `npm run build`

Run the full test suite if this plan substantially alters shared workspace persistence or active navigation behavior across the product.
