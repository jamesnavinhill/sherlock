# Library Rail Unification Plan

## Goal

Unify Sherlock's left-side library and browse panels into a shared library rail system that preserves context-specific behavior while removing duplicated shell, section, and item rendering logic.

This cleanup should include the artifact details sidebar patterns that currently live inside the archive viewer, since that sidebar behaves like a specialized library rail already. The center artifact reading surface should remain intact.

## Current Read

Sherlock currently has a family of left-side browse surfaces and sidebars that all serve a similar job: organize saved workspace context, expose grouped records, and provide quick actions for opening, focusing, placing, or managing those records.

The strongest members of this family are:

- Operation/network workspace library rail: [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- Timeline library rail: [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- Board library rail: [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)
- Chat library rail: [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)
- Artifact details sidebar patterns inside [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx)

There is also a related but less directly matching records-browsing surface in Files:

- [src/components/features/Files/FilesOverview.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesOverview.tsx)
- [src/components/features/Files/FilesRecords.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesRecords.tsx)

These surfaces share a lot of structure:

- panel shell
- header treatment
- accordion sections
- nested rows and mini-cards
- thin action buttons
- empty-state messaging
- exclusive section toggling
- list-and-drill interaction patterns

But they differ in behavioral details:

- board items need `Add To Board`
- timeline items need `Focus`
- operation dossier items need `Open`
- chat items need `Select Session`
- artifact sidebar items need `Jump To Section`
- board alone currently has a search row and create actions

That means the right target is not one mega component. The right target is a shared rail system with page-specific data and behavior adapters.

## Target Outcome

Implement one shared library rail system that:

- standardizes left-rail shell and browse patterns
- supports page-specific sections, item types, and actions
- reuses current chrome and styling language
- removes duplicated rail shell and accordion rendering logic
- folds the artifact details sidebar into the same family
- keeps Files visually aligned but not forcibly merged if the fit is poor

## Design Principles

- Unify rendering vocabulary, not business behavior.
- Keep page-specific click handling and action semantics outside the shared rail primitives.
- Do not force Files into the exact same component if it is better treated as an adjacent records browser.
- Treat the artifact viewer's right-hand detail sidebar as part of the library rail family.
- Keep the archive viewer's center artifact reading experience intact.
- Favor builder/adaptor layers over giant prop bags.

## Shared Library Rail Architecture

### 1. Create a dedicated shared feature area

Add a shared rail feature folder:

- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/LibraryRail/LibraryRailHeader.tsx`
- `src/components/features/LibraryRail/LibraryRailSections.tsx`
- `src/components/features/LibraryRail/LibraryRailEntry.tsx`
- `src/components/features/LibraryRail/LibraryRailSearch.tsx`
- `src/components/features/LibraryRail/libraryRailTypes.ts`
- `src/components/features/LibraryRail/libraryRailUtils.ts`
- `src/components/features/shared/useExclusivePanelSections.ts`

This feature area should become the canonical left-rail and sidebar browse system.

### 2. Standardize on a shared section and entry model

Define shared config types in `libraryRailTypes.ts`:

- `LibraryRailSection`
- `LibraryRailEntry`
- `LibraryRailEntryAction`
- `LibraryRailHeaderAction`

Recommended section variants:

- `list`
- `nested-list`
- `summary`
- `filters`
- `detail-cards`

Recommended entry variants:

- simple row
- disclosure row
- compact card
- metadata row
- action card

The shared rail should render these generically, while route-specific builders decide what data becomes sections and what actions each entry exposes.

### 3. Centralize the shell, not the behavior

The shared library rail system should own:

- panel width/open-state layout
- fixed header structure
- optional summary text/counts
- optional header action row
- optional search bar row
- accordion section rendering
- scroll region handling
- nested item styling
- empty states
- optional section-local action rows

The route adapters should still own:

- which sections exist
- section ordering
- how rows are built
- what each click does
- what nested actions are shown
- whether a search field is present
- whether create/upload actions are present

This separation is the main thing that will keep the cleanup clean.

## Shared Toggle and Section State Cleanup

There are repeated exclusive-toggle patterns across the current panel family.

Examples:

- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts)
- [src/components/features/Timeline/timelineViewUtils.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineViewUtils.ts)
- operation dossier state
- chat left panel section state

Create one shared hook:

- `src/components/features/shared/useExclusivePanelSections.ts`

Use it to standardize:

- one-open-at-a-time section toggles
- optional nested item expansion state
- default-open behavior

This reduces repeated boilerplate before the visual migration is even finished.

## Family Grouping Strategy

### Group 1: Reference Library Rails

These should share the most implementation:

- [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)
- artifact detail/sidebar portions of [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx)

Common traits:

- sectioned grouped records
- drill into related content
- nested row actions
- browse-and-open behavior

### Group 2: Focus and Navigation Rails

These should share shell and section rendering, but use different builders:

- [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)

Common traits:

- grouped navigation
- focus/select semantics
- lighter record metadata
- no full nested browse cards needed in some sections

### Group 3: Records Browsers

These should stay somewhat separate, but align visually with the same primitives:

- [src/components/features/Files/FilesOverview.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesOverview.tsx)
- [src/components/features/Files/FilesRecords.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesRecords.tsx)

These are better treated as consumers of shared chrome tokens and possibly shared row/card subcomponents, not as strict library rails.

## Artifact Viewer Sidebar Plan

The center artifact reading view in [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx) should remain a dedicated document-reading experience.

However, the right-side detail sidebar inside that file should be extracted into the shared library rail family because it already behaves like a specialized library panel:

- sectioned browse surface
- key findings list
- follow-up list
- entity list
- source/evidence browse list
- nested local actions

Recommended extraction:

- move the right-side sidebar rendering into a dedicated component under `LibraryRail`
- keep artifact-specific builders close to operation view, for example:
  - `src/components/features/OperationView/buildArtifactSidebarSections.ts`

This will let the archive viewer keep its workflow while removing a large block of one-off sidebar rendering logic.

## Shared Builder Pattern

The shared rail system should be driven by per-page builders, not hand-written JSX in every route.

Recommended builder files:

- `src/components/features/OperationView/buildOperationLibrarySections.ts`
- `src/components/features/Timeline/buildTimelineLibrarySections.ts`
- `src/components/features/WorkspaceBoard/buildBoardLibrarySections.ts`
- `src/components/features/Chat/buildChatLibrarySections.ts`
- `src/components/features/OperationView/buildArtifactSidebarSections.ts`

Each builder should:

- accept route-specific state and callbacks
- return a list of `LibraryRailSection` objects
- produce the exact entry actions needed for that page

This keeps the rendering system shared and the behavior local.

## Route Migration Order

### Phase 1: Shared shell and primitives

Build the shared library rail system first.

Primary files:

- `src/components/features/LibraryRail/*`
- `src/components/features/shared/useExclusivePanelSections.ts`
- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)

Goals:

- centralize shell
- centralize header/search/action rows
- centralize section rendering
- centralize entry rendering
- centralize toggle behavior

### Phase 2: Migrate the operation/network dossier rail

Primary files:

- [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- [src/components/features/OperationView/index.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/index.tsx)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx)

This is the best first real consumer because:

- network already reuses it
- it has the cleanest canonical `Library` rail identity
- it covers artifacts, entities, follow-ups, sources, and signals

### Phase 3: Migrate the board library rail

Primary files:

- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)

This phase should prove:

- shared header tools
- shared search row
- shared nested disclosure item cards
- route-specific row actions like `Add To Board`
- create/upload affordances living in the rail header without becoming special-case UI

### Phase 4: Migrate the timeline library rail

Primary files:

- [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- [src/components/features/Timeline/timelineViewUtils.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineViewUtils.ts)
- [src/components/features/TimelineView.tsx](C:/Users/james/projects/sherlock/src/components/features/TimelineView.tsx)

This phase should prove the shared rail works for focus/navigation semantics, not just browse/open semantics.

### Phase 5: Migrate the chat library rail

Primary files:

- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts)
- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)

This phase should validate:

- simpler section groups
- compact metadata rows
- section-local action rows like `Rename` and `Delete`

### Phase 6: Extract and migrate the artifact detail sidebar

Primary files:

- [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx)
- `src/components/features/OperationView/buildArtifactSidebarSections.ts`

This is likely the highest-complexity migration, so it should happen after the shared rail system is proven on the simpler left rails.

Goals:

- pull right-sidebar rendering out of `ArtifactViewer`
- preserve document-reading flow
- move sidebar sections into shared section/entry config
- keep artifact-specific local actions like `Jump To Section` and `Open Evidence`

### Phase 7: Evaluate Files for partial adoption

Primary files:

- [src/components/features/Files/FilesOverview.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesOverview.tsx)
- [src/components/features/Files/FilesRecords.tsx](C:/Users/james/projects/sherlock/src/components/features/Files/FilesRecords.tsx)

Recommendation:

- do not force Files into `LibraryRailShell`
- do selectively reuse shared row, action, and card primitives where helpful
- align the browse/record visual language, but keep Files as a records browser

## Cleanup Targets

Once migrations are stable, remove or shrink the custom rail implementations:

- [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)
- [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)

Also clean up:

- duplicated section toggle logic
- duplicated scroll region class usage
- repeated nested item action row patterns
- large sidebar-specific rendering blocks inside `ArtifactViewer`

## Risks and Watchouts

- Do not centralize route behavior like `Add To Board` or `Focus` into the shared rail layer.
- Do not flatten the artifact reader into a generic rail.
- Do not force Files into the same component if it makes the records experience worse.
- Do not over-genericize entry rendering to the point where every page passes huge optional prop bags.
- Do not lose the current nested-card affordances the board library uses for created items and source rows.

## Validation Plan

Expected validation for implementation phases:

- `npm run lint`
- `npm run typecheck`
- targeted component and controller tests
- `npm run build`

Likely tests to update:

- [src/components/features/OperationView/WorkspaceLibraryRail.test.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.test.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.test.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.test.tsx)
- [src/components/features/Chat/ChatLibraryRail.test.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.test.tsx)
- [src/components/features/OperationView/ArtifactViewer.test.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.test.tsx)
- board library state tests in [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.test.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.test.ts)

Do not default to the full test suite unless the refactor becomes broad enough that targeted validation would be misleading.

## Summary

The cleanest cleanup is to build a shared `LibraryRail` system with page-specific builders and actions, then migrate the operation/network dossier, board library, timeline dossier, chat session rail, and artifact detail sidebar onto that system in phases. Files should stay visually aligned but only partially adopt the shared primitives if that improves consistency without compromising its records-browser role.
