# UI Panel Unification Epic

## Goal

Unify Sherlock's right-side inspector surfaces and left-side library rails behind the shared panel systems that now exist in the codebase, then finish the remaining route migrations, remove obsolete bespoke shells, and land one clean parity pass with docs and validation in sync.

This epic remains the execution-level companion to:

- [13-global-inspector-cutover-plan.md](C:/Users/james/projects/sherlock/docs/plans/13-global-inspector-cutover-plan.md)
- [14-library-rail-unification-plan.md](C:/Users/james/projects/sherlock/docs/plans/14-library-rail-unification-plan.md)

## Audit Snapshot

Date audited: 2026-04-09

Overall status: In progress, with shared foundations landed and partial route adoption complete.

Current read:

- shared inspector foundations are implemented
- shared library rail foundations are implemented
- OperationView, NetworkGraph, Timeline, Chat, and the ArtifactViewer detail sidebar are consuming the new shared foundations in meaningful ways
- WorkspaceBoard still relies on bespoke panel shells and custom section-state wiring
- final cleanup, full parity normalization, and legacy deletion are not complete

## What Landed

### Shared Inspector Foundation

Implemented:

- [src/components/features/Inspector/GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/Inspector/GlobalInspectorHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorHeader.tsx)
- [src/components/features/Inspector/GlobalInspectorSections.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorSections.tsx)
- [src/components/features/Inspector/GlobalInspectorTabs.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorTabs.tsx)
- [src/components/features/Inspector/globalInspectorTypes.ts](C:/Users/james/projects/sherlock/src/components/features/Inspector/globalInspectorTypes.ts)
- [src/components/features/Inspector/sharedInspectorSectionBuilders.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/sharedInspectorSectionBuilders.tsx)

What this means:

- the canonical shared right-panel shell exists
- shared tab treatment exists
- shared section rendering exists
- reusable entity/headline section builders exist

### Shared Library Rail Foundation

Implemented:

- [src/components/features/LibraryRail/LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- [src/components/features/LibraryRail/LibraryRailHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailHeader.tsx)
- [src/components/features/LibraryRail/LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/LibraryRail/LibraryRailEntry.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailEntry.tsx)
- [src/components/features/LibraryRail/LibraryRailSearch.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSearch.tsx)
- [src/components/features/LibraryRail/libraryRailTypes.ts](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/libraryRailTypes.ts)

What this means:

- the canonical shared left-panel shell exists
- shared header, search, section, and entry rendering exists
- thin nested actions and card-style entries are supported centrally

### Shared Section-State Foundation

Implemented:

- [src/components/features/shared/useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)

What this means:

- the intended exclusive section toggle primitive exists
- Timeline, NetworkGraph, OperationView, and ArtifactViewer are using it
- Chat and WorkspaceBoard have not been migrated onto it yet

### Shared Chrome Hardening

Implemented:

- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)
- [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)

What this means:

- thin action-row density landed
- grid and wrap layouts landed
- shared tab button styling landed
- the shared action-row foundation is stable enough for remaining route migrations

## Phase Status

## Phase 1: Shared Foundation Slice

Status: Complete

Notes:

- the shared inspector feature area exists
- the shared library rail feature area exists
- the exclusive section-state hook exists
- the shared chrome/action-row pass exists

## Phase 2: Foundation Hardening Pass

Status: Largely complete

Evidence:

- focused tests exist for shared inspector, shared library rail, shared section-state, and action row
- thin action density, grid layout, and tab treatment are all present in shared code

Still open:

- there is not yet one final naming and cleanup pass across all route adapters
- Chat and WorkspaceBoard still expose old local panel state APIs rather than consuming the shared section-state hook

## Phase 3: Parallel Pair A

### Stream A1: OperationView + NetworkGraph

Status: Mostly complete, not cleanup-complete

Implemented:

- [src/components/features/OperationView/InspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/InspectorPanel.tsx) is now a shared-inspector adapter over [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/OperationView/DossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx) is now a shared-library adapter over [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/NetworkGraph/NodeInspector.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NodeInspector.tsx) is now a shared-inspector adapter over [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx) reuses [DossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)

Still open:

- the route still keeps legacy wrapper names instead of consolidating on shared route adapters
- OperationView and NetworkGraph are functionally migrated, but final legacy deletion and API cleanup did not happen

### Stream A2: Timeline

Status: Mostly complete, closest route to clean cutover

Implemented:

- [src/components/features/Timeline/TimelineDetailRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDetailRail.tsx) renders through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/Timeline/TimelineDossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDossierPanel.tsx) renders through [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- [src/components/features/Timeline/useTimelineViewController.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/useTimelineViewController.ts) uses [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)

Still open:

- component names still reflect the legacy rail model
- the final route-level cleanup and deletion pass did not happen

## Phase 4: Parallel Pair B

### Stream B1: Chat

Status: Mostly complete, not cleanup-complete

Current state:

- [src/components/features/Chat/ChatSessionRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatSessionRail.tsx) now renders through [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/Chat/ChatContextRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatContextRail.tsx) now renders through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts) now uses [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)

What remains:

- preserve and polish route-level behavior now that the shared shells are in place
- decide whether the remaining route wrappers should stay as thin adapters or be renamed during the cleanup pass
- include Chat in the final cross-route spacing, terminology, and breakpoint audit

### Stream B2: WorkspaceBoard

Status: Partially prepared, not cut over

Current state:

- [src/components/features/WorkspaceBoard/BoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardLibraryRail.tsx) is still a bespoke left rail
- [src/components/features/WorkspaceBoard/BoardInspectorRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardInspectorRail.tsx) is still a bespoke inspector body
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx) still owns a route-specific right-panel shell and tab strip
- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts) and [src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts) still use local exclusive-toggle state

What is already aligned:

- board inspector actions already use [InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- the board still preserves the intended `Agent` sibling surface

What remains:

- move the left rail onto the shared library shell, header, search, and entry system
- move the inspector onto the shared global inspector
- move inspector/agent tabs onto the shared tab shell
- fold AI actions into the shared top action treatment
- preserve create, upload, search, and add-to-board affordances

## Phase 5: Final Integration Audit

Status: Not started

Not done yet:

- legacy wrapper/component cleanup
- naming normalization
- final API cleanup in route adapters
- cross-route spacing and section-language normalization
- breakpoint and open/close behavior audit across all routes after Chat and Board migrate

## Phase 6: Documentation and Final Verification

Status: In progress

Current validation on 2026-04-09:

- `npm run check` passed
- `npm run build` passed
- `npm test` is not green yet

Current failing test:

- [src/services/workspace/agent/actions/registry.test.ts](C:/Users/james/projects/sherlock/src/services/workspace/agent/actions/registry.test.ts)

Failure shape:

- `editor.createAssets is not a function`
- thrown from [src/services/workspace/boardShapes.ts](C:/Users/james/projects/sherlock/src/services/workspace/boardShapes.ts)

Interpretation:

- the main app build is healthy
- the full suite is close but not fully green
- the remaining red test is board-adjacent and should be resolved before calling the epic done

## Route-by-Route Status

### OperationView

Status: Shared inspector and shared library adopted

Still remaining:

- convert legacy wrapper naming into final route-level shared-adapter naming if desired
- include route in the final cleanup/deletion pass

### NetworkGraph

Status: Shared inspector adopted, shared dossier rail reused

Still remaining:

- reduce `NodeInspector` to a thinner final adapter if possible
- include route in the final cleanup/deletion pass

### Timeline

Status: Shared inspector and shared library adopted

Still remaining:

- cleanup-only pass

### ArtifactViewer Detail Sidebar

Status: Partially unified

Implemented:

- [src/components/features/OperationView/artifactViewerDetailRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/artifactViewerDetailRail.tsx) builds shared library-rail sections
- [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx) uses [LibraryRailHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailHeader.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)

Still remaining:

- decide whether this is finished as an intentionally specialized consumer, or should be moved fully onto [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- document that decision in the final architecture sync

### Chat

Status: Shared inspector and shared library adopted, cleanup still pending

### WorkspaceBoard

Status: Legacy rails still active, shared action-row pieces only

## Remaining Work For Clean Cutover

This is the smallest clean path to full parity from the current repo state.

### Workstream 1: Finish Chat Cutover

Owner surface:

- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- [src/components/features/Chat/ChatSessionRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatSessionRail.tsx)
- [src/components/features/Chat/ChatContextRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatContextRail.tsx)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts)

Deliverables:

- complete any final parity polish on the new shared-shell chat rails
- verify launch context, recent artifacts, recent signals, retrieval actions, rename/delete, and action log behavior remain clean across breakpoints
- decide whether to keep the current route adapters or rename them during the cleanup pass

Exit criteria:

- no meaningful bespoke chat panel shell remains
- shared panel sections fully represent current chat context behavior

### Workstream 2: Finish WorkspaceBoard Left Rail

Owner surface:

- [src/components/features/WorkspaceBoard/BoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)

Deliverables:

- move header, actions, search, and grouped sections onto the shared library rail system
- preserve create note, create link, file upload, nested disclosure items, delete, and add-to-board actions
- migrate section state to [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts) where applicable

Exit criteria:

- no bespoke board left rail shell remains

### Workstream 3: Finish WorkspaceBoard Right Rail And Tabs

Owner surface:

- [src/components/features/WorkspaceBoard/BoardInspectorRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardInspectorRail.tsx)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts)

Deliverables:

- render board inspector content through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- move `Inspector` and `Agent` tabs onto the shared tab shell
- normalize AI actions into the shared top action treatment instead of a dedicated accordion section
- preserve provenance, selection rendering, delete-board affordance, and agent sibling behavior

Exit criteria:

- board becomes the canonical proof that shared tabs work for `Inspector` + `Agent`

### Workstream 4: Cleanup And Parity Pass

Owner surface:

- [src/components/features/OperationView/InspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/InspectorPanel.tsx)
- [src/components/features/OperationView/DossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)
- [src/components/features/Timeline/TimelineDetailRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDetailRail.tsx)
- [src/components/features/Timeline/TimelineDossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDossierPanel.tsx)
- [src/components/features/Chat/ChatContextRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatContextRail.tsx)
- [src/components/features/Chat/ChatSessionRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatSessionRail.tsx)
- [src/components/features/WorkspaceBoard/BoardInspectorRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardInspectorRail.tsx)
- [src/components/features/WorkspaceBoard/BoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardLibraryRail.tsx)

Deliverables:

- delete obsolete bespoke shells where they are no longer meaningful
- keep only thin adapters where route-specific data shaping is still valuable
- normalize section labels, action density, and tab behavior across all routes
- make an explicit final decision on whether ArtifactViewer remains a specialized shared consumer or moves fully onto `LibraryRailShell`

Exit criteria:

- panel architecture is coherent across all major routes
- legacy rail implementations are removed or reduced to trivial adapters

### Workstream 5: Final Docs And Verification

Owner surface:

- [README.md](C:/Users/james/projects/sherlock/README.md)
- [docs/operations/ARCHITECTURE.md](C:/Users/james/projects/sherlock/docs/operations/ARCHITECTURE.md)
- [docs/plans/15-ui-panel-unification-epic.md](C:/Users/james/projects/sherlock/docs/plans/15-ui-panel-unification-epic.md)

Deliverables:

- sync architecture language with the final shared-panel structure
- resolve the remaining red test in [registry.test.ts](C:/Users/james/projects/sherlock/src/services/workspace/agent/actions/registry.test.ts)
- rerun:
  - `npm run check`
  - `npm test`
  - `npm run build`

Exit criteria:

- docs reflect the final architecture, not the intermediate state
- validation is fully green

## Recommended Finish Order

The cleanest close-out order from here is:

1. finish Chat cutover
2. finish WorkspaceBoard left rail
3. finish WorkspaceBoard inspector + shared tabs
4. run the cleanup/deletion pass across all routes
5. fix the remaining failing board-agent test
6. sync docs and rerun full validation

## Definition Of Done Status

Current status against the epic definition:

- all inspector rails use the shared global inspector system: not yet
- all left-side library rails use the shared library rail system where appropriate: not yet
- artifact sidebar/detail rail behavior is moved into the shared panel family: mostly yes, final shell decision still open
- board Agent tab remains intact inside the unified panel shell: not yet
- route-specific behaviors are preserved: yes on migrated routes, still pending Chat and Board cutover
- legacy custom panel implementations are removed or reduced to trivial wrappers: not yet
- docs are updated if architecture changed materially: in progress
- validation passes cleanly: not yet

## Summary

The epic is past the risky foundation stage and into the final conversion stage. Shared inspector and library systems are real and already powering OperationView, NetworkGraph, Timeline, and the ArtifactViewer detail sidebar. The remaining path to full parity is now straightforward: finish Chat, finish WorkspaceBoard, do one deliberate cleanup pass, fix the remaining red test, and then lock docs and validation together.
