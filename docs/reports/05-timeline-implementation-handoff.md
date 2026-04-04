# Timeline Implementation Handoff

Date: 2026-04-03
Status: Active Handoff

## What Landed

The next Timeline buildout slice is now implemented.

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
  - chat sessions
  - curated high-signal chat actions
- chat remains opt-in at the filter layer rather than default-on in the main chronology
- chronology cards now show lightweight lineage chips for related signals, runs, artifacts, and chat sessions
- event cards support click-through into:
  - `OperationView` for related artifacts
  - `Chat` for workspace or event-context chat entry
  - exact saved chat sessions when the timeline event belongs to a persisted chat session/action
- launch requests now derive missing `parentArtifactId`, `parentRunId`, and `sourceSignalId` lineage from known parent artifacts/runs before task persistence
- artifact saves now backfill lineage from `sourceRunId` when the incoming report payload is partial

## Files Added

- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/Timeline/timelineEvents.test.ts`
- `docs/reports/05-timeline-implementation-handoff.md`

## Files Updated

- `src/components/features/TimelineView.tsx`
- `src/services/chat/launchContext.ts`
- `src/types/index.ts`
- `README.md`
- `docs/operations/architecture.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/plans/04-timeline-buildout-plan.md`
- `docs/reports/05-timeline-implementation-handoff.md`

## Validation

Completed on this checkout:

- `npm run lint`
- `npx eslint src/types/index.ts src/services/chat/launchContext.ts src/services/chat/launchContext.test.ts src/components/features/Timeline/timelineEvents.ts src/components/features/Timeline/timelineEvents.test.ts src/components/features/TimelineView.tsx`
- `npx vitest run src/components/features/Timeline/timelineEvents.test.ts src/services/chat/launchContext.test.ts --pool=forks`
- `npm run build`

All of the above passed.

## Important Technical Notes

### 1. Artifact Chronology Is Now Real

`InvestigationReport` now exposes `createdAt` publicly and `CaseRepository` maps persisted report timestamps back out of SQLite.

That was necessary to make artifacts first-class timeline events instead of relying on `dateStr`.

### 2. Workspace Timestamps Are Surfaced

`Case` now exposes optional `createdAt` and `updatedAt`, and `CaseRepository` maps them.

### 3. Timeline Now Has A Curated Chat Track

Timeline now derives a secondary `CHAT` track from persisted:

- `chat_sessions`
- high-signal `chat_actions`

Included chat action types are intentionally limited to:

- `SEARCH_WORKSPACE`
- `CREATE_ARTIFACT_DRAFT`
- `APPEND_NOTE_TO_ARTIFACT`
- `CREATE_FOLLOW_UP_RUN`

Lower-signal retrieval helpers and raw transcript messages are still intentionally excluded from the main chronology.

### 4. Current Lineage Is Transitional

Run-to-artifact linkage is currently inferred in a compatibility-safe way:

- `task.report?.id` if available
- otherwise topic matching within the active workspace

Artifact follow-up lineage is currently inferred from:

- `parentTopic`

This slice reduced the inference surface by:

- deriving run lineage from known parent artifacts/runs at launch time
- backfilling artifact lineage from `sourceRunId` during archive persistence
- preserving signal lineage across chat follow-up launches when the chat session was opened from a signal

Chat lineage is explicit at the session/action layer, but run/artifact lineage is still not the final model everywhere.

## Best Next Session Starting Point

The most valuable next steps are now:

1. strengthen lineage with explicit IDs
2. add entity milestone chronology
3. continue mobile and presentation polish

### Recommended Order

#### 1. Add Explicit Lineage IDs

Highest leverage next improvement.

Current issue:

- some runs and artifacts still rely on compatibility fallbacks when no explicit stored ancestor id is available

Best next change:

- eliminate the remaining `parentTopic` and topic-match fallbacks where a stronger stored ref can be derived or persisted safely
- keep tightening the event builder so explicit stored refs win in every path

Most likely files:

- `src/types/index.ts`
- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/services/db/schema.ts`
- `src/services/db/repositories/TaskRepository.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/components/features/Timeline/timelineEvents.ts`

#### 2. Add Entity Milestones

The most natural next secondary chronology after curated chat events.

Recommended scope:

- first-seen entity moments
- repeated-mention thresholds
- artifact-backed entity reappearance

Recommended hold:

- raw graph edits
- individual chat messages
- low-level retrieval traces

Most likely files:

- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/TimelineView.tsx`
- `src/types/index.ts`

#### 3. Mobile Header Polish

The desktop shell is the stronger implementation right now.

Worth improving next:

- mobile workspace selector visibility
- mobile search ergonomics
- filters and dossier drawer rhythm on smaller breakpoints

Main file:

- `src/components/features/TimelineView.tsx`

## Known Gaps

These are expected at this handoff point.

- Timeline does not yet render entity milestones
- Timeline only renders curated high-signal chat actions, not the full chat audit stream
- some run/artifact lineage is still partly inferred when older records or weaker launch paths do not carry explicit ids
- export is not yet implemented
- mobile Timeline ergonomics are still behind the desktop shell
