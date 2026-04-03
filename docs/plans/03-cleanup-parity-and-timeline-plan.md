# Sherlock Cleanup, Parity, and Timeline Plan

Date: 2026-04-03
Status: Proposed

## Objective

Bring Sherlock to a clean, logically complete post-cutover state by:

- finishing workspace-data lifecycle parity across persistence and maintenance flows
- promoting the canonical `Workspace -> Artifact -> WorkspaceRun` hierarchy in code and docs
- removing or resolving dormant legacy surfaces that now create ambiguity
- preparing a clear next slice for a revived Timeline surface after parity work is complete

This plan is intentionally split into two slices:

- Slice 1: Cleanup and parity
- Slice 2: Timeline buildout

The recommendation is to complete Slice 1 first and use it to stabilize the app's data model, naming, and maintenance behavior before starting Timeline.

## Clarified Product Decisions

These decisions are now treated as settled direction for this plan.

### 1. Backup And Restore Scope

Backup/restore should be workspace-data only, not full local app state.

Workspace data should include:

- workspaces/cases
- artifacts/reports
- workspace runs/tasks
- chat sessions
- chat messages
- chat actions
- manual graph nodes and links
- templates
- workspace-linked headlines/signals

Workspace data should not include:

- theme settings
- provider/model defaults
- API keys
- quiet mode
- other personal environment preferences

### 2. Canonical Hierarchy

The app should move toward a clean canon, not remain in a permanent compatibility-first shape.

Target hierarchy:

- `Workspace`
- `Artifact`
- `WorkspaceRun`

Compatibility names may remain at persistence edges or migration boundaries where needed, but they should no longer be the dominant mental model in app/state/service code.

### 3. Timeline Direction

Timeline is not deprecated. It is unfinished.

It should be treated as the next meaningful product slice after cleanup/parity work lands, not as dead legacy behavior and not as something to mix into the parity pass.

## Slice 1: Cleanup And Parity

### Goal

Make Sherlock's current shipped feature set feel complete, coherent, and maintainable.

### Success Criteria

- workspace-data export/import covers all intended workspace-bound data
- purge/delete/clear flows clean up all intended workspace-bound records
- app-level settings remain intentionally outside workspace backup/restore
- canonical hierarchy is reflected in code structure and naming direction
- dormant legacy state and unused surfaces no longer create ambiguity
- docs consistently reflect the current structure and maintenance behavior

## Workstream A: Workspace-Data Lifecycle Parity

### Goal

Bring export/import/clear/purge/delete behavior up to parity with the current runtime surface area.

### Why This Is First

Chat, tasks, templates, and manual graph data are already first-class product features. Their lifecycle behavior now needs to catch up.

### Scope

Include:

- workspaces/cases
- artifacts/reports
- artifact sections
- tasks/workspace runs
- chat sessions/messages/actions/attachments
- manual graph nodes/links
- templates
- workspace-linked headlines/signals

Exclude:

- theme and presentation preferences
- provider keys
- global provider/model defaults
- other app-level settings not meaningfully part of workspace portability

### Primary Files

- `src/components/features/Settings/index.tsx`
- `src/store/caseStore.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/repositories/ChatRepository.ts`
- `src/services/db/repositories/TaskRepository.ts`
- `src/services/db/schema.ts`
- `docs/operations/DATA_PERSISTENCE.md`
- `README.md`

### Work Breakdown

#### 1. Define Canonical Workspace Backup Shape

Create and document an explicit payload shape for workspace-data export/import.

Recommended top-level shape:

- `workspaces`
- `artifacts`
- `runs`
- `chat`
- `signals`
- `graph`
- `templates`
- `metadata`

Important note:

- keep exported shape clean and forward-looking even if repository internals still read from compatibility tables

#### 2. Expand Export Logic

Update maintenance export so it includes:

- cases/workspaces
- reports/artifacts
- tasks
- chat sessions/messages/actions
- manual nodes/links
- templates
- workspace-linked headlines

Do not include:

- API keys
- app theme settings
- provider defaults

#### 3. Expand Import Logic

Update maintenance import so it:

- clears the intended workspace-data domain before import
- restores all exported workspace-bound tables coherently
- does not overwrite unrelated app-level preferences
- preserves backward-compatible import handling where reasonable

#### 4. Fix Purge/Delete/Clear Semantics

Current purge/delete behavior should be made consistent.

Required outcomes:

- deleting a workspace cleans up its associated chat sessions/messages/actions
- purging a workspace removes associated artifacts, signals, tasks, and graph-linked workspace data as intended
- clearing workspace data removes all workspace-domain records, not just cases/reports/leads

Decision point to settle during implementation:

- whether templates are global reusable assets or workspace-domain data for maintenance purposes

Current recommendation:

- include templates in workspace-data maintenance/export because they are part of the user's reusable workspace setup layer

#### 5. Add Tests For Lifecycle Operations

Add focused tests around:

- export payload completeness
- import restore behavior
- purge cleanup behavior
- clear-data behavior
- no accidental inclusion of app-level settings

### Deliverables

- workspace-data export/import shape implemented
- purge/delete/clear flows aligned with shipped feature set
- docs updated to reflect actual scope

## Workstream B: Canonical Hierarchy Cleanup

### Goal

Move the app toward clean canonical concepts without introducing risky persistence churn.

### Guiding Principle

Change code semantics before changing stable storage names.

This means:

- prefer internal type and module cleanup first
- keep database table names compatibility-safe until a later migration is truly justified

### Primary Files

- `src/types/index.ts`
- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/services/gemini.ts`
- `src/services/providers/*`
- `src/services/chat/*`
- `src/services/db/repositories/*`
- `src/components/features/*`
- `docs/operations/architecture.md`

### Work Breakdown

#### 1. Promote Canonical Type Usage

Reduce reliance on:

- `Case`
- `InvestigationReport`
- `InvestigationTask`

Increase explicit usage of:

- `Workspace`
- `Artifact`
- `WorkspaceRun`

Recommended approach:

- keep aliases available initially
- prefer canonical names in new and touched code
- gradually make compatibility names secondary rather than primary

#### 2. Clean App And Store Naming

Targets:

- `useCaseStore` should be reviewed for eventual rename or canonical selector layering
- `activeCaseId` should move toward `activeWorkspaceId`
- archive and launch helpers should center workspace/artifact naming where practical

Recommended strategy:

- use selectors and compatibility helpers first if a full store rename would create too much churn in one pass

#### 3. Review Compatibility Facades

`src/services/gemini.ts` currently acts as a compatibility-facing facade for the provider router.

Decide whether to:

- keep it as a temporary compatibility surface only
- or replace it with a more canonically named runtime facade

Recommendation:

- move toward a neutral runtime facade name once lifecycle parity work is stable

#### 4. Update Docs To Match Canon

Architecture and persistence docs should clearly distinguish:

- canonical product concepts
- compatibility persistence/table names
- transitional naming that still exists in code

### Deliverables

- canonical hierarchy reflected more clearly across code and docs
- compatibility names reduced to edges and historical paths

## Workstream C: Legacy Surface Resolution

### Goal

Resolve dormant or half-connected legacy surfaces that currently make the app feel unfinished.

### Primary Files

- `src/App.tsx`
- `src/store/caseStore.ts`
- `src/components/features/TimelineView.tsx`
- `src/components/ui/Sidebar.tsx`
- keyboard shortcut wiring under `src/hooks/*`

### Work Breakdown

#### 1. Resolve `showNewCaseModal`

Current issue:

- the state and shortcut path exist, but the modal is not actually rendered from the app shell

Choose one:

- reconnect it properly
- or remove the dead state and route if a different creation path is the intended UX

Recommendation:

- reconnect if the shortcut is still part of the intended product flow

#### 2. Decide How To Park Timeline During Slice 1

Options:

- keep the route but clearly mark Timeline as not yet active and remove dead affordances
- temporarily remove Timeline from app routing until Slice 2 starts

Recommendation:

- keep only the minimal scaffold necessary for the upcoming rebuild, but remove misleading behavior such as unimplemented actions

#### 3. Remove Other Dead Or Misleading Paths

Examples to review:

- old compatibility localStorage helpers no longer needed at runtime
- persistence artifacts no longer used meaningfully
- labels or comments that still imply older baseline limitations

### Deliverables

- shortcut and modal behavior is coherent
- Timeline is either intentionally parked or intentionally hidden
- dormant legacy paths are reduced

## Workstream D: Documentation Flush

### Goal

Make project docs and repo instructions match reality.

### Primary Files

- `AGENTS.md`
- `README.md`
- `docs/operations/CONTRIBUTING.md`
- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

### Work Breakdown

#### 1. Fix Path Drift

Update references still pointing to old top-level docs paths so they point to `docs/operations/*`.

#### 2. Remove Stale Baseline Language

Clean up:

- outdated lint/test/build issue notes
- references to absent directories like `docs/_legacy/`
- old install guidance that no longer matches `README.md`

#### 3. Document Workspace-Data Scope

Add explicit language for:

- what backup/restore includes
- what purge/clear includes
- what stays local as app-level preference/config

#### 4. Reflect Shipped Chat Surface

Ensure docs that list current product entry points and architecture mention Chat consistently.

### Deliverables

- docs aligned with actual repo structure
- maintenance and data scope documented clearly

## Testing Expectations For Slice 1

Before closing the cleanup/parity slice, run:

```bash
npm run lint
npm run test
npm run build
```

Add or extend tests for:

- maintenance/export/import flows
- chat repository and workspace search repository behavior
- purge/delete cleanup behavior
- canonical hierarchy helpers/selectors if introduced

## Risks In Slice 1

### 1. Over-Renaming Too Early

Risk:

- semantic cleanup can turn into broad churn

Mitigation:

- prioritize canonical selectors, adapters, and module naming before deep persistence changes

### 2. Data Loss In Maintenance Changes

Risk:

- export/import/purge work can accidentally drop data if done without explicit scope definition

Mitigation:

- define exported workspace-data shape first
- test import/export round-trip behavior
- keep app-level settings intentionally out of the imported payload

### 3. Timeline Scope Creep

Risk:

- Timeline aspirations could leak into the cleanup slice

Mitigation:

- keep Slice 1 focused on parity and cleanup only
- document Timeline as the immediate next slice, not part of current closure criteria

## Slice 2: Timeline Buildout

### Goal

Build Timeline into a real workspace chronology surface once cleanup/parity work is complete.

### Why It Matters

Sherlock already has strong surfaces for:

- discovery
- deep artifact reading
- graph relationships
- grounded chat

What it lacks is a strong temporal view across the whole workspace.

Timeline can provide that missing dimension.

### Product Role

Timeline should answer:

- what changed in this workspace over time
- what signals arrived when
- what runs were launched and what they produced
- how artifacts branched into follow-ups
- when entities, topics, or claims first appeared and evolved

### Candidate Timeline Tracks

- signal track: saved headlines and monitor events
- artifact track: artifacts created over time
- run track: launch chronology and follow-up lineage
- chat action track: retrieval, save, append, and follow-up actions
- entity track: notable entity appearances or milestone mentions

### Likely Capabilities

- workspace-wide chronological view
- filters by date range, artifact type, signal type, and entity
- click-through into artifacts, chats, and source context
- branch visualization for follow-up runs
- "what changed this week/month/quarter" summaries
- support for timeline sections inside Operation View artifacts where relevant

### Primary Files For Slice 2

- `src/components/features/TimelineView.tsx`
- `src/App.tsx`
- `src/components/ui/Sidebar.tsx`
- `src/store/caseStore.ts`
- `src/services/db/repositories/*`
- `src/services/chat/*`
- timeline-specific selectors/helpers to be introduced

### Recommended Timeline Build Sequence

1. Rebuild Timeline as a workspace chronology shell.
2. Add artifact and signal events first.
3. Add run lineage and chat action events.
4. Add filtering and click-through behavior.
5. Add higher-level summary views and temporal insights.

### Success Criteria For Slice 2

- Timeline is visible and intentionally navigable in the app shell
- it reflects actual workspace chronology rather than static legacy logs
- it links meaningfully to artifacts, signals, and follow-up work
- it complements Feed, Operation View, Graph, and Chat without duplicating them

## Recommended Execution Order

### Slice 1

1. Define workspace-data backup/maintenance scope.
2. Fix export/import/clear/purge/delete parity.
3. Add maintenance and repository test coverage.
4. Begin canonical hierarchy cleanup in app/store/services.
5. Resolve dormant legacy surfaces and shortcut dead paths.
6. Flush docs and repo instructions.

### Slice 2

1. Rebuild Timeline as a true chronology surface.
2. Start with artifacts and signals.
3. Add run and chat action lineage.
4. Polish filters, linking, and summary views.

## Final Recommendation

Do not start Timeline yet.

Complete the cleanup/parity slice first so Sherlock's current feature set has coherent data lifecycle behavior and clean canonical structure.

Then use the next slice to turn Timeline into a meaningful product surface rather than a revived leftover view.
