# Post-Refactor Completion Plan

Date: April 5, 2026

Status: Complete on April 5, 2026.

This plan follows the landed route-aware refactor and the findings in `docs/_legacy/reports/2026-04-05-codebase-audit-v2.md`.

It is not a new architecture reset.

It is a completion plan for finishing the refactor correctly, fully, and in a logical order so the new route-backed architecture becomes operationally true rather than structurally half-finished.

## Intent

Sherlock has already crossed the hard boundary:

- the shell is route-backed
- the store is decomposed
- persistence integrity is materially better
- canonical workspace/artifact language is established

That means the next pass should not reopen the broad shape of the system.

Instead, this plan should:

- complete the still-partial route contract
- clean the active documentation layer so it reflects the real current repo
- remove the highest-value remaining transition debt
- decompose the biggest remaining feature roots behind the now-stable route boundaries

This plan intentionally includes both:

- the explicit findings from the new audit
- adjacent cleanup that is already implied by the current architecture and should be finished in the same pass rather than deferred into another transitional cycle

## Core Decisions

### 1. Route correctness comes first, but not alone

The most important remaining issue is still route/state correctness.

That is the first workstream because every later cleanup depends on the route contract being trustworthy.

But this plan is not route-only. It also carries the doc and feature cleanup needed to finish the pass coherently.

### 2. `CURRENT_STATUS` should be retired, not revived

The repo should stop treating `docs/reports/CURRENT_STATUS.md` as a living checkpoint document.

Recommended replacement posture:

- `README.md` for onboarding and high-level current state
- `docs/operations/*.md` for durable system truth
- dated reports and plans for bounded point-in-time work products

### 3. Work should be grouped into large logical workstreams

This pass should not be broken into tiny disconnected chores.

It should be organized into a few agentic-ready streams that each own a meaningful slice of system correctness and leave a clearly improved resting state.

### 4. Finish canon and cleanup in the architecture that now exists

Do not reopen shell-level architecture unless a remaining issue truly demands it.

The refactor should now pay off through:

- route enforcement
- documentation truth
- compatibility cleanup
- focused decomposition inside feature roots

## End State

At the end of this plan, Sherlock should read as a completed route-backed local-first workspace app rather than a freshly landed refactor with a few transitional seams still showing.

That means:

- URL state is the real durable source of truth for route-owned workspace surfaces
- route landing behavior is canonical and predictable
- Timeline filter/search/focus state is shareable and deep-linkable
- board and chat surface selection cannot silently drift away from the URL
- active docs no longer point at missing checkpoint files
- the active doc set is small, real, and internally consistent
- remaining transition debt around compatibility navigation state is reduced
- the largest feature roots have clearer page/controller/presentation seams
- validation and route-behavior coverage make regressions easier to catch

## Workstreams

## Workstream 1. Route Contract Completion

Purpose:

- make the route-backed architecture operationally true on workspace surfaces

Primary targets:

- `src/app/routeViews.tsx`
- `src/app/navigation.ts`
- `src/app/routes.ts`
- `src/components/features/TimelineView.tsx`
- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/Chat/ChatPage.tsx`
- relevant route/launch tests

Scope:

- move Timeline route-owned state to `useSearchParams`
- treat `search`, `range`, `tracks`, `focusTrack`, and `focusRefId` as the canonical URL-owned state described in docs and route metadata
- make board selection navigate to the board-document route when a specific board is selected
- make chat and board landing routes behave intentionally when no deep-linked child id is present
- remove any remaining cases where store selection can silently disagree with the active route
- add regression coverage for direct entry, back/forward-safe state restoration, and landing-route behavior

Key principle:

- if the URL says one thing and the visible feature state says another, the URL wins

Done when:

- Timeline state round-trips through the URL
- `/workspaces/:workspaceId/chat` and `/workspaces/:workspaceId/board` behave predictably and do not inherit stale deep-linked selection by accident
- board switching updates both route and visible state
- route tests cover the key direct-entry and reset cases

Validation:

- `npm run lint`
- `npm run typecheck`
- targeted route/feature tests for Timeline, Chat, Board, and route helpers
- `npm run build`

## Workstream 2. Active Docs Canon Cleanup

Purpose:

- make the documentation layer match the repo that now actually exists

Primary targets:

- `README.md`
- `docs/operations/CONTRIBUTING.md`
- `docs/operations/ARCHITECTURE.md`
- the active dated plan doc set
- any active doc entry points that still mention retired checkpoints

Scope:

- retire `docs/reports/CURRENT_STATUS.md` as an active expected doc
- remove or replace all active references to that file
- normalize references to actual active file casing such as `docs/operations/ARCHITECTURE.md`
- ensure onboarding docs point at the current route-backed architecture and current report/plan set
- keep durable truth in operations docs and bounded point-in-time truth in dated plan/report docs

Key principle:

- active docs should describe real files and real behavior, not retired process habits

Done when:

- no active doc points at the missing `CURRENT_STATUS.md`
- active doc entry points agree on the same set of current references
- architecture and persistence docs still match runtime after Workstream 1 lands

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- manual grep for `CURRENT_STATUS.md` and casing drift in active docs

## Workstream 3. Post-Refactor Transition Debt Cleanup

Purpose:

- remove the most visible remaining transition debt that undercuts the new architecture

Primary targets:

- compatibility navigation state
- route/store mirror behavior
- stale transitional language or assumptions that survived the shell cutover
- small route-adjacent correctness gaps found while implementing Workstream 1

Representative areas:

- `AppView` compatibility seams that still act like hidden navigation state rather than coarse labels
- route helper behavior that still prefers store carryover over explicit route identity
- any remaining surface-specific assumptions that were acceptable during cutover but are now architectural drag

Scope:

- keep `currentView` only where it still provides legitimate compatibility value
- remove or narrow route-adjacent behavior that depends on transitional state mirroring
- clean up any route-backed feature behavior discovered during Workstream 1 that does not merit a separate future pass
- preserve user-facing behavior unless the current behavior is itself the transition bug

Key principle:

- now that the new shell is in place, transition helpers should become thinner, not more entrenched

Done when:

- route-owned identity no longer depends on compatibility state to stay coherent
- remaining compatibility fields read as mirrors or UI hints, not hidden sources of truth
- active docs can describe the route model simply without explaining around leftover contradictions

Validation:

- `npm run lint`
- `npm run typecheck`
- targeted navigation and store tests
- `npm run build`

## Workstream 4. Feature-Root Decomposition

Status: Complete on April 5, 2026.

Landed outcomes:

- `TimelineView.tsx` now delegates route-backed chronology derivation and selection logic to `src/components/features/Timeline/timelineViewModel.ts`
- `WorkspaceBoard/index.tsx` now delegates workspace/board/library/session derivation to `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts`
- `TaskSetupModal.tsx` now delegates wizard state, pack/model derivation, and launch/template handlers to `src/components/features/Runs/useTaskSetupState.ts`
- `useAppShellController.ts` now delegates initialization, location tracking, and theme-application effects to `src/app/useAppShellEffects.ts`
- targeted helper coverage now exists for the new Timeline and WorkspaceBoard view-model seams

Purpose:

- reduce the next real maintenance bottlenecks now that shell and store architecture are stable

Primary targets:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/Runs/TaskSetupModal.tsx`
- `src/app/useAppShellController.ts` if route completion exposes obvious extraction seams

Scope:

- extract page/controller logic from presentation-heavy sections
- isolate route-state adapters, selectors, and command handlers
- split large feature roots into smaller components/hooks/modules without changing settled behavior
- keep decomposition aligned with the route-backed architecture rather than introducing a second parallel organization scheme

Recommended extraction shape:

- page/controller layer
- route/query param adapter layer where relevant
- derived selector/util layer
- presentation panels/sections
- feature command hooks or action modules

Key principle:

- decompose where the new route boundaries already provide natural seams

Done when:

- the largest feature roots are materially smaller and easier to reason about
- route/state wiring is easier to test in isolation
- future work in Timeline, Board, and Task Setup no longer has to thread through thousand-line roots for routine changes

Validation:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted feature tests
- `npm run build`
- full `npm run test` if the decomposition becomes cross-cutting

## Recommended Execution Order

1. Workstream 1: Route Contract Completion
2. Workstream 2: Active Docs Canon Cleanup
3. Workstream 3: Post-Refactor Transition Debt Cleanup
4. Workstream 4: Feature-Root Decomposition
5. Final parity sweep across tests, docs, route behavior, and handoff notes

Why this order:

- Workstream 1 fixes the highest-risk correctness issue
- Workstream 2 keeps docs aligned with the architecture as it becomes fully true
- Workstream 3 removes leftover transition scaffolding after route behavior is settled
- Workstream 4 is safest once the route contract and active docs stop moving under it

## Implementation Posture

Each workstream should be handled as a substantial but bounded slice.

Recommended posture for execution:

- finish one workstream to a stable resting state before opening the next unless a shared extraction clearly reduces rework
- prefer broad coverage within a stream over partial touches across many streams
- add regression tests at the same time as route or state correctness changes
- update docs as the stream lands rather than batching all doc edits to the very end
- keep behavior conservative unless the existing behavior is a direct contradiction of the route contract

## Parity Sweep

After the four workstreams land, do one final sweep for:

- active doc references and casing
- route behavior on direct entry and refresh
- board/chat/timeline state restoration
- validation snapshot updates where they still exist in active docs
- remaining obvious transition comments that no longer match the code

Status: Complete on April 5, 2026.

Landed outcomes:

- active doc references and file casing were rechecked so the active doc layer points at current files rather than retired checkpoints
- direct-entry and landing-route behavior for chat, board, and timeline surfaces were re-verified through the route and feature test surface
- validation snapshots in `README.md` and `docs/operations/LINTING.md` were refreshed to the final parity-sweep baseline
- active docs now treat the root `README.md` plus operations docs as the current entry points, while dated plans and reports remain bounded records under `docs/plans/` and `docs/_legacy/`

Final validation for the completed pass:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Success Criteria

This plan is successful when:

- the remaining route/state contradictions from the audit are gone
- active docs no longer reference a missing current-status file
- the route-backed architecture can be described without caveats about hidden store ownership of durable state
- the largest feature roots are more maintainable without reopening the architecture
- the repo feels like it completed the refactor rather than merely landed it
