# Timeline Implementation Handoff

Date: 2026-04-03
Status: Active Handoff

Historical note: this handoff reflects the initial Timeline landing. The current codebase now includes later completion work such as Timeline snapshot export/save and stricter explicit-lineage handling.

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
  - entity milestones
  - chat sessions
  - curated high-signal chat actions
- entity and chat chronology remain opt-in at the filter layer rather than default-on in the main chronology
- chronology cards now show lightweight lineage chips for related signals, runs, artifacts, entities, and chat sessions
- event cards support click-through into:
  - `OperationView` for related artifacts
  - `Chat` for workspace or event-context chat entry
  - exact saved chat sessions when the timeline event belongs to a persisted chat session/action
- launch requests now derive missing `parentArtifactId`, `parentRunId`, and `sourceSignalId` lineage from known parent artifacts/runs before task persistence
- artifact saves now backfill lineage from `sourceRunId` when the incoming report payload is partial
- Timeline now derives explicit run-to-artifact links from saved `sourceRunId` before falling back to topic matching
- nearby report-selection helpers in `App.tsx` and `OperationView` now prefer stored `sourceRunId` / `parentArtifactId` lineage before legacy topic-only heuristics
- smaller-breakpoint Timeline header controls now keep workspace switching and chronology search visible without opening drawers first

## Files Added

- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/Timeline/timelineEvents.test.ts`
- `docs/reports/05-timeline-implementation-handoff.md`

## Files Updated

- `src/App.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/OperationView/index.tsx`
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
- `npx eslint src/types/index.ts src/components/features/Timeline/timelineEvents.ts src/components/features/Timeline/timelineEvents.test.ts src/components/features/TimelineView.tsx src/App.tsx src/components/features/OperationView/index.tsx`
- `npx vitest run src/components/features/Timeline/timelineEvents.test.ts --pool=forks`
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

### 4. Entity Milestones Are Now A Secondary Track

Timeline now derives an opt-in `ENTITY` track from persisted artifacts for:

- first-seen entity moments
- repeated-mention thresholds
- artifact-backed reappearance after meaningful chronology gaps

The milestone events keep click-through attached to the originating artifact so they remain chronology aids rather than becoming a second graph surface.

### 5. Current Lineage Is Stronger, But Still Compatibility-Aware For Legacy Records

Run-to-artifact linkage now prefers:

- `task.config.producedArtifactId`
- `task.report?.id`
- artifact `config.sourceRunId`
- only then topic matching within the active workspace

Artifact follow-up lineage now prefers:

- `config.parentArtifactId`
- only then legacy `parentTopic`

This slice further reduced the inference surface by:

- deriving timeline run lineage from saved `sourceRunId` before topic fallback
- preferring explicit parent ids in Timeline and nearby report-navigation helpers
- keeping older compatibility fields as a final fallback for legacy records that predate stored lineage ids

## Best Next Session Starting Point

The most valuable next steps are now:

1. evaluate timeline export and snapshot value
2. decide whether broader secondary chronology is worth the extra density
3. tighten legacy-record migration/backfill only if older data needs it

### Recommended Order

#### 1. Evaluate Timeline Export

Still explicitly later-slice work.

Question to answer:

- does a saved `TIMELINE` artifact meaningfully help operators, or would it just duplicate Archives plus Timeline screenshots/exported chat context?

#### 2. Decide Whether To Broaden Secondary Tracks

Current state is intentionally curated.

Possible future additions:

- richer graph-edit milestones
- broader chat audit traces
- other derived workspace milestones that are high-signal without overwhelming the stream

#### 3. Backfill Legacy Records Only If Needed

Current issue:

- older persisted artifacts/runs can still fall back to `parentTopic` or topic similarity when explicit ids were never stored

Likely next step if this matters:

- add migration/backfill work rather than expanding more runtime compatibility heuristics

## Known Gaps

These are expected at this handoff point.

- Timeline only renders curated high-signal chat actions, not the full chat audit stream
- some run/artifact lineage is still partly inferred for older records that never stored explicit ids
- export is not yet implemented
