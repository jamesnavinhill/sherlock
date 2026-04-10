# Global Inspector Cutover Plan

## Goal

Promote the network graph inspector into a shared global inspector panel that can serve as the canonical right-side context surface across Sherlock. The goal is to unify layout, reduce duplicated rail implementations, remove legacy inspector code, and make the panel consistently useful across network, archive viewer, board, timeline, and chat without introducing a new styling system.

This cutover should preserve one dedicated artifact details reading surface in the archive viewer flow. The center artifact viewer remains important to that workflow and should not be replaced.

## Current Read

The best current base is the network graph inspector in [src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx). It already handles:

- entities
- artifacts
- signals/headlines
- top-row actions
- accordion-based section layout
- empty states
- shared chrome primitives

The duplication around it lives in these route-specific right-side inspectors:

- Archive viewer inspector: [src/components/features/OperationView/OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx)
- Board inspector: [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)
- Timeline inspector: [src/components/features/Timeline/TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx)
- Chat inspector: [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)

All of these use the same visual language from [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts) and the shared action row in [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx), but each one rebuilt its own shell, section structure, and page-specific data rendering.

## Target Outcome

Implement one shared global inspector panel that:

- renders the current subject in a uniform way
- supports entities, artifacts, signals, workspace items, chat context, timeline context, and board selections
- reuses existing chrome and panel styling
- standardizes the top action row
- supports optional tabs so the panel can eventually host an Agent tab everywhere
- removes redundant inspector rails once migration is complete

The panel should function as a global context surface that organizes and surfaces the relevant information for the current item or page state in a clean and logical way.

## Design Principles

- Use the network graph inspector as the rendering baseline.
- Do not invent a new panel style system for this work.
- Keep per-page state and navigation logic outside the shared inspector when possible.
- Adapt each page's selection model into a shared inspector subject contract.
- Keep the archive viewer's main artifact details experience intact.
- Build support for an Agent tab now, but do not block the cutover on fully wiring page-specific agent context.

## Shared Inspector Architecture

### 1. Introduce a dedicated shared inspector feature area

Create a new shared feature folder:

- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- `src/components/features/Inspector/GlobalInspectorHeader.tsx`
- `src/components/features/Inspector/GlobalInspectorSections.tsx`
- `src/components/features/Inspector/GlobalInspectorTabs.tsx`
- `src/components/features/Inspector/globalInspectorTypes.ts`
- `src/components/features/Inspector/globalInspectorUtils.ts`

This should become the canonical rendering surface for all right-side inspector usage.

### 2. Standardize on a shared inspector subject model

Define a common subject union in `globalInspectorTypes.ts` so route-specific pages stop passing bespoke prop bags directly into custom rails.

Recommended subject kinds:

- `EMPTY`
- `ENTITY`
- `ARTIFACT`
- `SIGNAL`
- `WORKSPACE_ITEM`
- `CHAT_SESSION`
- `TIMELINE_EVENT`
- `BOARD_SELECTION`
- `WORKSPACE_CONTEXT`

Each subject should provide only the data the shared panel needs to render its header, actions, and section blocks. Pages remain responsible for adapting their own selected state into one of these shared shapes.

### 3. Extract reusable rendering logic from the network graph inspector

Lift the reusable logic from [src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx) into shared inspector helpers and section renderers:

- entity header treatment
- artifact header treatment
- signal/headline content treatment
- entity mentions lookup
- entity connection derivation
- artifact summary/entities/follow-ups/sources sections
- empty state shell

Keep graph-only concerns optional and injected:

- hide/unhide node
- star/unstar node
- delete node
- manual icon override

Those should remain available through action definitions and optional subject capabilities, not hardcoded graph behavior inside the shared inspector.

## Action Row Standardization

### 4. Normalize the top-level action strip before page migration

Update:

- [src/components/ui/InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)
- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)

Required changes:

- support a thin top-row action variant
- support responsive 2-column or 3-column fill-width layouts
- support clear separation between primary actions and utility/icon-only actions
- support dropdown action groups for overflow or grouped AI actions
- reduce nav/control item height so it matches the rest of the thin button language

This is the right place to implement the desired shared top row behavior:

- `Open`
- `Open In...`
- `Chat`
- `Timeline`
- `Network`
- `Star`
- `Delete`
- other route-specific actions

The result should be a compact, efficient action surface that fills width naturally and feels consistent across all pages.

## Route Migration Order

### Phase 1: Archive viewer cutover

Replace the far-right inspector in the archive viewer first.

Primary files:

- [src/components/features/OperationView/OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx)
- [src/components/features/OperationView/useOperationViewInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/OperationView/useOperationViewInspectorState.ts)
- [src/components/features/OperationView/index.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/index.tsx)

Plan:

- replace `OperationInspectorPanel` usage with the new shared `GlobalInspectorPanel`
- keep operation-view inspector state logic, but adapt selected entity, headline, and artifact data into shared inspector subjects
- preserve the center artifact viewer in [src/components/features/OperationView/ArtifactViewer.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/ArtifactViewer.tsx)
- keep archive workflow behavior unchanged while removing the legacy far-right implementation

This is the safest first migration because the surface already maps well to the network graph inspector model.

### Phase 2: Timeline cutover

Replace the timeline inspector next.

Primary files:

- [src/components/features/Timeline/TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx)
- [src/components/features/Timeline/useTimelineViewController.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/useTimelineViewController.ts)
- [src/components/features/Timeline/timelineViewModel.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineViewModel.ts)
- [src/components/features/Timeline/timelineDetailActions.ts](C:/Users/james/projects/sherlock/src/components/features/Timeline/timelineDetailActions.ts)
- [src/components/features/TimelineView.tsx](C:/Users/james/projects/sherlock/src/components/features/TimelineView.tsx)

Plan:

- keep `selectedEvent` as the selection source
- adapt timeline event selections into shared inspector subjects
- move timeline metadata into shared section blocks, likely under an `Event Context` or `Summary` grouping
- preserve timeline-specific actions through the existing action builder model
- keep open/focus/jump behaviors intact while removing the dedicated timeline inspector implementation

Timeline is a good second migration because its rail is mostly contextual data already, and that data can live comfortably inside the global inspector.

### Phase 3: Chat cutover

Replace the chat inspector with the shared global inspector.

Primary files:

- [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)
- [src/components/features/Chat/ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- [src/components/features/Chat/useChatController.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatController.ts)
- [src/components/features/Chat/useChatWorkspaceState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatWorkspaceState.ts)
- [src/components/features/Chat/useChatViewState.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatViewState.ts)

Plan:

- support a `WORKSPACE_CONTEXT` or `CHAT_SESSION` inspector subject for chat when there is no single selected item
- migrate launch context, recent artifacts, recent signals, retrievals, and action log into shared section blocks
- preserve current fetch actions such as artifact summary, full text, and recent signals
- keep right-panel open/close behavior and section toggle behavior intact while swapping the rendering layer

Chat is the main non-item-driven case, so this phase should confirm that the global inspector can also serve contextual workflows, not just direct entity/artifact inspection.

### Phase 4: Board cutover

Replace the board inspector rail after chat and timeline are stable.

Primary files:

- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)
- [src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.ts)
- [src/components/features/WorkspaceBoard/boardInspectorActions.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/boardInspectorActions.ts)
- [src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts)
- [src/components/features/WorkspaceBoard/index.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/index.tsx)
- [src/components/features/WorkspaceBoard/workspaceBoardUtils.ts](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/workspaceBoardUtils.ts)

Plan:

- introduce a `BOARD_SELECTION` inspector subject for one-or-many board selections
- render selected entries through the shared inspector rather than a board-specific rail
- move provenance into a shared section block
- replace the current `AI Actions` accordion with a grouped dropdown entry in the top action row under the normal action items
- preserve the existing board Agent rail as a sibling tab
- use this phase to introduce shared inspector tab rendering so `Inspector` and `Agent` feel uniform

For the board specifically, the top-level AI action grouping should sit below the regular action items and use the same thin-action language instead of feeling like a separate mode within the inspector body.

### Phase 5: Network graph internal migration

Move the source implementation over last.

Primary files:

- [src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx)
- [src/components/features/NetworkGraph/useNetworkGraphInspectorState.ts](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/useNetworkGraphInspectorState.ts)
- [src/components/features/NetworkGraph/index.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/index.tsx)

Plan:

- convert `NetworkGraphInspectorPanel` into a thin adapter over `GlobalInspectorPanel`
- keep graph selection state intact
- keep graph-only actions and capabilities available through subject/action injection
- remove duplicated rendering logic that was previously extracted

Doing this last keeps the current best implementation stable while the shared panel proves itself on the other routes.

## Agent Tab Plan

The shared inspector should support optional panel tabs from the beginning, even if the Agent tab is not fully wired everywhere yet.

Recommended initial behavior:

- Board keeps `Inspector` and `Agent`
- Chat can be the next candidate for `Inspector` and `Agent`
- Archive viewer, timeline, and network can render `Inspector` only at first

Shared files to support this:

- `src/components/features/Inspector/GlobalInspectorTabs.tsx`
- [src/components/ui/chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts)

The immediate goal is a uniform shell and tab system, not full agent-context parity on day one.

## Cleanup Targets

After each route is migrated and stable, remove the obsolete custom rail implementations.

Primary deletion targets:

- [src/components/features/OperationView/OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx)
- [src/components/features/Timeline/TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx)
- [src/components/features/Chat/ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)

Additional cleanup:

- collapse duplicated inspector helper logic currently spread across operation and network implementations
- remove route-specific shell/header duplication
- reduce per-page section-state structures where the shared inspector can own expansion behavior

## Risks and Watchouts

- Do not let the shared inspector become a giant prop bucket. Use subject adapters and section/action builders instead.
- Do not regress archive viewer deep-link behavior that opens report inspector state from artifact route params.
- Do not break timeline focus/open behaviors while translating its event model into shared subjects.
- Do not block the board cutover on fully generalized agent integration.
- Do not remove the archive viewer's main artifact reading panel.
- Do not introduce a second styling language for the panel or actions.

## Implementation Checklist

1. Build shared inspector types and shell.
2. Refactor action-row and thin-button styling support.
3. Extract reusable network inspector sections into shared helpers.
4. Migrate archive viewer to the shared inspector.
5. Migrate timeline to the shared inspector.
6. Migrate chat to the shared inspector.
7. Migrate board inspector and fold AI actions into action-row dropdown behavior.
8. Move board tabs onto the shared tab shell.
9. Convert network graph inspector into a thin adapter.
10. Delete legacy inspector rails and duplicated helpers.

## Validation Plan

Because this touches shipped UI across multiple surfaces, validation should be incremental per phase and then repeated after cleanup.

Expected validation:

- `npm run lint`
- `npm run typecheck`
- targeted tests for inspector-related components and controller hooks
- `npm run build`

Likely test files to update as the cutover proceeds:

- [src/components/features/NetworkGraph/NetworkGraphInspectorPanel.test.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.test.tsx)
- [src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.test.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.test.tsx)
- [src/components/features/Chat/ChatInspectorPanel.test.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.test.tsx)
- operation-view inspector/controller tests
- timeline controller and action-builder tests

Do not default to the full suite unless the implementation becomes cross-cutting enough that targeted coverage would be misleading.

## Summary

The cleanest path is to treat the current network graph inspector as the base implementation, extract its reusable rendering model into a shared inspector feature, then migrate archive viewer, timeline, chat, and board onto that shared surface in phases. Keep the archive viewer's main artifact detail experience intact, fold board AI actions into the top action system, add optional shared tabs for future Agent parity, and remove the legacy right-rail implementations as each route stabilizes.
