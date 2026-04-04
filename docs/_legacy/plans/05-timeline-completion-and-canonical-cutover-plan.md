# Sherlock Timeline Completion and Canonical Cutover Plan

Date: 2026-04-03
Status: Proposed

## Objective

Bring Sherlock to a clean, logically complete post-buildout state by:

- finishing the required Timeline extensions so the chronology surface feels fully intentional rather than merely present
- promoting the canonical `Workspace -> Artifact -> WorkspaceRun` hierarchy to the real code model
- removing legacy compatibility pathways that are no longer needed in a greenfield codebase
- doing the major doc and repo-instruction truth pass only after the implementation shape settles

This plan intentionally changes the earlier sequence implied across `03-cleanup-parity-and-timeline-plan.md` and `04-timeline-buildout-plan.md`.

New recommended order:

1. complete Timeline
2. cut over to canon and remove legacy
3. harden validation around the settled architecture
4. refresh docs broadly once the new shape is real

## Why This Order

The repo is no longer missing its biggest workspace-data lifecycle behaviors.

What is already materially in place:

- workspace-data export/import shape and settings flow
- workspace purge/delete/clear behavior across artifacts, runs, chat, graph data, templates, and signals
- first meaningful Timeline shell with lineage, entity milestones, and curated chat chronology

What still makes the codebase feel transitional is not basic product incompleteness. It is:

- Timeline still stopping short of the full intended chronology surface
- investigation-era naming still dominating the code model
- compatibility fields and facades still lingering as if migration safety were the main constraint
- docs and repo instructions still describing a partly older reality

Because this repo is effectively greenfield, we should optimize for a clean end state rather than preserving transitional compatibility longer than necessary.

## Superseded Assumptions

This plan treats the following as settled:

### 1. No Historical Migration Burden Should Drive Design

Older compatibility pathways are optional, not sacred.

If a field, helper, facade, or name only exists to preserve older semantics and is not needed for the current product, it should be removed rather than indefinitely carried forward.

### 2. Timeline Completion Comes Before The Big Documentation Flush

Timeline extensions are required product work, not optional polish.

We should finish the remaining meaningful Timeline capabilities before doing the broad doc truth pass, so the docs can describe the real settled surface rather than another interim state.

### 3. Canonical Naming Should Win In Runtime Code

The target hierarchy is no longer aspirational:

- `Workspace`
- `Artifact`
- `WorkspaceRun`

These should become the dominant runtime concepts in types, store shape, feature code, service facades, and helper names.

Compatibility persistence/table names may remain temporarily where changing them would create churn with no product value, but they should stop dominating app code and docs.

## Current Assessment

Sherlock is strong on feature surface and increasingly strong on Timeline, but still transitional in code semantics.

### What Is Already Strong

- domain-pack runtime and purpose-aware launch flow
- multi-provider investigate/chat/streaming support
- persisted workspace chat with save/append/follow-up actions
- workspace-data maintenance/export/import scope
- real Timeline shell with lineage, curated chat chronology, and entity milestone chronology

### What Still Feels Incomplete

- Timeline does not yet cover the full intended chronology depth
- the runtime/store/type model still centers `Case`, `InvestigationReport`, and `InvestigationTask`
- `src/services/gemini.ts` still acts as a compatibility facade for a generic provider runtime
- `parentTopic`, older localStorage aliases, and similar compatibility paths remain in active code
- some docs and audit/history docs still read like current truth when they are now partially outdated
- validation is still much stronger for app code than for repo-wide truth and persistence edge coverage

## Success Criteria

This plan is complete when:

- Timeline feels product-complete for the intended current scope
- canonical naming clearly dominates runtime code and touched docs
- unnecessary legacy/compatibility paths are removed rather than merely deprioritized
- repository validation credibly covers the settled implementation
- docs and repo instructions read as truthful descriptions of current reality rather than migration notes

## Stream 1: Timeline Completion

### Goal

Finish the remaining required Timeline capabilities before broader cleanup and documentation work.

### Why This Comes First

Timeline is now a real surface, and the remaining work is no longer about whether it should exist.

It is about finishing the chronology product so the rest of the cleanup can align to the final intended workspace model.

### Required Outcomes

- Timeline supports the remaining high-value chronology extensions
- follow-up branching and chronology relationships feel complete rather than selectively inferred
- the surface can stand beside Feed, Operation View, Graph, and Chat as a first-class workspace view

### Workstream A: Complete The Chronology Surface

Primary files:

- `src/components/features/TimelineView.tsx`
- `src/components/features/Timeline/timelineEvents.ts`
- `src/types/index.ts`
- lineage and chat/runtime helpers as needed

Required work:

#### 1. Decide And Implement Timeline Export

Settle whether Timeline should support an export/save path now.

Recommended direction:

- add a real export action if it produces a useful operator artifact
- if that export is valuable as saved workspace output, allow saving a timeline snapshot as an `Artifact` with `artifactType: TIMELINE`

This should not remain an open theoretical question.

#### 2. Broaden Secondary Tracks Beyond The Current Curated Set

Current Timeline now has:

- signals
- runs
- artifacts
- entity milestones
- chat sessions
- curated high-signal chat actions

Next required extension pass should decide and implement the next truly useful chronology layers such as:

- richer run/artifact follow-up branch events
- additional high-signal chat milestones where they materially change workspace state
- derived workspace milestones that make chronology more legible without turning the page into a noisy audit log

Hold the line against:

- raw transcript spam
- low-value retrieval noise
- graph-edit exhaust that belongs in topology views rather than chronology

#### 3. Finish Explicit Chronology Lineage

Continue replacing runtime compatibility inference where it still remains in Timeline-relevant paths.

Preferred direction:

- explicit ids win everywhere
- derived ids are backfilled where the current flow can safely compute them
- legacy topic-based matching is removed where it is no longer necessary

Because this repo is greenfield, removal is preferred over keeping broad compatibility heuristics indefinitely.

#### 4. Add Final Timeline Quality Pass

Close out the surface with:

- complete empty/loading/error states
- clear event-specific details
- consistent click-through actions
- desktop and mobile ergonomics that feel intentionally finished
- summary states that make the view useful at a glance

### Deliverables

- Timeline export decision implemented
- required secondary track extensions landed
- chronology lineage tightened further
- Timeline ready to be treated as a stable first-class feature

## Stream 2: Canonical Cutover and Legacy Removal

### Goal

Make the canonical workspace model the real code model and remove legacy semantics that no longer serve the product.

### Guiding Principle

Prefer clean end-state code over transitional compatibility scaffolding.

If a compatibility layer is no longer required for current users or current product behavior, remove it.

### Workstream A: Promote Canonical Runtime Names

Primary files:

- `src/types/index.ts`
- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/components/features/*`
- `src/services/chat/*`
- `src/services/providers/*`
- `src/services/db/repositories/*`

Required direction:

#### 1. Make Canonical Types Primary

Reduce or eliminate primary reliance on:

- `Case`
- `InvestigationReport`
- `InvestigationTask`

Promote:

- `Workspace`
- `Artifact`
- `WorkspaceRun`

Recommended approach:

- invert the alias direction or replace aliases entirely
- use canonical names in new and touched signatures first
- remove duplicate investigation-era type surfaces where they no longer add value

#### 2. Move Store And UI State Toward Canon

Targets include:

- `useCaseStore`
- `cases`
- `archives`
- `tasks`
- `activeCaseId`

Recommended direction:

- rename toward canonical workspace terminology
- add compatibility adapters only if absolutely needed during the refactor itself
- remove them once the codebase is consistently cut over

### Workstream B: Replace Compatibility Facades

Primary files:

- `src/services/gemini.ts`
- app/runtime call sites
- any residual compatibility imports

Required outcome:

- replace the investigation/Gemini-branded facade with a canonically named runtime facade
- update feature code to depend on the real generic runtime layer, not a compatibility wrapper

### Workstream C: Remove Legacy Compatibility Fields And Helpers

Primary files:

- `src/services/db/schema.ts`
- `src/store/caseStore.ts`
- provider normalizers/adapters
- export helpers
- localStorage helpers

Candidates to review aggressively:

- `parentTopic`
- older topic-based lineage matching
- older localStorage key aliases that are no longer needed
- comments/copy that still describe temporary migration behavior

Because no broad migration burden needs to be preserved, the default decision should be:

- remove old compatibility pathways
- keep only the minimum needed for the current settled product

### Deliverables

- canonical names dominate runtime code
- compatibility facades removed
- unnecessary legacy lineage/storage helpers removed
- the app reads as a clean workspace platform rather than a compatibility-first investigation app

## Stream 3: Validation and Stability Hardening

### Goal

Bring validation up to the level expected of the cleaned-up architecture before the broad doc refresh.

### Why This Comes Before The Big Doc Flush

Docs should describe a shape we trust.

That means validating the settled implementation first, not merely rewriting documentation optimistically.

### Work Breakdown

#### 1. Add Repository And Maintenance Coverage

Required targets:

- workspace-data export/import normalization
- purge/delete/clear semantics
- chat repository behavior
- workspace search repository behavior
- any new Timeline export path

#### 2. Add Canonical-Cutover Coverage

Where helpers/selectors/facades change shape, add targeted tests so the canonical refactor does not just become broad rename churn.

#### 3. Revisit Validation Scope

Current scripts largely focus on `src/`.

Recommended direction:

- decide whether repo-wide formatting/docs validation should be added
- ensure the main commands reflect the repo reality we actually expect contributors to maintain

### Deliverables

- stronger maintenance/repository coverage
- stronger confidence in the canonicalized runtime
- validation strategy aligned with the repo's actual surface area

## Stream 4: Major Documentation and Repo-Instruction Refresh

### Goal

Rewrite docs and repo guidance around the final settled implementation, not around transitional architecture history.

### Important Constraint

This is a major refresh after implementation and validation, not before.

The purpose is to make the docs truthful and durable once the code shape is stable.

### Primary Files

- `README.md`
- `AGENTS.md`
- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/CONTRIBUTING.md`
- `docs/operations/LINTING.md`
- historical reports/plans that need explicit superseded context

### Work Breakdown

#### 1. Rewrite Current-State Docs Around Canon

Docs should describe:

- canonical runtime names
- settled Timeline surface and export behavior
- real maintenance scope
- real UX entry points

#### 2. Mark Historical Docs As Historical

Older audit and handoff docs should remain useful as history, but they should not read like the current source of truth when they are no longer accurate.

Recommended direction:

- add clear “historical snapshot” or “superseded by later implementation” framing where needed
- avoid deleting useful planning history unless it is actively misleading

#### 3. Clean Repo Instructions

Ensure:

- `AGENTS.md` reflects current structure and validation expectations
- contributor docs match actual scripts and environment guidance
- no active doc points readers toward dead or obsolete paths

### Deliverables

- docs aligned with final implementation reality
- historical documents framed correctly
- repo instructions coherent for future contributors and agents

## Recommended Execution Order

1. Finish Timeline extension work and settle Timeline export.
2. Perform the canonical runtime/store/service cutover.
3. Remove unnecessary legacy compatibility fields and helpers.
4. Add targeted tests and validation hardening for the settled shape.
5. Do the broad doc and repo-instruction refresh last.

## Testing Expectations

Before closing this plan, run:

```bash
npm run lint
npm run test
npm run build
```

Add or extend targeted tests for:

- Timeline event derivation and export behavior
- maintenance/workspace-data flows
- repository-level chat/search/persistence behavior
- canonicalized selectors, helpers, and runtime facades

## Risks

### 1. Timeline Overexpands Into Noise

Risk:

- adding more chronology sources can dilute the signal of the page

Mitigation:

- add only high-signal derived chronology
- keep low-value audit exhaust out of the main stream

### 2. Canonical Refactor Turns Into Rename Churn

Risk:

- broad renaming can produce large diffs without improving clarity

Mitigation:

- center the cutover on real runtime seams: types, store shape, service facades, export helpers, and feature interfaces
- remove obsolete compatibility code rather than layering more aliases

### 3. Docs Are Refreshed Too Early

Risk:

- a big doc sweep before implementation settles creates another near-term drift cycle

Mitigation:

- keep the major documentation refresh as the final stream, after Timeline and canonicalization land

## Final Recommendation

Treat the next phase as a completion pass, not a maintenance-only cleanup pass.

Sherlock already has most of the product surface it needs. The highest-value remaining work is to:

- finish Timeline properly
- make the codebase honestly canonical
- remove leftover transitional scaffolding
- then refresh docs around the resulting settled product
