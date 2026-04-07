# Features + UX Productization Plan

Date: April 7, 2026

Status: Proposed

Related inputs:

- `docs/reports/2026-04-06-features-ux-audit.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

## Intent

This plan turns the April 6 features/UX audit into an execution roadmap that is product-shaped rather than audit-shaped.

The goal is not to chase parity by polishing every page independently. The goal is to strengthen the product spine first, then bring the feature surfaces into parity by reusing the same canonical contracts for:

- workspace identity
- search and navigation
- workspace-native knowledge items
- reviewable agent actions
- artifact reading and provenance
- shared chrome, panel, and toolbar behavior

This plan keeps the current canonical architecture intact:

- Sherlock remains route-backed
- Sherlock remains local-first
- SQLite + IndexedDB remain the primary persistence path
- artifact, chat, board, timeline, and graph stay workspace-scoped
- workspace home is intentionally deferred as the next-round consumer of the contracts established here

## Product North Star

By the end of this plan, Sherlock should feel like one coherent workspace system:

- every major object is canon, searchable, linkable, and reusable across surfaces
- headers, panels, selectors, and actions behave consistently
- the app explains what it did, what changed, and what is grounded
- search becomes a primary workflow, not a modal afterthought
- older feeder surfaces no longer feel like pre-refactor holdovers

## Planning Rules

1. Trust before polish.
   Bootstrap integrity, persistence contracts, and clear action receipts land before visual flourishes.

2. One canonical product primitive per job.
   One omnibox, one item model, one review pattern, one hint system, one panel contract.

3. Promote canon out of specialist surfaces.
   Workspace items cannot remain "real" only inside the board.

4. Reduce clutter instead of adding more helper UI.
   Guidance, presets, legends, and tips should live behind intentional entry points, not permanently on already dense surfaces.

5. Prepare the workspace home without building it yet.
   This round should leave behind the metadata, selectors, search actions, and summary contracts that a future workspace dashboard will need.

## Completion Standard

This plan is complete only when all active workstreams below have:

1. landed code, tests, and docs for the targeted slices
2. updated behavior docs where contracts changed
3. passed:
   - `npm run lint`
   - `npm run typecheck`
   - targeted tests for the touched areas
   - `npm run build` for shipped app/runtime/UI changes
4. moved any unfinished scope into a new dated plan rather than leaving "follow-up" debt inside this document

The full suite `npm run test` should only be run at the end of the plan, it currently can take over 30 minutes to complete. Run targeted tests for session validation. 

## Delivery Model

Use four active waves, with overlapping lanes where the dependencies are clean.

### Wave 1: Contracts and shared system baselines

- Workstream 0: Trust, identity, and vocabulary contracts
- Workstream 4A: Shared chrome and panel system contract

### Wave 2: Navigation and knowledge promotion

- Workstream 1: Omnibox and navigation spine
- Workstream 2: Canonical knowledge layer

### Wave 3: Trustworthy assistance and surface parity

- Workstream 3: Agent workflow + artifact/output legibility
- Workstream 4B: Surface polish slices

### Wave 4: Next-round workspace home prep only

- Workstream 5: Workspace home contract and readiness

## Workstream Map

## Workstream 0. Trust, Identity, And Vocabulary Contracts

Purpose:

- remove the known bootstrap integrity risk
- separate clean workspace identity from launch-control metadata
- settle the canonical product vocabulary so later polish does not keep reintroducing drift

### Scope

#### 0A. Standardize repository write transactions

Primary targets:

- `src/store/actions/bootstrapActions.ts`
- `src/services/db/client.ts`
- `src/services/db/repositories/CaseRepository.ts`
- other multi-table repository write paths that rely on `runWriteTransaction(...)`

Execution shape:

- audit every nested transaction entry point rather than patching only the demo-seed path
- define one durable rule: repository helpers may participate in an existing transaction, but must not open a second one implicitly
- preserve atomic restore/import behavior
- add targeted repository/bootstrap tests that cover seed import and another representative multi-table restore flow

Why first:

- first-run trust is a release gate
- this also protects upcoming work on search, item promotion, board-agent writes, and restore flows

#### 0B. Split workspace display identity from launch metadata

Primary targets:

- workspace persistence schema and repository mappings
- launch shaping and guided-mode flows
- display-title readers that still rely on raw `workspace.title`

Required fields:

- `displayTitle`
- `launchTopic`
- `launchAngle`
- `prioritySourcesSummary`

Execution shape:

- keep compatibility for existing records during migration
- use `displayTitle` for all primary user-facing chrome
- keep launch metadata structured for prompts, exports, run summaries, and future workspace home summaries
- continue using `sanitizeDisplayTitle()` only as a compatibility bridge, not as the long-term source of truth

#### 0C. Canonical vocabulary map

Decision:

- fix primary shell/product nouns instead of allowing top-level label drift by profile

Canonical nouns:

- `Workspace`: the top-level container
- `Artifact`: a saved generated output
- `Run`: a generation or execution event
- `Signal`: a saved monitored/discovered event
- `Source`: a cited external source
- `Item`: a canonical note, link, file, excerpt, or similar workspace-native record

Surface labels that stay literal:

- `Chat`
- `Board`
- `Timeline`
- `Network`
- `Files`
- `Settings`

Allowed variability:

- artifact type language inside artifact-specific UI and prompt copy
- pack/purpose helper copy in guided flows

Retire from top-level shell copy:

- `Case`
- `Project`
- `Report` as the primary generic object label
- archive naming that changes by label profile

Implementation note:

- label profiles should remain useful for setup and content framing, but shell chrome, route labels, and core object labels should converge

### Parallelization

- `0A` can run independently from `0B`
- `0C` can start immediately once the noun map is approved

### Exit Criteria

- seed/bootstrap restore is transaction-safe
- a migrated workspace can store clean display identity plus launch metadata
- top-level shell and primary route surfaces stop drifting between workspace/case/project/report language

### Docs To Update When Landing

- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/ARCHITECTURE.md`
- `README.md` if setup or surface naming changes visibly

## Workstream 1. Omnibox And Navigation Spine

Purpose:

- replace the current quick-jump modal with a true search-and-action primitive
- make workspace navigation and synthesis faster before a full workspace home exists

### Scope

#### 1A. Rebuild global search as one omnibox

Primary targets:

- `src/components/ui/GlobalSearch.tsx`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- shell/header composition points
- route navigation helpers

Decision:

- ship one canonical omnibox
- place it in the main header/toolbar area on surfaces where search is a primary behavior
- center it visually in workspace-heavy surfaces, with keyboard-first open behavior still available globally

Result model:

- global results for routes, workspaces, recent items, and saved views
- workspace-scoped results for artifacts, sections, evidence, sources, entities, signals, chats, runs, and workspace items
- typed actions on each result, but hidden behind one clean action menu rather than icon clutter

Selection behavior:

- first choice is in-context focus on the current surface when that surface can meaningfully resolve the result
- second choice is navigation to the canonical route for that object
- examples:
  - focus an artifact already open in the viewer
  - select/highlight an item on the current board
  - focus a timeline event or graph entity when already on that route
  - otherwise route to the correct surface

#### 1B. Replace duplicate full-search products, not local filters

Decision:

- the omnibox replaces full-app search experiences
- dense local panels may still keep lightweight filter inputs, but only for filtering items already visible in that panel
- those local filters should reuse the same query/result language where possible, not become separate search systems

This means:

- keep a library-panel filter when needed
- do not keep multiple unrelated "search" concepts in headers and drawers
- route all deep search through the omnibox result model

#### 1C. Add recents, saved views, and action routing

Required additions:

- recent workspaces, artifacts, chats, and items
- saved route states for timeline/graph/file views worth returning to
- typed action routing for:
  - open
  - focus in current surface
  - place on board
  - open in chat
  - open in timeline
  - open in network

### Why This Comes Before Workspace Home

The omnibox gives Sherlock a synthesis/navigation layer immediately, and its result/action contracts become direct inputs to a later workspace dashboard. * Well be able to test it out on the worksace board - ideally i can search for items and add them to the canvas. 

### Parallelization

- result modeling and repository expansion can run in parallel with shell/header placement
- recent-items plumbing can run in parallel with action routing once the result types are fixed

### Exit Criteria

- `GlobalSearch` is retired or absorbed into the new omnibox implementation
- `WorkspaceSearchRepository` or its successor powers real workspace search in production UI
- omnibox results can focus in-context where appropriate
- misleading index counts and legacy placeholder copy are removed

### Docs To Update When Landing

- `docs/operations/ARCHITECTURE.md`
- `README.md`

## Workstream 2. Canonical Knowledge Layer

Purpose:

- make workspace-native notes, links, files, and excerpts feel as real as artifacts
- ensure canon is reusable across board, chat, files, search, and timeline

### Definition Of "First-Class"

A record is first-class only if it is:

- searchable
- deep-linkable or focusable
- attachable in chat
- visible in Files/Archives
- eligible for timeline/history visibility where relevant
- placeable on the board
- represented in provenance/retrieval context when used

### Scope

#### 2A. Promote workspace items into the shared product spine

Primary targets:

- `src/services/workspace/library.ts`
- `src/components/features/WorkspaceBoard/*`
- `src/components/features/Archives.tsx`
- `src/components/features/Timeline/*`
- chat attachment/composer flows

Required outcomes:

- workspace items appear in omnibox results
- Files/Archives gains a library-aware mode, tab, or filter
- timeline gains events for item creation, promotion, and material updates
- workspace items can be referenced from non-board surfaces without detouring through the board rail

#### 2B. Add `@` mentions for workspace items in chat

Decision:

- support inline `@` mentions in chat inputs for artifacts, items, entities, and likely saved signals
- render them as clean inline tokens, closer to IDE mention behavior than attachment chips

Why:

- this is the cleanest path to making canon reusable during grounded chat
- it also creates a future-ready interaction contract for mentions in notes, agent prompts, and workspace home actions

#### 2C. Reframe Files/Archives around artifact-plus-item retrieval

Decision:

- keep `Files` as the preferred surface name
- support both list and card/grid views
- make list view the denser default for heavy workspaces
- keep card view for browsing and visual scanning, but redesign it to carry more signal and less empty chrome

### Parallelization

- item timeline events can run in parallel with Files view work
- chat mentions can run in parallel once item identity/result models are fixed

### Exit Criteria

- workspace items are discoverable outside the board
- chat can attach canonical records with inline mentions
- Files can browse artifacts and items without feeling artifact-only

### Docs To Update When Landing

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## Workstream 3. Trustworthy Assistant And Output Legibility

Purpose:

- turn the board agent into an explainable copilot
- make artifact reading feel aware of artifact type, provenance, and confidence

### Scope

#### 3A. Productize the board agent as a reviewable workflow

Primary targets:

- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx`
- `src/services/workspace/agent/runtime.ts`
- `src/services/workspace/agent/actions/registry.ts`
- persisted board-agent audit records

Decisions:

- default mode is approval-first for material actions
- add an explicit auto-approve toggle for low-risk organization actions
- starter intents should live behind one intentional menu entry, not as permanent chips across the surface

Starter intents:

- organize evidence
- cluster sources
- find contradictions
- draft note
- prep briefing

Review surface decision:

- use a focused review sheet, not a separate page
- desktop: right-side review drawer or inspector-adjacent sheet
- narrow screens: modal review step
- the review surface should show:
  - planned actions
  - per-action preview
  - expected writes
  - diff summary after execution
  - action receipts/history

#### 3B. Strengthen action receipts and history

Required outcomes:

- after every agent pass, the user can tell what changed
- completed, skipped, failed, and awaiting-approval actions are visible in one consistent history/readout
- follow-up todos and queued next actions are reviewable, not buried

#### 3C. Introduce artifact-type-aware reading patterns

Primary targets:

- `src/components/features/OperationView/ReportViewer.tsx`
- artifact presentation helpers
- artifact contract/domain mappings

Decision:

- keep one core reading system, but layer artifact-type-specific summaries and section ordering on top of it

Examples:

- `BRIEF`: takeaways, implications, next actions
- `COMPARISON`: comparison matrix and key deltas
- `MONITOR_SNAPSHOT`: change since prior snapshot, watchlist, escalation cues
- `TIMELINE`: chronology summary plus pattern callouts
- `SYNTHESIS`: consensus, disagreement, evidence quality

#### 3D. Make provenance visible without breaking the accordion system

Decision:

- keep the inspector/accordion pattern as the canonical deep provenance surface
- add a compact provenance summary strip near the top of the artifact
- add inline claim-level cues where the claim/evidence relationship matters
- do not duplicate the full provenance payload in multiple places

Recommended shape:

- top summary strip:
  - number of cited sources
  - number of evidence rows
  - provenance warnings
  - grounded vs inferred counts, if available
- inline cues:
  - claim/evidence link chips
  - source anchors where appropriate inside sections
- deep view:
  - existing accordion/panel structure remains the place for complete detail

This preserves the uniform panel system while preventing provenance from feeling invisible unless the user opens several layers.

### Parallelization

- agent UX/productization can run in parallel with artifact rendering work
- provenance summary work can run alongside the type-aware renderer once the shared evidence contract is settled

### Exit Criteria

- board agent actions are previewable, reviewable, and auditable
- artifact reading varies intentionally by artifact type
- provenance is visible at a glance and explorable in depth

### Docs To Update When Landing

- `docs/operations/OPERATIONS_RUNBOOK.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md` if new review/action seams are introduced

## Workstream 4. Shared Surface System And Parity Pass

Purpose:

- bring the routed surfaces to the same quality bar without re-solving headers, panels, and actions page by page

### 4A. Shared Chrome And Panel Contract

Define this before broad UI slicing:

- toolbar spacing, control height, and icon-button treatments
- one CTA hierarchy for headers, panels, cards, and overflow menus
- one selector/menu text rule: remove extra suffix clutter and parenthetical noise
- one hint/tip system behind a uniform trigger rather than inline helper paragraphs
- one default panel behavior:
  - inspector/right-side panels open collapsed by section/subsection
  - left library/dossier panels may open expanded, but their internal sections still start collapsed
- one typography pass:
  - reduce over-bold headings
  - establish clearer size/weight hierarchy
  - only expose extra font-weight controls in settings if they help the shared system rather than adding more one-off knobs

Matrix-rain decision:

- remove ambient matrix-rain backgrounds from steady-state pages
- if retained at all, keep it only for active-running or refreshing states where motion communicates live work
- treat customization as last-priority polish, not current-scope product work

Board/graph guidance decision:

- add onboarding affordances only through nested, on-demand areas
- do not scatter legends, chips, and helper copy across already dense canvases

### 4B. Targeted Surface Slices

These should land after `4A` freezes the system contract.

#### Operation View

- opening the inspector should target the current artifact instead of showing placeholder empty state
- convert edit and voice actions to icon-only controls with the established toolbar treatment

#### Network

- left panel should overlay/slide without shifting graph content
- align panel, toolbar, and inspector behavior with the shared contract

#### Chat

- remove the extra full-width bottom wrapper around chat
- add a cleaner separator for the input toolbar row
- add file-upload and config entry points aligned with the board-agent toolbar language

#### Board

- palette should not auto-close after each insert
- fix item hover/highlight emphasis so active/hovered state gains emphasis instead of losing it
- make library drag-and-drop truly place items on the canvas
- improve text hierarchy and styling inside board items

#### Timeline

- reduce duplicated inline row actions if the inspector/panel already provides the canonical action path
- align panels and action placement with the shared contract

#### Files

- add list/grid toggle behind a clean filter/view control
- make cards denser and more informative
- ensure the list mode becomes the efficient working view, not only an alternate

#### Settings

- `Runtime`: prefer natural vertical stacking over forced layout
- `Theme`: default light/dark surface system to the detected active theme
- `Theme`: put accent and font controls in the same top-level page sections horizontal stack
- `Font`: group selectors separately from the preview specimen
- `Surface workbench`: make "more/less chroma" and "more/less separation" buttons pair logically with "match hue" on its own row; use subtle active outlines in preview instead of text labels

#### Discovery And Live Monitor

- keep them conceptually as feeder surfaces into workspaces, not replacement homes
- redesign cards and CTAs with the same language as chat/board/timeline
- use template-card visual quality as a reference point for card density and clarity
- emphasize:
  - save to workspace
  - add to timeline
  - place on board
  - open in synthesis/chat

### Definition Of "Flagship" In This Plan

`Flagship` means a route a user can live in for sustained work: strong state, deep actions, rich context, and polished recovery paths.

Decision:

- Chat, Board, Timeline, Files, and the future Workspace Home are flagship workflow surfaces
- Discovery and Live Monitor should remain feeder surfaces with flagship-level polish at the interaction layer, but they do not need to become synthesis homes themselves

### Parallelization

- once `4A` is frozen, each surface slice can run as a separate scoped PR or branch
- Board and Network can run together if they share only the chrome tokens and not the same files
- Chat, Files, and Settings are clean parallel candidates after the toolbar/panel contract lands

### Exit Criteria

- shared chrome rules exist in code, not just in this plan
- the named surface issues above are resolved or moved into a narrower dated follow-up plan
- Discovery and Live Monitor no longer look like older subsystems beside newer routed surfaces

### Docs To Update When Landing

- `README.md` if surface behavior visibly changes
- `docs/operations/ARCHITECTURE.md` if controller/layout seams move

## Workstream 5. Workspace Home Next-Round Readiness

Purpose:

- avoid blocking the future workspace home while respecting that it is not this round's build target

Decision:

- do not build the full workspace home in this plan
- do leave behind the contracts it will require

Required readiness work:

- workspace summary selectors
- recent activity selectors
- saved-view model from the omnibox/navigation work
- clean workspace identity fields
- canonical counts for artifacts, items, signals, chats, and board state

Target shape for the next round:

```text
Workspace Home
| Header / Omnibox / Quick Actions |
| Summary | Next Actions | Recent Activity |
| Artifacts | Timeline | Chat |
| Board Snapshot | Network Snapshot | Files / Items |
| Signals | Saved Views | Health / Provenance |
```

This round should make that page obvious to build later, not attempt to fake it through more redirects.

## Recommended Execution Order

1. Workstream 0A: transaction contract fix
2. Workstream 0B and 0C: workspace identity + vocabulary map
3. Workstream 4A: chrome/panel/tooling contract
4. Workstream 1: omnibox and navigation spine
5. Workstream 2: canonical knowledge layer
6. Workstream 3A and 3B: agent review workflow
7. Workstream 3C and 3D: artifact-type reading and provenance pass
8. Workstream 4B: surface slices
9. Workstream 5 readiness checks and next-round handoff

Why this order:

- it fixes data trust first
- it removes naming churn before surface polish multiplies it
- it creates one navigation/search system before adding more page-specific finders
- it promotes canon before refining assistant and rendering behavior that depends on canon
- it holds the workspace home until the product spine is worthy of it

## Decision Matrix

| Topic                      | Decision                                                                                                                     | Why                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Bootstrap integrity        | Choose the full transaction-contract cleanup, not a demo-seed workaround                                                     | This protects every upcoming multi-table write path, not just first-run import           |
| Workspace naming           | Store clean `displayTitle` plus structured launch metadata fields                                                            | User-facing identity should be clean; prompts and lineage still need structured context  |
| Shell vocabulary           | Standardize top-level nouns on `Workspace`, `Artifact`, `Run`, `Signal`, `Source`, `Item`                                    | Least mismatch wins; label profiles should not keep changing the shell's object model    |
| Omnibox placement          | One omnibox, centered in the active header/toolbar where search makes sense, with keyboard access everywhere                 | Makes search feel like a primary workflow and removes fragmented search entry points     |
| Search replacement         | Replace full-app search variants; keep only lightweight local filters inside dense panels                                    | Preserves efficiency without creating competing search products                          |
| Result behavior            | Focus in the current surface when possible, otherwise navigate                                                               | Keeps the app feeling contextual rather than jumpy                                       |
| Workspace items            | Promote them into a full workspace knowledge layer                                                                           | The architecture already supports it, and the board should not be their only "real" home |
| Chat attachment model      | Add inline `@` mentions for artifacts, items, entities, and likely signals                                                   | This is the cleanest reusable canon-to-chat interaction                                  |
| Agent trust model          | Approval-first by default, with explicit auto-approve for low-risk actions                                                   | Investigative work benefits from trust and auditability more than maximum autonomy       |
| Agent starter intents      | Surface presets behind one menu/icon entry, not as persistent chips                                                          | Keeps power accessible without cluttering dense surfaces                                 |
| Agent preview surface      | Use a focused review drawer/sheet, not a new standalone page                                                                 | Fits the existing inspector language and keeps the user in context                       |
| Provenance surfacing       | Keep full detail in accordions/panels, add a top summary strip and inline claim cues                                         | Preserves the uniform panel system while making provenance visible sooner                |
| Discovery and Live Monitor | Keep them as feeder surfaces with flagship-quality polish, not synthesis homes                                               | They should feel first-class without duplicating the role of workspace-heavy surfaces    |
| Meaning of `first-class`   | Searchable, linkable/focusable, attachable, visible in Files, eligible for history, placeable on board                       | This gives a concrete product standard instead of a vague aspiration                     |
| Meaning of `flagship`      | A route users can live in for sustained work, with deep context and strong recovery                                          | Clarifies where Sherlock should invest the most workflow polish                          |
| Panel defaults             | Right-side panels collapsed by section by default; left library/dossier panels open, but their inner sections still collapse | Keeps pages calmer while preserving fast access to the main working rail                 |
| UI helper text             | Remove persistent helper clutter and move tips into one hint system                                                          | Dense pages need less always-visible text, not more                                      |
| Matrix rain                | Remove it from ambient/static pages; keep or revisit only for active-running states                                          | It currently reads more as legacy theme than useful state communication                  |
| Workspace home             | Do not build it in this round; leave behind the contracts it needs                                                           | The next round should consume the stronger spine produced here                           |
