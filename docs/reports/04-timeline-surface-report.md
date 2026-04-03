# Sherlock Timeline Surface Report

Date: 2026-04-03

## Purpose

This report turns Slice 2 of `docs/plans/03-cleanup-parity-and-timeline-plan.md` into a concrete product recommendation.

It focuses on:

- what Timeline should literally look like in the app
- what should be visible by default versus hidden behind filters or drawers
- how Timeline should map onto Sherlock's existing page shells so it feels cohesive
- which technical names should be used now for workspaces, artifacts, runs, signals, chat events, and follow-ups

## Source Snapshot

This report is grounded in the current implementation, especially:

- `src/App.tsx`
- `src/components/ui/Sidebar.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/OperationView/index.tsx`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/LiveMonitor/index.tsx`
- `src/components/features/Feed.tsx`
- `src/types/index.ts`
- `src/domain/labels.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/repositories/TaskRepository.ts`
- `src/services/db/repositories/ChatRepository.ts`

## Executive Summary

Timeline should ship as a regular feature page, not a canvas-first graph surface.

The recommended default is:

- a sticky header
- a compact summary strip
- a dossier-style left panel for organization and coarse filtering
- one mixed chronological stream for the active workspace
- a right-side detail drawer for inspection and click-through

It should feel closest to a hybrid of:

- `Feed` and `LiveMonitor` for the top-level page shell
- `Chat` for scrollable chronological content
- `OperationView` and `NetworkGraph` for optional side inspection

The primary view should not be:

- a horizontal bar chart with heavy scrolling
- a dashboard broken into isolated artifact/chat/report sections
- a graph canvas

Timeline's job is not to replace `OperationView`, `Chat`, `NetworkGraph`, `Archives`, or `LiveMonitor`.

Timeline's job is to answer one question those surfaces do not answer well today:

`How did this workspace evolve over time?`

## Current App Patterns Timeline Should Match

Sherlock already has a clear shell pattern across major views:

- full-screen feature modules
- sticky top headers
- a central working surface
- optional left/right side panels or drawers
- dense card/panel treatment on a dark background
- workspace-scoped click-through into deeper surfaces

That pattern is visible in:

- `Feed`: sticky header + scan/filter controls + scrollable center content
- `LiveMonitor`: sticky header + event stream + scan state
- `Chat`: center transcript + optional left and right context panels
- `OperationView`: 3-panel workspace reading surface
- `NetworkGraph`: central visual surface + dossier and inspector panels

Timeline should fit that family, not introduce a completely new interaction grammar.

## Recommended Timeline Product Role

The clean product split should be:

- `Feed`: what is happening outside the workspace
- `Live Monitor`: what is arriving right now
- `Archives`: what has been saved
- `Operation View`: what a single artifact says
- `Chat`: what the user can ask and do next
- `Network Graph`: how entities and sources connect
- `Timeline`: when workspace activity happened, in what order, and what it produced

That makes Timeline additive instead of redundant.

## Recommended Technical Naming

### Canonical Terms To Prefer In New Timeline Work

| Preferred term | Current dominant runtime term | Notes |
| --- | --- | --- |
| `Workspace` | `Case` | Preferred product/canonical concept. Current runtime/store still mostly says `Case`. |
| `Artifact` | `InvestigationReport` | Preferred umbrella for reports, briefs, syntheses, comparisons, timelines, notes. |
| `WorkspaceRun` | `InvestigationTask` | Preferred name for launched runs and their lifecycle. |
| `Signal` | `Headline` | Preferred product term for saved workspace-linked monitor/discovery items. |
| `Live Signal Event` | `MonitorEvent` | Ephemeral live-monitor item before it is saved into the workspace as a signal. |
| `ArtifactSection` | `ArtifactSection` | Already canonical. |
| `ChatSession` | `ChatSession` | Already clear and stable. |
| `AgentAction` | `AgentAction` | Good technical name for retrieval/save/append/follow-up audit events. |
| `Entity` | `Entity` | Stable. |
| `ManualNode` / `ManualConnection` | `ManualNode` / `ManualConnection` | Stable graph-edit vocabulary. |

### Important Naming Hazard In The Current Codebase

`Lead` is overloaded in two different ways today:

- `InvestigationReport.leads` means follow-up bullets inside an artifact
- the SQLite `leads` table actually stores persisted `Headline`-like signal records

For Timeline, avoid using `lead` as a top-level timeline label.

Use:

- `Signal` for `Headline` records
- `Follow-up` for artifact `leads`

That keeps the screen understandable and aligns with the new canon.

### User-Facing Labels Should Still Be Pack-Aware

Sherlock already supports label profiles via `src/domain/labels.ts`.

That means the same underlying timeline track may render as:

- `Case Timeline`, `Project Timeline`, `Monitor Timeline`, or `Workspace Timeline`
- `Report`, `Artifact`, `Brief`, or `Briefing`
- `Signals`, `Sources`, or other pack-aware labels where appropriate

Recommendation:

- keep the sidebar label stable as `Timeline`
- make the page title pack-aware, for example `Case Timeline` or `Project Timeline`

One more distinction matters here:

- `ArtifactType.TIMELINE` already exists in the type system
- that should be treated as an artifact output format, not as the main page architecture

In other words:

- the feature surface is `Timeline`
- a later exportable snapshot from that surface could become an `Artifact` whose `artifactType` is `TIMELINE`

## Recommended Information Architecture

### Default Surface

Timeline should open to a single workspace-scoped chronology page with:

- a clean header matching other major Sherlock pages
- the active workspace title
- a workspace selector
- a text search field
- a single filters button that opens a config-style popout
- a compact summary strip
- a dossier-style left panel with collapsible sections
- a mixed event stream grouped by day, week, or month
- a details drawer that opens when an event is selected

### Left Dossier Structure

The left panel should behave more like `OperationView` and `NetworkGraph` dossier panels than like a row of chips.

Recommended top-level sections:

- `Events`
- `Runs`
- `Artifacts`
- `Signals`
- `Chats`
- `Follow-ups`

Behavior:

- sections are collapsible
- each section shows counts
- clicking a section filters or focuses the main chronology on that class of items
- clicking a specific item highlights or isolates related timeline events
- "All" lives naturally inside the dossier rather than as a top-row chip

This makes the left panel do two jobs that fit Sherlock well:

- structural navigation
- coarse filter selection

### Default-On Tracks

These are the most meaningful timeline categories for a first release:

- `Signals`
- `Runs`
- `Artifacts`

These three still tell the clearest story:

- a signal arrived
- a run was launched
- an artifact was produced

### Secondary Tracks

These should exist, but be controlled through the dossier and filters popout rather than always living in the header:

- `Chat Sessions`
- `Chat Actions`
- `Entity Milestones`

Recommendation:

- show `Chat Sessions` only as notable events like session created or guided run created
- show `Chat Actions` only for meaningful outputs such as `SEARCH_WORKSPACE`, `CREATE_ARTIFACT_DRAFT`, `APPEND_NOTE_TO_ARTIFACT`, and `CREATE_FOLLOW_UP_RUN`
- show `Entity Milestones` only as derived moments like "first seen in workspace" or "mentioned by 3 artifacts"

### Hidden Or Advanced-Only Tracks

These are useful, but likely too noisy for the default stream:

- `Graph Edits` from `ManualNode` and `ManualConnection`
- individual chat messages
- full retrieval snippet payloads
- provider/model/debug metadata

These should live behind:

- advanced filter toggles
- the details drawer
- a per-event "show raw details" expander

## Recommended Layout

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [L] Timeline / Case Timeline   [Workspace Selector]   [Search]   [Filters] │
│                                                     [Export] [Details] [R] │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────┬───────────────────────────────┐
│ TIMELINE DOSSIER             │ MAIN CHRONOLOGY       │ DETAILS DRAWER       │
│                              │                       │                      │
│ Events (21)                  │ Apr 03                │ selected event       │
│ Runs (4)                     │  09:14 Signal saved   │ actions              │
│ Artifacts (3)                │  09:28 Run started    │ collapsible sections │
│   Artifact 1                 │  09:41 Artifact made  │ source/context       │
│   Artifact 2                 │                       │ linked items         │
│ Signals (12)                 │ Apr 02                │                      │
│ Chats (5)                    │  17:20 Follow-up run  │                      │
│ Follow-ups (2)               │  16:55 Artifact made  │                      │
└──────────────────────────────┴───────────────────────┴──────────────────────┘
```

### Mobile

```text
┌──────────────────────────────┐
│ Timeline                     │
│ [Workspace] [Search] [Filter]│
└──────────────────────────────┘
┌──────────────────────────────┐
│ dossier drawer               │
│ collapsible sections         │
└──────────────────────────────┘
┌──────────────────────────────┐
│ grouped timeline list        │
│ event card                   │
│ event card                   │
│ event card                   │
└──────────────────────────────┘

tap event -> bottom sheet / full-screen detail
```

## Recommended Event Card Design

Each event row should show only the information needed to scan and decide whether to inspect:

- timestamp
- track icon and type
- short title
- one-line explanation
- 2-4 badges
- 1-3 primary actions

Example:

```text
09:41  ARTIFACT
Acme Supplier Brief
Created from deep-dive run on supplier concentration risk.
[Brief] [Follow-up] [Workspace Chat]
Open Artifact   Open Run   Open Chat
```

Do not dump full artifact text, chat transcripts, or raw retrieval payloads into the main stream.

That belongs in the drawer.

## Filters, Tabs, And Panels

### Recommendation

Use:

- a dossier-style left panel for organization and coarse filtering
- a detail drawer on the right
- one filters button with a config popout

Do not use:

- always-visible filter chips across the header
- heavy top-level tabs

Reason:

- Timeline is strongest when it shows mixed chronology
- a chip row adds visual noise quickly
- hard tabs split the story into silos too early
- Sherlock already uses drawers and contextual panels well

### Suggested Header Controls

- left panel toggle
- page title
- workspace selector
- text search input
- filters button
- optional export button
- right panel toggle

This keeps the header closer to existing Sherlock shells:

- uniform
- readable
- control-light
- framed by outer panel toggles

### Suggested Filters Popout

Filters should open in a compact config-style popout matching the existing settings overlays used by `Feed` and `LiveMonitor`.

Good candidates for that popout:

- date range
- event-type toggles
- threat/severity filters
- artifact type filters
- "include chat actions"
- "include graph edits"
- density or grouping options if needed

### Suggested Drawer Content

The right drawer should hold:

- full event summary
- linked workspace
- linked artifact/run/chat/session identifiers
- related source, entity, or signal references
- raw metadata expander
- navigation actions into `OperationView`, `Chat`, `NetworkGraph`, or `Archives`

## Search Model

### Recommended Answer

Use both text search and filters, but give them different responsibilities.

### Text Search

Search should be a direct text input in the header, placed naturally after the workspace selector.

That search should feel like quick-find, not advanced filtering.

It should match things users are likely to type:

- artifact titles
- run topics
- signal text
- entity names
- source names
- chat session titles

### Filters

Filters should not try to replace text search.

Filters are better for narrowing the result set by structured constraints:

- date range
- track type
- artifact type
- severity
- follow-up only
- include or exclude chat/system activity

### Left Dossier Vs Search

The dossier should not become a second full search system.

Recommended split:

- header search = quick text lookup
- filters popout = structured narrowing
- left dossier = browse, organize, and focus by category or item

That division feels clean and matches the rest of the app better than using chips for everything.

## Graph, Canvas, Or Regular Page?

### Recommended Answer

Regular page first.

More specifically:

- DOM-based scrollable chronology list
- grouped date sections
- inline branch connectors for lineage
- optional virtualization later if volume grows

### Why Not A Graph-First Timeline

Sherlock already has a dedicated graph surface.

If Timeline also becomes a graph-first experience, the distinction between:

- time
- topology

gets muddy.

A graph answers:

- what is connected?

Timeline should answer:

- what happened first, next, and because of what?

### Why Not A Horizontal Timeline Bar As The Main Surface

Horizontal timelines work best when there are relatively few large scheduled phases.

Sherlock's data is the opposite:

- many small events
- irregular density
- expanding detail
- lots of text

That makes a horizontal scroll bar a poor default.

A vertical stream is more natural and matches `Chat`, `Feed`, and `LiveMonitor`.

### Where Small Graph-Like Affordances Do Help

Use lightweight lineage markers, for example:

- vertical connector lines between related events
- "spawned follow-up run" chips
- "produced artifact" chips
- "opened from signal" chips

That gives chronology plus causality without turning Timeline into a second graph module.

## Recommended Track Mapping To Current Data

| Timeline track | Backing data now | Default? | Notes |
| --- | --- | --- | --- |
| Signals | `Headline` records, optionally saved from `MonitorEvent` | Yes | Best canonical label is `Signal`, even though the runtime type is `Headline`. |
| Runs | `InvestigationTask` / `WorkspaceRun` | Yes | Use `startTime` and `endTime`. |
| Artifacts | `InvestigationReport` / `Artifact` | Yes | Needs surfaced creation timestamp in the public type for clean ordering. |
| Chat Sessions | `ChatSession` | Secondary | Good for "session created", "guided session created", or "chat revived from artifact". |
| Chat Actions | `AgentAction` | Secondary | Show only high-signal action types, not every retrieval detail by default. |
| Entity Milestones | derived from `InvestigationReport.entities` | Secondary | Good as computed milestones, not raw mentions. |
| Graph Edits | `ManualNode`, `ManualConnection` | Advanced only | Useful for power users, too noisy for default stream. |

## Recommended Default Flow

```text
Signal saved
  -> user launches run
  -> WorkspaceRun starts
  -> WorkspaceRun completes
  -> Artifact is created
  -> user opens chat from artifact
  -> AgentAction creates draft / append / follow-up
  -> follow-up WorkspaceRun starts
  -> child Artifact appears under the same branch
```

This is the story Timeline should make obvious at a glance.

## How Timeline Stands Out In A Meaningful Way

Timeline adds a dimension the app currently lacks.

Right now Sherlock has:

- strong per-artifact reading
- strong graph relationship exploration
- strong grounded chat
- strong discovery and live-monitor intake

What is weak today is longitudinal workspace memory.

Timeline becomes the answer to:

- when did this workspace begin to shift?
- what caused the newest artifact to exist?
- which signal led to which run?
- what did chat materially change?
- where did follow-up work branch?

That is a meaningful product addition, not just another view of the same records.

## Cohesion Recommendations

To feel on-brand with the existing app:

- keep the matrix/dark panel treatment already used by feature shells
- use the same sticky-header pattern as `Feed` and `LiveMonitor`
- use the same inspector/drawer behavior already familiar from `OperationView`, `Chat`, and `NetworkGraph`
- let the left dossier work like existing dossier/navigation panels instead of a toolbar of chips
- keep text search in the header near the workspace selector
- keep advanced filters behind a single config-style popout
- keep actions workspace-scoped and click-through oriented
- reuse current label profiles for user-facing copy

Recommendation for sidebar placement after Slice 2 ships:

1. `Operation View`
2. `Workspace Chat`
3. `Timeline`
4. `Network Graph`
5. `Live Monitor` / `Signal Monitor`
6. `Archives`
7. `Discovery Feed`

That groups the core workspace-analysis surfaces together.

## Implementation Notes That Matter For UX

### 1. Introduce A Normalized `TimelineEvent` Layer

Slice 2 should not wire the UI directly to raw store collections.

Add a selector/helper layer that normalizes all event sources into a single shape, for example:

```ts
type TimelineEvent = {
  id: string;
  occurredAt: number;
  track: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'GRAPH';
  workspaceId: string;
  title: string;
  summary?: string;
  refKind?: string;
  refId?: string;
  parentEventId?: string;
  parentRefId?: string;
  badges?: string[];
  metadata?: Record<string, unknown>;
};
```

Without that layer, the screen will quickly become a pile of one-off conditionals.

### 2. Expose Reliable Timestamps On Public Types

The database already stores strong timestamps for:

- `cases`
- `reports`
- `tasks`
- `chat_sessions`
- `chat_messages`
- `chat_actions`
- `manual_nodes`
- `manual_links`

But the public runtime types do not expose all of those fields consistently today.

Most notably:

- `InvestigationReport` does not currently expose `createdAt`
- `Case` does not currently expose `createdAt` / `updatedAt`

Timeline should not rely on `dateStr` for artifact chronology.

Recommendation:

- expose canonical timestamps in the public type layer before or alongside the Timeline shell

### 3. Add Explicit Lineage IDs

Current artifact lineage is weakly inferred through `parentTopic` and topic matching in `archiveReport`.

That is enough for a loose relationship, but not ideal for a true chronology surface.

Recommendation:

- add explicit parent identifiers for runs and artifacts
- prefer `parentRunId`, `parentArtifactId`, or similar over title/topic matching

That will make branch rendering far more trustworthy.

### 4. Keep V1 Focused

The first real Timeline release should not try to show everything.

A strong V1 is:

- mixed workspace chronology
- dossier-style left panel
- signals + runs + artifacts
- header text search
- filters popout
- detail drawer
- click-through into existing views

Later additions can include:

- entity milestones
- chat action density views
- graph edit overlays
- weekly/monthly summaries
- exportable timeline artifacts

## Final Recommendation

Build Timeline as a workspace chronology page with a mixed vertical event stream, compact summary strip, filter chips, and a right-side detail drawer.

Use canonical terms in the implementation:

- `Workspace`
- `Artifact`
- `WorkspaceRun`
- `Signal`

But keep pack-aware user labels through the existing label-profile system.

Most importantly, keep Timeline distinct from both `NetworkGraph` and `Archives`:

- `NetworkGraph` is structure
- `Archives` is inventory
- `Timeline` is sequence and causality

That is the version of Slice 2 most likely to feel cohesive, intuitive, and meaningfully additive inside the current Sherlock app.
