# Canonical Cleanup Roadmap Audit

Date: April 8, 2026

Subject: Audit of `docs/plans/10-canonical-cleanup-roadmap.md`

## Verdict

The roadmap implementation is substantial and directionally strong, but it is not fully complete against its own stated completion standard.

The biggest gap is not runtime breakage. The app currently looks structurally healthier than before and the core static/build checks pass. The gap is canonical closure: active code, import/export contracts, and active docs still preserve meaningful `case` / `report` / `task` / `headline` / `archive` terminology and compatibility pathways that the roadmap explicitly said would be removed rather than retained.

Recommended status change:

- change the roadmap from `Completed` to `Substantially Landed / Follow-up Required`, or
- create a short closeout plan specifically for final canonical naming and legacy-bridge removal

## Audit Scope

Reviewed:

- `docs/plans/10-canonical-cleanup-roadmap.md`
- active `src/` seams called out by the roadmap, especially store, db, maintenance/import-export, runtime, and routed feature surfaces
- `README.md`
- active `docs/operations/*` files most directly affected by the roadmap

Validation run during this audit:

- `npm run lint` -> pass
- `npm run typecheck` -> pass
- `npm run build` -> pass, with the already-known large chunk warning for `vendor-tldraw-app`

Not run during this audit:

- full `npm run test`
- exhaustive stream-by-stream targeted test replay

## Executive Summary

What looks genuinely landed:

- app-shell and route extraction work is present (`src/app/useAppShellLaunch.ts`, `src/app/useAppShellNavigation.ts`, `src/app/routeViewHelpers.ts`)
- provider/runtime extraction work is present (`src/config/aiModels/*`, `src/services/providers/routerContext.ts`, `src/services/providers/shared/directTransport.ts`, `src/services/runtime/providerOperations.ts`, `src/services/runtime/providerKeys.ts`)
- shared runtime-config extraction is present (`src/components/features/Runs/runtimeConfigState.ts` and related consumers)
- the codebase passes lint, typecheck, and build on this checkout

What is still materially incomplete:

- active persistence/import/export still accepts and emits legacy payload shapes
- active schema/type/repository code still exposes legacy nouns in canonical seams
- active docs still describe compatibility-era vocabulary as current runtime truth
- the roadmap's `Completed` status overstates the actual end state

Directional residue counts from active `src/`, active docs, and `README.md` with tests excluded:

- `case`: 252
- `report`: 479
- `task`: 71
- `archive`: 6
- `lead`: 24
- `headline`: 92

These counts are only directional, not all bugs. Some are legitimate domain copy, enum members, or intentionally bounded compatibility seams. Even so, the volume is too high for a roadmap whose own success condition says active `src/` should no longer use those nouns for canonical primitives.

## Findings

### 1. The roadmap is marked complete even though its own closure rules are still violated

Severity: High

The roadmap says completion requires:

- active `src/` to stop using legacy `case/report/archive/lead/task` naming for canonical primitives
- active persistence to stop depending on legacy import/migration bridges
- active docs to reflect the final canonical codebase

That standard is not met today.

Evidence:

- `src/services/maintenance/workspaceData.ts:22-27,189-245` still accepts legacy backup keys such as `cases`, `archives`, `tasks`, `headlines`, and workspace-export keys `case` + `reports`
- `src/utils/exportUtils.ts:92-121,398-437` still exports `case` / `reports` / `report` payload shapes through active utilities
- `src/services/db/schema.ts:14,35,77,95,117,127,132,146` still uses canonical table names with legacy schema comments and field aliases like `reportId`
- `docs/operations/BROAD_SCOPE.md:20,42` still describes `case/report/headline` lifecycle and `Case Files`
- `README.md:113,119` still treats workspace-export JSON with legacy keys as a first-class documented path

Conclusion:

The implementation is not failed, but the roadmap should not currently be treated as fully closed.

### 2. Active persistence still preserves legacy bridges instead of containing or removing them

Severity: High

This is the strongest mismatch against Streams 1 and 2.

The roadmap repeatedly says legacy preservation should not be the steady-state model. In practice, active persistence still carries legacy bridges in both restore and export paths.

Evidence:

- `src/services/maintenance/workspaceData.ts:22-27` defines `LegacyWorkspaceDataBackup`
- `src/services/maintenance/workspaceData.ts:192-245` normalizes `cases`, `archives`, `tasks`, `headlines`, and `case` / `reports`
- `src/services/maintenance/workspaceData.ts:103-111` still builds graph reference ids with `case-...`
- `src/utils/exportUtils.ts:92-105` exports workspace JSON with top-level `case` and `reports`
- `docs/operations/DATA_PERSISTENCE.md:278,294` documents old restore/export shapes as active supported behavior
- `README.md:113,119` repeats the same compatibility story for demo seeding

Why this matters:

- the canonical backup boundary is still blurry
- import/export is carrying legacy debt into future releases
- docs now describe the bridge as normal behavior, which makes removal harder later

Suggested fix:

- pick one final policy:
  - either remove legacy import/export acceptance entirely
  - or isolate it behind a clearly named legacy-only adapter module and stop documenting it as the normal path

### 3. Canonical naming did not fully converge in active code

Severity: High

The codebase is much better than before, but the canonical cutover stopped halfway in several core seams.

Evidence in active code:

- `src/services/db/schema.ts:14,35,132,146` still labels sections as `CASES`, `REPORTS`, `LEADS`, `TASKS`
- `src/services/db/schema.ts:77,95,117,127` still exposes `reportId` properties even though the column is `artifact_id`
- `src/services/db/repositories/WorkspaceRepository.ts:155,189,238,764,827,884,888` still uses helpers and comments like `mapCaseRow`, `CASES`, `REPORTS`, `importCasesAndReports`, `LEADS`, `getHeadlines`, `createHeadline`
- `src/services/db/repositories/WorkspaceRunRepository.ts:7,24,50` still uses `mapTaskRow`, `task config`, and `task row`
- `src/types/index.ts:158-159,202,767-778` still exposes `Headline`, `LeadStatus`, `ManualNode.type: 'CASE'`, `TASK SYSTEM`, and `WorkspaceRun.report`
- `src/components/ui/RunManager.tsx:14-37` and `src/components/ui/Sidebar.tsx:124-128` still ship an active `RunManager`/`Task Manager` seam using `activeTaskId` and `onSelectTask`
- `src/utils/exportUtils.ts:28-40,92-121,398-437` still centers active workspace/artifact export helpers around `caseObj`, `exportCaseAs*`, and `report`

Why this matters:

- developers still have to translate between canonical and legacy vocabulary inside core seams
- refactors remain riskier because terminology is split across tables, types, repos, exports, and UI
- the repository still reads like a cutover-in-progress rather than a finalized canonical model

### 4. Docs are not in final parity with the active canonical story

Severity: Medium

The roadmap promised docs closeout, but active docs still preserve or foreground pre-canonical language.

Strongest examples:

- `docs/operations/BROAD_SCOPE.md:10,20,42`
  - still says workspace organization is built on existing case structures
  - still frames the lifecycle as `case/report/headline`
  - still lists `Case Files (archive and export)`
- `README.md:37`
  - still describes Files as `workspace/archive browsing`
- `docs/operations/ARCHITECTURE.md:278,332-336,497,518,668`
  - accurately documents some compatibility seams, but the amount of compatibility-language left in the active architecture doc is a sign the cleanup is not truly closed
- `docs/operations/DATA_PERSISTENCE.md:130,152,278,294`
  - explicitly documents legacy compatibility as an active steady-state behavior

This is not just wording polish. It creates onboarding drift: the docs no longer cleanly answer "what is canonical now?" without also teaching the old model.

### 5. Some legacy seams are intentionally bounded and are lower risk

Severity: Low

Not every leftover legacy term is equally concerning.

Contained examples:

- `src/components/features/NetworkGraph/networkGraphNodeIds.ts:6-7` keeps `case-${reportId}` ids specifically to preserve existing hidden/flagged graph references
- `docs/operations/ARCHITECTURE.md:518` documents that graph-id compatibility boundary directly

This is acceptable if it stays boxed in and clearly documented. It is not the same problem as active import/export or active repo/type naming drift.

## Stream Assessment

### Stream 1. Canonical foundation cutover

Assessment: Partial, not fully closed

Why:

- major renames landed
- active canonical tables/files exist
- but core active seams still use `case`, `report`, `headline`, `task`, and `archive` terminology

### Stream 2. Persistence and bootstrap simplification

Assessment: Partial, not fully closed

Why:

- the old bootstrap path appears simplified and `initDB()` is the active entry point
- but restore/import/export still preserves legacy bridges in active code and active docs

### Stream 3. App shell, routes, store, and selector spine

Assessment: Mostly landed

Why:

- the extracted app-shell seams described in the roadmap are present
- no major contradictory evidence surfaced in this audit beyond residual vocabulary drift

### Stream 4. Search, Files, Timeline, and workspace-knowledge spine

Assessment: Mostly landed, with vocabulary residue

Why:

- the surface files and timeline/files structure described by the roadmap are present
- remaining issues are more about naming residue and export compatibility than missing feature extraction

### Stream 5. Workflow surfaces parity

Assessment: Mostly landed

Why:

- Chat, Board, Operation View, and related controller seams show the extractions claimed by the roadmap

### Stream 6. Provider, model catalog, and runtime subsystem extraction

Assessment: Mostly landed

Why:

- the extracted provider/runtime modules are present and the repo builds cleanly
- this stream looks materially implemented

### Stream 7. Settings, runtime-config unification, warning zero, and docs closeout

Assessment: Mixed

Why:

- runtime-config extraction appears landed
- core warnings did not block lint/typecheck/build in this audit
- docs closeout is not actually complete

## Bloat, Drift, And Legacy Fat

### Real bloat still present

- compatibility import/export logic in `workspaceData.ts`
- legacy-shaped export helpers in `exportUtils.ts`
- duplicated mixed vocabulary in schema comments, repository helpers, and public types
- compatibility aliases like `getHeadlines` / `createHeadline` and `importCasesAndReports`

### Drift patterns

- canonical database columns with legacy TypeScript property names (`artifact_id` surfaced as `reportId`)
- canonical feature surfaces with legacy UI/controller naming (`RunManager`, `activeTaskId`, `Task Manager`)
- active docs trying to describe both the new system and the old compatibility story at once

### Legacy fat that should probably move behind explicit boundaries

- old backup/import key acceptance
- workspace-export JSON compatibility
- legacy graph ids, but only if they remain fully isolated behind helpers

## Integrity Snapshot

Current health on this checkout:

- lint: pass
- typecheck: pass
- build: pass
- build warning: Vite large-chunk warning for `vendor-tldraw-app`

Interpretation:

- the codebase is operationally healthy
- the main risk is conceptual integrity and contract sprawl, not immediate breakage

## Recommended Follow-Up

### Priority 1

- reopen canonical cleanup closeout with a narrow final stream
- remove or quarantine legacy backup/import/export shapes
- stop exporting new workspace data as `case` / `reports`

### Priority 2

- finish active-code vocabulary cleanup in:
  - `src/services/db/schema.ts`
  - `src/services/db/repositories/WorkspaceRepository.ts`
  - `src/services/db/repositories/WorkspaceRunRepository.ts`
  - `src/types/index.ts`
  - `src/components/ui/RunManager.tsx`
  - `src/components/ui/Sidebar.tsx`
  - `src/utils/exportUtils.ts`

### Priority 3

- rewrite or trim stale active docs:
  - `README.md`
  - `docs/operations/BROAD_SCOPE.md`
  - `docs/operations/ARCHITECTURE.md`
  - `docs/operations/DATA_PERSISTENCE.md`

### Priority 4

- once the final cleanup lands, either:
  - update `docs/plans/10-canonical-cleanup-roadmap.md` to reflect the true final state
  - or archive it and replace it with a short closeout report that is honest about what remains intentionally preserved

## Bottom Line

This roadmap did real work and materially improved the codebase. It should not be treated as a failed effort.

But it also should not currently be treated as fully complete.

The implementation is best described as:

- structurally much cleaner
- operationally healthy
- still carrying meaningful canonical-cleanup debt in active contracts, active names, and active docs

That remaining debt is now concentrated enough that a short, deliberate closeout pass could finish it cleanly.
