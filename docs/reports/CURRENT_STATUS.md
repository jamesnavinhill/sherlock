# Current Status

This is the active status checkpoint for Sherlock on April 5, 2026.

Historical implementation plans and reports have been retired to:

- `docs/_legacy/plans/`
- `docs/_legacy/reports/`

Use this document, `README.md`, and the other files under `docs/operations/` as the current source of truth.

## Current Implementation State

Sherlock is materially in a shipped, usable state for its intended local-first workspace model.

What is clearly live in the codebase now:

- canonical workspace runtime behavior under `Workspace -> Artifact -> WorkspaceRun`
- multi-provider investigate/chat support across Gemini, OpenRouter, OpenAI, and Anthropic
- persisted workspace chat sessions, message history, action traces, transcript export, and guided run building
- a first-class multi-board Research Workspace built on `tldraw`, with canonical workspace items plus separate board-document persistence
- Timeline as a first-class routed feature with signal/run/artifact chronology, curated chat and entity tracks, and snapshot export/save flows
- workspace-data export/import/clear behavior for workspaces, artifacts, runs, chat, research boards, canonical workspace items, graph data, templates, and saved signals
- active runtime/store surfaces now use `useWorkspaceStore`, `workspaces`, `artifacts`, `workspaceRuns`, and `activeWorkspaceId`
- unused `feed_items` and `parent_topic` schema/bootstrap definitions have been removed from the active schema files

## What Is Finished Enough To Treat As Settled

- Timeline is no longer a parked or provisional surface.
- Research Workspace is no longer a planned sidecar surface; it is a primary routed workspace view with cross-surface handoff from Chat, Timeline, Operation View, and Network Graph.
- Timeline snapshot export/save is implemented through the normal artifact path.
- workspace-data maintenance is no longer limited to cases and reports
- the main architecture docs in `README.md`, `docs/operations/architecture.md`, and `docs/operations/DATA_PERSISTENCE.md` are directionally aligned with the current app

## Unfinished Business

The remaining work is now mostly additive refinement rather than missing core surface.

### 1. Canonical naming has landed in the active runtime surface, but persistence-edge cleanup still remains

Canonical concepts now dominate the active app/store/type surface.

What still remains transitional is mostly at persistence or historical boundaries.

Examples:

- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/utils/exportUtils.ts`
- repository/table naming such as `CaseRepository`, `cases`, `reports`, and `tasks`
- some legacy-oriented docs and migration helpers

The biggest remaining mismatch is now between the canonical runtime model and the compatibility-oriented persistence edge, not between the product and the active UI/runtime code.

### 2. Compatibility persistence names still deserve a deliberate cleanup pass

The current runtime works, but the persistence edge still carries legacy semantics:

- SQLite tables remain `cases`, `reports`, `tasks`, and `leads`
- report hydration still rebuilds legacy `agendas`, `leads`, and `followUps` arrays for compatibility in `src/services/db/repositories/CaseRepository.ts`

This is acceptable if the compatibility window is still intentional. If not, these should be reduced in a focused cleanup pass rather than left indefinitely.

### 3. localStorage-era compatibility helpers are still present

Sherlock now persists core workspace data through SQLite, but some compatibility pathways remain:

- legacy theme/config reads in `src/store/caseStore.ts`
- old storage-key utilities in `src/utils/localStorage.ts`
- provider-key alias migration in `src/services/providers/keys.ts`
- legacy backup-shape normalization in `src/services/maintenance/workspaceData.ts`

Some of these are still useful for import or migration safety. Others may now be removable.

### 4. Feed persistence now matches the real product model more closely

The product direction is now settled:

- Finder/Feed discovery results stay transient
- Live Monitor events stay transient until promoted into saved `Headline` records
- saved `Headline` records remain the canonical durable signal path

That means the technical cleanup is now aligned with the product model.

Relevant files:

- `src/services/db/schema.ts`
- `src/store/caseStore.ts`
- `src/components/features/Feed.tsx`

What landed in this pass:

- `feed_items` was removed from the active schema/bootstrap files
- keep Feed transient
- keep `Headline` records as the persisted signal layer

### 5. Historical docs should stay archived, not half-active

The retired plans and reports remain useful as decision history, but they should not be treated as live implementation guidance.

If a future plan/report set is created, it should represent fresh work from the new baseline rather than resuming the retired stack in place.

## Recommended Cleanup Order

1. Continue reducing compatibility-oriented repository/storage naming where it no longer earns its keep.
2. Expand workspace-board polish and coverage incrementally instead of reopening the persistence foundation.
3. Remove no-longer-needed compatibility helpers from active runtime-adjacent code where import/migration support no longer justifies them.
4. Keep broad documentation refreshes tied to actual code changes, not retired historical plan sets.

## Validation Snapshot

Validated on this checkout during the workspace-slice audit pass:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- src/store/caseStore.test.ts src/services/maintenance/workspaceData.test.ts src/services/workspace/promotions.test.ts src/services/workspace/library.test.ts src/services/db/repositories/WorkspaceSearchRepository.test.ts`
- `npm run build`

All of the above passed. `npm run build` still reports one remaining Vite large-chunk warning on the `tldraw` app bundle after chunk-splitting improvements.

The full Vitest suite was not run for this workspace-slice audit pass.
