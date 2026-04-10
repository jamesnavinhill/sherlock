# UI Panel Unification Epic

## Goal

Unify Sherlock's right-side inspector surfaces and left-side library rails behind the shared panel systems that now exist in the codebase, then finish the remaining route migrations, remove obsolete bespoke shells, and land one clean parity pass with docs and validation in sync.

This epic remains the execution-level companion to:

- [13-global-inspector-cutover-plan.md](C:/Users/james/projects/sherlock/docs/plans/13-global-inspector-cutover-plan.md)
- [14-library-rail-unification-plan.md](C:/Users/james/projects/sherlock/docs/plans/14-library-rail-unification-plan.md)

## Audit Snapshot

Date audited: 2026-04-10

Overall status: In progress, with shared foundations landed and partial route adoption complete.

Current read:

- shared inspector foundations are implemented
- shared library rail foundations are implemented
- OperationView, NetworkGraph, Timeline, Chat, and the ArtifactViewer detail sidebar are consuming the new shared foundations in meaningful ways
- WorkspaceBoard now rides the shared panel shells and shared section-state primitives
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
- Timeline, NetworkGraph, OperationView, ArtifactViewer, Chat, and WorkspaceBoard are using it in migrated panel state

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
- there is not yet one final breakpoint, terminology, and adapter cleanup pass across all routes

## Phase 3: Parallel Pair A

### Stream A1: OperationView + NetworkGraph

Status: Mostly complete, not cleanup-complete

Implemented:

- [src/components/features/OperationView/OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx) is now a shared-inspector adapter over [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx) is now a shared-library adapter over [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx) is now a shared-inspector adapter over [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx) reuses [WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)

Still open:

- final route-level deletion and API cleanup did not happen

### Stream A2: Timeline

Status: Mostly complete, closest route to clean cutover

Implemented:

- [src/components/features/Timeline/TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx) renders through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx) renders through [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- [src/components/features/Timeline/useTimelineViewController.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/useTimelineViewController.ts) uses [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)

Still open:

- the final route-level cleanup and deletion pass did not happen

## Phase 4: Parallel Pair B

### Stream B1: Chat

Status: Mostly complete, not cleanup-complete

Current state:

- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx) now renders through [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx) now renders through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts) now uses [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)

What remains:

- preserve and polish route-level behavior now that the shared shells are in place
- decide whether the remaining route wrappers should stay as thin adapters or be renamed during the cleanup pass
- include Chat in the final cross-route spacing, terminology, and breakpoint audit

### Stream B2: WorkspaceBoard

Status: Mostly complete, cleanup naming largely complete

Current state:

- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx) now renders through [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx), [LibraryRailSearch.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSearch.tsx), and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx) now renders through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx) now uses the shared tab shell for `Agent` and `Inspector`
- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts) and [src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts) now use [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts) for top-level panel sections

What is already aligned:

- board inspector actions already use [InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- the board still preserves the intended `Agent` sibling surface

What remains:

- preserve and polish route-level behavior now that both board rails run through the shared shells
- include WorkspaceBoard in the final cross-route spacing, naming, and breakpoint audit

## Phase 5: Final Integration Audit

Status: In progress

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

- include route in the final cleanup/deletion pass

### NetworkGraph

Status: Shared inspector adopted, shared dossier rail reused

Still remaining:

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

- document the final architecture decision in the architecture sync

Decision:

- ArtifactViewer remains an intentionally specialized shared consumer rather than moving fully onto [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- the sidebar is right-side reading support rather than a canonical left library rail, so the current [LibraryRailHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailHeader.tsx) plus [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx) composition is the correct final shell geometry

### Chat

Status: Shared inspector and shared library adopted, naming normalized

### WorkspaceBoard

Status: Shared rails and shared tabs adopted, naming normalized

## Remaining Work For Clean Cutover

This is the smallest clean path to full parity from the current repo state.

### Workstream 1: Finish Chat Cutover

Owner surface:

- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)
- [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)
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

- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)
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

- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)
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

- [src/components/features/OperationView/OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx)
- [src/components/features/OperationView/WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- [src/components/features/Timeline/TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx)
- [src/components/features/Timeline/TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)
- [src/components/features/Chat/ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)

Deliverables:

- delete obsolete bespoke shells where they are no longer meaningful
- keep only thin adapters where route-specific data shaping is still valuable
- normalize section labels, action density, and tab behavior across all routes
- make an explicit final decision on whether ArtifactViewer remains a specialized shared consumer or moves fully onto `LibraryRailShell`

Exit criteria:

- panel architecture is coherent across all major routes
- legacy rail implementations are removed or reduced to trivial adapters

Current progress:

- WorkspaceBoard inspector now uses [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx) as a thinner adapter with shared footer support instead of route-local section rendering composition
- Chat and WorkspaceBoard route-level right-panel toggles and mobile overlays are normalized to the shared `lg` breakpoint behavior
- OperationView dossier copy and section treatment are normalized with the other shared library rails
- ArtifactViewer has an explicit final-shell decision and remains a specialized shared consumer
- route adapter names are normalized to canonical shared-panel language across OperationView, Timeline, Chat, WorkspaceBoard, and NetworkGraph
- exact obsolete panel file references are removed from active `src/` and non-legacy `docs/`

Status:

- Workstream 4 is complete for the shared-panel cutover
- remaining work is verification/documentation follow-through, not route-panel architecture churn

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

Current progress:

- active architecture and planning docs now use the canonical shared-panel file names and route-adapter language
- targeted shared-panel validation is green, including lint, typecheck, build, and focused component/controller tests
- the repo still has the pre-existing unrelated full-suite failure in [registry.test.ts](C:/Users/james/projects/sherlock/src/services/workspace/agent/actions/registry.test.ts), so Workstream 5 is not fully closed yet

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
