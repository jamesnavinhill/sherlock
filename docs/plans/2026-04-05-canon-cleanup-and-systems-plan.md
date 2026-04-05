# Route-Aware Canon Cleanup And Systems Plan

Date: April 5, 2026

Supersedes the earlier April 5 cleanup plan, which is now archived in `docs/_legacy/plans/2026-04-05-canon-cleanup-and-systems-plan.md`.

## Intent

This plan reframes the cleanup/refactor effort around a route-backed application shape.

The previous plan correctly identified canon cleanup, persistence integrity, and decomposition needs, but it still treated the current enum-driven app shell as the stable container. After reviewing the current codebase, that is no longer the right assumption.

Sherlock has outgrown view switching that lives primarily in `App.tsx` and Zustand state. The next major cleanup pass should move the app toward proper URL-backed navigation and organize the rest of the refactor around that target shape.

This is not a call for a broad framework rewrite.

This plan assumes:

- Sherlock should move to route-backed navigation with regular URLs
- the app should remain client-rendered and local-first in this pass
- we should not couple the cleanup to a Next.js or SSR migration
- URL state should own durable navigation identity
- Zustand/store state should own domain data and ephemeral UI state
- medium-to-large parity slices are preferred over prolonged transitional increments
- documentation should be updated as code lands, then finalized in one sweep

## Core Decisions

### 1. Adopt route-backed navigation now

Sherlock should no longer treat `currentView` and related shell state as the primary navigation model.

The app should move to a client-side router with real URL paths, deep linking, back/forward behavior, and direct-entry support.

Recommended posture:

- use a mature client-side router in the existing Vite app
- prefer a low-friction route migration over a framework migration
- treat route adoption as architecture work, not optional polish

### 2. Do not turn this pass into an SSR/framework rewrite

Sherlock is still browser-local and IndexedDB/SQLite-backed.

That means:

- SEO is not a primary driver
- server data loaders are not the core problem
- route identity matters more than server rendering in this phase

If Sherlock later grows into collaborative, shared, or server-persisted workflows, a framework migration can be evaluated from a cleaner route-backed baseline.

### 3. URL state should own durable location

The browser URL should become the source of truth for:

- active surface/page
- active workspace
- active artifact when directly inspected
- active board
- active chat session
- timeline/network/workspace surface context

The store should not remain responsible for durable page identity when the URL can carry it.

### 4. Keep behavior conservative while refactoring structure aggressively

This pass should improve architecture without casually redesigning product behavior.

Recommended principle:

- refactor navigation and structure aggressively
- preserve current product behavior wherever practical

### 5. Do not spend time polishing the legacy `AppView` shell beyond what is needed to migrate away from it

Further investment in enum-driven view switching would create rework.

That includes avoiding deep new dependencies on:

- `AppView`
- `setCurrentView(...)`
- `lastNonSettingsView`
- custom window navigation events where route navigation should be used instead

## Why This Plan Changes The Refactor

The current app is already a large single-page application, but it is not yet a route-backed one.

Today:

- top-level feature surfaces are lazy-loaded inside `src/App.tsx`
- navigation is selected by `AppView`
- a large amount of state is effectively acting as navigation state
- view transitions are encoded in app logic rather than in URLs

That made sense earlier, but it now creates architectural drag:

- surfaces do not have stable addressable identities
- direct linking is weak or absent
- shell orchestration and feature orchestration are tangled
- decomposition gets harder because the app shell is still acting like a switchboard for everything

Because of that, route migration should happen before the deepest decomposition work. Otherwise we risk cleaning up the wrong shell and redoing the top layer shortly afterward.

## End State

At the end of this plan, Sherlock should read as a route-backed, local-first research workspace application with consistent canonical runtime language and clearer system boundaries.

That means:

- navigation is URL-backed and directly addressable
- the app shell composes routes rather than owning every surface transition
- workspaces, artifacts, boards, timelines, chats, and network views have stable route identities
- canonical `Signal` and `FollowUp` models are first-class in runtime and persistence
- critical multi-table writes are atomic
- browser storage and runtime boundaries are centralized and documented
- the giant orchestration files are decomposed around route/page and domain boundaries
- docs describe the real route-aware architecture, not the transitional shell

## Preferred Target Shape

### Route model

Recommended initial route family:

- `/discover`
- `/monitor`
- `/files`
- `/runs/:runId`
- `/settings`
- `/workspaces/:workspaceId`
- `/workspaces/:workspaceId/artifacts/:artifactId`
- `/workspaces/:workspaceId/chat`
- `/workspaces/:workspaceId/chat/:sessionId`
- `/workspaces/:workspaceId/board`
- `/workspaces/:workspaceId/board/:boardId`
- `/workspaces/:workspaceId/timeline`
- `/workspaces/:workspaceId/network`

Notes:

- `OperationView` should converge toward artifact/workspace detail routing rather than remain a special shell-only mode
- workspace-scoped surfaces should group under `/workspaces/:workspaceId/*`
- route naming should favor workspace language rather than legacy case/report terminology

### URL state vs store state

URL should own:

- current surface/page
- primary selected workspace
- primary selected artifact
- selected chat session when deep-linked
- selected board when deep-linked
- shareable filters when they define the visible surface meaningfully

Store should own:

- workspaces, artifacts, runs, signals, follow-ups, chat data, board data
- generation state
- unsaved drafts
- transient panel open/close state
- local selection details that do not deserve URL permanence
- theme/settings and browser-local preferences

Avoid putting ephemeral panel toggles and temporary inspector state into the URL unless a later product need clearly calls for it.

### Shell shape

`App.tsx` should shrink toward:

- bootstrapping
- providers
- router mounting
- theme/bootstrap wiring
- global overlays

It should stop owning detailed page orchestration for every feature.

### Page and feature shape

Feature roots should become small route pages/controllers that compose:

- route param parsing
- feature hooks
- selectors
- command handlers
- presentation panels/components

Recommended high-level organization:

```text
src/
  app/
    router/
    routes/
    views/
  store/
    index.ts
    types.ts
    selectors/
    actions/
  components/
    features/
      Chat/
        page/
        components/
        hooks/
        commands/
      Timeline/
        page/
        components/
        hooks/
        selectors/
      WorkspaceBoard/
        page/
        components/
        hooks/
        commands/
      Settings/
        page/
        sections/
        forms/
      Runs/
        TaskSetupModal.tsx
  services/
    ...
```

This directory sketch is descriptive rather than mandatory, but the final shape should make page/controller/presentation boundaries obvious.

### Store shape

Keep one public store entry if convenient, but decompose its internals into modules such as:

- store state and shared types
- selectors
- workspace actions
- artifact and run actions
- signal and follow-up actions
- chat actions
- board actions
- import/export and maintenance actions
- UI/settings actions

The store should stop behaving like one long mixed responsibility script.

## Workstream Shape

This work is best handled as five coordinated workstreams plus a final parity sweep.

The workstreams are:

1. Route architecture and navigation contract
2. Route cutover and app shell conversion
3. Canonical model and persistence parity
4. Integrity, storage boundary, and runtime safety
5. System decomposition and organized refactor
6. final parity sweep across docs, naming, validation, and route behavior

## Recommended Order

Recommended execution order:

1. establish the route model and URL/state contract
2. cut over the app shell to route-backed navigation
3. complete canon/model parity on the route-backed surfaces
4. finish integrity and boundary cleanup on the stabilized model
5. decompose the major store and feature systems around the new page boundaries
6. run the final parity/docs/validation sweep

Reasoning:

- route identity changes where page boundaries live
- page boundaries should be settled before major shell decomposition
- canon and persistence work still matter, but should land against the real target shell
- decomposition is safer once route ownership and canonical nouns are both stable

## Workstream 1: Route Architecture And Navigation Contract

### Goal

Define the route-backed architecture clearly before implementation churn begins.

### Primary outcomes

- one canonical route map exists
- URL ownership vs store ownership is explicit
- route naming uses workspace canon rather than legacy shell conventions
- direct-entry, back/forward, and deep-link expectations are defined up front

### Scope

- route inventory
- route naming
- URL param/query ownership
- surface identity rules
- hosting fallback requirements for direct entry
- navigation semantics for artifact, board, chat, and timeline surfaces

Primary files/modules likely touched:

- `src/App.tsx`
- new router files under `src/app/*`
- `src/components/ui/Sidebar.tsx`
- route-aware feature entry points
- `vercel.json`
- `docs/operations/ARCHITECTURE.md`

### Design decisions

#### 1. Route-backed does not mean server-rendered

This pass should keep the existing local-first client model.

#### 2. Workspace-scoped features should nest under workspace routes

That includes:

- artifact inspection
- chat
- board
- timeline
- network

#### 3. URL identity must be durable enough to bookmark

The URL should open the same meaningful surface later, not just "roughly this area of the app."

### Planned slices

#### Slice 1A: Define canonical route map

- choose the route tree
- define route params and query conventions
- define which existing shell states disappear, survive, or become derived

Acceptance:

- the route map is explicit in code and docs
- no top-level surface is left without a clear URL identity

#### Slice 1B: Define route/state ownership

- document which state belongs in URL, store, or local component state
- identify fields that can stop being durable shell state

Acceptance:

- route/state ownership is documented
- shell-level ambiguity around active page identity is removed

#### Slice 1C: Hosting/direct-entry requirements

- add SPA rewrite handling if needed for direct route loads
- document route deployment assumptions

Acceptance:

- direct loading of a non-root route is supported in deployed environments

## Workstream 2: Route Cutover And App Shell Conversion

### Goal

Replace enum-driven app-shell navigation with route-backed composition while preserving feature parity.

### Primary outcomes

- `App.tsx` stops being the page switchboard
- `AppView` stops being the primary navigation mechanism
- sidebar navigation uses routes
- browser back/forward behavior works naturally
- feature surfaces remain available with current behavior

### Scope

- app shell conversion
- sidebar and navigation actions
- feature entry point routing
- route wrappers for current feature roots
- route-aware artifact/chat/board opening flows

Primary files/modules likely touched:

- `src/App.tsx`
- `src/types/index.ts`
- `src/components/ui/Sidebar.tsx`
- feature entry points under `src/components/features/*`
- store fields that currently persist shell navigation state

### Planned slices

#### Slice 2A: Introduce router and route pages

- add router infrastructure
- wrap current feature roots with route pages rather than rewriting all features immediately
- keep lazy loading where it still helps

Acceptance:

- top-level surfaces render through routes instead of `currentView` branching

#### Slice 2B: Convert navigation actions

- move sidebar navigation to route links/navigation
- replace custom shell transitions with route transitions where appropriate
- remove dead or redundant shell-only back behavior

Acceptance:

- primary app navigation is route-driven
- back/forward behavior is consistent with the current visible page

#### Slice 2C: Convert open/report/chat/board handoff flows

- `openChat`, artifact-open, board-open, and similar flows navigate by route
- route params become the durable selection source where appropriate

Acceptance:

- opening a report, board, or chat session results in the expected URL and visible state

### Risks

- route cutover can expose hidden assumptions in feature surfaces
- shell and feature state can drift if URL and store ownership are not cut over together

### Mitigation

- start with route wrappers over current feature roots
- keep acceptance focused on parity, not redesign
- cut over route ownership intentionally instead of layering routes on top of old shell state forever

## Workstream 3: Canonical Model And Persistence Parity

Status: Complete on April 5, 2026.

Landed outcomes:

- canonical `Signal` / `FollowUp` runtime language now leads the persistence edge and active retrieval surfaces
- saved-signal repositories now expose canonical `getSignals(...)` / `createSignal(...)` APIs with compatibility wrappers kept at the edge
- workspace-data backups now emit canonical signal snapshots as `signals.signals` while continuing to accept legacy `signals.headlines`
- chat retrieval, workspace search, and workspace-board reference flows now prefer `SIGNAL` refs/attachments rather than growing new `HEADLINE`-named roots

### Goal

Finish the move from transitional investigation-first naming to the settled research workspace canon on the route-backed architecture.

### Primary outcomes

- `Signal` replaces `Headline` as the canonical durable observation model
- `FollowUp` becomes the single durable actionable model
- `Case` and `Report` continue shrinking toward persistence-edge compatibility only
- lineage remains explicit and works cleanly across route surfaces

### Scope

- types and domain helpers
- runtime/store surfaces
- persistence contracts and repositories
- route-driven surface integrations
- docs

Primary files/modules likely touched:

- `src/types/index.ts`
- `src/domain/*`
- `src/store/*`
- `src/services/runtime.ts`
- `src/services/lineage/*`
- `src/services/db/schema.ts`
- `src/services/db/repositories/*`
- `src/components/features/Timeline/*`
- `src/components/features/OperationView/*`
- `src/components/features/Chat/*`
- `src/components/features/WorkspaceBoard/*`
- docs under `README.md` and `docs/operations/*`

### Planned slices

#### Slice 3A: Canonical model cutover

- define settled `Signal` and `FollowUp` shapes
- remove new dependencies on `Lead` and `Headline` as active roots
- normalize artifact outputs into canonical follow-ups

Acceptance:

- one canonical noun exists for each active runtime concept
- new runtime code no longer grows old roots

#### Slice 3B: Persistence and repository cutover

- persist follow-ups as first-class durable records
- keep signal persistence aligned with the canon
- maintain explicit lineage refs

Acceptance:

- follow-ups can be created, read, updated, resolved, and linked through lineage
- signals continue to support monitor/discovery flows

#### Slice 3C: Route-surface parity cutover

- update route-backed Timeline, artifact view, chat, and board surfaces to consume canonical models
- ensure follow-up launches and artifact links work cleanly from route pages

Acceptance:

- canonical models are visible across the route-backed surfaces without transitional drift

## Workstream 4: Integrity, Storage Boundary, And Runtime Safety

Status: Complete on April 5, 2026.

Landed outcomes:

- critical artifact persistence remains transaction-backed through `runWriteTransaction(...)`
- app-owned browser storage now routes through typed helpers for config, model-catalog cache, recent model history, active workspace selection, and monitor autosave
- provider/router capability enforcement remains active and covered by targeted router tests
- active docs and validation notes now reflect the current route-backed canonical model and this slice's actual validation scope

### Goal

Finish the safety and boundary work so the route-backed canonical model rests on consistent infrastructure.

### Primary outcomes

- critical multi-table writes are atomic
- storage behavior is centralized
- provider/router capability checks remain real and documented
- validation/status docs are trustworthy

### Scope

- transaction/write-bundle infrastructure
- repository multi-table writes
- storage/settings boundary
- router capability enforcement
- cleanup of smaller correctness inconsistencies

Primary files/modules likely touched:

- `src/services/db/client.ts`
- `src/services/db/repositories/*`
- `src/store/*`
- `src/utils/localStorage.ts`
- `src/config/systemConfig.ts`
- `src/config/aiModels.ts`
- `src/services/providers/index.ts`
- `src/components/features/LiveMonitor/*`
- docs under `docs/operations/*` and `README.md`

### Planned slices

#### Slice 4A: Atomic persistence pattern

- establish one canonical transaction/write-bundle pattern
- convert artifact persistence first
- extend immediately to other parity-sensitive write paths if the pattern holds

Acceptance:

- critical multi-table writes cannot leave partial durable state behind

#### Slice 4B: Storage boundary completion

- route remaining approved browser storage usage through one typed boundary
- keep provider keys as the only intentional special case if still needed

Acceptance:

- active feature components do not write directly to `localStorage` except approved exceptions

#### Slice 4C: Runtime hygiene and documentation parity

- keep router capability enforcement aligned with model/runtime truth
- clean smaller correctness issues
- refresh docs to reflect the actual architecture and validation state

Acceptance:

- architecture docs and runtime behavior match

## Workstream 5: System Decomposition And Organized Refactor

### Goal

Break the largest orchestration files into route-native, domain-aligned systems with clearer ownership boundaries.

### Primary outcomes

- app shell is small and compositional
- store internals are modular
- large feature roots become page/controller plus extracted hooks/components/commands
- feature code reads as intentional architecture rather than accumulated feature mass

### Scope

Main decomposition targets:

- `src/App.tsx`
- `src/store/caseStore.ts`
- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Settings/index.tsx`
- `src/components/ui/TaskSetupModal.tsx`

### Decomposition posture

This should be an organized refactor, not a cosmetic file split.

Recommended principle:

- decompose around responsibilities, not arbitrary file size
- create obvious homes for data derivation, orchestration, side effects, and presentation
- preserve current behavior unless a route/canon decision requires a change

### Proposed target organization

#### App shell decomposition

Split toward:

- app bootstrap
- router mounting
- shared providers
- global overlays/modals
- route-level composition

Acceptance:

- `App.tsx` owns composition, not feature-specific workflows

#### Store decomposition

Split toward:

- public store entry
- state/types
- selectors
- workspace actions
- artifact/run actions
- signal/follow-up actions
- chat actions
- board actions
- maintenance/import/export actions
- UI/settings actions

Acceptance:

- the store is materially smaller and more legible
- feature/domain logic is grouped near its owning action set

#### Feature decomposition

For `WorkspaceBoard`, `Timeline`, `Chat`, `Settings`, and task setup:

- separate page/controller concerns from presentation
- separate data derivation/selectors from side-effect orchestration
- move feature-specific workflow UI out of generic `components/ui` homes
- create smaller reusable subpanels and hooks

Acceptance:

- feature roots stop being giant mixed controller/view files
- major subflows are independently understandable

### Risks

- decomposition can accidentally alter behavior
- route migration can obscure whether a regression is architectural or behavioral

### Mitigation

- do not do decomposition before route ownership is stable
- preserve focused behavior tests around launch flows, timeline derivation, board workflows, and chat flows
- favor larger coherent slices over long-lived half-split systems

## Validation Strategy

### Default validation per slice

- `npm run lint`
- `npm run typecheck`
- targeted tests for the affected area

Run `npm run build` when a slice affects:

- shipped app code
- route behavior
- bundling
- shared UI/runtime behavior

### Full suite policy

Do not run the full suite on every slice by default.

Run `npm run test` at:

- route-cutover milestones
- risky canon/persistence cutovers
- before final merge of the broader refactor

### Suggested targeted coverage by area

- route cutover: shell navigation, deep-link entry, route-backed feature handoffs
- canon/lineage: timeline tests, launch propagation tests, store tests, repository tests
- persistence/integrity: repository tests, DB client tests, workspace-data tests
- decomposition: targeted tests for the refactored surface plus `build` where shared behavior changes

## Documentation Requirements

Update docs incrementally as the work lands:

- `README.md` when setup, route behavior, validation, or status shifts
- `docs/operations/ARCHITECTURE.md` for route and structural changes
- `docs/operations/DATA_PERSISTENCE.md` for follow-up/signal persistence and storage-boundary changes
- `docs/operations/OPERATIONS_RUNBOOK.md` for provider capability or runtime fallback behavior changes
- `docs/operations/DEPLOYMENT.md` for route-entry/deployment assumptions
- `docs/reports/CURRENT_STATUS.md` when the active implementation state materially changes

Final pass:

- one final documentation sweep after all workstreams land to remove lingering transitional shell language and stale status claims

## Delivery Style

Recommended delivery style:

- medium-to-large slices
- each slice should land one coherent architectural boundary end to end
- avoid long-lived compatibility layers that keep both the route shell and the legacy shell equally alive
- avoid incremental cosmetic extractions that do not change ownership cleanly

Good slice shape:

- route boundary plus navigation parity
- canonical model plus persistence plus UI parity for one concept
- one feature system reorganized fully enough that the old mixed responsibility file can shrink materially

Bad slice shape:

- adding routes while still treating `currentView` as the real source of truth
- shell cleanup that assumes the enum view model will remain permanent
- decomposition before route ownership is settled
- name-only canon changes without behavior and persistence cutover

## Acceptance Criteria

This plan is complete when:

- Sherlock uses route-backed navigation with direct-entry support
- top-level workspace surfaces have stable URL identities
- URL state and store state have clear ownership boundaries
- `Signal` and `FollowUp` are first-class canonical models
- artifact-produced follow-ups are durable and explicitly linked through lineage
- old `lead` and `headline` roots no longer dominate active runtime thinking
- critical multi-table persistence paths are atomic
- storage behavior is centralized and documented consistently
- the largest orchestration files are decomposed into organized systems
- active docs match the implemented route-aware architecture
- milestone validation passes throughout, and final validation includes full test coverage plus build

## Bottom Line

Sherlock should not keep optimizing the legacy enum-driven shell while simultaneously trying to clean up everything beneath it.

The right next move is a route-aware canon-and-systems refactor:

- adopt regular URLs now
- keep the app client-rendered and local-first for this pass
- finish canon and safety work against that target
- then decompose the store and feature systems around the new page boundaries

This plan is designed to get the codebase back under control without doing cleanup that immediately has to be redone.
