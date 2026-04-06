# Codebase Audit v2

Date: April 5, 2026

## Scope

This audit reviews Sherlock after the April 5 refactor that began from:

- `docs/reports/2026-04-05-codebase-audit.md`
- `docs/plans/2026-04-05-canon-cleanup-and-systems-plan.md`

Primary attention again went to the active architecture anchors and the refactor's promised outcomes:

- route-backed navigation and shell cutover
- store decomposition
- canonical workspace/artifact/runtime language
- persistence integrity and storage boundaries
- documentation parity

## Validation Snapshot

Validated on this checkout during this audit pass:

- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run test`: passes (`35` files, `123` tests)
- `npm run build`: passes

Validation notes:

- Vitest emits React Router v7 future-flag warnings in several route-aware component tests
- provider-router tests emit expected `[provider-router]` debug logs during contract coverage
- Vite still emits a large-chunk warning for `vendor-tldraw-app`

## Overall Assessment

This refactor landed successfully in the areas that mattered most structurally.

Compared with the first audit:

- `src/App.tsx` is now a thin export over the route-backed shell
- route definitions, route wrappers, and shell composition are real runtime code, not planning scaffolding
- `src/store/caseStore.ts` has been reduced to a much smaller contract/composition layer with grouped action modules
- artifact persistence is now transaction-backed through `runWriteTransaction(...)`
- the `purgeWorkspace` active-task bug was fixed and regression-tested
- feature-level browser storage has been centralized behind the typed helper boundary

The codebase now reads much more like a real route-backed local-first application than a transitional SPA shell.

The main remaining gap is that the route contract is not yet fully enforced at runtime. The new architecture exists, but a few workspace surfaces still let store state outrun URL state, which weakens deep linking and direct-entry guarantees. There is also some active-doc drift left behind after the refactor.

## Priority Findings

### P1. URL-backed route identity is still only partially enforced on workspace surfaces

Evidence:

- `docs/operations/ARCHITECTURE.md:60`
- `docs/operations/ARCHITECTURE.md:65`
- `docs/operations/ARCHITECTURE.md:69`
- `src/app/routes.ts:160`
- `src/app/routes.ts:162`
- `src/components/features/TimelineView.tsx:99`
- `src/components/features/TimelineView.tsx:100`
- `src/components/features/TimelineView.tsx:101`
- `src/components/features/TimelineView.tsx:102`
- `src/components/features/TimelineView.tsx:178`
- `src/components/features/WorkspaceBoard/index.tsx:1387`
- `src/components/features/WorkspaceBoard/index.tsx:1390`
- `src/app/routes.ts:119`
- `src/app/routes.ts:142`
- `src/app/routeViews.tsx:262`
- `src/app/routeViews.tsx:266`
- `src/app/routeViews.tsx:286`
- `src/app/routeViews.tsx:290`

What is happening:

- active docs and route metadata say Timeline search/filter/focus state is URL-owned
- `TimelineView` still keeps `search`, `filters`, `focusedTrack`, and `focusedRefId` entirely in local component state
- the board selector changes only store state and does not navigate to the board-document route
- the chat and board landing route wrappers only set deep-linked ids when present; they do not clear them when the URL drops back to the landing route

Why this matters:

- the refactor's most important architectural promise was durable URL-backed location
- today, the URL can still disagree with the visible Timeline or active board/session selection
- that weakens bookmarkability, back/forward behavior, shareable links, and direct-entry confidence on the most route-sensitive surfaces

Recommendation:

- wire Timeline query state to `useSearchParams`
- make board selection navigate to `/workspaces/:workspaceId/board/:boardId` when a specific board is selected
- make bare landing routes explicitly clear deep-linked session/board selection or redirect to a canonical route
- add route-behavior tests for Timeline query params, board selection, and landing-route reset behavior

### P2. Active documentation still points to a missing current-status document

Evidence:

- `README.md:141`
- `docs/reports/README.md:8`
- `docs/reports/README.md:9`
- `docs/plans/README.md:8`
- `docs/plans/README.md:9`
- `docs/operations/CONTRIBUTING.md:57`
- `docs/operations/CONTRIBUTING.md:58`
- `docs/operations/CONTRIBUTING.md:59`

What is happening:

- several active docs still direct readers to `docs/reports/CURRENT_STATUS.md`
- that file is no longer present in the active `docs/reports/` directory on this checkout
- some references also use `docs/operations/architecture.md` while the active file is `docs/operations/ARCHITECTURE.md`

Why this matters:

- the repo now has much better architecture docs, but the doc index still sends readers to a retired or missing checkpoint
- this creates confusion right at the onboarding and contribution layer

Recommendation:

- either restore a real current-status document or remove all active references to it
- standardize active doc links on the actual file casing used in the repo
- keep `README.md`, plan indexes, and contributing guidance aligned on one current doc set

### P2. Decomposition improved substantially, but the largest feature roots are still the next maintenance bottleneck

Evidence from this audit pass:

- `src/App.tsx`: `1` line
- `src/store/caseStore.ts`: `375` lines
- `src/app/useAppShellController.ts`: `690` lines
- `src/components/features/WorkspaceBoard/index.tsx`: `1724` lines
- `src/components/features/TimelineView.tsx`: `1421` lines
- `src/components/features/Runs/TaskSetupModal.tsx`: `1020` lines

Why this matters:

- the shell and store are in much better shape than before
- the next extension cost has shifted into feature-root controllers and large surface components rather than the old app shell
- `WorkspaceBoard`, `TimelineView`, and `TaskSetupModal` still each combine page orchestration, selection logic, UI composition, and action wiring in one place

Recommendation:

- keep the next cleanup pass focused on feature-root decomposition rather than another broad architecture rewrite
- prioritize `WorkspaceBoard`, `TimelineView`, and `TaskSetupModal`
- split page/controller logic, route-state adapters, derived selectors, and presentational sections before adding more major feature scope

## Prior Audit Status

The highest-priority issues from the first audit are mostly resolved:

- provider capability enforcement is no longer TTS-only; router tests now cover runtime-disabled chat and provider-disabled live-intel cases
- the `purgeWorkspace` active-task preservation bug is fixed and regression-tested
- artifact persistence now uses shared transaction-backed writes
- feature-local monitor autosave handling now flows through the typed browser-storage helper instead of direct `localStorage` calls
- `src/App.tsx` and `src/store/caseStore.ts` were both meaningfully decomposed

## Suggested Next Sequence

1. Finish the route contract: Timeline search params, board route syncing, and landing-route reset/canonicalization.
2. Clean the active doc index so onboarding and contributor guidance point at real current files.
3. Decompose the remaining large feature roots while the new route/shell boundaries are fresh and stable.
