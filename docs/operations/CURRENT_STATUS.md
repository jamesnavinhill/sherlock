# Current Status

This is the active status checkpoint for Sherlock on April 3, 2026.

Historical implementation plans and reports have been retired to:

- `docs/_legacy/plans/`
- `docs/_legacy/reports/`

Use this document, `README.md`, and the other files under `docs/operations/` as the current source of truth.

## Current Implementation State

Sherlock is materially in a shipped, usable state for its intended local-first workspace model.

What is clearly live in the codebase now:

- canonical workspace runtime behavior under `Workspace -> Artifact -> WorkspaceRun`, even though investigation-era aliases still remain in active code
- multi-provider investigate/chat support across Gemini, OpenRouter, OpenAI, and Anthropic
- persisted workspace chat sessions, message history, action traces, transcript export, and guided run building
- Timeline as a first-class routed feature with signal/run/artifact chronology, curated chat and entity tracks, and snapshot export/save flows
- workspace-data export/import/clear behavior for workspaces, artifacts, runs, chat, graph data, templates, and saved signals

## What Is Finished Enough To Treat As Settled

- Timeline is no longer a parked or provisional surface.
- Timeline snapshot export/save is implemented through the normal artifact path.
- workspace-data maintenance is no longer limited to cases and reports
- the main architecture docs in `README.md`, `docs/operations/architecture.md`, and `docs/operations/DATA_PERSISTENCE.md` are directionally aligned with the current app

## Unfinished Business

The remaining work is mostly cleanup and semantic cutover rather than missing product surface.

### 1. Canonical naming is still not the dominant runtime language

Canonical concepts exist, but large parts of the codebase still center the investigation-era model.

Examples:

- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/utils/exportUtils.ts`
- `src/components/features/*` in several view props and selectors
- `src/types/index.ts` alias exports such as `Case`, `InvestigationReport`, and `InvestigationTask`

The product reads more workspace-first than the code does. That mismatch is now the biggest source of “transitional” feeling in the repo.

### 2. Compatibility persistence names and fields still deserve a deliberate cleanup pass

The current runtime works, but the persistence edge still carries legacy semantics:

- SQLite tables remain `cases`, `reports`, `tasks`, and `leads`
- `reports.parent_topic` still exists in `src/services/db/schema.ts`
- report hydration still rebuilds legacy `agendas`, `leads`, and `followUps` arrays for compatibility in `src/services/db/repositories/CaseRepository.ts`

This is acceptable if the compatibility window is still intentional. If not, these should be reduced in a focused cleanup pass rather than left indefinitely.

### 3. localStorage-era compatibility helpers are still present

Sherlock now persists core workspace data through SQLite, but some compatibility pathways remain:

- legacy theme/config reads in `src/store/caseStore.ts`
- old storage-key utilities in `src/utils/localStorage.ts`
- provider-key alias migration in `src/services/providers/keys.ts`
- legacy backup-shape normalization in `src/services/maintenance/workspaceData.ts`

Some of these are still useful for import or migration safety. Others may now be removable.

### 4. Feed persistence is still ambiguous

The schema and migrations still define `feed_items`, but the active Feed surface is driven from in-memory store state rather than a dedicated repository-backed persistence flow.

Relevant files:

- `src/services/db/schema.ts`
- `src/store/caseStore.ts`
- `src/components/features/Feed.tsx`

This should be resolved one way or the other:

- persist Feed items intentionally, or
- remove the unused schema baggage

### 5. Historical docs should stay archived, not half-active

The retired plans and reports remain useful as decision history, but they should not be treated as live implementation guidance.

If a future plan/report set is created, it should represent fresh work from the new baseline rather than resuming the retired stack in place.

## Recommended Cleanup Order

1. Finish the runtime naming cutover toward `Workspace`, `Artifact`, and `WorkspaceRun`.
2. Remove no-longer-needed compatibility aliases, fields, and helpers once the migration/support window is clear.
3. Decide the long-term fate of `feed_items` and any other schema/store leftovers that no longer have a real product role.
4. Keep broad documentation refreshes tied to actual code changes, not the retired historical plan set.

## Validation Snapshot

Validated on this checkout during the retirement pass:

- `npm run lint`
- `npm run test -- src/components/features/Timeline/timelineEvents.test.ts src/components/features/Timeline/timelineSnapshot.test.ts src/services/maintenance/workspaceData.test.ts src/store/caseStore.test.ts`
- `npm run build`

All of the above passed.

The full Vitest suite was not run for this docs/status cleanup pass.
