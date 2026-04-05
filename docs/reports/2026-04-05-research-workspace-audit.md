# Sherlock Research Workflow Audit

Date: April 5, 2026

## Executive Summary

Sherlock already has most of the right primitives for a serious research product:

- a canonical `Workspace -> Artifact -> WorkspaceRun` runtime
- persisted typed artifact sections in `artifact_sections`
- a dossier/report surface, a network surface, a chronology surface, and a workspace chat surface
- local-first persistence for artifacts, chat, signals, and manual graph data

What it does not yet have is a unifying research workflow.

Two issues stand out:

1. report generation is still biased toward short summaries plus follow-up leads, rather than dense evidence gathering and synthesis
2. the app has analysis surfaces, but not a true workspace board where a researcher can manually assemble, arrange, annotate, and relate artifacts, links, media, notes, and entities

My recommendation is to treat these as two linked but separate tracks:

- Track A: make artifacts materially deeper and more research-first
- Track B: add a dedicated board/workspace canvas instead of trying to force the current report view or D3 graph to become that surface

I do not recommend overloading the current `NetworkGraph` into the full board. It should remain the relationship-analysis surface. The board should be a separate manual assembly surface that reuses the same underlying workspace records.

## What The Codebase Already Has

The current code is stronger than the UI makes it feel.

### 1. Richer artifacts are already partially modeled

The domain layer already supports section kinds beyond summary/leads:

- `EXECUTIVE_SUMMARY`
- `KEY_FINDINGS`
- `EVIDENCE`
- `TIMELINE`
- `METHODOLOGY`
- `LITERATURE_REVIEW`
- `IMPLICATIONS`
- `NEXT_STEPS`

Relevant files:

- `src/domain/artifacts.ts`
- `src/domain/purposes.ts`
- `src/types/index.ts`
- `src/services/db/schema.ts`

This matters because Sherlock does not need a ground-up artifact redesign. It needs the generation contract and UI to actually honor the richer model it already introduced.

### 2. Sherlock already has multiple workspace-adjacent surfaces

Today the product is split across:

- `OperationView` for dossier + active artifact
- `NetworkGraph` for relationship mapping and manual links
- `TimelineView` for chronology
- `Chat` for retrieval-backed workspace conversation

That means the product is not missing capability so much as composition. Researchers want one place to assemble evidence manually; Sherlock currently gives them several adjacent places to inspect it.

### 3. Persistence is already set up for incremental expansion

The existing SQLite model already persists:

- workspaces
- artifacts and typed sections
- chat sessions/messages/actions
- saved signals
- manual graph nodes/links

Relevant docs and code:

- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `src/services/db/schema.ts`
- `src/services/db/repositories/CaseRepository.ts`

That is a strong base for adding a board surface without changing the app into a server-backed product.

## Key Findings

### 1. The report contract is still lead-first

This is the clearest reason the output feels fragmented.

In `src/services/providers/shared/prompts.ts:150-162`, the structured output instruction still requires:

- `summary`
- `entities`
- `agendas`
- `leads`
- `sources`
- optional `sections`

It also explicitly asks for a fixed number of lead items. That pushes every provider toward a lead-generation artifact even when the user really wants a research dossier.

Related implementation details:

- all providers append that same instruction
- investigation responses are currently capped at `maxTokens: 3200` in the provider adapters
- `ReportViewer` still foregrounds `visibleLeads` and `visibleAnomalies`

Relevant files:

- `src/services/providers/shared/prompts.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`
- `src/services/providers/geminiProvider.ts`
- `src/components/features/OperationView/ReportViewer.tsx`

Net effect:

- sections are treated as optional enrichment
- leads are treated as mandatory output
- the UI still spends more energy on follow-up than on evidence density

### 2. The artifact schema is richer than before, but still not evidence-native

`ArtifactSection.items` is still just `string[]` in `src/types/index.ts:38-43`.

That means Sherlock can store more section headings, but it still cannot express claim-level structure such as:

- claim
- evidence excerpt
- source reference(s)
- confidence
- linked entities
- provenance / retrieval origin

This is why reports can look more organized without actually becoming much more usable in a real research workflow.

### 3. The dossier is still an inventory panel, not a working set

`DossierPanel` currently centers on five buckets:

- reports
- entities
- leads
- sources
- headlines

Relevant file:

- `src/components/features/OperationView/DossierPanel.tsx`

This is useful for browsing, but it is not a research library:

- no notes
- no pinned artifacts
- no board membership state
- no categories for media/files/links/embeds
- no staging area for assembling a case narrative

### 4. The current graph is not yet a durable board

The current manual graph persistence is too thin for the "big board" you described.

Current constraints:

- `manual_nodes` only stores `id`, `label`, `type`, `subtype`, `timestamp`
- `manual_links` only stores `source`, `target`, `timestamp`
- `GraphCanvas` stores positions in `nodePositionsRef`, which is runtime-only

Relevant files:

- `src/services/db/schema.ts:179-190`
- `src/services/db/repositories/ManualDataRepository.ts`
- `src/components/features/NetworkGraph/GraphCanvas.tsx`

What is missing for a real board:

- persisted x/y position
- persisted width/height/z-order
- workspace-scoped board pages
- artifact-backed board cards
- note cards
- media/file/embed nodes
- board groups / frames
- board-level metadata and viewport state

So while the graph proves the interaction model, it is not yet the right persistence model for a research canvas.

### 5. Sherlock already has reusable context primitives that the board should consume

This is a major advantage.

Existing reusable primitives:

- `WorkspaceSearchRepository` already retrieves report, section, entity, source, and headline snippets
- chat actions already persist retrieval and save/follow-up provenance
- timeline snapshots already reuse the existing artifact path

Relevant files:

- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `src/components/features/TimelineView.tsx`

This means the new board should not invent a second artifact universe. It should sit on top of the current artifact/search/chat lineage model.

## Recommendation

## Track A: Make Artifacts Research-First

### Recommendation A1: flip the output contract from lead-first to section-first

The prompt contract should make structured sections mandatory and leads conditional.

Proposed default for research-grade artifacts:

- `EXECUTIVE_SUMMARY`
- `KEY_FINDINGS`
- `EVIDENCE`
- `METHODOLOGY`
- `IMPLICATIONS`
- `NEXT_STEPS`

Behavioral change:

- `NEXT_STEPS` should become optional and short when evidence is already sufficient
- `LEADS` should stop being a mandatory array count target
- a run should be allowed to return "few follow-ups, high evidence density"

### Recommendation A2: introduce structured evidence blocks

The current `string[]` item model is the main blocker to truly useful reports.

I recommend extending artifact content with a typed block/item model, for example:

- claim
- support
- sourceIds
- entityRefs
- confidence
- note

This can be done either by:

- extending `ArtifactSection.items` from `string[]` to a typed union, or
- introducing a new typed sub-record for `EVIDENCE` sections

The second path is safer if you want minimal regression risk for existing sections.

### Recommendation A3: update the report layout so follow-up work is secondary

`ReportViewer` should become a dossier reader, not a launch pad.

Suggested layout change:

- center column: summary, findings, evidence, methodology, implications
- right rail: sources, cited entities, provenance, open questions
- collapsed or lower-priority section: next steps / follow-ups

The current report page heavily emphasizes leads and anomalies. That was sensible for fraud-finding and lead expansion, but it works against the broader research direction.

### Recommendation A4: do not rely on a single short response for "meatier" reports

Today each investigation adapter is capped at `maxTokens: 3200`.

That does not necessarily need a universal hardcoded replacement, because provider limits differ and your OpenRouter wiring is being updated now. But the product implication is clear:

- if you want materially deeper artifacts, Sherlock needs either a higher output budget per run or a staged generation flow

The staged option is probably safer:

1. draft structured findings
2. expand evidence and methodology
3. derive short next steps only after the main artifact exists

That avoids turning every run into one giant brittle generation.

## Track B: Add A Dedicated Workspace Board

### Recommendation B1: create a new board surface instead of mutating `NetworkGraph`

I recommend a separate surface such as:

- `AppView.WORKSPACE_BOARD`
- `src/components/features/WorkspaceBoard/*`

Why:

- `NetworkGraph` is currently an analysis view with automatic relationship logic
- the board is a manual assembly view
- users will want both

If these become the same surface, you will end up compromising both.

### Recommendation B2: treat the board as a manual composition layer over canonical artifacts

Board nodes should usually reference existing workspace objects rather than duplicate them.

Recommended board node kinds:

- `ARTIFACT`
- `ENTITY`
- `SOURCE`
- `HEADLINE`
- `NOTE`
- `LINK`
- `MEDIA`
- `EMBED`
- `GROUP`

Principle:

- canonical research objects stay in the main workspace/artifact model
- the board stores layout, assembly, annotations, and manual relationships

That keeps the board reusable and avoids data drift.

### Recommendation B3: add a board-specific persistence model

Current manual graph persistence is not enough.

Recommended new tables:

- `workspace_boards`
- `workspace_board_nodes`
- `workspace_board_edges`

Suggested node fields:

- `id`
- `board_id`
- `workspace_id`
- `kind`
- `ref_id`
- `x`
- `y`
- `width`
- `height`
- `z_index`
- `title`
- `props_json`
- `created_at`
- `updated_at`

Suggested edge fields:

- `id`
- `board_id`
- `source_node_id`
- `target_node_id`
- `label`
- `props_json`
- `created_at`
- `updated_at`

This should be documented in `docs/operations/DATA_PERSISTENCE.md` when implemented, per repo rules.

### Recommendation B4: make the dossier the board library

The existing dossier should evolve from a report-side list into a reusable library panel for the board.

Suggested categories:

- Reports
- Notes
- Entities
- Sources
- Links
- Media
- Signals
- Chats / saved excerpts

Key interaction:

- drag from dossier into board
- create note on board
- drop URL/file/media into board
- auto-register that content into the workspace library if it becomes canonical

That last point is important: if a user adds media or a link, Sherlock should not create a board-only ghost object. It should create or reference a canonical workspace item first, then place it on the board.

### Recommendation B5: prefer one of these two implementation paths

#### Option 1: React Flow / xyflow as the pragmatic v1

This is the lower-risk path.

Why it fits Sherlock:

- node-based mental model already exists in `NetworkGraph`
- custom React nodes map well to artifact/entity/source/note cards
- official examples already cover drag-from-sidebar, save/restore, grouping, and whiteboard-style extensions

This path is best if you want:

- a fast incremental board
- strong control over custom card layouts
- minimal conceptual shift from the existing graph work

#### Option 2: tldraw as the stronger long-term whiteboard path

This is the more ambitious path.

Why it fits the end-state you described:

- external content handling for dropped files, URLs, and embeds
- explicit asset model for images/videos/bookmarks
- custom shapes and tools
- readonly presentation mode for review/share flows

This path is best if the board is meant to become a true first-class research canvas, not just a node editor.

### My recommendation on the choice

If the next goal is to ship a usable research board quickly, choose React Flow for v1 and keep it narrowly scoped.

If the next goal is to make the board the center of the product, with media, embeds, richer annotation, and presentation/share modes, choose tldraw and accept the heavier integration.

For Sherlock as it exists on April 5, 2026, I would recommend:

- React Flow-style board first
- keep D3 `NetworkGraph` as a separate intelligence graph
- revisit tldraw only if the board becomes the primary product surface

That is the better fit for the current codebase and the lower-conflict path while provider wiring is changing in parallel.

## Proposed Delivery Plan

### Phase 1: report contract and viewer refresh

- change the structured output contract so sections are primary and leads are optional
- make `EVIDENCE` and `METHODOLOGY` first-class in the default purpose profiles
- redesign `ReportViewer` around dossier reading, not lead launching
- preserve current persistence path for artifacts and sections

Expected result:

- deeper, less fragmented artifacts without changing the rest of the product yet

### Phase 2: board persistence and shell

- add board tables and repository layer
- add `WorkspaceBoard` view
- add note and artifact nodes only
- allow drag from dossier to board
- persist node layout and viewport

Expected result:

- a durable manual workspace with the core research assembly loop

### Phase 3: broader canonical workspace items

- introduce canonical link/media/embed item support
- extend dossier categories
- add board inspector and metadata editing
- add cross-links to report, timeline, chat, and graph

Expected result:

- the board becomes a real workspace rather than just a pinned-report wall

### Phase 4: advanced workflows

- saved board presets/pages
- grouped frames or canvases by theme
- board snapshots as artifacts
- read-only review mode / presentation mode
- optional AI-assisted organization on the board

Expected result:

- the board becomes the operational center for long-running research cases

## What I Would Not Do First

- I would not merge the board into the existing D3 graph first
- I would not start with freeform media upload before defining canonical workspace item types
- I would not chase a giant schema rewrite before fixing the report contract and adding a minimal board shell
- I would not make leads more prominent while trying to reposition Sherlock as a broader research product

## Implementation Notes For The Current Repo

The safest reuse points are:

- `useWorkspaceStore` as the integration seam
- `CaseRepository` and existing artifact persistence for canonical research outputs
- `WorkspaceSearchRepository` for board search/add flows
- `chat_actions` for provenance and saved excerpts
- `TimelineView` snapshot save flow as a model for future board snapshots

The main architectural addition should be a new board persistence layer, not a mutation of the existing artifact store.

## Official Guidance Reviewed

React / state architecture:

- React recommends avoiding redundant, duplicated, and deeply nested state and keeping state structures simple: [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- React recommends reducers when many handlers update shared state and the update logic is getting harder to scan: [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)

React Flow / xyflow:

- React Flow documents drag-from-sidebar node creation and explicitly calls out this pattern for node-based editors: [Drag and Drop](https://reactflow.dev/examples/interaction/drag-and-drop)
- React Flow documents save/restore using `toObject()` or local node/edge state: [Save and Restore](https://reactflow.dev/examples/interaction/save-and-restore)
- React Flow documents interactive custom React nodes: [Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- React Flow documents selection grouping and resizable group nodes: [Selection Grouping](https://reactflow.dev/examples/grouping/selection-grouping)

tldraw:

- tldraw documents custom shapes/tools and HTML/SVG-based interactive shapes: [Custom shapes and tools](https://tldraw.dev/features/customization/custom-shapes-and-tools)
- tldraw documents external content handling for dropped files, URLs, embeds, and pasted content: [External content handling](https://tldraw.dev/sdk-features/external-content)
- tldraw documents a separate asset model for images, videos, and bookmarks: [Assets](https://tldraw.dev/sdk-features/assets)
- tldraw documents readonly/viewer mode for presentation or review flows: [Readonly mode](https://tldraw.dev/sdk-features/readonly)

## Bottom Line

Sherlock does not need a vague "polish pass." It needs a sharper product split:

- reports should become research dossiers
- the manual workspace should become a first-class board

The existing codebase is already close enough that this can be done incrementally. The biggest near-term win is to stop asking the model to mainly generate leads and start asking it to build evidence-rich artifacts that a board can actually organize.
