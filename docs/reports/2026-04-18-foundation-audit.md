# 2026-04-18 Foundation Audit

## Scope

This audit focused on the active application under `src/`, the active docs under `README.md` and `docs/operations/*`, and the current docs/report structure in `docs/`.

Method used:

- read-only repo inspection
- architecture-anchor review (`AppShell`, store, runtime/provider router, Timeline, theme, DB)
- hotspot scan by file size
- docs/path consistency review
- legacy/canonical naming review

Validation note:

- No local `npm`/Vite/Vitest commands were run from WSL. `AGENTS.md` explicitly forbids running local repo Node toolchain commands against this Windows-mounted checkout from WSL.

## Executive Summary

Sherlock is in a much better place than a raw “cleanup emergency” repo. The canonical `Workspace -> Artifact -> WorkspaceRun` direction is real in the runtime, the app shell has been thinned, the store is composed from action slices, and several newer features already follow controller/view-model extraction patterns.

The main risk is not “total architectural chaos.” It is drift:

1. active documentation and active filesystem reality are no longer aligned
2. a few large feature/persistence modules are still carrying too many responsibilities
3. Operation View still leaks a legacy `case/report` mental model internally
4. the theme workbench appears to have at least one concrete state-shape bug in the current background updater

If the goal is “canon, organized, safe and sound,” the next step should be a cleanup tranche centered on docs canon, naming canon, and hotspot decomposition before more major feature expansion.

## What Looks Healthy

- `src/App.tsx` is now a thin export into the route-backed shell, which is a good sign that shell responsibilities have been pushed down into dedicated modules.
- `src/store/workspaceStore.ts` is no longer an all-in-one mutation file; it mainly composes `bootstrap`, `simple`, `conversation`, `artifact run`, and `workspace` action slices.
- `src/services/runtime.ts` is a clean barrel over `src/services/runtime/*`, which is the right stability boundary for the provider router.
- Timeline is in comparatively good shape for a complex feature: `TimelineView.tsx` stays presentational while `useTimelineViewController.ts` and `timelineViewModel.ts` carry the logic.
- Legacy compatibility is not everywhere. A lot of it is intentionally bounded in reasonable places such as theme storage/bootstrap, backup normalization, and repository hydration.

## Priority Findings

### 1. Active docs are not canon-stable right now

Evidence:

- `README.md:5` says this repo contains a standalone `canon-design/` app, but that directory is not present in the current checkout.
- `docs/operations/ARCHITECTURE.md:8-9` repeats the same `canon-design/` claim even though the directory is absent.
- `README.md:184-186` points to active files under `docs/plans/*` and `docs/reports/*`.
- `docs/plans/` currently has `0` files.
- `docs/reports/` currently has `0` files before this audit.
- Meanwhile `docs/_legacy/` contains `44` files totaling about `20,154` lines, with `23` reports and `21` plans.

Why this matters:

- The repo’s stated “active truth” is not the same as the repo’s actual active content.
- New contributors will follow dead links and stale structure before they reach the real source of truth.
- It becomes too easy for architectural claims to survive after the corresponding code or extracted package is gone.

Recommendation:

- Treat this as the highest-priority cleanup track.
- Update `README.md` and `docs/operations/ARCHITECTURE.md` so they only describe directories and files that actually exist.
- Decide what belongs in active `docs/plans` and `docs/reports`; either populate them with current canon artifacts or remove active references until they exist.
- Add a short active docs index that explicitly says:
  - what is current truth
  - what is historical only
  - which dated reports still matter operationally

### 2. The theme workbench appears to write malformed background state

Evidence:

- `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx:192-214`

Observed issue:

- `updateBackgroundField()` correctly writes `hue/lightness/chroma/opacity` under `background[activeMode]`.
- But for `dotColor`, `gridSize`, `dotOpacity`, `glowOpacity`, and `scanlineOpacity`, it spreads those properties directly onto `background`, not onto `background[activeMode]`.

Why this matters:

- Those controls likely do not persist to the actual active mode background object.
- Even if the UI appears to move, the saved theme state shape is at risk of drift or silent no-op behavior.
- This is exactly the kind of bug that makes a “foundation cleanup” feel shaky even when the architecture looks good on paper.

Recommendation:

- Fix this before more theme/workbench expansion.
- Add focused tests for all background sliders, not just theme workspace persistence generally.
- Verify export JSON/CSS from the workbench after the fix.

### 3. Operation View still leaks the legacy `case/report` system internally

Evidence:

- `src/components/features/OperationView/useOperationViewController.ts:53-97`
- `src/components/features/OperationView/Toolbar.tsx:44-56`

Examples:

- `caseInfo`, `allCases`, `selectedCaseId`, `activeCase`, `isNewCaseModalOpen`
- `report`, `reportOverride`, `allCaseReports`
- `onStartNewCase` next to UI copy that already says “workspace”

Why this matters:

- The app’s canonical runtime model is now `Workspace`/`Artifact`, but one of the main deep-work surfaces still thinks in `Case`/`Report` internally.
- That mismatch creates friction every time someone updates routes, labels, docs, tests, or shared utilities.
- It also makes it harder to know whether a term is deliberately legacy-compatible or just leftover vocabulary debt.

Recommendation:

- Run a bounded internal rename pass on Operation View and its route wiring.
- Rename internal variables and props to `workspace`, `artifact`, `newWorkspace`, etc. while preserving user-facing pack/purpose copy where intended.
- Keep compatibility logic only where data migration/import truly needs it.

### 4. Several critical files are still too large for safe change velocity

Hotspots:

| File | Lines | Concern |
| --- | ---: | --- |
| `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx` | 1281 | UI, local state, mutation logic, export tools all in one place |
| `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts` | 1059 | board orchestration, AI, upload flows, panel state, navigation, persistence handoffs |
| `src/services/db/repositories/WorkspaceRepository.ts` | 1037 | CRUD, hydration, normalization, legacy translation, persistence packing |
| `src/services/workspace/agent/actions/registry.ts` | 946 | many action handlers centralized in one executor |
| `src/types/index.ts` | 937 | shared-contract gravity well |

Why this matters:

- These are all high-change zones.
- Large files are not automatically wrong, but at this size they become harder to review, harder to regression-test mentally, and more likely to accrete unrelated fixes.
- The repo’s newer patterns are better than these hotspots, which means the architecture standard is already ahead of the worst files.

Recommendation:

- Decompose by responsibility, not by arbitrary size.
- Good first cuts:
  - split theme workbench by tab/section
  - split board controller into board session orchestration, board agent flow, and panel/dialog state
  - split `WorkspaceRepository` into workspace DAO, artifact mapper/hydrator, and backup/import coordination
  - split board-agent registry by action family
  - start peeling domain-specific contracts out of `src/types/index.ts`

### 5. `WorkspaceRepository` is carrying too much canonical-plus-legacy translation in one class

Evidence:

- `src/services/db/repositories/WorkspaceRepository.ts:420-535`
- `src/services/db/repositories/WorkspaceRepository.ts:540-585`

Observed pattern:

- One repository is handling:
  - raw row parsing
  - section hydration
  - evidence hydration
  - canonical key findings and follow-up backfill
  - legacy `agendas`/`leads` reconstruction
  - artifact object assembly
  - artifact persistence packing

Why this matters:

- This is currently the most important persistence boundary in the app.
- It is doing valuable work, but too much of it is coupled together.
- Any migration or artifact contract change now touches one oversized file with a broad blast radius.

Recommendation:

- Keep the repository boundary, but extract the mapping layers around it.
- Target seams such as:
  - `artifactRowToDomain.ts`
  - `artifactDomainToPersistence.ts`
  - `legacyArtifactCompatibility.ts`

This would preserve behavior while making later canon cleanups much safer.

## Secondary Findings

### 6. The board and board-agent layers have good ambition, but their coordination surface is still heavy

Evidence:

- `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts:1-140`
- `src/services/workspace/agent/actions/registry.ts:1-120`

Observation:

- The board surface now combines a lot of valuable functionality: library placement, uploads, agent review, action execution, navigation, persistence, board session control.
- The problem is not capability; it is concentration.

Recommendation:

- Keep the feature, reduce the center of gravity.
- Move toward:
  - one controller for route/page orchestration
  - one board-agent session runner
  - one board-agent review state module
  - one placement/import orchestration module

### 7. Active reports/plans were effectively missing before this audit

Observation:

- The repo already expects active dated artifacts in `docs/reports`, but the directory was empty before this file.
- That is a process smell: the code and README already assume a current-report pipeline that the filesystem was not actually honoring.

Recommendation:

- Keep writing active audits here.
- Consider a tiny `docs/reports/README.md` and `docs/plans/README.md` explaining what belongs in active vs `_legacy`.

## Canon Readiness Assessment

Current status: promising, but not yet “foundations fully cleaned.”

Reasons:

- The runtime architecture is meaningfully more canonical than the docs/process layer.
- Legacy compatibility is more bounded than it used to be, which is good.
- The biggest remaining debt is concentrated and therefore fixable.
- The repo is ready for a cleanup tranche, not yet for “ignore foundations and build freely.”

## Recommended Cleanup Sequence

### Phase 1: Docs Canon

- remove or correct references to missing `canon-design/`
- fix dead links in `README.md`
- establish active `docs/plans` and `docs/reports` usage
- add one short “current truth” doc index

### Phase 2: Correctness Pass

- fix theme workbench background update behavior
- add focused tests around theme background persistence/export
- sanity-check other workbench state updaters for the same pattern

### Phase 3: Naming Canon

- normalize Operation View internals from `case/report` to `workspace/artifact`
- update adjacent tests and route props
- document any intentionally retained legacy vocabulary boundaries

### Phase 4: Hotspot Decomposition

- split `WorkspaceRepository`
- split board controller
- split board-agent action registry
- start extracting `src/types/index.ts`

## Suggested Definition Of Done For The Cleanup Tranche

- active docs describe only present directories and current behavior
- `docs/reports` and `docs/plans` contain real active artifacts, not empty placeholders
- no concrete UI state bugs remain in theme workbench mutation paths
- Operation View internals use canonical workspace/artifact naming
- the worst hotspot files each lose at least one major responsibility seam
- README and architecture docs can be trusted as present-tense truth again

