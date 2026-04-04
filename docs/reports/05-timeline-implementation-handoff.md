# Timeline Implementation Handoff

Date: 2026-04-03
Status: Active Handoff

## What Landed

The first meaningful Timeline slices are now implemented.

Current delivered state:

- Timeline is visible in the main sidebar
- the parked placeholder has been replaced with a real routed Timeline shell
- the page now has:
  - a clean header
  - workspace selector
  - header text search
  - filters popout
  - left dossier
  - central mixed chronology stream
  - right details drawer
- Timeline is backed by normalized `TimelineEvent` helpers rather than ad hoc component merging
- Timeline currently renders real workspace chronology for:
  - signals
  - runs
  - artifacts
- event cards support click-through into:
  - `OperationView` for related artifacts
  - `Chat` for workspace or event-context chat entry

## Files Added

- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/Timeline/timelineEvents.test.ts`
- `docs/reports/05-timeline-implementation-handoff.md`

## Files Updated

- `src/components/features/TimelineView.tsx`
- `src/components/ui/Sidebar.tsx`
- `src/App.tsx`
- `src/types/index.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/store/caseStore.ts`
- `docs/plans/04-timeline-buildout-plan.md`

## Validation

Completed on this checkout:

- `npm run lint`
- `npm run test`
- `npm run build`

All three passed.

## Important Technical Notes

### 1. Artifact Chronology Is Now Real

`InvestigationReport` now exposes `createdAt` publicly and `CaseRepository` maps persisted report timestamps back out of SQLite.

That was necessary to make artifacts first-class timeline events instead of relying on `dateStr`.

### 2. Workspace Timestamps Are Surfaced

`Case` now exposes optional `createdAt` and `updatedAt`, and `CaseRepository` maps them.

### 3. Current Lineage Is Transitional

Run-to-artifact linkage is currently inferred in a compatibility-safe way:

- `task.report?.id` if available
- otherwise topic matching within the active workspace

Artifact follow-up lineage is currently inferred from:

- `parentTopic`

This is good enough for the current slice, but it is not the final lineage model.

## Best Next Session Starting Point

The most valuable next steps are:

1. strengthen lineage with explicit IDs
2. improve Timeline details and event-specific context
3. add secondary tracks once the core chronology remains stable

### Recommended Order

#### 1. Add Explicit Lineage IDs

Highest leverage next improvement.

Current issue:

- runs and artifacts do not yet have strong explicit parent/child linkage everywhere

Best next change:

- introduce explicit identifiers such as `parentArtifactId`, `parentRunId`, `sourceSignalId`, or equivalent metadata
- update the timeline event builder to use those IDs instead of topic inference

Most likely files:

- `src/types/index.ts`
- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/services/db/schema.ts`
- `src/services/db/repositories/TaskRepository.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/components/features/Timeline/timelineEvents.ts`

#### 2. Enrich The Details Drawer

Good next UX improvement after lineage.

Current drawer state:

- useful, but intentionally light
- summary, context, and actions

Best next additions:

- event-specific sections for signals, runs, and artifacts
- stronger display of related refs
- clearer causal chain when a signal led to a run or a run produced an artifact

Main file:

- `src/components/features/TimelineView.tsx`

#### 3. Add Secondary Tracks

Only after the core remains legible.

Recommended next tracks:

- `ChatSession`
- high-signal `AgentAction`
- entity milestones

Recommended hold:

- graph edits
- raw chat messages
- low-level retrieval traces in the main stream

Most likely files:

- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/TimelineView.tsx`
- `src/types/index.ts`

#### 4. Mobile Header Polish

The desktop shell is the stronger implementation right now.

Worth improving next:

- mobile workspace selector visibility
- mobile search ergonomics
- filters and dossier drawer rhythm on smaller breakpoints

Main file:

- `src/components/features/TimelineView.tsx`

## Known Gaps

These are expected at this handoff point.

- Timeline does not yet render chat actions in the main chronology
- Timeline does not yet render entity milestones
- run/artifact lineage is still partly inferred
- export is not yet implemented
- the details drawer is intentionally functional rather than fully polished

## Caution For The Next Session

The repo was already in a dirty state before this handoff.

Several touched files also show existing modifications outside this Timeline work, especially:

- `src/App.tsx`
- `src/components/ui/Sidebar.tsx`
- `src/services/db/repositories/CaseRepository.ts`
- `src/store/caseStore.ts`
- `src/types/index.ts`

So the next session should:

- read current file contents carefully before editing
- avoid reverting unrelated work
- prefer incremental patches over broad rewrites

## Quick Continuation Prompt

If starting a new session, a good prompt would be:

`Continue the Timeline implementation from docs/reports/05-timeline-implementation-handoff.md. Focus first on explicit lineage IDs for run/artifact/signal relationships, then improve the Timeline details drawer using those stronger links. Preserve the current dossier/search/filter shell and do not broaden into chat actions until lineage is reliable.`
