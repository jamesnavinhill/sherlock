# Cross-Feature Refactor Slice Plan

Date: April 5, 2026

Status: Proposed

Related inputs:

- `docs/reports/2026-04-05-project-audit.md`
- `docs/plans/2026-04-05-post-refactor-completion-plan.md`

## Intent

This is a repo-wide structural cleanup plan for the next refactor pass.

It is intentionally slice-based, not feature-by-feature.

The goal is to avoid repeating the same categories of refactor across separate sessions. Instead of cleaning Chat now, then rediscovering the same extraction pattern in Board, then repeating it again in Settings and Timeline later, this plan groups the work by refactor type and applies that slice across all relevant surfaces in one coordinated pass.

This plan does not reopen the major architectural decisions that are already settled:

- Sherlock remains route-backed
- Sherlock remains local-first
- provider/API calls remain client-side by design
- wa-sqlite + IndexedDB remain the primary persistence path

This plan is about decomposition, consistency, maintainability, and reducing future rework.

## Planning Rules

### 1. Work by slice, not by page

Each slice should represent one category of refactor applied across all relevant features.

Examples:

- page/controller extraction across all oversized feature roots
- runtime-config UI consolidation across all launch/config flows
- panel/rail extraction across all detail-heavy views

### 2. Freeze the shared contract before parallel work starts

Within a slice, it is fine to work in parallel across features, but only after the common pattern is agreed.

That means:

- define the shared extraction pattern first
- then assign disjoint feature ownership
- avoid having multiple people invent the shared abstraction at the same time

### 3. Prefer clear seams over clever abstractions

The target is easier reasoning, not maximal reuse.

Good outcomes:

- smaller page roots
- controller/view-model hooks with obvious ownership
- presentational sections that receive narrow props
- shared runtime-config pieces where behavior truly overlaps

Bad outcomes:

- generic abstractions that hide feature behavior
- shared helpers created too early
- parallel changes that force repeated merge cleanup

### 4. Land each slice in a stable resting state

Each slice should leave the codebase better even if the next slice has not started yet.

That means every slice should include:

- code extraction
- tests for the moved behavior
- docs updates if the slice changes validation, behavior, or structure

## Current Hotspots

Largest active code roots observed on April 5, 2026:

- `src/components/features/WorkspaceBoard/index.tsx` - 1643 lines
- `src/components/features/Chat/ChatPage.tsx` - 1613 lines
- `src/components/features/Settings/index.tsx` - 1613 lines
- `src/components/features/TimelineView.tsx` - 1269 lines
- `src/components/features/NetworkGraph/index.tsx` - 759 lines
- `src/components/features/Runs/TaskSetupModal.tsx` - 757 lines
- `src/components/features/Chat/GuidedRunBuilder.tsx` - 678 lines
- `src/components/features/NetworkGraph/NodeInspector.tsx` - 675 lines
- `src/components/features/OperationView/index.tsx` - 663 lines
- `src/components/features/Timeline/timelineEvents.ts` - 661 lines
- `src/app/useAppShellController.ts` - 625 lines
- `src/components/features/OperationView/ReportViewer.tsx` - 582 lines
- `src/components/features/NetworkGraph/GraphCanvas.tsx` - 535 lines
- `src/store/caseStore.ts` plus action modules under `src/store/actions/*`

These files are not all equally urgent, but together they define the main maintenance pressure in the repo.

## Refactor Areas To Cover

This plan covers all major maintainability areas, not just large UI files.

### Feature roots

- Chat
- Workspace Board
- Settings
- Timeline
- Network Graph
- Operation View
- Runs / task setup

### Shared launch and runtime-config flows

- provider/model selection
- scope and purpose selection
- thinking budget and provider capability messaging
- template-driven launch configuration
- guided/manual launch setup

### App shell and routing

- route-owned view identity
- shared route fallbacks
- app-shell controller responsibility boundaries

### Store and action boundaries

- wide component store subscriptions
- feature-specific selectors and derived state
- routing vs global state responsibilities
- action ownership and orchestration seams

### Persistence and repositories

- typed row mapping
- safe JSON hydration
- fallback handling
- bootstrap error tolerance

### Docs, tests, and bundle control

- docs that explain the new structure
- test coverage around extracted controllers/view-models
- build and chunk-size monitoring

## Execution Model

### Recommended model

Work through the slices in order.

Within each slice:

1. define the contract and naming pattern
2. split feature ownership into disjoint lanes
3. extract across all relevant targets in the same pass
4. run validation and update docs before moving on

### What "parallel" means in this plan

Parallel does not mean unrelated refactors happening randomly.

It means:

- one slice is active at a time
- that slice is applied across all relevant features together
- feature owners can work in parallel once the shared pattern is fixed

### What should stay single-owner inside a slice

These should usually have one owner at a time:

- shared hooks/components introduced for multiple features
- store contract changes
- repository mapping and bootstrap behavior
- route shell behavior

### What can be parallel inside a slice

These are good disjoint write scopes once the slice contract is decided:

- `Chat`
- `WorkspaceBoard`
- `Settings`
- `Timeline`
- `NetworkGraph`
- `OperationView`

## Slice Roadmap

## Slice 0. Refactor Contracts And Naming

Purpose:

- settle the extraction patterns before feature work starts

Targets:

- `src/components/features/*`
- `src/app/useAppShellController.ts`
- `src/store/*`
- `docs/operations/ARCHITECTURE.md` if needed

Work:

- choose the preferred pattern for each kind of extraction:
  - page root
  - controller hook
  - view-model / derived-state module
  - presentational section components
  - feature dialog modules
- standardize naming such as:
  - `useXxxController`
  - `buildXxxViewModel`
  - `XxxLeftRail`
  - `XxxRightRail`
  - `XxxDialogs`
- define when to extract to:
  - hook
  - pure util/view-model
  - section component
  - shared UI module
- define constraints for shared abstractions:
  - no feature-specific branching in shared controls unless there is real overlap
  - shared runtime-config pieces must preserve current behavior

Done when:

- there is one clear extraction pattern for the rest of the plan
- the team can split work without inventing new structure mid-stream

## Slice 1. Page / Controller Decomposition Across Feature Roots

Purpose:

- reduce the largest page roots first
- separate orchestration from presentation

Primary targets:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Settings/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/OperationView/index.tsx`

Recommended extraction shape by feature:

### Workspace Board

- keep `index.tsx` as a thin route/page entry
- extract a `useWorkspaceBoardController` hook for:
  - board persistence lifecycle
  - board switching
  - library actions
  - board-agent orchestration
  - modal state and command handlers
- split render-heavy sections into:
  - `BoardTopBar`
  - `BoardLibraryRail`
  - `BoardCanvasPane`
  - `BoardInspectorRail`
  - `BoardAgentRail`
  - `BoardDialogs`

### Chat

- keep `ChatPage.tsx` as a page shell
- extract a `useChatController` hook for:
  - session creation/selection
  - send/stop generation logic
  - artifact append/save flows
  - follow-up launch flows
  - guided/manual launch commands
- split render-heavy sections into:
  - `ChatSessionRail`
  - `ChatTranscript`
  - `ChatComposer`
  - `ChatContextRail`
  - `ChatDialogs`

### Settings

- keep `Settings/index.tsx` as tab orchestration
- extract one controller per tab or one `useSettingsController` plus tab-level sections
- split the UI into:
  - `SettingsRuntimeTab`
  - `SettingsThemeTab`
  - `SettingsDataTab`
  - `SettingsScopesTab`
  - `SettingsTemplatesTab`

### Timeline

- keep `TimelineView.tsx` as route shell plus high-level state wiring
- extract:
  - `TimelineToolbar`
  - `TimelineFiltersPanel`
  - `TimelineEventList`
  - `TimelineDetailRail`
  - `TimelineExportMenu`

### Network Graph

- extract a `useNetworkGraphController` hook for:
  - manual node/link actions
  - inspector actions
  - board/chat/investigation handoffs
  - modal and overlay state
- separate the add-node overlay and confirm flows from the page root

### Operation View

- extract a `useOperationViewController` hook for:
  - entity/headline/report selection
  - board/chat/investigation actions
  - modal state
- further isolate:
  - workspace dossier
  - report pane
  - inspector action wiring

Done when:

- each page root is mostly orchestration and layout
- large command handlers move out of giant render files
- feature-specific presentation sections are independently readable

Parallel lanes inside this slice:

- Lane A: Workspace Board
- Lane B: Chat
- Lane C: Settings
- Lane D: Timeline
- Lane E: Network Graph + Operation View

## Slice 2. Shared Runtime-Config And Launch Surface Consolidation

Purpose:

- stop repeating provider/model/scope/purpose logic across features

Primary targets:

- `src/components/features/Settings/index.tsx`
- `src/components/features/Runs/TaskSetupModal.tsx`
- `src/components/features/Runs/useTaskSetupState.ts`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`
- `src/app/useAppShellController.ts`

Work:

- identify the overlapping runtime-config surfaces:
  - provider selection
  - model selection
  - capability display
  - thinking budget controls
  - scope/purpose defaults
  - template application
  - launch request shaping
- extract shared pieces such as:
  - `ProviderModelSelector`
  - `ThinkingBudgetControl`
  - `RuntimeConfigSummary`
  - `useRuntimeConfigForm`
  - `runtimeConfigMapping.ts`
- make sure all launch flows use the same mapping rules for:
  - default model fallback
  - provider readiness
  - scope and purpose inheritance
  - artifact type inheritance

Important rule:

- shared runtime-config modules should be introduced by one owner first
- feature-level adoption can then happen in parallel

Done when:

- the same runtime-config logic is not reimplemented in Settings, Templates, Guided Run Builder, Task Setup, and launch orchestration
- provider/model behavior reads the same everywhere

## Slice 3. Panel / Rail / Section Extraction

Purpose:

- reduce giant render trees and make side-panels easier to reason about

Primary targets:

- `Chat`
- `WorkspaceBoard`
- `Timeline`
- `OperationView`
- `Settings`

Work:

- extract left-rail and right-rail sections into dedicated feature components
- normalize section ownership around:
  - data in
  - callbacks out
  - minimal direct store access
- reduce repeated accordion and panel markup embedded in the page roots

Good targets in this slice:

- Chat session rail and context rail
- Board library and inspector rails
- Timeline dossier and detail rail
- Operation dossier and inspector
- Settings tab sections and surface-editor blocks

Done when:

- major side panels can be read without scrolling through unrelated page logic
- page roots stop carrying most accordion markup

## Slice 4. Dialog, Overlay, And Menu Normalization

Purpose:

- finish standardizing UI workflow boundaries after the browser-dialog cleanup

Primary targets:

- `Chat`
- `WorkspaceBoard`
- `NetworkGraph`
- `Timeline`
- `Settings`

Work:

- collect feature dialogs into dedicated modules such as `XxxDialogs.tsx`
- standardize:
  - destructive confirmations
  - text-prompt flows
  - export/save menus
  - add/create overlays
- remove remaining ad hoc overlay blocks that are embedded deep in page roots where practical

Expected outputs:

- feature-local dialog modules
- consistent modal copy and confirm labels
- easier testability around menu and modal flows

Done when:

- workflow UI boundaries are easy to find
- feature roots are not carrying large inline modal/menu blocks

## Slice 5. Store Selector And Action Boundary Cleanup

Purpose:

- reduce wide subscriptions and make feature ownership clearer

Primary targets:

- `src/store/caseStore.ts`
- `src/store/actions/*`
- `src/app/useAppShellController.ts`
- feature roots that destructure large portions of the store

Work:

- introduce feature-level selector hooks or selector modules where useful
- reduce `useWorkspaceStore()` call sites that pull very wide state sets
- move derived state out of components where it belongs in:
  - view-model modules
  - selector helpers
  - action modules
- keep route-owned state out of the global store unless it truly needs persistence or cross-surface coordination
- keep orchestration logic in action/controller layers rather than large components

Possible outputs:

- `useChatFeatureState`
- `useWorkspaceBoardFeatureState`
- `useTimelineFeatureState`
- dedicated selectors under `src/store/selectors/*`

Important rule:

- do not turn the store cleanup into a state-management rewrite
- keep the current Zustand architecture, just narrow and clarify it

Done when:

- feature roots subscribe to narrower state
- action ownership is easier to trace
- route state and global state have fewer ambiguous overlaps

## Slice 6. Persistence And Repository Adapter Cleanup

Purpose:

- finish the repository hardening in a uniform, typed way

Primary targets:

- `src/services/db/repositories/*`
- `src/store/actions/bootstrapActions.ts`
- `src/store/actions/workspaceActions.ts`

Work:

- standardize row-to-domain mapping and domain-to-row mapping
- keep safe JSON parsing centralized
- remove ad hoc parse/fallback logic from individual repositories where possible
- improve corrupted-row tolerance and error reporting during bootstrap
- make repository typing stricter so fallback objects match domain types
- document client-side provider key handling as an explicit invariant, not an accidental behavior

Potential outputs:

- per-repository mapper helpers
- clearer parse labels and corrupted-row logging
- narrower bootstrap failure surfaces

Done when:

- repository hydration reads consistently
- malformed persisted data degrades more gracefully
- persistence behavior is easier to audit and extend

## Slice 7. Tests, Docs, And Bundle Budget Closeout

Purpose:

- lock in the gains and prevent regression

Primary targets:

- route tests
- feature controller/view-model tests
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- build tooling or docs around chunk monitoring

Work:

- add targeted tests for extracted controllers and view-model modules
- keep route-entry and back/forward coverage strong
- update docs to reflect the new feature/module layout
- add a simple bundle-monitoring practice:
  - documented budget
  - build log review checklist
  - optional script if desired later

Done when:

- the extracted architecture is explained in docs
- regressions in route/controller behavior are easier to catch
- bundle growth has a visible review checkpoint

## Suggested Per-Slice Ownership Model

Use the same ownership pattern in each slice wherever possible.

### Feature owners

- Board owner
- Chat owner
- Settings owner
- Timeline owner
- Graph / Operation owner

### Shared owner

One owner should coordinate any modules that multiple features will consume in the active slice:

- shared runtime-config components
- store selectors
- repository helpers
- route shell changes

### Reviewer focus

Review should be organized by slice, not by file count.

Review questions:

- did this slice apply the same pattern consistently across all target features?
- did it remove duplicated structure, or just move it around?
- did it keep ownership boundaries understandable?
- did it preserve behavior and validation?

## Recommended Landing Order

Recommended order:

1. Slice 0 - Refactor contracts and naming
2. Slice 1 - Page/controller decomposition
3. Slice 2 - Shared runtime-config and launch surfaces
4. Slice 3 - Panel/rail/section extraction
5. Slice 4 - Dialog, overlay, and menu normalization
6. Slice 5 - Store selector and action boundary cleanup
7. Slice 6 - Persistence and repository adapter cleanup
8. Slice 7 - Tests, docs, and bundle budget closeout

Why this order:

- Slice 1 reduces the biggest maintenance hotspots immediately
- Slice 2 prevents repeated config-form refactors later
- Slice 3 and Slice 4 clean up the render trees once controller boundaries exist
- Slice 5 and Slice 6 harden the shared system layers after the feature boundaries are clearer
- Slice 7 finishes with regression protection and documentation truth

## Success Criteria

This plan succeeds when:

- the largest feature roots are materially smaller
- the same refactor pattern is not repeated feature-by-feature in separate sessions
- shared runtime-config behavior is implemented once, not many times
- store and repository boundaries are easier to reason about
- docs and tests match the extracted structure
- the next maintainer can find page logic, controller logic, data shaping, and dialogs without hunting through 1500-line files

## Non-Goals

This plan does not include:

- moving provider/API calls server-side
- replacing Zustand
- replacing wa-sqlite
- redesigning the product UI from scratch
- broad behavior changes unrelated to maintainability

## Validation Expectation Per Slice

Default expectation for each non-trivial slice:

- `npm run lint`
- `npm run typecheck`
- targeted tests for the touched feature/module set
- `npm run build`

Run the full suite when:

- the slice is cross-cutting
- shared runtime-config logic changes
- store or repository contracts change
- route shell behavior changes

For this plan, that likely means full-suite validation for Slices 1, 2, 5, 6, and 7.
