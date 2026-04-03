# Sherlock Project Audit Report

Date: 2026-04-03

## Purpose

This report audits the current Sherlock codebase against:

- the recent implementation plans in `docs/plans/01-domain-pack-cutover-plan.md` and `docs/plans/02-chat-agent-implementation-plan.md`
- the active project documentation under `README.md` and `docs/operations/*`
- the current runtime and persistence behavior in `src/`

The goal is to identify what is already at parity, what remains transitional, and what still needs cleanup to make the implementation feel logically complete.

## Validation Snapshot

Current validation on this checkout:

- `npm run lint`: passes
- `npm run test`: passes
- `npm run build`: passes

## Executive Assessment

Sherlock is in a strong state overall.

The major architecture work from both recent plans is substantially present:

- domain-pack and purpose resolution are live
- typed artifact sections are live
- multi-provider router parity is live for investigate/chat/streaming
- persisted workspace chat is live
- guided conversational run building is live
- launch-into-chat reuse is live

The remaining work is not a broad rewrite. It is a flush-and-cleanup pass.

The biggest remaining gaps are:

1. data lifecycle parity is incomplete for newer chat/task data
2. documentation and agent instructions are visibly out of sync in a few important places
3. the repo still carries several compatibility-first names and dormant legacy surfaces that should now be either finished, renamed, or removed

## Plan Audit

### Plan 01: Domain-Pack Cutover

Status assessment: mostly implemented, but still compatibility-first rather than fully cut over.

What is clearly shipped:

- domain packs, purposes, labels, and typed artifact sections are present
- launch flow resolves scope, pack, purpose, artifact type, and label profile
- persistence stores pack/purpose/artifact metadata and artifact sections
- UI surfaces use label profiles in several key places

What is still transitional:

- the core system of record is still mostly `Case`, `InvestigationReport`, `InvestigationTask`, and `InvestigationScope`
- `Workspace`, `Artifact`, and `WorkspaceRun` are aliases, not the dominant internal model
- app/store/service naming still centers the investigation vocabulary
- the compatibility facade in `src/services/gemini.ts` still fronts the generic provider router

Conclusion:

The architecture has moved to the new shape, but the codebase has not fully finished the semantic cutover described in the plan's target end state.

### Plan 02: Chat and Agent Implementation

Status assessment: feature-complete at the product surface, but not fully flushed through maintenance and lifecycle behavior.

What is clearly shipped:

- dedicated chat view
- persisted sessions/messages/actions
- provider-router chat and streaming paths
- workspace retrieval
- stop/cancel handling
- save draft / append / follow-up actions
- guided run builder
- launch into chat from Operation View, Archives, and Network Graph

What is still incomplete around that shipped surface:

- backup/import/purge flows do not fully include or clean up chat data
- delete/purge flows do not fully account for chat/session/task relationships
- test coverage is lighter for chat persistence and adapter normalization than for the one-shot run flows

Conclusion:

The chat plan is implemented in user-facing terms, but the surrounding maintenance and cleanup work is not yet at the same level of completeness.

## Highest-Priority Remaining Work

### 1. Finish Data Lifecycle Parity For Chat, Tasks, And Related Workspace Data

This is the most important remaining gap.

Current problems:

- `src/components/features/Settings/index.tsx` export/import only handles `cases` and `archives`
- `src/services/db/repositories/CaseRepository.ts` `clearCaseData()` only clears cases/reports/leads-related tables
- `src/services/db/repositories/CaseRepository.ts` `purgeCase()` and `deleteCase()` do not remove related chat sessions/messages/actions
- `src/store/caseStore.ts` only partially filters tasks in memory during purge and does not persist full cleanup for task/chat data

Impact:

- "backup" is not a full workspace backup anymore
- "purge" is not a full purge anymore
- imported data can coexist with stale chat/task/manual/template data from a prior state
- deleted workspaces can leave orphaned chat/session/task records behind

Clarified direction:

- backup and restore should be workspace-data only, not full local app state
- workspace data should include cases/workspaces, artifacts, chat sessions/messages/actions, tasks, manual graph data, templates, and workspace-linked headlines
- global settings should stay out of backup/restore, including theme, provider selection, API keys, and other personal environment preferences

Recommendation:

- define an explicit workspace-data backup scope in code and docs
- update export/import/clear/purge/delete flows to include chat, tasks, manual graph data, templates, and workspace-linked headlines
- keep app-level settings separate from workspace portability and maintenance flows

### 2. Decide Whether The Compatibility Layer Is Still Intentional Or Ready To Be Reduced

Current state:

- the product is broader, but the codebase is still heavily organized around investigation-era names
- `src/types/index.ts`, `src/store/caseStore.ts`, `src/services/gemini.ts`, and many feature files still use legacy type names as the primary mental model

Impact:

- this increases cognitive overhead
- it makes docs and code feel like they are describing slightly different products
- it leaves the cutover looking perpetually "mid-migration"

Clarified direction:

- the goal is a clean canon, not a permanent compatibility shell
- `Workspace`, `Artifact`, and `WorkspaceRun` should become the real conceptual hierarchy of the app

Recommendation:

- start a cleanup pass that promotes `Workspace` / `Artifact` / `WorkspaceRun` to real first-class names in state, repos, and feature code
- keep compatibility layers only where they still serve migration safety or historical data rendering

### 3. Remove Or Finish Dormant Legacy Surfaces

There are a few clear examples:

- `src/components/features/TimelineView.tsx` is still investigation-branded, has an unimplemented "Details" action, and is not exposed in sidebar navigation
- `src/App.tsx` still wires `AppView.TIMELINE`, so the view is not truly removed
- `showNewCaseModal` state exists in `src/store/caseStore.ts` and `src/App.tsx`, but no active modal is rendered from that state

Impact:

- these are visible signs of unfinished legacy behavior
- the keyboard shortcut path for "new investigation" appears incomplete

Clarified direction:

- Timeline is not dead weight; it is an unfinished surface worth reviving after the cleanup/parity work
- it should not block the current parity pass, but it should be treated as the next meaningful product slice afterward

Recommendation:

- remove or reconnect `showNewCaseModal` so the shortcut path is real
- decide whether the current dormant TimelineView shell should remain parked during cleanup or be temporarily removed until the real rebuild starts
- use the next slice after parity work to build Timeline as a true workspace chronology surface rather than a passive legacy log

## Documentation Audit

### What Is In Good Shape

- `README.md` is largely aligned with the current shipped feature set
- `docs/operations/architecture.md` reflects most of the recent runtime work
- `docs/operations/DATA_PERSISTENCE.md` correctly documents the newer schema additions at a high level
- `docs/plans/*` are useful and still readable as decision history

### What Is Outdated Or Inconsistent

#### AGENTS.md path drift

`AGENTS.md` still points to:

- `docs/DATA_PERSISTENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/SCOPES.md`
- `docs/SOURCES.md`

The active files now live under `docs/operations/`.

#### CONTRIBUTING is stale

`docs/operations/CONTRIBUTING.md` still contains several outdated items:

- `npm install` instead of the current `npm ci --include=optional` guidance
- references to `docs/architecture.md`, `docs/OPERATIONS_RUNBOOK.md`, `docs/SOURCES.md`, and `docs/SCOPES.md`
- a "Known Baseline Issues" section dated February 7, 2026 that no longer matches reality
- references to `docs/_legacy/*` even though that directory is not present in this repo

#### Broad-scope doc under-reports shipped functionality

`docs/operations/BROAD_SCOPE.md` lists current UX entry points but omits the shipped Chat surface.

#### Architecture doc has one stale path reference

`docs/operations/architecture.md` still points to `docs/LINTING.md` instead of `docs/operations/LINTING.md`.

## Secondary Cleanup Candidates

### 1. Strengthen Test Coverage Around Chat And Persistence

Current test coverage is good overall, but still uneven.

Gaps worth closing:

- provider adapter contract tests cover investigate/scan/live, but not chat/stream normalization per adapter
- there are no direct repository tests for `ChatRepository` or `WorkspaceSearchRepository`
- maintenance flows for export/import/purge/clear are not covered

### 2. Review Dead Or Semi-Dead Persistence Artifacts

Examples:

- `feed_items` exists in the schema but is not backed by an active repository flow
- `src/utils/localStorage.ts` still exposes many older storage keys that no longer appear to be active runtime pathways beyond workspace selection compatibility

This is not urgent, but it is a good cleanup pass once the maintenance gaps are fixed.

### 3. Do A Final Naming And Copy Sweep

Most user-facing surfaces are improved, but the repo still mixes:

- workspace/project/monitor language
- case/report/investigation language
- operation-era labels

That is acceptable during migration, but it is the main reason the implementation still feels slightly transitional.

### 4. Treat Timeline As The Next Product Slice After Parity

Timeline has more upside than its current dormant state suggests.

The strongest version of the feature would unify time-based workspace understanding across:

- saved signals and monitor events
- artifact creation and follow-up lineage
- run chronology
- chat action history
- entity emergence and change over time

That would give Sherlock a real temporal workspace surface to complement Feed, Operation View, Graph, and Chat.

## Recommended Execution Order

1. Fix export/import/clear/purge/delete so newer chat/task data participates correctly in lifecycle operations.
2. Update `AGENTS.md` and the stale docs under `docs/operations/` so repo instructions match reality.
3. Start the canonical hierarchy cleanup so `Workspace` / `Artifact` / `WorkspaceRun` become the real mental model.
4. Remove or reconnect dormant legacy surfaces like `showNewCaseModal`, and decide how to park the current Timeline shell until the dedicated rebuild.
5. Add tests around chat adapter contracts, chat repositories, and maintenance flows.
6. Use the next slice after parity to build the revived Timeline surface intentionally.

## Bottom Line

Sherlock does not need another major architecture pass.

It needs a cleanup-and-parity pass.

The codebase is already strong enough to support that work incrementally. The highest-value next move is to make data lifecycle behavior, docs, and legacy cleanup catch up with the feature work that has already landed.
