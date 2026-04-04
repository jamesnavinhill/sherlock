# Sherlock Timeline Buildout Plan

Date: 2026-04-03
Status: In Progress

## Objective

Build Timeline into a first-class workspace chronology surface that shows how a workspace evolved over time across signals, runs, artifacts, chat actions, and follow-up activity.

This plan turns the direction established in:

- `docs/plans/03-cleanup-parity-and-timeline-plan.md` Slice 2
- `docs/reports/04-timeline-surface-report.md`

into an implementation-ready plan.

## Relationship To Current Architecture

Timeline should extend Sherlock's existing feature-shell grammar, not invent a new one.

Important current patterns to build on:

- full-screen feature modules routed by `AppView` in `src/App.tsx`
- sticky headers in `Feed` and `LiveMonitor`
- left/right panel composition in `OperationView`, `Chat`, and `NetworkGraph`
- workspace-scoped state and persistence in `src/store/caseStore.ts`
- local-first SQLite repositories in `src/services/db/repositories/*`

Important constraint:

- Timeline is a chronology surface, not a second graph view and not a second archive browser

## Settled Product Decisions

The following are treated as settled direction for this plan.

### 1. Timeline Is A Regular Feature Page

Timeline should ship as:

- a regular routed page
- a central chronological stream
- optional left and right side panels

It should not ship as:

- a graph-first canvas
- a horizontal-scroll-first bar timeline
- a dashboard of disconnected sections

### 2. Header Should Stay Clean And Uniform

The header should match the rest of Sherlock's major pages.

Recommended header controls:

- left panel toggle
- page title
- workspace selector
- text search input
- filters button
- optional export button
- right panel toggle

Always-visible filter chips are not the recommended direction.

### 3. Left Panel Is A Dossier

The left panel should act like an existing Sherlock dossier/navigation panel.

It should support:

- collapsible sections
- counts per section
- category browsing
- coarse filtering
- item selection that focuses the chronology

It should not become a second complex filter form.

### 4. Search And Filters Have Different Jobs

Search should be:

- header-based
- text input
- quick-find

Filters should be:

- behind one button
- shown in a config-style popout
- used for structured narrowing such as date range, event type, severity, and advanced inclusions

### 5. V1 Scope Should Stay Focused

The first meaningful Timeline release should focus on:

- signals
- runs
- artifacts
- lineage and click-through behavior

Chat actions, entity milestones, and graph edits should follow after the chronology shell is strong.

### 6. Canonical Naming Should Lead New Timeline Work

Prefer in new Timeline selectors, helpers, and docs:

- `Workspace`
- `Artifact`
- `WorkspaceRun`
- `Signal`

Compatibility names may remain at repository/storage edges where needed.

## Product Role

Timeline should answer:

- what changed in this workspace over time
- what signals arrived when
- what runs were launched and completed
- what artifacts those runs produced
- where follow-up work branched
- what chat-driven actions materially changed the workspace

Timeline should complement:

- `Archives` as inventory
- `OperationView` as artifact reading
- `NetworkGraph` as topology
- `Chat` as interaction and action

## Target End State

Sherlock should gain:

- a visible `Timeline` app surface in the shell
- a workspace-scoped chronology page
- a dossier-style left panel for organization and coarse selection
- a central mixed event stream grouped by time
- a right-side details drawer
- header text search
- a filters/config popout
- click-through into artifacts, chat, graph, and related workspace items
- lineage markers that make follow-up relationships legible

The resulting workflow should support things like:

- open a workspace and see its sequence of signals, runs, and outputs
- narrow to one artifact or one signal and see related follow-up activity
- search for an entity, source, or topic in the timeline
- inspect a selected event in a side drawer
- jump from a timeline event into `OperationView`, `Chat`, `NetworkGraph`, or `Archives`

## Core Model To Introduce

### 1. Timeline Event

Introduce a normalized timeline event layer rather than driving the UI directly from raw store collections.

Recommended internal type:

- `TimelineEvent`

Responsibilities:

- normalize mixed sources into one chronology contract
- expose one canonical timestamp
- expose event track and subtype
- store workspace linkage
- store related refs for click-through and lineage
- support lightweight badges and summaries

Recommended properties:

- `id`
- `occurredAt`
- `track`
- `workspaceId`
- `title`
- `summary`
- `refKind`
- `refId`
- `parentRefId`
- `badges`
- `metadata`

### 2. Timeline Query State

Recommended internal type:

- `TimelineQueryState`

Responsibilities:

- capture current workspace scope
- capture text search
- capture structured filters
- capture left-dossier focus selection
- drive selectors and derived counts

### 3. Timeline Selection State

Recommended internal type:

- `TimelineSelectionState`

Responsibilities:

- track selected event
- control right-drawer content
- support route-safe click-through behavior

## Execution Streams

This plan is intentionally split into five implementation streams:

- Stream 1: chronology foundation
- Stream 2: timeline shell and layout
- Stream 3: dossier, search, and filters
- Stream 4: details drawer and click-through integration
- Stream 5: lineage, polish, and summary upgrades

The recommendation is to land Streams 1 and 2 first so Timeline becomes a real navigable page, then complete search/filter/drawer behavior before polishing lineage and summary layers.

## Stream 1: Chronology Foundation

### Goal

Create the normalized event model and selectors Timeline will depend on.

### Success Criteria

- mixed workspace records can be normalized into a single `TimelineEvent` array
- selectors return stable chronological ordering
- Timeline does not depend on ad hoc component-level data merging
- canonical timestamp behavior is defined per event source

### Scope

This stream includes:

- normalized event types
- event-building helpers/selectors
- workspace-scoped timeline derivation
- initial event-source mapping

This stream does not aim to:

- ship final page polish
- expose full advanced filters
- solve every lineage edge case

### Primary Files

- `src/types/index.ts`
- `src/store/caseStore.ts`
- `src/components/features/TimelineView.tsx`
- new timeline-specific helpers/selectors to be introduced
- `src/services/db/repositories/*` where timestamp or ref access needs widening

### Work Breakdown

#### 1. Define Timeline Types

Add:

- `TimelineEvent`
- `TimelineQueryState`
- `TimelineSelectionState`
- enums or unions for event tracks and subtypes

#### 2. Normalize Event Sources

Start with:

- `Headline` as `Signal`
- `InvestigationTask` as `WorkspaceRun`
- `InvestigationReport` as `Artifact`

Defer secondary sources until the shell is stable:

- `ChatSession`
- `AgentAction`
- `ManualNode`
- `ManualConnection`

#### 3. Define Timestamp Rules

Use source timestamps that represent actual chronology.

Important note:

- `InvestigationReport` currently needs a stronger public creation timestamp than `dateStr`
- `Case` currently does not expose all useful created/updated timestamps in the public type layer

Recommendation:

- expose canonical timestamps in the public types and repository mappers as part of this stream

#### 4. Define Minimal Lineage Metadata

Establish a first pass for parent/child relationship wiring across:

- signal to run
- run to artifact
- artifact to follow-up run

Prefer explicit identifiers where available.

Where identifiers are not yet available, define contained compatibility logic and mark it transitional.

## Stream 2: Timeline Shell And Layout

### Goal

Replace the parked Timeline placeholder with a real page shell.

### Success Criteria

- `Timeline` is intentionally visible and navigable in the app shell
- the page follows Sherlock's existing feature-shell patterns
- left and right panel toggles work
- the center chronology renders normalized events

### Primary Files

- `src/components/features/TimelineView.tsx`
- `src/App.tsx`
- `src/components/ui/Sidebar.tsx`
- shared panel/UI components where reuse makes sense

### Work Breakdown

#### 1. Replace The Parked Placeholder

Rebuild `TimelineView` from the current parked slice into a proper feature shell.

#### 2. Implement Header Layout

Header should include:

- left toggle
- title
- workspace selector
- text search input
- filters button
- optional export button
- right toggle

#### 3. Add Three-Pane Desktop Composition

Desktop target:

- left dossier panel
- main chronology panel
- right details drawer

Mobile target:

- compact header
- collapsible dossier drawer
- main chronology list
- bottom sheet or full-screen detail view

#### 4. Keep Visual Language Cohesive

Match established Sherlock patterns:

- dark panel treatment
- sticky headers
- dossier-style collapsible sections
- inspector-style detail surfaces

## Stream 3: Dossier, Search, And Filters

### Goal

Implement the main control model for browsing and narrowing the timeline.

### Success Criteria

- text search works naturally from the header
- left dossier can focus categories and items
- filters live in a single config-style popout
- controls feel distinct rather than redundant

### Primary Files

- `src/components/features/TimelineView.tsx`
- extracted Timeline subcomponents to be introduced
- reusable popout/config UI patterns if factored

### Work Breakdown

#### 1. Build The Left Dossier

Recommended sections:

- `Events`
- `Runs`
- `Artifacts`
- `Signals`
- `Chats`
- `Follow-ups`

Dossier behavior:

- collapsible sections
- counts
- click section to focus/filter
- click item to isolate related activity

#### 2. Add Header Text Search

Search should match likely user queries such as:

- artifact titles
- run topics
- signal text
- entity names
- source names
- chat session titles

Search should be quick-find, not an advanced query builder.

#### 3. Add Filters Popout

Use a config-style popout aligned with `Feed` and `LiveMonitor`.

Good initial filters:

- date range
- event types
- artifact type
- threat/severity
- include chat actions
- include graph edits

#### 4. Keep Control Responsibilities Clear

Recommended split:

- dossier = browse and coarse focus
- search = text lookup
- filters = structured narrowing

## Stream 4: Details Drawer And Click-Through Integration

### Goal

Turn Timeline from a passive list into a navigable workspace surface.

### Success Criteria

- selecting an event opens a useful details drawer
- drawer content adapts by event type
- drawer actions open the correct downstream surfaces
- Timeline meaningfully links into the rest of Sherlock

### Primary Files

- `src/components/features/TimelineView.tsx`
- `src/App.tsx`
- click-through helpers/selectors to be introduced

### Work Breakdown

#### 1. Build Event Detail Rendering

The right drawer should support:

- summary
- event type
- timestamp
- workspace linkage
- related run/artifact/session refs
- raw metadata expander

#### 2. Add Click-Through Actions

Support actions such as:

- open artifact in `OperationView`
- open workspace in `Chat`
- jump to related graph context
- open archive context where helpful

#### 3. Add Event-Specific Drawer Sections

Examples:

- signal source and severity for signals
- config snapshots and status for runs
- artifact type and follow-up relations for artifacts
- action payload summaries for meaningful chat actions

## Stream 5: Lineage, Polish, And Summary Upgrades

### Goal

Improve the chronology so it feels intentional and insight-rich rather than just technically correct.

### Success Criteria

- follow-up relationships are legible
- chronology density remains readable
- useful summary states exist without overwhelming the page
- Timeline feels meaningfully distinct from Archives and Graph

### Primary Files

- `src/components/features/TimelineView.tsx`
- extracted Timeline presentation helpers/components
- timeline selector/helpers introduced in Stream 1

### Work Breakdown

#### 1. Add Lightweight Lineage Markers

Use:

- connector lines
- parent/child relationship chips
- "spawned follow-up"
- "produced artifact"

Do not turn the page into a graph canvas.

#### 2. Add Compact Summary States

Useful upgrades:

- activity totals by visible scope
- "last activity" indicators
- lightweight weekly/monthly grouping

#### 3. Add Secondary Tracks

Once the shell is strong, add:

- chat sessions
- meaningful chat actions
- entity milestones

#### 4. Evaluate Exportable Timeline Artifacts

If worthwhile later:

- allow saving a timeline snapshot as an `Artifact` with `artifactType: TIMELINE`

This is explicitly later-slice work, not required for the first meaningful release.

## Testing Expectations

Before closing this plan's first implementation pass, run:

```bash
npm run lint
npm run test
npm run build
```

Add or extend tests for:

- normalized timeline event ordering
- event-source mapping correctness
- search and filter behavior
- dossier section behavior
- click-through routing behavior
- timeline rendering of empty and populated states

## Documentation Expectations

When Timeline becomes a real surface, update:

- `README.md`
- `docs/operations/architecture.md`
- `docs/operations/OPERATIONS_RUNBOOK.md` if Timeline introduces notable navigation or fallback behavior

## Risks

### 1. Timeline Becomes Too Broad

Risk:

- the page tries to represent every stored record at once

Mitigation:

- keep V1 focused on signals, runs, and artifacts
- add secondary tracks later

### 2. Weak Chronology Fidelity

Risk:

- some current public types do not expose ideal timestamps or lineage identifiers

Mitigation:

- strengthen timestamp exposure in the type/repository layer first
- introduce explicit lineage identifiers where practical

### 3. Redundant Control Surface

Risk:

- search, filters, and dossier overlap and make the page feel noisy

Mitigation:

- keep a strict division of responsibility between quick-find, structured narrowing, and dossier navigation

### 4. Timeline Drifts Into Graph Or Archive Territory

Risk:

- the feature loses its core identity

Mitigation:

- keep Timeline centered on sequence and causality
- treat `Archives` as inventory and `NetworkGraph` as topology

## Recommended Execution Order

1. Finish Slice 1 cleanup/parity work from `docs/plans/03-cleanup-parity-and-timeline-plan.md`.
2. Land Timeline event normalization and timestamp cleanup.
3. Replace the parked Timeline shell with the real three-pane layout.
4. Add dossier, search, and filters behavior.
5. Add details drawer click-through integration.
6. Add lineage markers and secondary tracks.

## Final Recommendation

Build Timeline as a clean, dossier-driven chronology page:

- clean header
- workspace selector
- text search
- filters popout
- left dossier
- central event stream
- right details drawer

That is the version of Timeline most likely to feel cohesive with Sherlock's current shells while still adding a truly new dimension to the product.
