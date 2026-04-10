# UI Panel Unification Epic

Status: Retired on 2026-04-10

This epic is complete for the shared-panel cutover and is now retired.

It closed the execution work outlined in:

- [13-global-inspector-cutover-plan.md](C:/Users/james/projects/sherlock/docs/plans/13-global-inspector-cutover-plan.md)
- [14-library-rail-unification-plan.md](C:/Users/james/projects/sherlock/docs/plans/14-library-rail-unification-plan.md)

## Final Outcome

Sherlock now uses one shared panel family for its major routed inspector and library surfaces.

Landed shared foundations:

- [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx)
- [GlobalInspectorHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorHeader.tsx)
- [GlobalInspectorSections.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorSections.tsx)
- [GlobalInspectorTabs.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorTabs.tsx)
- [sharedInspectorSectionBuilders.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/sharedInspectorSectionBuilders.tsx)
- [LibraryRailShell.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailShell.tsx)
- [LibraryRailHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailHeader.tsx)
- [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx)
- [LibraryRailEntry.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailEntry.tsx)
- [LibraryRailSearch.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSearch.tsx)
- [useExclusivePanelSections.ts](C:/Users/james/projects/sherlock/src/components/features/shared/useExclusivePanelSections.ts)
- shared chrome and action-row updates in [chrome.ts](C:/Users/james/projects/sherlock/src/components/ui/chrome.ts) and [InspectorActionRow.tsx](C:/Users/james/projects/sherlock/src/components/ui/InspectorActionRow.tsx)

Current shared-panel consumers:

- [OperationInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/OperationInspectorPanel.tsx)
- [WorkspaceLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/OperationView/WorkspaceLibraryRail.tsx)
- [NetworkGraphInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx)
- [TimelineInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineInspectorPanel.tsx)
- [TimelineLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Timeline/TimelineLibraryRail.tsx)
- [ChatInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatInspectorPanel.tsx)
- [ChatLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatLibraryRail.tsx)
- [WorkspaceBoardInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardInspectorPanel.tsx)
- [WorkspaceBoardLibraryRail.tsx](C:/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/WorkspaceBoardLibraryRail.tsx)

## Final Decisions

- Route-local adapters remain the intended architecture. The shared system centralizes shell, chrome, tabs, section rendering, and section-state behavior, while each feature keeps its own data shaping, copy, and actions.
- WorkspaceBoard keeps the shared `Inspector` plus `Agent` tab model through [GlobalInspectorPanel.tsx](C:/Users/james/projects/sherlock/src/components/features/Inspector/GlobalInspectorPanel.tsx).
- ArtifactViewer's detail sidebar is a specialized shared consumer, not a full `LibraryRailShell` migration. It intentionally composes [LibraryRailHeader.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailHeader.tsx) and [LibraryRailSections.tsx](C:/Users/james/projects/sherlock/src/components/features/LibraryRail/LibraryRailSections.tsx) directly because it is a right-side reading support surface inside the artifact reader, not a canonical left library rail.
- The implementation ended up simpler than the original plan language in a few places. The repo uses the shared panel contracts directly and keeps some route-local section builders instead of forcing every route through a heavier shared subject or builder layer.

## Validation Snapshot

Validation last rechecked on 2026-04-10:

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run build` passed
- focused shared-panel test sweep passed: 13 files, 21 tests

The full suite was not green at retirement time, so this epic is retired as complete for architecture/cutover scope rather than as a fully green repo-wide verification milestone.

## Outstanding Note

One unrelated verification issue remains outside the panel-cutover work:

- `npm test -- src/services/workspace/agent/actions/registry.test.ts` still fails with `editor.createAssets is not a function`, thrown from [boardShapes.ts](C:/Users/james/projects/sherlock/src/services/workspace/boardShapes.ts)

That issue should be tracked and fixed as board-agent verification follow-through, not as additional panel-architecture work.

## Follow-On Source Of Truth

The live architecture description now lives in:

- [ARCHITECTURE.md](C:/Users/james/projects/sherlock/docs/operations/ARCHITECTURE.md)
