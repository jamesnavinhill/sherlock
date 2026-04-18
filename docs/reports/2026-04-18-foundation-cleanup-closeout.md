# 2026-04-18 Foundation Cleanup Closeout

Status: Closed on April 18, 2026

Related plan:

- `docs/plans/2026-04-18-foundation-cleanup-plan.md`

Related audit:

- `docs/reports/2026-04-18-foundation-audit.md`

## Summary

The April 18 foundation cleanup is complete. The active docs now describe the current checkout, the theme workbench background mutation bug is fixed and covered, Operation View and route seams are materially more canonical, persistence and board-agent responsibilities have clearer helper boundaries, shared contracts have moved out of the old `src/types/index.ts` gravity well, and the first large-file refactor tranche has landed.

The cleanup intentionally did not redesign the board-agent rail. That UI remains a temporary surface until the future second dockable agent-panel stream.

## Confirmed Landed Work

- Active docs now distinguish current plans/reports from historical `_legacy` material through `docs/plans/README.md` and `docs/reports/README.md`.
- The missing `canon-design/` active-doc references were removed from current onboarding and architecture docs.
- Theme background edits now write to `background[activeMode]`, with focused tests in `src/components/features/Settings/themeWorkbench/backgroundState.test.ts`.
- Operation View route and feature seams use canonical workspace/artifact/run naming for active contracts, with remaining legacy `case` / `report` wording bounded to artifact-type values, compatibility paths, persisted graph/search identifiers, or intentional user-facing copy.
- `WorkspaceRepository.ts` delegates artifact hydration, persistence planning, and legacy payload compatibility to `artifactHydration.ts`, `artifactPersistence.ts`, and `artifactCompatibility.ts`.
- Workspace-data restore/import compatibility lives in `src/services/maintenance/workspaceDataCompatibility.ts`.
- Board controller responsibilities are split across placement, agent-state, library, inspector, upload, canvas-persistence, and dialog seams.
- Board-agent action execution dispatches through focused action-family modules instead of one oversized registry body.
- Shared contracts now live in subsystem files under `src/types/*`; `src/types/index.ts` is a compatibility barrel.
- Theme workbench and Operation View reader hotspots were split into feature-owned modules, reducing the largest panel/viewer files while keeping behavior stable.

## Deferred Work

- Build the future second dockable agent panel. Do not treat the current `BoardAgentRail.tsx` layout as the permanent destination.
- Decide in a later cleanup whether non-Operation-View `REPORT` vocabulary in chat/search/network graph helpers should remain as an artifact-type/search-ref compatibility term or move to a broader artifact-oriented naming scheme.
- Continue large-file reductions from the reality-based queue below, prioritizing behavior-owning modules over generated/static registries.

## Remaining Hotspots

The large-file tranche reduced the theme workbench and Operation View reader pair first. These files intentionally remain as the next queue:

- `src/system/theme/schema.ts`
- `src/components/features/NetworkGraph/GraphCanvas.tsx`
- `src/components/ui/GlobalSearch.tsx`
- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` - deferred for the future dockable panel stream
- `src/services/chat/runtime.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/components/features/Chat/useChatController.ts`
- `src/components/features/Timeline/timelineEventBuilders.ts`
- `src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx`
- `src/services/providers/geminiProvider.ts`
- `src/utils/themeFonts.ts`
- `src/domain/artifacts.ts`
- `src/components/features/Runs/RunSetupModal.tsx`
- `src/components/features/Settings/themeWorkbench/SettingsThemeTab.tsx`
- `src/services/workspace/agent/session.ts`
- `src/services/db/repositories/WorkspaceRepository.ts`

Large generated/static or data-heavy files such as `src/lib/tablerIconSvgMap.ts`, `src/lib/appIcons.tsx`, `src/index.css`, and `src/data/presets.ts` were not treated as first-line architecture refactor targets for this foundation pass.

## Validation

Phase 7 closeout validation was run from Windows shell for this checkout:

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test -- src/components/features/OperationView/ArtifactViewer.test.tsx src/components/features/OperationView/launchPropagation.test.tsx src/components/features/OperationView/OperationInspectorPanel.test.tsx src/components/features/Settings/themeWorkbench/backgroundState.test.ts src/components/features/Settings/useSettingsController.test.ts`: passed
- `npm run build`: passed

The full repo-wide `npm run test` suite was not the default target for this scoped closeout.

Build still reports the known Vite chunk-size warning for `vendor-tldraw-app`; no new chunk warning was introduced in this closeout.
