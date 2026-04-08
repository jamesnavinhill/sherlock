# Canonical Cleanup Roadmap

Date: April 8, 2026

Status: Planned

Related inputs:

- `docs/reports/2026-04-08-codebase-audit.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

## Intent

This plan turns the April 8 codebase audit into a full-scope cleanup roadmap for bringing Sherlock into a final canonical, uniform, production-ready state.

This is not a “preserve compatibility and tidy around the edges” plan.

This is a deliberate end-to-end cleanup plan to:

- remove old legacy naming from active code and storage
- normalize systems so similar things are shaped similarly
- close architectural seams that are only partially extracted today
- remove one-off bridges, shims, fallback layers, and leftover transitional pathways
- leave active docs and active code in obvious parity

## Product North Star

By the end of this plan, Sherlock should feel and read like one coherent system:

- one canonical vocabulary
- one obvious persistence model
- one obvious routing and store ownership model
- one obvious runtime-config contract
- one obvious search/navigation contract
- one obvious controller/view-model/dialog extraction pattern
- one obvious active-doc set

The end state should be polished, internally consistent, easy to navigate, and ready for production hardening rather than still carrying cutover debt.

## Roadmap Rules

1. No legacy preservation.
   If a legacy name, structure, or pathway is replaced, it is removed from active code rather than preserved indefinitely.

2. Canonical names win everywhere.
   Active code, storage, tests, docs, and module names should converge on `Workspace`, `Artifact`, `Run`, `Signal`, `Source`, and `Item` where those are the product primitives.

3. End-to-end streams only.
   Each stream must close a whole subsystem, not leave behind half-renamed or half-extracted seams.

4. Code first, docs immediately after landing.
   Documentation updates happen as part of each stream closeout, after the code contract is settled for that stream.

5. Targeted validation only.
   Use the narrowest credible tests for the touched files and behavior. Do not run the full suite unless explicitly requested.

6. Warnings are work.
   Build warnings, React test warnings, router future-flag warnings, and newly discovered cleanup warnings must be fixed in-stream or explicitly added to a later stream before session closeout.

7. Discovery must feed the roadmap.
   If we discover additional cleanup while working:
   - fix it in the current stream if it is the same seam or a blocker
   - otherwise add it to the active roadmap in the most logical later stream before ending the session
   - do not leave discovered debt only in chat history

8. No new transitional shims unless unavoidable.
   If a temporary bridge is absolutely required, it must have a named owner stream and explicit removal criteria.

## Completion Standard

This roadmap is complete only when:

1. active `src/` code no longer uses legacy “case/report/archive/lead/task” naming for Sherlock’s canonical primitives
2. active persistence paths use canonical structures and no longer depend on legacy import/migration bridges
3. large feature roots have been reduced into consistent controller/view-model/section/dialog seams
4. runtime-config, provider, routing, and search systems follow one shared contract each
5. active docs in `README.md` and `docs/operations/*` reflect the actual active code and actual active plan/report locations
6. each stream has landed targeted tests and any discovered warning cleanup relevant to that stream
7. any completed plans/reports that are no longer active can then move to `docs/_legacy/`

## Validation Standard

Default per stream:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted test command(s) for the touched slice
- `npm run build` when the stream touches shipped app code, routing, runtime behavior, bundling, or shared UI contracts

Do not run `npm run test` as the default validation path for stream work on this roadmap.

## Delivery Model

Run the roadmap in ordered streams. Each stream is a clean handoff-sized unit that can be executed in one or more agent sessions, with parallel lanes only where write scopes are clearly disjoint.

Recommended order:

1. Canonical foundation cutover
2. Persistence and bootstrap simplification
3. App shell, routes, store, and selector spine
4. Search, Files, Timeline, and workspace-knowledge spine
5. Workflow surfaces parity: Artifact, Chat, Board, Network
6. Provider, model catalog, and runtime subsystem extraction
7. Settings, runtime-config unification, warning zero, and docs closeout

## Stream 1. Canonical Foundation Cutover

Purpose:

- remove legacy naming from the active product spine
- align code, storage, tests, and modules to one canonical vocabulary
- eliminate the biggest source of conceptual drift before deeper refactors begin

### Scope

Primary targets:

- `src/types/*`
- `src/domain/*`
- `src/store/*`
- `src/services/db/schema.ts`
- `src/services/db/repositories/*`
- `src/services/maintenance/workspaceData.ts`
- route, navigation, and feature modules that still use `case`, `report`, `archive`, `lead`, or `task` as primary runtime nouns
- file and module names that still carry legacy nouns where the active product name is now canonical

Execution shape:

- rename active interfaces, helper names, action names, selector names, and repository names to canonical terms
- rename storage tables/columns and repository mappings to canonical terms
- rename legacy feature/file/module names where the active surface already uses a new product label
- update tests alongside the rename so the language matches the code
- remove compatibility aliases instead of layering more synonyms

### Exact Current File Inventory

Canonical type/domain/store/persistence core:

```text
src/types/index.ts
src/domain/artifacts.ts
src/domain/artifacts.test.ts
src/domain/index.ts
src/domain/labels.ts
src/domain/packs.ts
src/domain/presentation.ts
src/domain/presentation.test.ts
src/domain/purposes.ts
src/domain/vocabulary.ts
src/domain/workspaces.ts
src/domain/workspaces.test.ts
src/store/caseStore.ts
src/store/caseStore.test.ts
src/services/db/schema.ts
src/services/db/repositories/CaseRepository.ts
src/services/db/repositories/CaseRepository.test.ts
src/services/db/repositories/TaskRepository.ts
src/services/maintenance/workspaceData.ts
src/services/maintenance/workspaceData.test.ts
```

Confirmed current legacy-named active files:

```text
src/components/features/Archives.tsx
src/components/features/Archives.launch.test.tsx
src/components/features/OperationView/ReportViewer.tsx
src/components/features/OperationView/ReportViewer.test.tsx
src/components/features/OperationView/operationCasePanelData.ts
src/components/features/OperationView/reportViewerPresentation.ts
src/components/features/Runs/TaskSetupModal.tsx
src/components/features/Runs/taskSetupUtils.ts
src/components/features/Runs/useTaskSetupState.ts
src/components/ui/TaskManager.tsx
src/components/ui/TaskSetupModal.tsx
src/services/db/repositories/CaseRepository.ts
src/services/db/repositories/CaseRepository.test.ts
src/services/db/repositories/TaskRepository.ts
src/store/caseStore.ts
src/store/caseStore.test.ts
```

### Execution Checklist

1. Rename the active primitive types and domain helpers to canonical vocabulary in `src/types/index.ts` and `src/domain/*`.
2. Rename the store backbone away from `caseStore` and update store-facing tests at the same time.
3. Rename `CaseRepository` and `TaskRepository`, plus the canonical table/column names in `src/services/db/schema.ts`.
4. Rewrite `workspaceData` backup/import terminology so the canonical backup shape no longer carries legacy primitive naming.
5. Rename or replace the confirmed legacy-named feature and UI files so active filenames match the product vocabulary.
6. Remove any compatibility aliases introduced by old naming once all call sites are moved.

Parallel lanes when safe:

- app/domain/type rename lane
- persistence schema/repository rename lane
- feature/module/file rename lane

Exit criteria:

- active code reads canonically without needing a translation layer in day-to-day development
- legacy primitive names are gone from active runtime paths except where required by third-party APIs
- file/module names no longer undermine the product vocabulary

Docs to update on landing:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`

## Stream 2. Persistence And Bootstrap Simplification

Purpose:

- turn persistence into one obvious system
- remove migration clutter, runtime schema patching debt, and legacy bootstrap bridges
- harden repository hydration and write paths while the canonical naming cutover is still fresh

### Scope

Primary targets:

- `src/services/db/client.ts`
- `src/services/db/migrate.ts`
- `src/services/db/migrations/*`
- `src/services/db/migrations_sql.ts`
- `src/services/db/repositories/*`
- `src/store/actions/bootstrapActions.ts`
- `src/store/actions/bootstrapResourceLoader.ts`
- `src/services/maintenance/workspaceData.ts`

Execution shape:

- define one primary schema-evolution path and retire the extras
- remove the old `sherlock-storage` migration bridge
- remove or retire runtime ALTER/repair helpers once the canonical migration path is in place
- harden JSON parsing and row hydration so malformed data is handled intentionally
- keep transaction behavior explicit and uniform across repository write paths
- simplify import/export and workspace-data backup logic around one canonical backup shape

### Exact Current File Inventory

```text
src/services/db/client.ts
src/services/db/client.test.ts
src/services/db/migrate.ts
src/services/db/migrations/0000_woozy_harpoon.sql
src/services/db/migrations/meta/0000_snapshot.json
src/services/db/migrations/meta/_journal.json
src/services/db/migrations_sql.ts
src/services/db/schema.ts
src/services/db/repositories/BoardAgentRepository.ts
src/services/db/repositories/BoardAgentRepository.test.ts
src/services/db/repositories/CaseRepository.ts
src/services/db/repositories/CaseRepository.test.ts
src/services/db/repositories/ChatRepository.ts
src/services/db/repositories/ChatRepository.test.ts
src/services/db/repositories/ManualDataRepository.ts
src/services/db/repositories/ScopeRepository.ts
src/services/db/repositories/SettingsRepository.ts
src/services/db/repositories/TaskRepository.ts
src/services/db/repositories/TemplateRepository.ts
src/services/db/repositories/TemplateRepository.test.ts
src/services/db/repositories/WorkspaceBoardRepository.ts
src/services/db/repositories/WorkspaceItemRepository.ts
src/services/db/repositories/WorkspaceSearchRepository.ts
src/services/db/repositories/WorkspaceSearchRepository.test.ts
src/services/db/repositories/json.ts
src/services/db/repositories/json.test.ts
src/services/maintenance/workspaceData.ts
src/services/maintenance/workspaceData.test.ts
src/store/actions/bootstrapActions.ts
src/store/actions/bootstrapResourceLoader.ts
src/store/actions/bootstrapResourceLoader.test.ts
```

### Execution Checklist

1. Replace the current mixed migration story in `client.ts`, `migrate.ts`, `migrations_sql.ts`, and `migrations/*` with one canonical path.
2. Remove the `sherlock-storage` bridge from `src/services/db/migrate.ts`.
3. Retire runtime schema patch helpers in `src/services/db/client.ts` once canonical migrations cover the same ground.
4. Standardize tolerant JSON parsing and hydration patterns across every repository file under `src/services/db/repositories/`.
5. Normalize bootstrap import/export behavior in `bootstrapActions.ts`, `bootstrapResourceLoader.ts`, and `workspaceData.ts`.
6. Land targeted repository, migration, and bootstrap tests for any changed persistence seam before closing the stream.

Parallel lanes when safe:

- schema/migration lane
- repository hydration/write-path lane
- bootstrap/import/export lane

Exit criteria:

- persistence no longer depends on overlapping migration systems
- bootstrap/import/export logic uses one canonical data contract
- repository read/write behavior is explicit, uniform, and easier to reason about

Docs to update on landing:

- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

## Stream 3. App Shell, Routes, Store, And Selector Spine

Purpose:

- settle ownership between routes, app shell, store state, and feature selectors
- reduce broad selector bleed and large store-oriented orchestration modules
- make the core app spine feel finished rather than still mid-cutover

### Scope

Primary targets:

- `src/app/*`
- `src/store/caseStore.ts` and its successor naming/location
- `src/store/actions/*`
- `src/store/selectors/featureSelectors.ts`
- app-shell helpers and route state helpers

Execution shape:

- rename `caseStore` and related store artifacts to canonical naming
- narrow selectors so they stop mirroring large store slices unnecessarily
- move pure shaping logic out of controllers where the seams are now obvious
- tighten the route-state ownership model and remove leftover mixed responsibilities
- reduce app-shell orchestration sprawl where helpers or smaller modules should own the behavior

### Exact Current File Inventory

```text
src/app/AppShell.tsx
src/app/AppShellRoutes.tsx
src/app/appShellLaunchHelpers.ts
src/app/appShellLaunchHelpers.test.ts
src/app/appShellNavigationHelpers.ts
src/app/appShellNavigationHelpers.test.ts
src/app/appShellOpenChatHelpers.ts
src/app/appShellOpenChatHelpers.test.ts
src/app/navigation.ts
src/app/openChatRequest.ts
src/app/openChatRequest.test.ts
src/app/routeViews.tsx
src/app/routeViews.test.tsx
src/app/routes.ts
src/app/routes.test.ts
src/app/useAppShellController.ts
src/app/useAppShellEffects.ts
src/store/caseStore.ts
src/store/caseStore.test.ts
src/store/actions/artifactRunActions.ts
src/store/actions/bootstrapActions.ts
src/store/actions/bootstrapResourceLoader.ts
src/store/actions/bootstrapResourceLoader.test.ts
src/store/actions/conversationActions.ts
src/store/actions/shared.ts
src/store/actions/simpleActions.ts
src/store/actions/workspaceActions.ts
src/store/selectors/featureSelectors.ts
```

### Execution Checklist

1. Rename the app/store backbone away from `caseStore` and update all app-shell imports accordingly.
2. Re-slice app-shell orchestration across `useAppShellController.ts`, helpers, and route views so ownership is explicit.
3. Clean the route contract in `routes.ts`, `routeViews.tsx`, `navigation.ts`, and `openChatRequest.ts`.
4. Reduce selector breadth in `featureSelectors.ts` so feature hooks stop consuming oversized store slices.
5. Revisit each store action module so async orchestration, pure shaping, and persistence side effects are consistently separated.
6. Update route and app-shell tests to match the new ownership model before stream closeout.

Parallel lanes when safe:

- app-shell and route ownership lane
- store/selectors/action-slice lane

Exit criteria:

- route state, store state, and feature state ownership are explicit and consistent
- the store and selector layer reads like a product backbone, not a compatibility staging area
- the app shell can be extended without adding more “god hook” behavior

Docs to update on landing:

- `docs/operations/ARCHITECTURE.md`
- `README.md` if navigation/setup descriptions change materially

## Stream 4. Search, Files, Timeline, And Workspace-Knowledge Spine

Purpose:

- clean up the shared knowledge-navigation layer
- finish the heavy seams around Files, omnibox, and Timeline
- make search, saved views, artifacts, items, signals, and runs behave like one system

### Scope

Primary targets:

- `src/components/features/Archives.tsx` and successor module naming
- `src/components/ui/GlobalSearch.tsx`
- `src/components/ui/omniboxModel.ts`
- `src/components/ui/omniboxActions.ts`
- `src/components/features/Timeline/*`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/services/workspace/library.ts`
- related navigation/handoff helpers

Execution shape:

- finish the Files surface rename and extraction so the surface matches its product role
- break omnibox ranking, result shaping, mention handling, and recents into smaller uniform modules
- keep Timeline pure-logic seams pure and reduce the owner-file load in controller/event-building paths
- align shared workspace-library/search/handoff contracts across Files, Timeline, Board, and Chat entry points

### Exact Current File Inventory

```text
src/components/features/Archives.tsx
src/components/features/Archives.launch.test.tsx
src/components/features/TimelineView.tsx
src/components/features/TimelineView.test.tsx
src/components/features/Timeline/TimelineDetailRail.tsx
src/components/features/Timeline/TimelineDossierPanel.tsx
src/components/features/Timeline/TimelineEventList.tsx
src/components/features/Timeline/TimelineExportMenu.tsx
src/components/features/Timeline/TimelineFiltersPanel.tsx
src/components/features/Timeline/TimelineToolbar.tsx
src/components/features/Timeline/timelineDetailActions.ts
src/components/features/Timeline/timelineEvents.ts
src/components/features/Timeline/timelineEvents.test.ts
src/components/features/Timeline/timelineQueryHelpers.ts
src/components/features/Timeline/timelineRouteState.ts
src/components/features/Timeline/timelineRouteState.test.ts
src/components/features/Timeline/timelineSavedViews.ts
src/components/features/Timeline/timelineSavedViews.test.ts
src/components/features/Timeline/timelineSnapshot.ts
src/components/features/Timeline/timelineSnapshot.test.ts
src/components/features/Timeline/timelineViewModel.ts
src/components/features/Timeline/timelineViewModel.test.ts
src/components/features/Timeline/timelineViewUtils.ts
src/components/features/Timeline/useTimelineViewController.ts
src/components/features/Timeline/useTimelineViewController.test.ts
src/components/ui/GlobalSearch.tsx
src/components/ui/omniboxActions.ts
src/components/ui/omniboxFocus.ts
src/components/ui/omniboxModel.ts
src/components/ui/omniboxModel.test.ts
src/services/db/repositories/WorkspaceSearchRepository.ts
src/services/db/repositories/WorkspaceSearchRepository.test.ts
src/services/workspace/library.ts
src/services/workspace/library.test.ts
src/services/workspace/workspaceHandoffs.ts
src/services/workspace/workspaceHandoffs.test.ts
src/services/workspace/workspaceSurfaceFocus.ts
src/app/navigation.ts
src/app/routes.ts
```

### Execution Checklist

1. Rename and extract the Files surface from `Archives.tsx` into canonical product naming and smaller sections.
2. Split `omniboxModel.ts` into smaller ranking, result-shaping, mention, and recents modules while keeping `GlobalSearch.tsx` thin.
3. Reduce the owner-file load in Timeline by extracting pure logic out of `timelineEvents.ts` and `useTimelineViewController.ts`.
4. Align search and handoff contracts across `WorkspaceSearchRepository.ts`, `library.ts`, `workspaceHandoffs.ts`, and `workspaceSurfaceFocus.ts`.
5. Update route helpers in `navigation.ts` and `routes.ts` only where the Files/Timeline/search contract actually changes.
6. Land focused tests for Files behavior, omnibox behavior, and Timeline behavior before closing the stream.

Parallel lanes when safe:

- Files surface lane
- omnibox/search lane
- Timeline lane

Exit criteria:

- Files, omnibox, and Timeline all use the same underlying workspace-knowledge contracts
- large owner files in this slice are materially reduced
- search/navigation behavior feels like one spine instead of several adjacent tools

Docs to update on landing:

- `docs/operations/ARCHITECTURE.md`
- `README.md`

## Stream 5. Workflow Surfaces Parity: Artifact, Chat, Board, Network

Purpose:

- finish the main workflow surfaces so they follow the same extraction and interaction patterns
- remove remaining parity gaps between artifact reading, chat, board workflows, and network workflows
- clean up the most complex feature-local orchestration seams

### Scope

Primary targets:

- `src/components/features/OperationView/*`
- `src/components/features/Chat/*`
- `src/components/features/WorkspaceBoard/*`
- `src/components/features/NetworkGraph/*`
- `src/services/workspace/agent/*`
- shared handoff and board-agent action modules

Execution shape:

- reduce oversized controller hooks and route roots
- align dialog/menu/section extraction patterns across these surfaces
- normalize cross-surface handoff actions so the same record types behave the same way everywhere
- continue splitting pure derivation out of controller code
- clean up board-agent/session/action seams so they match the rest of the app’s orchestration style

### Exact Current File Inventory

```text
src/components/features/OperationView/DossierPanel.tsx
src/components/features/OperationView/InspectorPanel.tsx
src/components/features/OperationView/OperationViewDialogs.tsx
src/components/features/OperationView/ReportViewer.tsx
src/components/features/OperationView/ReportViewer.test.tsx
src/components/features/OperationView/Toolbar.tsx
src/components/features/OperationView/index.tsx
src/components/features/OperationView/launchPropagation.test.tsx
src/components/features/OperationView/operationCasePanelData.ts
src/components/features/OperationView/reportViewerPresentation.ts
src/components/features/OperationView/useOperationViewController.ts
src/components/features/OperationView/useOperationViewController.test.ts
src/components/features/Chat/ChatComposer.tsx
src/components/features/Chat/ChatContextRail.tsx
src/components/features/Chat/ChatDialogs.tsx
src/components/features/Chat/ChatHeader.tsx
src/components/features/Chat/ChatPage.tsx
src/components/features/Chat/ChatPage.test.tsx
src/components/features/Chat/ChatSessionRail.tsx
src/components/features/Chat/ChatTranscript.tsx
src/components/features/Chat/GuidedRunBuilder.tsx
src/components/features/Chat/chatGuidedActions.ts
src/components/features/Chat/chatGuidedActions.test.ts
src/components/features/Chat/chatPageUtils.ts
src/components/features/Chat/chatPageUtils.test.ts
src/components/features/Chat/chatSessionLifecycle.ts
src/components/features/Chat/chatStreaming.ts
src/components/features/Chat/chatTranscriptActions.ts
src/components/features/Chat/chatTranscriptActions.test.ts
src/components/features/Chat/index.tsx
src/components/features/Chat/useChatController.ts
src/components/features/Chat/useChatController.test.ts
src/components/features/WorkspaceBoard/BoardAgentRail.tsx
src/components/features/WorkspaceBoard/BoardCanvasPane.tsx
src/components/features/WorkspaceBoard/BoardCanvasPane.test.tsx
src/components/features/WorkspaceBoard/BoardDialogs.tsx
src/components/features/WorkspaceBoard/BoardInspectorRail.tsx
src/components/features/WorkspaceBoard/BoardLibraryRail.tsx
src/components/features/WorkspaceBoard/BoardTopBar.tsx
src/components/features/WorkspaceBoard/CompactStylePanel.tsx
src/components/features/WorkspaceBoard/boardInspectorActions.ts
src/components/features/WorkspaceBoard/index.tsx
src/components/features/WorkspaceBoard/useBoardCanvasPersistence.ts
src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts
src/components/features/WorkspaceBoard/useWorkspaceBoardController.test.ts
src/components/features/WorkspaceBoard/workspaceBoardAgent.ts
src/components/features/WorkspaceBoard/workspaceBoardItemActions.ts
src/components/features/WorkspaceBoard/workspaceBoardUtils.ts
src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts
src/components/features/WorkspaceBoard/workspaceBoardViewModel.test.ts
src/components/features/NetworkGraph/ControlBar.tsx
src/components/features/NetworkGraph/EntityResolution.tsx
src/components/features/NetworkGraph/GraphCanvas.tsx
src/components/features/NetworkGraph/NetworkGraphAddNodeOverlay.tsx
src/components/features/NetworkGraph/NetworkGraphDialogs.tsx
src/components/features/NetworkGraph/NodeInspector.tsx
src/components/features/NetworkGraph/entityResolutionUtils.ts
src/components/features/NetworkGraph/index.tsx
src/components/features/NetworkGraph/launchPropagation.test.tsx
src/components/features/NetworkGraph/networkGraphDossierData.ts
src/components/features/NetworkGraph/networkGraphNodeIds.ts
src/components/features/NetworkGraph/networkGraphWorkspaceHandoffs.ts
src/components/features/NetworkGraph/useNetworkGraphController.ts
src/components/features/NetworkGraph/useNetworkGraphController.test.ts
src/components/features/NetworkGraph/useNetworkGraphInspectorState.ts
src/components/features/NetworkGraph/useNetworkGraphUiState.ts
src/services/workspace/agent/actions/registry.ts
src/services/workspace/agent/actions/registry.test.ts
src/services/workspace/agent/actions/review.ts
src/services/workspace/agent/actions/todos.ts
src/services/workspace/agent/actions/types.ts
src/services/workspace/agent/context/boardSnapshot.ts
src/services/workspace/agent/context/buildBoardAgentContext.ts
src/services/workspace/agent/context/buildBoardAgentContext.test.ts
src/services/workspace/agent/index.ts
src/services/workspace/agent/runtime.ts
src/services/workspace/agent/session.ts
src/services/workspace/agent/session.test.ts
src/services/workspace/agent/types.ts
src/services/workspace/boardAi.ts
src/services/workspace/boardShapes.ts
```

### Execution Checklist

1. Reduce oversized controller and owner files in OperationView, Chat, WorkspaceBoard, and NetworkGraph into consistent seams.
2. Normalize dialog, menu, and section boundaries across these four feature families.
3. Bring shared handoff behavior into parity so the same record types open, place, and route consistently across surfaces.
4. Clean up the board-agent stack in `src/services/workspace/agent/*`, `workspaceBoardAgent.ts`, `boardAi.ts`, and `boardShapes.ts`.
5. Remove remaining product-language drift inside operation, board, and network supporting modules such as `operationCasePanelData.ts`.
6. Land focused controller, launch-propagation, and board-agent tests for every changed seam before closing the stream.

Parallel lanes when safe:

- Artifact/Chat lane
- Board/board-agent lane
- Network lane

Exit criteria:

- the main workflow surfaces use the same controller/view-model/dialog/section vocabulary
- cross-surface actions behave consistently
- board-agent plumbing no longer feels like a subsystem with its own separate architectural dialect

Docs to update on landing:

- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `README.md`

## Stream 6. Provider, Model Catalog, And Runtime Subsystem Extraction

Purpose:

- deeply clean the AI runtime stack
- split catalog data, catalog IO/cache, router policy, transport, and provider-specific behavior into sane boundaries
- reduce synchronized multi-file edits for future provider/runtime work

### Scope

Primary targets:

- `src/config/aiModels.ts`
- `src/config/systemConfig.ts`
- `src/services/runtime.ts`
- `src/services/providers/index.ts`
- `src/services/providers/*Provider.ts`
- `src/services/providers/shared/*`
- provider/router/model tests

Execution shape:

- separate static model data from OpenRouter catalog fetch/cache behavior
- extract shared direct-provider request and streaming transport helpers
- keep provider-specific adapters focused on provider-specific payload shaping
- reduce repeated router request shaping across operations
- normalize capability, error, logging, and structured-output handling

### Exact Current File Inventory

```text
src/config/aiModels.ts
src/config/systemConfig.ts
src/config/systemConfig.test.ts
src/services/runtime.ts
src/services/chat/runtime.ts
src/services/chat/runtime.test.ts
src/services/providers/index.ts
src/services/providers/types.ts
src/services/providers/keys.ts
src/services/providers/keys.test.ts
src/services/providers/geminiClientState.ts
src/services/providers/geminiProvider.ts
src/services/providers/openRouterProvider.ts
src/services/providers/openAIProvider.ts
src/services/providers/anthropicProvider.ts
src/services/providers/router.test.ts
src/services/providers/adapters.contract.test.ts
src/services/providers/__fixtures__/adapterPayloads.ts
src/services/providers/shared/artifactContract.ts
src/services/providers/shared/boardAgent.ts
src/services/providers/shared/boardAgent.test.ts
src/services/providers/shared/chat.ts
src/services/providers/shared/errors.ts
src/services/providers/shared/jsonParsing.ts
src/services/providers/shared/logging.ts
src/services/providers/shared/normalizers.ts
src/services/providers/shared/parsingNormalization.test.ts
src/services/providers/shared/prompts.ts
src/services/providers/shared/retry.ts
src/services/providers/shared/streaming.ts
```

### Execution Checklist

1. Split `aiModels.ts` into smaller canonical modules for static model data, catalog IO/cache, and selection policy.
2. Rework `systemConfig.ts`, `runtime.ts`, and `services/chat/runtime.ts` around the cleaned runtime boundaries.
3. Extract shared transport and streaming behavior out of the provider adapter files where the request patterns are currently duplicated.
4. Reduce repetition in `src/services/providers/index.ts` by centralizing shared operation-shaping logic.
5. Keep provider-specific files focused on provider-specific payloads, capability differences, and response parsing.
6. Update router, contract, parsing, and provider-specific tests as part of the same stream.

Parallel lanes when safe:

- model-catalog/config lane
- router/policy lane
- adapter/transport lane

Exit criteria:

- provider/runtime code is more modular and less repetitive
- model-catalog behavior is no longer concentrated in one oversized policy-plus-network module
- future provider additions or capability changes require fewer synchronized edits

Docs to update on landing:

- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `README.md`

## Stream 7. Settings, Runtime-Config Unification, Warning Zero, And Docs Closeout

Purpose:

- finish the shared runtime-config layer
- close remaining warning debt and cleanup stragglers
- leave active docs, active plan state, and release-facing descriptions in sync with the final code

### Scope

Primary targets:

- `src/components/features/Settings/*`
- `src/components/features/Runs/*`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- shared runtime-config modules and tests
- any remaining warning-producing test files
- active docs and active plan/report inventory

Execution shape:

- finish shared runtime-config form/state/UI extraction across Settings, task setup, and guided flows
- remove leftover re-export shims and naming leftovers
- burn down React `act(...)` warnings and router future-flag warnings still present after earlier streams
- update README and operations docs so they point only to active current files
- archive completed plans/reports into `_legacy` once their active replacements exist

### Exact Current File Inventory

```text
src/components/features/Settings/index.tsx
src/components/features/Settings/SettingsDataTab.tsx
src/components/features/Settings/SettingsDialogs.tsx
src/components/features/Settings/SettingsRuntimeTab.tsx
src/components/features/Settings/SettingsScopesTab.tsx
src/components/features/Settings/SettingsTemplatesTab.tsx
src/components/features/Settings/SettingsThemeTab.tsx
src/components/features/Settings/TemplateGallery.tsx
src/components/features/Settings/settingsUtils.ts
src/components/features/Settings/useSettingsController.ts
src/components/features/Settings/useSettingsController.test.ts
src/components/features/Settings/useSettingsDataState.ts
src/components/features/Settings/useSettingsRuntimeState.ts
src/components/features/Settings/useSettingsThemeState.ts
src/components/features/Runs/OpenRouterSearchControls.tsx
src/components/features/Runs/ProviderModelSelector.tsx
src/components/features/Runs/RuntimeConfigBehaviorControls.tsx
src/components/features/Runs/RuntimeConfigSummary.tsx
src/components/features/Runs/TaskSetupModal.tsx
src/components/features/Runs/ThinkingBudgetControl.tsx
src/components/features/Runs/runtimeConfigMapping.ts
src/components/features/Runs/runtimeConfigMapping.test.ts
src/components/features/Runs/runtimeConfigOptions.ts
src/components/features/Runs/taskSetupUtils.ts
src/components/features/Runs/useRuntimeConfigForm.ts
src/components/features/Runs/useRuntimeConfigForm.test.ts
src/components/features/Runs/useTaskSetupState.ts
src/components/features/Chat/GuidedRunBuilder.tsx
src/components/ui/ApiKeyModal.tsx
src/components/ui/OpenRouterModelBrowser.tsx
src/components/ui/ScopeManager.tsx
src/components/ui/TaskSetupModal.tsx
src/config/systemConfig.ts
src/config/systemConfig.test.ts
src/services/providers/keys.ts
src/services/providers/keys.test.ts
src/components/features/OperationView/launchPropagation.test.tsx
src/components/features/OperationView/useOperationViewController.test.ts
src/components/features/Timeline/useTimelineViewController.test.ts
src/index.tsx
README.md
docs/operations/ARCHITECTURE.md
docs/operations/DATA_PERSISTENCE.md
docs/operations/OPERATIONS_RUNBOOK.md
docs/operations/CONTRIBUTING.md
```

### Execution Checklist

1. Finish the shared runtime-config contract across `Settings/*`, `Runs/*`, `GuidedRunBuilder.tsx`, and the supporting UI modules.
2. Remove re-export shims and naming leftovers such as `src/components/ui/TaskSetupModal.tsx` once the canonical import surface is settled.
3. Clean the current warning-owner tests in `OperationView/launchPropagation.test.tsx`, `OperationView/useOperationViewController.test.ts`, and `Timeline/useTimelineViewController.test.ts`.
4. Confirm `src/index.tsx` and any router-based tests stay aligned on the React Router future flags so warnings do not regress.
5. Update active docs only after the final runtime-config and warning contract lands.
6. Move superseded plan/report docs to `_legacy` only once the active replacements are complete and linked.

Parallel lanes when safe:

- Settings/runtime-config lane
- warning-cleanup lane
- docs closeout lane

Exit criteria:

- runtime-config behavior is shared and uniform across all relevant surfaces
- known non-failing warnings in active targeted validation are resolved or intentionally documented with a clear owner
- active docs reflect the actual final codebase state and actual active file layout

Docs to update on landing:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/CONTRIBUTING.md`

## Stream Maintenance Rule

At the end of every stream session:

1. note what landed
2. note what was intentionally deferred
3. move any newly discovered cleanup into the correct stream in this plan
4. update stream status inline if the stream is partially complete
5. do not let discovered debt live only in terminal output or chat history

## Suggested Execution Order For Agent Sessions

Use this plan as the working queue:

1. Stream 1: canonical foundation cutover
2. Stream 2: persistence and bootstrap simplification
3. Stream 3: app shell, routes, store, and selector spine
4. Stream 4: search, Files, Timeline, and workspace-knowledge spine
5. Stream 5: workflow surfaces parity
6. Stream 6: provider, model catalog, and runtime subsystem extraction
7. Stream 7: settings, runtime-config unification, warning zero, and docs closeout

That order is intentionally cumulative: each stream should make the next one cleaner rather than reopening vocabulary, ownership, or persistence questions that should already be settled.
