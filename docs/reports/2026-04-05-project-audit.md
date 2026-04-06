# Sherlock Project Audit

Date: 2026-04-05
Repository: `C:\Users\james\projects\sherlock`

## Scope and Method

This audit focused on active code under `src/`, active documentation under `README.md` and `docs/operations/*`, and the architecture anchors called out in `AGENTS.md`.

I reviewed:

- route shell and launch orchestration
- Zustand store shape and action layers
- provider runtime/router paths
- SQLite repository and persistence paths
- Timeline, Chat, Settings, Workspace Board, and Network Graph feature surfaces
- repo structure, file-size hotspots, explicit markers such as TODO/FIXME/HACK, and current validation status

## Validation Snapshot

Commands run on 2026-04-05:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`

Result:

- lint passed
- typecheck passed
- build passed
- full Vitest suite passed: 40 files, 135 tests

Notable validation warnings:

- production build emitted chunk-size warnings
- current build produced app chunks above 500 kB after minification, including a main app chunk at 559.96 kB and a `vendor-tldraw-app` chunk at 521.79 kB
- test runs emit React Router future-flag warnings for the upcoming v7 behavior changes

## Executive Summary

The project is in better shape than many repos at this stage. Baseline validation is green, active code does not show broad TODO/FIXME sprawl, docs for architecture and persistence are relatively current, and there is real test coverage around routing, providers, persistence, chat, timeline, and board-agent plumbing.

The main risks are not basic code rot. They are:

1. a real board autosave data-loss edge case
2. an async launch/navigation race in the run pipeline
3. browser-side secret handling that is acceptable only if the current security posture is intentional
4. heavy route and state composition that is already showing up as bundle-size and maintainability pressure
5. brittle persistence deserialization in parts of the repository layer

## Confirmed Findings

### 1. P1: Workspace Board autosave can lose the most recent edits

Evidence:

- `src/components/features/WorkspaceBoard/index.tsx:322-336` debounces document persistence with `setTimeout(..., 550)`
- `src/components/features/WorkspaceBoard/index.tsx:379-384` clears the pending timeout on editor cleanup without flushing
- `src/components/features/WorkspaceBoard/index.tsx:303-309` also clears the timeout on component unmount
- `src/store/actions/workspaceActions.ts:301-312` persists board documents only when `saveWorkspaceBoardDocument(...)` is actually called

Why this is risky:

- if the user edits a board and quickly navigates away, switches boards, closes the tab, or unmounts the editor before the 550 ms timer fires, the last changes are dropped
- the debounced callback also awaits persistence without local error handling, so IndexedDB/SQLite write failures can become silent or unstructured runtime failures

Recommendation:

- flush pending board saves on unmount, board switch, and route exit
- wrap debounced save failures in explicit error handling and user feedback
- add a focused test for "edit -> navigate away before debounce expires"

### 2. P1: Run launch flow races async task persistence against route navigation

Evidence:

- `src/app/useAppShellController.ts:427-437` calls `addTask(newTask)` and immediately navigates to `/runs/:id` plus starts execution
- `src/store/actions/artifactRunActions.ts:46-52` shows `addTask` is async and does not update store state until after `TaskRepository.create(...)` resolves
- `src/app/routeViews.tsx:210-219` redirects away from the run route when the task is not found
- `src/app/useAppShellController.ts:320-333` also calls async `completeTask(...)` and `failTask(...)` without awaiting either one

Why this is risky:

- on slower storage or transient DB latency, the run-detail route can render before the task exists in store and redirect the user away from the active run
- unawaited `addTask`, `completeTask`, and `failTask` can hide persistence failures or create inconsistent UI/DB timing

Recommendation:

- await task creation before routing to `/runs/:id`, or optimistically insert into store before the DB write
- await or explicitly manage `completeTask` / `failTask` promises
- add a route-level regression test covering delayed task persistence

### 3. P1/P2: Provider API secrets are stored and resolved entirely on the client

Evidence:

- `src/services/providers/keys.ts:39-54` reads provider keys from `import.meta.env` / `process.env`
- `src/services/providers/keys.ts:57-85` resolves keys from browser storage or env
- `src/services/providers/keys.ts:131-167` persists keys directly to `localStorage`
- `docs/operations/DATA_PERSISTENCE.md` explicitly lists provider keys among values still kept in browser storage

Why this is risky:

- this means provider credentials are exposed to any same-origin script, browser extension, XSS payload, or user with local machine/browser access
- `VITE_*` support is especially easy to misuse because it bakes secrets into the client bundle at build time

Important nuance:

- this is an architectural tradeoff, not a hidden implementation bug; the current runtime is intentionally browser-local and BYOK
- it is still a serious security constraint if the app is hosted or expected to handle sensitive investigations

Recommendation:

- decide explicitly whether Sherlock is a local-first BYOK tool or a hosted multi-user product
- if hosted or security-sensitive, move provider calls server-side and stop accepting client-bundled secrets
- at minimum, document the exposure model more prominently in setup and deployment docs

### 4. P2: Route-level code splitting is incomplete and the main app bundle is still heavy

Evidence:

- `src/app/AppShellRoutes.tsx:17-26` lazy-loads `Archives`, `LiveMonitor`, `Settings`, and `Feed`
- `src/app/routeViews.tsx:5-9` eagerly imports `OperationView`, `Chat`, `NetworkGraph`, `TimelineView`, and `WorkspaceBoard`
- current build emitted >500 kB chunk warnings

Why this is risky:

- the shell still pulls several large workspace surfaces into the primary routed path
- `WorkspaceBoard` in particular brings the tldraw-heavy surface into the app shell path instead of isolating it behind a route split
- the result is already visible in build warnings and will get harder to recover from as features grow

Recommendation:

- lazy-load the heavy workspace surfaces in `routeViews.tsx` or split them one layer earlier in the route tree
- treat the board/tldraw surface as a first-class code-splitting boundary
- add a bundle budget so this stops regressing silently

### 5. P2: Persistence deserialization is brittle in several repositories

Evidence:

- `src/services/db/repositories/CaseRepository.ts:271-318` uses raw `JSON.parse(...)` repeatedly for persisted fields
- `src/services/db/repositories/CaseRepository.ts:344` and `:362` parse `configJson` directly
- `src/services/db/repositories/WorkspaceBoardRepository.ts:14` and `:23` parse board metadata and snapshots directly
- `src/store/actions/bootstrapActions.ts:61-274` wraps initialization in one top-level try/catch and falls back to a generic "Failed to load data" error on any exception

Why this is risky:

- one malformed imported payload, corrupt local row, or legacy record mismatch can take down full app initialization instead of degrading one feature surface
- some repositories already use safer helper parsing (`ChatRepository`, `BoardAgentRepository`), so the current robustness level is inconsistent

Recommendation:

- centralize tolerant JSON parsing for repository hydration
- quarantine bad rows where possible instead of failing the whole bootstrap
- surface which record failed so recovery is debuggable

### 6. P3: Several important user flows still rely on native `prompt` / `confirm`

Evidence:

- `src/components/features/Chat/ChatPage.tsx:415-423`, `:572-600`
- `src/components/features/WorkspaceBoard/index.tsx:397-400`, `:789`
- `src/components/features/NetworkGraph/index.tsx:453-459`

Why this is risky:

- these flows are harder to style, harder to validate, harder to test, and inconsistent with the rest of the app shell
- the chat append/follow-up flows in particular feel like temporary scaffolding inside an otherwise custom product surface

Recommendation:

- replace native dialogs with shared modal/confirm components
- capture validation, default values, and destructive-action copy in reusable UI instead of browser primitives

## Structural Observations

These are not necessarily broken today, but they are the clearest maintainability pressure points.

### A. The global store is too broad

Evidence:

- `src/store/caseStore.ts:104-297` defines a very wide `WorkspaceState` covering persistence, routing context, chat, board state, graph state, themes, feed config, and UI toggles
- `src/store/caseStore.ts:299-368` composes many action families into one global store
- `src/store/actions/bootstrapActions.ts:61-270` eagerly hydrates most persisted domains at startup

Effect:

- broad invalidation surface
- harder reasoning about ownership and lifecycle
- more temptation to reach into `useWorkspaceStore.getState()` from unrelated layers

### B. Several feature files are clearly oversized

Largest active application files observed during this audit:

- `src/components/features/Settings/index.tsx` - 1613 lines
- `src/components/features/WorkspaceBoard/index.tsx` - 1561 lines
- `src/components/features/Chat/ChatPage.tsx` - 1452 lines
- `src/components/features/TimelineView.tsx` - 1269 lines
- `src/services/workspace/agent/actions/registry.ts` - 875 lines
- `src/store/caseStore.ts` - 368 lines plus large action modules behind it

Effect:

- logic, state wiring, and UI composition are competing in the same files
- review and regression detection get harder as each surface grows

### C. Runtime-config UI is duplicated across multiple flows

Evidence:

- `src/components/features/Settings/index.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Runs/useTaskSetupState.ts`
- `src/components/features/Runs/TaskSetupModal.tsx`

Shared concerns repeated across those files include provider/model selection, search depth, generation mode, thinking budget, and OpenRouter model browsing.

Effect:

- behavior drift risk
- repeated bug fixes
- higher cost to add or change model capability rules

### D. Focused tests are good in some seams but thin in the heaviest screens

Positive:

- routing helpers, provider routing, persistence repos, timeline utilities, and chat runtime have meaningful tests

Gaps I observed:

- no direct route test for the run-detail loading/race path
- no focused component test for `Settings`
- no focused component test for `WorkspaceBoard` autosave behavior

### E. Documentation is cleaner than before, but still somewhat scattered

Current docs are separated into active vs legacy content, which is good. The tradeoff is that there is still a lot of report/plan history in `docs/_legacy/*`, including multiple same-day audits and implementation plans. That is not breaking the product, but it does raise the cost of figuring out what is canonical at a glance.

## Things I Did Not Find

Worth calling out explicitly:

- no active-code TODO/FIXME/HACK sprawl in `src/`
- no current lint or typecheck failures
- no obvious divergence between the high-level persistence docs and the current SQLite-backed implementation
- no immediate evidence of a second hidden persistence path beyond the documented SQLite plus limited localStorage helpers

## Recommended Next Steps

### Immediate

1. Fix the Workspace Board autosave flush bug and add a regression test.
2. Fix the run-launch async race and add a route-level delayed-persistence test.
3. Decide whether browser-side provider secrets are an intentional permanent constraint or a temporary architecture choice.

### Short Term

1. Lazy-load the heavy workspace surfaces now that bundle warnings are already firing.
2. Introduce safe repository JSON parsing everywhere persisted JSON is hydrated.
3. Replace native browser dialogs in chat/board/graph with shared in-app modal primitives.

### Medium Term

1. Split the largest feature files into view-model/hooks/panel subcomponents.
2. Extract shared runtime-config controls so Settings, templates, guided runs, and manual setup stop drifting.
3. Consider narrowing Zustand subscriptions with selectors and moving more route-specific state out of the global store.

## Overall Assessment

Sherlock does not currently look abandoned or sloppily unfinished. It looks like a project that has moved quickly, shipped meaningful architecture, and reached the point where a few timing, persistence, and scale-shape issues need intentional cleanup before the next wave of features.

The most important thing is that the highest-risk items are fixable and well-bounded. I would prioritize the two runtime correctness issues first, then address the client-secret posture and route/code-splitting debt before feature expansion makes them more expensive.
