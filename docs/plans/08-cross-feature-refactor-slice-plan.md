# Cross-Feature Refactor Completion Plan

Date: April 6, 2026

Status: In Progress

Related inputs:

- `docs/reports/2026-04-06-cross-feature-refactor-audit.md`
- `docs/reports/2026-04-05-project-audit.md`

## Intent

This is the active completion plan for the cross-feature refactor.

The earlier refactor pass landed meaningful improvements, but the April 6 audit confirmed that the work is not actually complete yet. This document replaces the prior "completed" framing with a finish-to-done plan.

The goal is not just to keep extracting files. The goal is to finish the refactor in a way that is actually closed:

- feature roots are thin and readable
- controller hooks own orchestration without becoming new monoliths
- pure view-model and selector seams stay pure
- shared runtime-config behavior is implemented once
- dialog and overlay boundaries are consistent
- store subscriptions are narrower and easier to trace
- repository/bootstrap behavior is auditable and resilient
- tests, docs, and validation results match reality

This plan does not reopen the settled architecture:

- Sherlock remains route-backed
- Sherlock remains local-first
- provider and API calls remain client-side by design
- wa-sqlite + IndexedDB remain the primary persistence path

## Completion Standard

This refactor is not complete until all of the following are true:

1. Every slice below has all required code, tests, and docs work landed.
2. No item is left as "follow-up" inside this plan. Any deferred work must move into a new dated plan.
3. README and operations docs describe the code as it exists, not the intended end state.
4. Focused tests for extracted view-model/controller seams run successfully in this checkout.
5. Final validation passes:
   - `npm run lint`
   - `npm run typecheck`
   - targeted tests for the touched slices
   - `npm run test`
   - `npm run build`
6. Only after that final gate passes should this plan status change from `In Progress` to `Completed`.

## Current Remaining Hotspots

Current line counts on April 6, 2026:

- `src/components/features/Settings/index.tsx` - 1295
- `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts` - 1009
- `src/components/features/Chat/useChatController.ts` - 910
- `src/components/features/Runs/TaskSetupModal.tsx` - 777
- `src/app/useAppShellController.ts` - 676
- `src/components/features/Chat/GuidedRunBuilder.tsx` - 669
- `src/components/features/NetworkGraph/useNetworkGraphController.ts` - 617
- `src/components/features/Settings/useSettingsController.ts` - 589
- `src/components/features/Timeline/useTimelineViewController.ts` - 545
- `src/components/features/OperationView/useOperationViewController.ts` - 503

These are the main files this plan must shrink, split, or otherwise stabilize.

## Global Rules

### 1. Keep pure seams pure

Pure modules may not import React components, browser-only workflow helpers, `tldraw`, router hooks, or mixed UI utility files.

This applies to:

- view-model modules
- selector helpers
- data derivation utilities
- controller test helpers

### 2. Page roots only compose

Route/page files should own:

- route params
- route fallbacks and navigation handoff
- top-level layout
- composition of feature sections

They should not carry:

- large command handlers
- inline modal trees
- long filter/export menu markup
- heavy derived-state logic

### 3. Controllers coordinate, they do not become the new page roots

Controller hooks may own:

- async effects
- command handlers
- modal state
- cross-surface handoffs
- route/store orchestration

They should move out:

- pure derivation
- repetitive action-building
- render-only menu/panel logic
- static copy shaping that does not need hook state

### 4. Shared runtime-config modules must be truly shared

Do not create "shared" components that contain feature-specific branches for Settings vs Task Setup vs Guided Chat. Shared modules should only cover overlapping behavior.

### 5. No slice closes without validation and docs

Every slice must leave the repo in a stable state with:

- targeted tests
- updated docs when structure or behavior changes
- validation commands recorded in the session handoff

## Expected End-State Modules

By the end of this plan, these modules should exist unless an updated plan explicitly replaces them with a better-named equivalent:

- `src/components/features/Settings/SettingsRuntimeTab.tsx`
- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/components/features/Settings/SettingsDataTab.tsx`
- `src/components/features/Settings/SettingsScopesTab.tsx`
- `src/components/features/Settings/SettingsTemplatesTab.tsx`
- `src/components/features/Settings/SettingsDialogs.tsx`
- `src/components/features/Timeline/TimelineFiltersPanel.tsx`
- `src/components/features/Timeline/TimelineExportMenu.tsx`
- `src/components/features/Runs/ProviderModelSelector.tsx`
- `src/components/features/Runs/RuntimeConfigSummary.tsx`
- `src/components/features/Runs/useRuntimeConfigForm.ts`

Recommended but optional if the same seam is solved cleanly with equivalent files:

- `src/components/features/WorkspaceBoard/BoardTopBar.tsx`
- `src/components/features/WorkspaceBoard/BoardCanvasPane.tsx`
- `src/components/features/Chat/ChatHeader.tsx`
- `src/components/features/NetworkGraph/NetworkGraphDialogs.tsx`
- `src/components/features/NetworkGraph/NetworkGraphAddNodeOverlay.tsx`

## Execution Order

Work through the slices in this order:

1. Slice 0: contract reset and audit corrections
2. Slice 1: page/controller decomposition
3. Slice 2: shared runtime-config consolidation
4. Slice 3: panel/rail/section extraction
5. Slice 4: dialog/overlay/menu normalization
6. Slice 5: store selector and action boundary cleanup
7. Slice 6: persistence and repository cleanup
8. Slice 7: tests, docs, and bundle closeout

Slices 1 through 4 can overlap only after Slice 0 freezes the contracts.

## Slice Roadmap

## Slice 0. Contract Reset And Audit Corrections

Current state:

- Completed on April 6, 2026

Purpose:

- reset the plan from "finished" to a real completion baseline
- fix the known seam purity regression before more refactor work builds on top of it

Primary targets:

- `docs/plans/08-cross-feature-refactor-slice-plan.md`
- `docs/reports/2026-04-06-cross-feature-refactor-audit.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts`
- `src/components/features/WorkspaceBoard/workspaceBoardUtils.ts`

Work items:

- record the completion standard and keep this plan `In Progress` until the final gate passes
- add the April 6 audit as the canonical gap report for this plan
- codify the final seam contract in `docs/operations/ARCHITECTURE.md`:
  - page shell
  - controller hook
  - pure view-model/util
  - section component
  - dialog/menu/overlay module
  - feature selector hook
  - shared runtime-config module
- fix the Workspace Board purity leak:
  - move `boardRefKey` out of `workspaceBoardUtils.ts` into a tiny pure helper
  - keep `workspaceBoardUtils.ts` reserved for UI/tldraw-facing helpers
  - ensure `workspaceBoardViewModel.ts` imports only pure helpers
- audit the other extracted pure modules for similar mixed imports:
  - `src/components/features/Timeline/timelineViewModel.ts`
  - `src/components/features/Chat/chatPageUtils.ts`
  - `src/store/selectors/featureSelectors.ts`
- remove any README/architecture wording that implies the refactor is already fully closed

Deliverables:

- seam contract documented in `docs/operations/ARCHITECTURE.md`
- board key helper moved to a pure module
- corrected README/plan status language

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- src/components/features/WorkspaceBoard/workspaceBoardViewModel.test.ts`

Done when:

- the board view-model test finishes successfully on its own
- no pure view-model module imports mixed UI utility files
- docs no longer overstate completion

## Slice 1. Page / Controller Decomposition Across Feature Roots

Purpose:

- finish the large feature-root refactor rather than stopping after first-pass extraction

Primary targets:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Chat/useChatController.ts`
- `src/components/features/Settings/index.tsx`
- `src/components/features/Settings/useSettingsController.ts`
- `src/components/features/TimelineView.tsx`
- `src/components/features/Timeline/useTimelineViewController.ts`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/NetworkGraph/useNetworkGraphController.ts`
- `src/components/features/OperationView/index.tsx`
- `src/components/features/OperationView/useOperationViewController.ts`

Shared completion rules for this slice:

- page roots should mostly do layout and composition
- no page root should keep large inline render helpers for whole tabs or panels
- controller hooks should stop growing as replacement monoliths
- pure derivation should move out of controllers where possible

### Workspace Board

Current gap:

- `index.tsx` is much better than before, but the top bar and canvas shell still live inline
- `useWorkspaceBoardController.ts` is still over 1000 lines

Work items:

- extract `BoardTopBar.tsx` from the current header area
- extract `BoardCanvasPane.tsx` for the canvas mount, empty/loading state, and drag/drop shell
- split `useWorkspaceBoardController.ts` into one public board controller plus internal focused modules for:
  - board persistence and autosave
  - library actions and item creation/deletion
  - inspector action building
  - board-agent session orchestration
  - board placement and route handoff
- move any pure inspector/action derivation into non-hook helper modules

### Chat

Current gap:

- the page is decomposed, but `useChatController.ts` is still a very large mixed-responsibility hook
- header, new-session menu, and export menu markup still live inline in `ChatPage.tsx`

Work items:

- extract `ChatHeader.tsx` or equivalent header/menu composition module
- move the new-session and export-menu trees out of `ChatPage.tsx`
- split `useChatController.ts` into focused modules for:
  - session lifecycle and navigation
  - send/stop streaming flow
  - guided-run state and commands
  - transcript artifact/follow-up actions
  - dialog state management
- keep `ChatPage.tsx` responsible only for header plus rail/transcript/composer/dialog composition

### Settings

Current gap:

- `Settings/index.tsx` is still the largest active feature root in the repo
- `useSettingsController.ts` mixes runtime settings, provider keys, theme editing, and data-maintenance flows

Work items:

- create:
  - `SettingsRuntimeTab.tsx`
  - `SettingsThemeTab.tsx`
  - `SettingsDataTab.tsx`
  - `SettingsScopesTab.tsx`
  - `SettingsTemplatesTab.tsx`
- reduce `Settings/index.tsx` to:
  - tab shell
  - top-level save/close chrome
  - composition of tab modules
- split `useSettingsController.ts` into either:
  - one thin facade plus per-tab hooks, or
  - per-tab controllers directly consumed by the new tab modules
- isolate:
  - runtime-config state
  - theme state helpers
  - backup/restore/purge flows
  - provider-key save/clear flows

### Timeline

Current gap:

- the route shell is thin, but `useTimelineViewController.ts` still owns many unrelated concerns
- filters and export UI are still combined with toolbar responsibilities

Work items:

- keep `TimelineView.tsx` as route shell plus layout only
- move filter/export-specific UI into dedicated modules in Slice 3, then trim controller responsibilities accordingly
- split out pure helper modules for:
  - detail action building
  - route-query update helpers
  - selected-event handoff shaping
  - any remaining derived summary blocks that do not need hook state

### Network Graph

Current gap:

- `index.tsx` is smaller, but controller state and overlay behavior are still concentrated in `useNetworkGraphController.ts`

Work items:

- keep `index.tsx` as layout and section composition only
- split `useNetworkGraphController.ts` into focused modules for:
  - manual graph mutation
  - inspector selection state
  - board/chat handoff commands
  - resolution and overlay state
- move dossier derivation into a pure view-model/helper if it still lives in the controller after overlay extraction

### Operation View

Current gap:

- layout extraction landed, but `useOperationViewController.ts` still carries derived panel data and multiple handoff builders

Work items:

- keep `index.tsx` as layout shell only
- move case-panel derivation into a pure helper/view-model module
- separate selection/inspector state from board/chat/template command builders
- keep dialogs and routed layout outside the controller where practical

Validation:

- `npm run lint`
- `npm run typecheck`
- relevant targeted tests for the feature roots and their extracted helpers

Done when:

- page roots are mostly orchestration and composition
- controller hooks no longer act as replacement monoliths
- the remaining large files are section components or intentionally complex pure modules, not mixed page/controller blobs

## Slice 2. Shared Runtime-Config And Launch Surface Consolidation

Purpose:

- finish the part that only half-landed: shared runtime-config behavior exists, but shared runtime-config UI/state does not

Primary targets:

- `src/components/features/Settings/index.tsx`
- `src/components/features/Settings/useSettingsController.ts`
- `src/components/features/Runs/TaskSetupModal.tsx`
- `src/components/features/Runs/useTaskSetupState.ts`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`
- `src/app/useAppShellController.ts`
- `src/components/features/Runs/runtimeConfigOptions.ts`
- `src/components/features/Runs/runtimeConfigMapping.ts`

Shared modules to introduce:

- `src/components/features/Runs/useRuntimeConfigForm.ts`
- `src/components/features/Runs/ProviderModelSelector.tsx`
- `src/components/features/Runs/RuntimeConfigSummary.tsx`

Optional shared modules if the split stays clearer:

- `src/components/features/Runs/RuntimeConfigBehaviorControls.tsx`
- `src/components/features/Runs/OpenRouterSearchControls.tsx`

Work items:

- define one canonical runtime-config state shape used by:
  - Settings AI tab
  - Task Setup config step
  - Guided Run Builder config step
  - template apply/save flows
  - app-shell launch mapping
- centralize provider/model behavior in one place:
  - fallback model resolution
  - provider runtime readiness
  - recent-model tracking
  - capability messaging copy
  - OpenRouter browser launch and selection behavior
- centralize config-field shaping for:
  - provider
  - modelId
  - searchDepth
  - generationMode
  - thinkingBudget
  - scope and purpose inheritance
  - artifact type inheritance
- replace the current repeated provider/model UI blocks in:
  - `Settings/index.tsx`
  - `TaskSetupModal.tsx`
  - `GuidedRunBuilder.tsx`
- ensure `TemplateGallery.tsx` and launch-entry flows read from the same mapping helpers as manual setup and guided setup

Validation:

- targeted tests for `runtimeConfigMapping.ts`
- tests for the shared runtime-config hook/component behavior
- smoke coverage for each consumer surface after adoption

Done when:

- provider/model selection and capability copy are implemented once
- Settings, Task Setup, and Guided Run Builder no longer hand-roll the same runtime-config form logic
- template and app-shell launch shaping use the same mapping rules as UI launch setup

## Slice 3. Panel / Rail / Section Extraction

Purpose:

- finish the render-tree extraction pass after the controller seams are stable

Primary targets:

- `Chat`
- `WorkspaceBoard`
- `Settings`
- `Timeline`
- `NetworkGraph`
- `OperationView`

Work items:

- complete the Settings tab split and move the large inline render helpers into dedicated tab components
- if `BoardTopBar.tsx` and `BoardCanvasPane.tsx` were not created in Slice 1, create them here and remove the remaining inline header/canvas composition from `WorkspaceBoard/index.tsx`
- move the Chat header plus new/export menus into dedicated section modules
- extract `TimelineFiltersPanel.tsx` and `TimelineExportMenu.tsx`
- ensure Network Graph overlay/panel sections are dedicated modules instead of deep inline markup
- audit each section component so it follows:
  - data in
  - callbacks out
  - no direct store access unless it is intentionally the store boundary
- remove large inline accordion, menu, and panel markup from the main page roots

Validation:

- targeted tests for behaviorful extracted sections
- route-level smoke tests where sections materially change interaction flow

Done when:

- side panels and section components can be read in isolation
- page roots stop carrying whole-tab or whole-panel render trees

## Slice 4. Dialog, Overlay, And Menu Normalization

Purpose:

- finish workflow-boundary cleanup and eliminate the remaining browser-dialog holdouts

Primary targets:

- `Chat`
- `WorkspaceBoard`
- `NetworkGraph`
- `Timeline`
- `Settings`

Residual cleanup targets that must also be included before closing this slice:

- `src/components/features/Archives.tsx`
- `src/components/features/OperationView/ReportViewer.tsx`

Work items:

- create `SettingsDialogs.tsx` for:
  - restore-backup confirmation
  - purge confirmation
  - restore success/failure feedback
- create dedicated Network Graph dialog/overlay modules for:
  - add-node flow
  - node deletion
  - entity-resolution flow
  - lead-investigation handoff modal if still inline
- keep `BoardDialogs.tsx` as the single workflow boundary for board creation/deletion/item deletion and normalize copy if needed
- move Timeline export/filter menu behavior into dedicated modules and standardize close behavior
- normalize Chat header menu boundaries if still inline after Slice 3
- replace all remaining raw `confirm(...)` and `alert(...)` usage in active repo code
- standardize destructive copy, confirm labels, cancel labels, and success/error feedback where practical

Validation:

- targeted tests for the dialog modules and destructive flows
- `rg -n "confirm\\(|alert\\(" src/components/features src/app src/store`

Done when:

- no active feature relies on raw browser dialogs for core workflow actions
- workflow UI boundaries are easy to find by file name
- major menus and overlays are not buried inside feature roots

## Slice 5. Store Selector And Action Boundary Cleanup

Purpose:

- narrow feature subscriptions and make ownership easier to trace without rewriting the store

Primary targets:

- `src/store/caseStore.ts`
- `src/store/actions/*`
- `src/store/selectors/featureSelectors.ts`
- `src/app/useAppShellController.ts`
- the controller hooks introduced in Slice 1

Work items:

- audit each controller hook for selector width and split selectors where it materially reduces subscriptions
- narrow `useAppShellFeatureState` by responsibility:
  - launch/task state
  - route-adjacent state
  - theme/UI state
  - chat/workspace lookup state
- add Settings-specific selectors so runtime settings and persistence maintenance do not ride through one broad selector
- review `useWorkspaceStore.getState()` escape hatches and either:
  - replace them with explicit action inputs, or
  - document why the escape hatch is intentional
- move derived state out of controllers where it belongs in:
  - pure view-model modules
  - selector helpers
  - action/helper modules
- isolate `useAppShellController.ts` responsibilities by extracting:
  - launch orchestration helpers
  - open-chat routing helpers
  - navigation record resolution helpers
- keep route-owned state out of the global store unless persistence or cross-surface coordination truly requires it

Validation:

- selector/unit tests where added
- targeted tests for app-shell launch/open-chat helpers
- `npm run typecheck`

Done when:

- controller hooks subscribe to smaller, easier-to-reason-about slices
- action ownership is easier to trace
- route state and store state have fewer ambiguous overlaps

## Slice 6. Persistence And Repository Adapter Cleanup

Purpose:

- finish repository and bootstrap hardening in one consistent pass

Primary targets:

- `src/services/db/repositories/*`
- `src/services/db/repositories/json.ts`
- `src/store/actions/bootstrapActions.ts`
- `src/store/actions/workspaceActions.ts`
- `docs/operations/DATA_PERSISTENCE.md`

Work items:

- standardize a per-repository mapping pattern:
  - row-to-domain mapper
  - domain-to-row mapper where applicable
  - consistent parse labels
- audit repositories for ad hoc JSON parsing and move that behavior behind the shared JSON helpers
- ensure malformed/corrupted rows degrade gracefully during bootstrap and restore flows
- tighten fallback typing so fallback objects still satisfy domain types
- make bootstrap error handling explicit:
  - what is skipped
  - what is logged
  - what should fail the entire bootstrap
- document provider-key handling as an explicit invariant in `DATA_PERSISTENCE.md`
- add tests for malformed persisted data in the repository layer and bootstrap layer

Validation:

- targeted repository tests
- `npm run test -- src/services/db/repositories/json.test.ts`
- any new bootstrap tests added in this slice

Done when:

- repository hydration reads consistently
- malformed persisted data does not produce silent shape drift
- persistence behavior is easier to audit and extend

## Slice 7. Tests, Docs, And Bundle Budget Closeout

Purpose:

- finish the refactor honestly: strong tests, accurate docs, and a real final validation gate

Primary targets:

- route tests
- controller/view-model/helper tests
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- bundle-review documentation

Required test work:

- add focused tests for:
  - `useChatController.ts`
  - `useWorkspaceBoardController.ts`
  - `useTimelineViewController.ts`
  - `useNetworkGraphController.ts`
  - `useOperationViewController.ts`
  - `useSettingsController.ts` or its replacement tab controllers
  - the app-shell launch/open-chat helper seams extracted in Slice 5
- keep the pure tests working:
  - `workspaceBoardViewModel.test.ts`
  - `timelineViewModel.test.ts`
  - `chatPageUtils.test.ts`
- rerun route and launch propagation coverage where those slices changed:
  - `src/app/routeViews.test.tsx`
  - feature launch-propagation tests for affected surfaces

Required docs work:

- update README so the validation snapshot reflects the actual final run, not a premature closeout claim
- update `docs/operations/ARCHITECTURE.md` for the final module layout
- update `docs/operations/DATA_PERSISTENCE.md` if repository/bootstrap or provider-key invariants change
- update `docs/operations/OPERATIONS_RUNBOOK.md` if provider fallback or error handling changes
- update `docs/operations/SCOPES.md` or `docs/operations/SOURCES.md` only if scope/purpose behavior changes during runtime-config cleanup

Bundle-review work:

- rerun `npm run build`
- record the large-chunk outcome
- either:
  - accept the remaining `vendor-tldraw-app` warning as a documented exception, or
  - add chunking work and document the change

Final validation gate:

- `npm run lint`
- `npm run typecheck`
- targeted tests for the changed slices
- `npm run test`
- `npm run build`

Done when:

- extracted seams have real focused coverage
- docs describe the final code as-shipped
- the full validation gate passes in this checkout
- only then may this plan be marked `Completed`

## Parallel Ownership Model

Use one shared owner for contract-setting work inside the active slice, then split feature execution into these lanes where write scopes stay disjoint:

- Lane A: Workspace Board
- Lane B: Chat
- Lane C: Settings
- Lane D: Timeline
- Lane E: Network Graph and Operation View
- Shared lane: runtime-config modules, selectors, repositories, app-shell helpers, docs

Do not parallelize work that changes the same shared contract in the same slice.
