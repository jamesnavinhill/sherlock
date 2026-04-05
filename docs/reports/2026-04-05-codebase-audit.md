# Codebase Audit

Date: April 5, 2026

## Scope

This audit reviewed Sherlock's active code and docs with the goal of improving:

- cleanup and canonization
- naming uniformity and behavioral parity
- cleanliness and maintainability
- safety and readiness for further development

Primary attention went to the documented architecture anchors:

- `src/App.tsx`
- `src/store/caseStore.ts`
- `src/services/runtime.ts`
- `src/services/providers/index.ts`
- `src/components/features/Timeline/*`
- `src/services/db/*`

## Validation Snapshot

Validated on this checkout during this audit pass:

- `npm run lint`: fails
- `npm run typecheck`: passes
- `npm run test`: passes (`33` files, `110` tests)
- `npm run build`: passes

Current lint failure:

- `src/components/features/WorkspaceBoard/CompactStylePanel.tsx:16` has an unused `relevantStyles` binding

Build note:

- Vite still emits a large-chunk warning for `vendor-tldraw-app`

## Overall Assessment

Sherlock is closer to "working platform" than "cleanup project." The runtime surface is substantial, the provider/router architecture is centralized, SQLite persistence is real, the full test suite passes, and the docs show a serious attempt to keep architecture explicit.

The main gap is not missing product capability. The main gap is that the codebase still has several places where the intended canon is not yet fully enforced in code, state, or documentation. That leaves the project in a transitional posture: usable and feature-rich, but not yet as uniform, safe, or development-ready as it could be.

## Priority Findings

### P1. Provider capability enforcement is only partially implemented

Evidence:

- `src/services/providers/index.ts:103`
- `src/services/providers/index.ts:120`
- `src/services/providers/index.ts:263`
- `src/services/providers/index.ts:294`

What is happening:

- `assertCapability(...)` only throws for `TTS`
- `INVESTIGATE`, `CHAT`, `BOARD_AGENT`, `SCAN_ANOMALIES`, and `LIVE_INTEL` all call `assertCapability(...)`
- but those operations are not actually checked against model capabilities

Why this matters:

- the docs and architecture describe a capability-aware router, but the guardrail is incomplete
- unsupported models can still reach runtime paths that appear validated
- this is the kind of inconsistency that produces "it lets me select it, then fails later" behavior

Recommendation:

- turn `assertCapability(...)` into a real operation-to-capability gate
- keep one authoritative mapping from router operation to model capability requirements
- add tests for each unsupported path, not just happy-path dispatch

### P1. `purgeWorkspace` can restore the wrong active task state

Evidence:

- `src/store/caseStore.ts:669`
- `src/store/caseStore.ts:671`
- `src/store/caseStore.ts:1444`
- `src/store/caseStore.ts:1498`
- `src/store/caseStore.ts:1499`

What is happening:

- the store carries both `activeWorkspaceRunId` and `activeTaskId`
- setters force them to mirror each other
- `purgeWorkspace(...)` checks survival using `activeWorkspaceRunId`
- then writes both fields back from `state.activeWorkspaceRunId`, not from `state.activeTaskId`

Why this matters:

- this creates a correctness bug at a destructive boundary
- if the fields ever diverge, or if future work decouples them, purge logic will preserve or clear the wrong selection
- even before a bug is observed, duplicated state with mirrored setters is a maintenance trap

Recommendation:

- collapse to one canonical "active run/task" field, or make the two fields intentionally distinct
- update purge/delete flows to restore from the field they actually mean to preserve
- add a regression test around purging a workspace while another task remains selected

### P1. Artifact persistence is multi-step and non-atomic

Evidence:

- `src/services/db/repositories/CaseRepository.ts:347`
- `src/services/db/repositories/CaseRepository.ts:364`
- `src/services/db/repositories/CaseRepository.ts:381`
- `src/services/db/repositories/CaseRepository.ts:393`
- `src/services/db/repositories/CaseRepository.ts:407`

What is happening:

- `createReport(...)` inserts the base report row first
- then inserts entities, sources, sections, and evidence in separate awaited loops
- the code explicitly avoids a surrounding transaction

Why this matters:

- partial writes are possible if a later insert fails
- a report can be persisted without its dependent rows, leaving the database internally inconsistent
- this is a safety issue, not just a style issue, because reports are the core durable artifact path

Recommendation:

- move artifact persistence to an atomic write strategy
- if drizzle transaction support is incompatible with this wa-sqlite setup, build a lower-level SQLite transaction helper at the client layer and use it for repository writes that span tables
- add failure-path tests that confirm no partial artifact survives a mid-write error

### P2. Validation docs are currently stale relative to the actual repo state

Evidence:

- `README.md:130`
- `README.md:132`
- `docs/reports/CURRENT_STATUS.md:132`
- `docs/reports/CURRENT_STATUS.md:139`
- `docs/operations/LINTING.md:30`
- `src/components/features/WorkspaceBoard/CompactStylePanel.tsx:16`

What is happening:

- active docs say lint passes
- current audit run found a real lint failure
- active docs also describe a targeted-test validation snapshot, while this audit pass confirms the full suite now passes

Why this matters:

- the repo has clear documentation standards, so stale validation status reduces trust in the docs that are supposed to be the current source of truth
- cleanup work should tighten the feedback loop between code and docs, not let them drift

Recommendation:

- treat validation snapshots as short-lived status, not durable prose
- either refresh the current-status docs after each meaningful pass or move validation state into a smaller, explicitly ephemeral report section

### P2. Persistence guidance is not fully uniform across docs and implementation

Evidence:

- `docs/operations/ARCHITECTURE.md:198`
- `docs/operations/DATA_PERSISTENCE.md:154`
- `src/components/features/LiveMonitor/index.tsx:79`
- `src/components/features/LiveMonitor/index.tsx:281`

What is happening:

- architecture docs say persistence writes go through repositories and settings KV rather than feature-level `localStorage`
- data persistence docs correctly list remaining direct `localStorage` keys
- `LiveMonitor` still reads/writes `sherlock_livestream_autosave` directly inside the feature component

Why this matters:

- the code is not wrong, but the canon is not singular
- direct feature-level storage writes make persistence behavior harder to audit and standardize
- this undercuts the repo's push toward a clean persistence boundary

Recommendation:

- centralize the remaining browser-storage keys behind one typed settings/storage service
- then update docs so architecture and operations describe the same model

### P2. Core app state and feature surfaces are too monolithic for comfortable extension

Evidence:

- `src/store/caseStore.ts` is about `1706` lines
- `src/components/features/WorkspaceBoard/index.tsx` is about `1741` lines
- `src/components/features/TimelineView.tsx` is about `1509` lines
- `src/components/ui/TaskSetupModal.tsx` is about `1027` lines
- `src/App.tsx` is about `756` lines

Why this matters:

- this is the clearest maintainability constraint in the codebase
- these files each hold multiple responsibilities: orchestration, selection logic, UI composition, persistence calls, derived-state assembly, and cross-surface handoff behavior
- the project is still workable today, but further feature work will get steadily more expensive and riskier unless these seams are broken apart

Recommendation:

- make file decomposition a first-class cleanup stream
- prioritize `caseStore`, `WorkspaceBoard`, and `TimelineView`
- extract selectors, action modules, and feature-specific hooks before doing broad semantic renames

### P3. ID generation is not yet uniform

Evidence:

- `src/utils/id.ts:6`
- `src/App.tsx:364`
- `src/store/caseStore.ts:1185`
- `src/store/caseStore.ts:1239`
- `src/services/db/repositories/CaseRepository.ts:371`
- `src/services/db/repositories/CaseRepository.ts:385`

What is happening:

- some code uses `createLocalId(...)`
- other paths still hand-roll IDs with `Date.now()` plus `Math.random()` and older `substr(...)`/`substring(...)` patterns

Why this matters:

- this is mostly a uniformity and auditability issue, not an acute bug
- but it makes generated-record behavior less predictable and creates unnecessary style drift across the codebase

Recommendation:

- standardize on `createLocalId(...)` for app-generated identifiers
- remove ad hoc string-building once surrounding persistence code is touched

## Structural Themes

### Canonization Status

The product model is substantially canonical at the runtime surface:

- workspace-oriented terminology is real in the UI/runtime
- provider routing is centralized
- timeline, chat, and board workflows are first-class

What remains transitional is mostly:

- persistence-edge naming (`cases`, `reports`, `tasks`, `leads`)
- compatibility reconstruction (`agendas`, `leads`, `followUps`)
- localStorage-era helper carryover
- duplicated or mirrored state naming inside the store

### Cleanliness Status

Positive signs:

- no obvious `TODO` / `FIXME` sprawl in active `src/`
- test coverage is materially better than many similarly-sized frontends
- docs are detailed and architecture-aware

Current cleanliness drag:

- giant orchestration files
- mixed ID-generation conventions
- stale status docs
- direct storage access that bypasses the cleaner repository/settings boundary

### Safety Status

Strong:

- full typecheck passes
- full test suite passes
- provider routing and DB access are centralized

Needs improvement:

- incomplete capability gating
- non-atomic multi-table artifact writes
- destructive workspace cleanup path with duplicated selection state

## Recommended Cleanup Sequence

1. Fix the current lint break and refresh active validation docs.
2. Repair the `activeWorkspaceRunId` / `activeTaskId` duplication and add purge/delete regression tests.
3. Finish provider capability enforcement so router behavior matches the stated architecture.
4. Introduce atomic multi-table artifact persistence.
5. Centralize remaining feature-level localStorage usage behind one typed boundary.
6. Break up `caseStore`, `WorkspaceBoard`, and `TimelineView` into smaller units.
7. Standardize ID creation and continue trimming compatibility-first naming where it no longer earns its keep.

## Suggested Workstreams

### Workstream A: Safety and correctness

- capability enforcement
- atomic artifact writes
- workspace purge/delete regression coverage

### Workstream B: Canon and persistence cleanup

- storage boundary cleanup
- settings/localStorage consolidation
- compatibility naming review at the persistence edge

### Workstream C: Maintainability decomposition

- split store actions/selectors
- split workspace board controller logic from presentation
- split timeline derivation/filtering/panels into submodules

## Bottom Line

Sherlock is already a capable local-first platform, not a fragile prototype. The next high-value move is not a broad rewrite. It is a disciplined cleanup pass that tightens enforcement, removes a few transition-era inconsistencies, and decomposes the biggest orchestration files so future work lands into a cleaner canon instead of deepening the current monoliths.
