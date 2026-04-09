# UI Panel Unification Epic

## Goal

Combine the global inspector cutover and library rail unification work into one coordinated execution plan that can be delivered steadily with limited parallelism, low merge risk, and a clear final cleanup pass.

This epic is intended to replace ad hoc implementation sequencing with a deliberate rollout:

1. build shared foundations first
2. harden foundations in a short second pass
3. execute route-level migrations in small parallel pairs
4. finish with a cleanup, audit, and docs sync pass

This plan complements, rather than replaces, the more detailed design docs:

- [13-global-inspector-cutover-plan.md](C:/Users/james/projects/sherlock/docs/plans/13-global-inspector-cutover-plan.md)
- [14-library-rail-unification-plan.md](C:/Users/james/projects/sherlock/docs/plans/14-library-rail-unification-plan.md)

## Guiding Strategy

The safest way to run this work is:

- one solid shared-foundation slice first
- one short hardening pass over that foundation
- then only two route/surface streams in parallel at a time
- one final audit and documentation pass at the end

The main rule is:

Do not split work by `inspector` versus `library` once implementation starts.

Instead, split work by surface after the foundations are in place:

- OperationView + NetworkGraph
- Timeline
- Chat
- WorkspaceBoard

That keeps each agent mostly inside its own route files and avoids constant conflicts in page entry files.

## Why This Structure Works

The inspector and library plans overlap in several high-friction areas:

- shared chrome primitives in [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)
- shared action/list rendering patterns
- the same route entry files
- the same controller hooks
- the same panel open/close behavior

If two agents independently attack `inspector` and `library` on the same route at the same time, they will likely collide in:

- [src/components/features/OperationView/index.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/index.tsx)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)
- [src/components/features/TimelineView.tsx](C:/Users/james/projects/sherlock/src/components/features/TimelineView.tsx)
- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx)

That is why the post-foundation work should be parallelized by route, not by panel type.

## Epic Phases

## Phase 0: Pre-Flight Alignment

Before implementation starts:

- treat [13-global-inspector-cutover-plan.md](C:/Users/james/projects/sherlock/docs/plans/13-global-inspector-cutover-plan.md) and [14-library-rail-unification-plan.md](C:/Users/james/projects/sherlock/docs/plans/14-library-rail-unification-plan.md) as the design source docs
- use this epic as the execution sequence
- agree on file ownership before each session
- keep all work additive and adapter-oriented at first

## Phase 1: Shared Foundation Slice

One agent owns the shared foundations.

### Scope

Build the shared primitives needed by both the inspector and library rail families.

### Likely files

- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)
- [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- `src/components/features/Inspector/*`
- `src/components/features/LibraryRail/*`
- `src/components/features/shared/useExclusivePanelSections.ts`

### Goals

- shared global inspector shell
- shared inspector types and utilities
- shared library rail shell
- shared library rail section and entry renderers
- shared thin button and action row support
- shared panel tab treatment
- shared section toggle helpers

### Constraints

- do not migrate route-level pages yet unless needed for smoke wiring
- do not remove legacy implementations yet
- prioritize additive shared infrastructure first

## Phase 2: Foundation Hardening Pass

A second focused pass over the shared layer should happen before route migrations spread.

### Purpose

This pass exists to reduce churn before multiple route streams begin.

### Goals

- smooth rough edges in shared APIs
- normalize naming
- verify action-row density and tab sizing
- tighten render contracts for inspector subjects and library sections
- add or update focused shared tests

### Likely files

- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)
- [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- shared `Inspector` files
- shared `LibraryRail` files

### Exit criteria

Shared primitives should feel stable enough that route agents mostly consume them instead of reshaping them.

## Phase 3: Parallel Pair A

Run two route/surface streams in parallel.

### Stream A1: OperationView + NetworkGraph

Primary files:

- [src/components/features/OperationView/index.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/index.tsx)
- [src/components/features/OperationView/useOperationViewInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/OperationView/useOperationViewInspectorState.ts)
- [src/components/features/OperationView/DossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)
- [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx)
- [src/components/features/NetworkGraph/NodeInspector.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NodeInspector.tsx)
- [src/components/features/NetworkGraph/useNetworkGraphInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/useNetworkGraphInspectorState.ts)

Goals:

- migrate archive viewer inspector to the shared global inspector
- migrate operation/network dossier usage to the shared library rail system
- extract artifact sidebar/detail rail patterns where feasible
- keep archive center artifact reader intact
- leave legacy components only as wrappers temporarily if helpful

### Stream A2: Timeline

Primary files:

- [src/components/features/TimelineView.tsx](C:/Users/james/projects/sherlock/src/components/features/TimelineView.tsx)
- [src/components/features/Timeline/TimelineDetailRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDetailRail.tsx)
- [src/components/features/Timeline/TimelineDossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDossierPanel.tsx)
- [src/components/features/Timeline/useTimelineViewController.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/useTimelineViewController.ts)
- [src/components/features/Timeline/timelineDetailActions.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineDetailActions.ts)
- [src/components/features/Timeline/timelineViewUtils.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineViewUtils.ts)

Goals:

- replace timeline detail rail with the shared global inspector
- replace timeline dossier rail with the shared library rail shell
- preserve focus and reference navigation semantics

### Why these two can run together

They overlap very little once the shared foundation is stable. Timeline stays inside timeline files, while operation/network shares a route family.

## Phase 4: Parallel Pair B

Run the next two route/surface streams in parallel.

### Stream B1: Chat

Primary files:

- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- [src/components/features/Chat/ChatContextRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatContextRail.tsx)
- [src/components/features/Chat/ChatSessionRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatSessionRail.tsx)
- [src/components/features/Chat/useChatController.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatController.ts)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts)
- [src/components/features/Chat/useChatWorkspaceState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatWorkspaceState.ts)

Goals:

- replace chat context rail with the shared global inspector
- replace chat session rail with the shared library rail shell
- preserve session selection, launch context, retrieval actions, and action log behavior

### Stream B2: WorkspaceBoard

Primary files:

- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)
- [src/components/features/WorkspaceBoard/BoardInspectorRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardInspectorRail.tsx)
- [src/components/features/WorkspaceBoard/BoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardLibraryRail.tsx)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardLibraryState.ts)
- [src/components/features/WorkspaceBoard/boardInspectorActions.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/boardInspectorActions.ts)
- [src/components/features/WorkspaceBoard/workspaceBoardUtils.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/workspaceBoardUtils.ts)

Goals:

- replace board inspector rail with the shared global inspector
- replace board library rail with the shared library rail shell
- preserve board search/create/upload affordances
- fold AI quick actions into the shared top action treatment
- keep board Agent as a sibling tab

### Why these two can run together

Chat and board are largely isolated by route after the shared foundation pass, even though both consume the new shared panel systems.

## Phase 5: Final Integration Audit

After both parallel rounds land, run a final single-owner integration pass.

### Purpose

This is where the product gets tightened up into one coherent system instead of four independently migrated routes.

### Goals

- remove legacy panel implementations that are no longer needed
- collapse temporary wrappers where possible
- normalize tab behavior
- normalize panel action density and spacing
- normalize section heading language where appropriate
- check panel open/close behavior across breakpoints
- resolve any final API awkwardness in shared inspector and library rail layers

### Likely deletion or cleanup targets

- [src/components/features/OperationView/InspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/InspectorPanel.tsx)
- [src/components/features/Timeline/TimelineDetailRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDetailRail.tsx)
- [src/components/features/Chat/ChatContextRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatContextRail.tsx)
- [src/components/features/WorkspaceBoard/BoardInspectorRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardInspectorRail.tsx)
- [src/components/features/OperationView/DossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)
- [src/components/features/Timeline/TimelineDossierPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineDossierPanel.tsx)
- [src/components/features/Chat/ChatSessionRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatSessionRail.tsx)
- [src/components/features/WorkspaceBoard/BoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardLibraryRail.tsx)

## Phase 6: Documentation and Final Verification

Once the code is stable, do one final doc and validation pass.

### Docs to review

- [README.md](C:/Users/james/projects/sherlock/README.md)
- [docs/operations/ARCHITECTURE.md](C:/Users/james/projects/sherlock/docs/operations/ARCHITECTURE.md)

Update only if the new shared panel architecture materially changes the documented structure.

### Validation expectations

At minimum:

- `npm run lint`
- `npm run typecheck`
- targeted tests covering touched routes and shared panel systems
- `npm run build`

If the cumulative churn across routes becomes broad enough, run:

- `npm run test`

Use the full suite if targeted coverage starts to feel misleading after all phases land.

## Parallel Execution Rules

When running multiple agents, use these rules:

### Rule 1: Shared foundations are single-owner

Only one agent at a time should own:

- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)
- [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- `src/components/features/Inspector/*`
- `src/components/features/LibraryRail/*`
- `src/components/features/shared/useExclusivePanelSections.ts`

### Rule 2: After foundations, split by route family

Good route ownership:

- Agent 1: OperationView + NetworkGraph
- Agent 2: Timeline
- Agent 3: Chat
- Agent 4: WorkspaceBoard

### Rule 3: Agents should know other work is in flight, but ownership matters more

It is useful to prime agents that neighboring work is happening, but that alone is not enough. File ownership must be explicit.

### Rule 4: Do not divide concurrent work by `inspector` vs `library`

That split will collide too often in the same route entry and controller files.

## Recommended Session Cadence

This matches the intended steady, controlled rollout:

### Session 1

- foundation slice

### Session 2

- foundation hardening pass

### Session 3

- parallel pair A
- OperationView + NetworkGraph
- Timeline

### Session 4

- continue or finish parallel pair A

### Session 5

- parallel pair B
- Chat
- WorkspaceBoard

### Session 6

- continue or finish parallel pair B

### Session 7

- final audit
- cleanup
- docs update
- full verification

This keeps momentum high without trying to move too many risky surfaces at once.

## Definition of Done

The epic is complete when:

- all inspector rails use the shared global inspector system
- all left-side library rails use the shared library rail system where appropriate
- artifact sidebar/detail rail behavior is moved into the shared panel family
- board Agent tab remains intact inside the unified panel shell
- route-specific behaviors are preserved
- legacy custom panel implementations are removed or reduced to trivial wrappers
- docs are updated if architecture changed materially
- validation passes cleanly

## Summary

The best execution model is one shared-foundation pass, one short hardening pass, then two small rounds of route-based parallel migration, followed by a final audit and documentation pass. This keeps the work steady instead of chaotic, limits merge conflicts, and gives the panel systems a real chance to settle into a coherent unified architecture.
