# Sherlock AI Architecture

This document describes the current runtime architecture as implemented in `src/`.

Sherlock now runs on a canonical workspace architecture. The domain-pack shell remains in place, but runtime execution resolves a generic pack, purpose profile, and artifact contract under the settled `Workspace -> Artifact -> WorkspaceRun` model.

## 1. Application Shell

`src/App.tsx` is now a thin entry export over the route-backed shell in `src/app/AppShell.tsx`.

Responsibilities:

- initializes persistence/state (`useWorkspaceStore().initializeStore()`, re-exported from `src/store/caseStore.ts`)
- mounts the browser router and route-backed page composition
- mounts the global omnibox/search surface used for route, workspace, and canonical-record lookup
- owns the unified launch pipeline
- resolves domain-pack and purpose metadata into run config
- wires lazy-loaded route pages and route wrappers
- applies theme/accent/font runtime CSS variables

Primary route-backed surfaces:

- `Feed` at `/discover`
- `Archives` at `/files`
- `LiveMonitor` at `/monitor`
- `OperationView` for transient execution state at `/runs/:runId`
- `OperationView` for saved artifact detail at `/workspaces/:workspaceId/artifacts/:artifactId`
- `Chat` at `/workspaces/:workspaceId/chat` and `/workspaces/:workspaceId/chat/:sessionId`
- `WorkspaceBoard` at `/workspaces/:workspaceId/board` and `/workspaces/:workspaceId/board/:boardId`
- `TimelineView` at `/workspaces/:workspaceId/timeline`
- `NetworkGraph` at `/workspaces/:workspaceId/network`
- `Settings` at `/settings`

Supporting shell files now include:

- `src/app/routes.ts`
- `src/app/navigation.ts`
- `src/app/routeViews.tsx`
- `src/app/AppShell.tsx`
- `src/app/useAppShellController.ts`
- `src/app/useAppShellEffects.ts`
- `src/app/AppShellRoutes.tsx`
- `src/components/ui/GlobalSearch.tsx`
- `src/components/ui/omniboxModel.ts`

`src/app/useAppShellController.ts` now delegates initialization, location tracking, and theme-application effects to `src/app/useAppShellEffects.ts`, keeping the controller focused on launch orchestration and surface commands.

The app-shell controller now also relies on dedicated helper seams:

- `src/app/appShellLaunchHelpers.ts` for launch/run config shaping and preseeded-entity merge behavior
- `src/app/appShellOpenChatHelpers.ts` for launch-context chat title/primer decisions
- `src/app/appShellNavigationHelpers.ts` for record-id to route-target resolution

Canonical path inventory:

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

Route/state ownership is intentionally split this way:

- URL state should own durable location such as the active workspace, artifact, board, chat session, and timeline filter/search context
- store state should continue to own domain records, generation state, drafts, panel visibility, and other transient UI details that do not need bookmarkable permanence

Examples captured directly in `src/app/routes.ts`:

- timeline query state (`search`, `range`, `tracks`, `focusTrack`, `focusRefId`) is designated URL-owned
- artifact inspector panel visibility and temporary selection state remain store/component-owned
- board agent drafts, chat composer drafts, and other transient workflow state remain store/component-owned

Route wrappers now enforce the same contract at runtime:

- `TimelineView` round-trips chronology query state through `useSearchParams` with parsing/serialization centralized in `src/components/features/Timeline/timelineRouteState.ts`
- the bare workspace chat route (`/workspaces/:workspaceId/chat`) clears stale deep-linked session selection when no `sessionId` is present
- the bare workspace board route (`/workspaces/:workspaceId/board`) redirects to the first valid board document when one exists, and invalid board ids fall back to that same canonical board route

The route contract is now active runtime behavior rather than future groundwork. `AppView` still exists only as a coarse navigation label for the sidebar and route-targeting helpers, while URL-backed routing is the primary navigation mechanism.

### Feature extraction contract

The active cross-feature refactor uses one shared extraction pattern for routed feature surfaces. Some features are already aligned to it, and the remaining slice work should continue following the same contract:

- route/page files stay responsible for route params, layout composition, and wiring feature sections together
- `useXxxController` hooks own feature-local state, effects, command handlers, navigation handoff, and store/runtime orchestration
- `buildXxxViewModel` modules stay pure and derive display-ready state from already-fetched inputs
- feature section components receive narrow props and avoid reaching back into the global store unless the section is the store boundary on purpose
- feature-local workflow UI such as dialogs, overlays, and export menus should move toward `XxxDialogs`, `XxxMenu`, or similarly named modules once the controller seam exists
- feature selector hooks should stay store-only and expose narrower slices to controllers rather than mirroring whole-store access patterns

Use these seams deliberately:

- extract to a controller hook when the code owns async flows, side effects, modal state, or cross-surface commands
- extract to a view-model/util module when the logic is pure derivation, filtering, grouping, or label shaping
- extract to a section component when the main page is carrying a large render subtree that can take data-in and callbacks-out
- extract to a shared UI/runtime module only when multiple features already share the same behavior without feature-specific branching

Additional constraints for the remaining slice work:

- pure view-model/util modules must not import React components, router hooks, browser-dialog APIs, `tldraw`, or mixed UI helper modules
- controller hooks should shed pure derivation and repetitive action-shaping once those seams become obvious
- shared runtime-config modules should centralize overlapping field state, mapping, and capability behavior without feature-specific branching

Naming is intentionally literal rather than clever:

- `useChatController`
- `useWorkspaceBoardController`
- `useSettingsController`
- `useNetworkGraphController`
- `buildTimelineViewModel`
- `TimelineDetailRail`
- `WorkspaceBoardDialogs`

This contract is meant to keep future slice work consistent: controller for orchestration, view-model for pure derivation, sections for presentation, and shared modules only where overlap is already real.

## 2. Launch Pipeline

All launches still converge through `launchInvestigation` in `src/app/useAppShellController.ts`.

Flow:

1. Resolve runtime-config fields through `src/components/features/Runs/runtimeConfigMapping.ts`
2. Enforce provider API key presence before task creation
3. Resolve effective scope, domain pack, purpose profile, artifact type, and label profile
4. Create and persist a workspace run (`TaskRepository`)
5. Execute the provider run via `runWorkspaceInvestigation`
6. Normalize typed artifact sections and run metadata
7. Save the resulting artifact into the canonical workspace/artifact store
8. Persist run config snapshots for traceability

Run config snapshots now include:

- `scopeId` and `scopeName`
- `packId` and `packName`
- `purposeId` and `purposeName`
- `artifactType`
- `labelProfileId`
- date-range, launch source, and provider/model snapshots
- lineage refs such as `sourceSignalId`, `sourceFollowUpId`, `parentArtifactId`, `parentRunId`, `sourceRunId`, and `producedArtifactId` when available

Launch handling now derives missing lineage refs from already-known parent artifacts and runs before task persistence so downstream chronology surfaces do not have to rely on topic inference as often.

Launch sources currently used:

- `FEED_SEARCH`
- `FEED_WIZARD`
- `LIVE_MONITOR_EVENT`
- `OPERATION_HEADLINE`
- `FULL_SPECTRUM`
- `SETTINGS_TEMPLATE`

## 3. Domain Runtime Layer

Domain runtime helpers live in:

- `src/domain/index.ts`
- `src/domain/packs.ts`
- `src/domain/purposes.ts`
- `src/domain/labels.ts`
- `src/domain/artifacts.ts`
- `src/domain/presentation.ts`
- `src/domain/workspaces.ts`
- `src/domain/vocabulary.ts`

Key responsibilities:

- derive first-party domain packs from scopes
- resolve purpose profiles for each run
- resolve label profiles for compatibility rendering
- resolve clean workspace display identity separately from launch metadata, while keeping compatibility with legacy tagged workspace titles
- expose the canonical shell noun map (`Workspace`, `Artifact`, `Run`, `Signal`, `Source`, `Item`) so top-level product chrome does not drift by label profile
- normalize canonical `Signal` and `FollowUp` runtime records alongside persistence compatibility aliases
- build typed artifact sections alongside legacy flattened fields
- provide pack-aware launch copy, purpose-aware setup labels, starter templates, export naming, and legacy title cleanup helpers

## 4. AI Provider Layer

App-facing runtime facade:

- `src/services/runtime.ts`

Provider router and adapters:

- `src/services/providers/index.ts`
- `src/services/providers/geminiProvider.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`

Shared provider utilities:

- `src/services/providers/shared/*`
  - error normalization
  - retry policy
  - JSON parsing fallbacks
  - output normalization
  - prompt builders
  - shared chat message shaping
  - artifact contract normalization

Model registry and provider defaults:

- `src/config/aiModels.ts`
- `src/config/systemConfig.ts`

Key behavior:

- model selection is now capability-aware at the selected-model level rather than only the provider level
- `aiModels.ts` exposes static direct-provider models plus a dynamic OpenRouter catalog backed by bundled snapshot, local cache, live refresh, curated quick picks, recent selections, and manual slug support
- router enforces provider/model alignment and capability checks
- router resolves a pack and purpose profile for each run
- router now exposes a sibling `CHAT` runtime path for workspace-grounded conversational turns
- router now exposes a sibling `BOARD_AGENT` runtime path for workspace-board planning turns with structured action outputs
- router now exposes both non-streaming and streaming chat paths with a provider-agnostic event envelope and abort support
- router now exposes both non-streaming and streaming board-agent paths with structured action events parsed from a Sherlock-owned tagged protocol
- adapters now share a stronger request/response shape for both chat and artifact generation, including model-aware capability handling and warning surfaces
- adapters now share a board-agent planning contract that keeps BYOK/model selection aligned with the rest of the app instead of introducing a separate board-only provider stack
- the board-agent runtime now layers a Sherlock-owned session runner plus action registry on top of the provider router so streamed planning actions can be sanitized, executed, audited, and continued without introducing a second provider subsystem
- adapters return typed artifact sections plus canonical `followUps`; legacy `summary`, `agendas`, and `leads` compatibility fields are still populated for transitional readers
- chat adapters accept message arrays plus deterministic workspace retrieval bundles, support streaming output on all active providers, and return structured citations/provenance
- TTS is only implemented on Gemini adapter
- OpenRouter uses native message arrays, requests native structured output when available, and enables `openrouter:web_search` by default when the active configuration allows it
- provider debug logs use `[provider-router]` metadata

## 5. Persistence Model

Sherlock persists core application data to SQLite in-browser.

Runtime storage stack:

- wa-sqlite WASM (`public/wa-sqlite-async.wasm`)
- IndexedDB VFS (`IDBBatchAtomicVFS`)
- Drizzle ORM proxy driver

Entry points:

- `src/services/db/client.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/*`

The schema still uses compatibility table names such as `cases`, `reports`, and `tasks`, while runtime code treats them as workspaces, artifacts, and workspace runs:

- `cases` can now hold workspace-oriented metadata such as `displayTitle`, `launchTopic`, `launchAngle`, `prioritySourcesSummary`, `mode`, `packId`, `purposeId`, and `labelProfileId`
- `reports` now store `artifactType`, pack/purpose references, label profiles, config snapshots, and metadata JSON including provider provenance
- `follow_ups` now persist first-class actionable follow-up records linked to artifacts and lineage refs such as `sourceSignalId` and `resolvedByArtifactId`
- `artifact_sections` persists typed section rows separately from the legacy flattened report fields, with section ids scoped per report rather than globally across the table
- `artifact_evidence` persists first-class evidence rows for artifact claims, citations, quotes, and source hints
- `tasks` now persist pack/purpose/artifact metadata alongside the config snapshot
- `chat_sessions`, `chat_messages`, `chat_message_attachments`, and `chat_actions` persist workspace-bound chat history and auditable retrieval traces
- `workspace_items` persist canonical workspace-native notes, links, files/media, and promoted excerpts with provenance
- `workspace_boards` persist named board/page shells per workspace
- `workspace_board_documents` persist tldraw board snapshots separately from canonical research records
- `board_agent_sessions` and `board_agent_actions` persist board-agent task state plus action audit trails for workspace boards

Artifact persistence still uses the existing `reports` table, while `follow_ups`, `artifact_sections`, and `artifact_evidence` carry richer structured output alongside the legacy flattened artifact fields. `configJson` now carries explicit lineage refs and generation-mode snapshots that Timeline and other runtime surfaces use directly.

Repository write paths that span multiple tables now use the shared `runWriteTransaction(...)` helper from `src/services/db/client.ts` so artifact saves, chat attachment saves, workspace deletes, demo-seed imports, and workspace-data restore flows commit atomically instead of relying on sequential best effort. Repository helpers may join an existing transaction, but must not silently open a nested one.

Maintenance flows now treat SQLite data as a workspace-data domain:

- Settings export/import use a canonical backup payload with `workspaces`, `artifacts`, `runs`, `chat`, `boardAgent`, `signals`, `graph`, `workspaceSurface`, `templates`, and `metadata`
- workspace-data restore clears the current workspace-data domain and replays the backup inside one transaction
- app-level settings such as theme, provider defaults, and API keys remain outside workspace backup/restore

Migration:

- `src/services/db/migrate.ts` migrates prior `localStorage` Zustand payload (`sherlock-storage`) into SQLite one time
- `src/services/db/client.ts` applies additive schema upgrades for existing local databases, including rebuilding `artifact_sections` when older installs still use the legacy global section-id primary key

Canonical signal naming now leads the active runtime seams even where compatibility aliases remain:

- repositories expose `getSignals(...)` / `createSignal(...)` as the primary saved-signal API, while `getHeadlines(...)` / `createHeadline(...)` remain compatibility wrappers
- chat retrieval attachments, workspace-search snippets, and board/library refs now prefer `SIGNAL` as the ref/attachment kind
- backup payloads now write canonical signal snapshots under `signals.signals`, while legacy `signals.headlines` snapshots are still accepted during restore/import

## 6. State Layer

Global store:

- `src/store/caseStore.ts`
- `src/store/actions/bootstrapActions.ts`
- `src/store/actions/simpleActions.ts`
- `src/store/actions/conversationActions.ts`
- `src/store/actions/artifactRunActions.ts`
- `src/store/actions/workspaceActions.ts`
- `src/store/selectors/featureSelectors.ts`

State domains include:

- workspaces, artifacts, workspace runs, and saved signals
- workspace-native library items, board/page shells, and board documents
- chat sessions, messages, generation state, and launch context
- board-agent sessions and action audit history
- pack-aware report config snapshots
- canonical follow-up lineage on artifacts
- typed artifact sections
- manual graph nodes/links
- entity aliases and hide/flag sets
- theme mode, accent surfaces, and font-role selections
- scopes and templates
- feed config and UI state

`src/store/caseStore.ts` is now primarily the public state contract plus initial state composition; grouped action modules own bootstrap, UI/settings, conversation, artifact/run, and workspace maintenance responsibilities behind that stable store entry.

Feature-level subscriptions now route through selector hooks in `src/store/selectors/featureSelectors.ts` for the largest routed surfaces and controllers. That keeps `useAppShellController`, chat, board, timeline, network graph, operation, settings, and runtime-config flows subscribed to their own state slices without changing the underlying Zustand architecture or introducing a second state system.

App-shell subscriptions are explicitly split by responsibility instead of one broad selector:

- `useAppShellLaunchTaskState`
- `useAppShellRouteState`
- `useAppShellThemeUiState`
- `useAppShellLookupState`
- `useAppShellBootstrapState`

Settings selectors are also split so persistence-maintenance reads and scope tab reads do not share one broad subscription:

- `useSettingsDataMaintenanceState`
- `useSettingsScopeState`

Persistence writes are handled through repository calls and settings KV writes rather than direct feature-level `localStorage` use. The remaining browser-persisted non-SQLite values now flow through typed helpers in `src/utils/localStorage.ts`, including dedicated helpers for system config, cached OpenRouter catalog data, recent model selections, omnibox recent destinations, active workspace id, and monitor autosave. Provider keys and one-time legacy migration remain the only intentional direct `localStorage` exceptions.

The browser location is now the durable source of truth for active page identity. Store state keeps route-adjacent convenience selection such as the active workspace, board, chat session, and task ids, but it no longer mirrors top-level surface identity through a stored `currentView` field.

## 7. Feature Composition

Routed workflow surfaces now share a baseline chrome/panel contract rather than styling headers and side rails independently:

- `src/components/ui/chrome.ts` provides shared toolbar/header spacing and menu/toggle button treatments
- `src/components/ui/Accordion.tsx` is the shared section shell for dossier/inspector rails, including compact count badges instead of parenthetical count noise
- right-side inspector/detail panels default to section-collapsed content, and left library/dossier rails keep their internal sections collapsed by default even when the rail itself is open
- ambient matrix-rain backgrounds are reserved for active-running states instead of steady-state routed pages such as Operation View and Timeline

### Operation View

`src/components/features/OperationView/*`

- Toolbar
- DossierPanel
- ReportViewer
- InspectorPanel
- `useOperationViewController.ts` now owns route-level selection state, handoff commands, template-save flow, and board/chat orchestration while `index.tsx` stays focused on layout and modal composition
- `OperationViewDialogs.tsx` now holds the lead follow-through modal, new-workspace modal, and protocol-template save dialog so workflow copy and launch boundaries live outside the page shell

Supports deep dives, follow-up execution, signal follow-through, launch-into-chat handoff for the active artifact plus inspected entities/signals, workspace/artifact editing, entity rename flows, and workspace/artifact exports.

Operation View now also includes board handoff for the active artifact plus inspected entities and headlines, reusing canonical identifiers rather than creating board-only report copies.

### Research Workspace

`src/components/features/WorkspaceBoard/*`

- dedicated canvas-first workspace surface built on `tldraw`
- route-backed workspace/board/library/session derivation centralized in `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts`
- multiple named boards/pages per workspace with persisted board snapshots
- canonical library drawer for artifacts, entities, sources, signals, notes, links, files/media, and promoted excerpts
- drag/drop or click-to-place flows from canonical library into the active board
- presentation mode plus manual-first AI actions for selection summaries and drafted board notes
- Sherlock-owned board-agent groundwork under `src/services/workspace/agent/*`, including pure snapshot parsing and prompt-part context assembly for selected, visible, and linked board state
- a board-agent runtime wrapper that turns persisted board state plus bounded prompt parts into provider-router `BOARD_AGENT` requests
- a board-agent session runner and action registry that execute safe board actions plus Sherlock-aware canonical writes against the live `tldraw` editor while persisting audit status updates in `board_agent_actions`
- board inspector request entry, live task state, todo tracking, cancellation, and recent action audit history for the latest board-agent session
- cross-surface placement handoff respects presentation mode rather than mutating readonly boards
- inspector actions back into reports, workspace chat, timeline, network graph, source links, and promoted-item provenance
- Sherlock-themed board chrome that reuses the existing panel/header/button vocabulary instead of introducing a parallel UI system
- `BoardTopBar.tsx`, `BoardCanvasPane.tsx`, `BoardLibraryRail.tsx`, `BoardInspectorRail.tsx`, `BoardAgentRail.tsx`, and `BoardDialogs.tsx` now isolate the major board sections from the route shell
- controller responsibilities are split further across `useBoardCanvasPersistence.ts`, `workspaceBoardItemActions.ts`, `boardInspectorActions.ts`, and `workspaceBoardAgent.ts` so the public controller stays focused on orchestration

`ReportViewer` and `DossierPanel` now also surface:

- evidence records as first-class report content
- methodology sections when present
- provider/model/generation-mode badges
- provenance warnings and web-search usage hints

### Chat

`src/components/features/Chat/ChatPage.tsx`

- dedicated workspace-bound chat page
- persisted session switching, rename, delete, and guided-run session flows
- streaming grounded answers backed by deterministic workspace retrieval
- stop/cancel handling for in-flight assistant turns
- bounded retrieval actions for artifact summaries, full artifact text, and recent signals
- `@` mention autocomplete for canonical workspace artifacts, items, entities, and saved signals from the active workspace
- resolved mention refs persist on the user turn metadata, feed an explicit mentioned-record context block into retrieval, and render back out of the transcript as reopenable inline tokens
- save-as-artifact, append-to-artifact, and follow-up-run actions with persisted `chat_actions`
- retrieval attachments can now be promoted into canonical workspace excerpts and optionally placed directly onto the research board
- transcript copy plus Markdown/JSON export
- guided conversational run builder that maps into the same launch request shape used by `src/components/features/Runs/TaskSetupModal.tsx`
- context drawer with recent artifacts, recent signals, pinned launch context, last-turn retrieval snippets, and action log
- contextual handoff from Operation View, Archives, and Network Graph into the same session backend, with report/entity/signal grounding persisted on the target chat session
- `ChatHeader.tsx`, `ChatSessionRail.tsx`, `ChatTranscript.tsx`, `ChatComposer.tsx`, `ChatContextRail.tsx`, and `ChatDialogs.tsx` now keep the routed page shell focused on header/layout wiring rather than the full transcript and modal tree
- controller responsibilities are split across `chatSessionLifecycle.ts`, `chatStreaming.ts`, `chatGuidedActions.ts`, and `chatTranscriptActions.ts` so the routed chat controller no longer carries every session, streaming, and transcript workflow inline

`ReportViewer` now renders:

- typed summary sections
- supplemental sections such as findings, methodology, implications, or timeline
- compatibility-mapped lead and anomaly sections for legacy artifacts
- purpose-ordered section layouts with dedicated timeline and findings treatments
- pack-aware section titles that map legacy labels into broader workspace terminology

### Network Graph

`src/components/features/NetworkGraph/*`

- D3 canvas rendering
- `src/components/features/NetworkGraph/useNetworkGraphController.ts` now owns inspector selection, graph mutations, board/chat handoffs, and modal state while `index.tsx` stays focused on composing the control bar, canvas, dossier, and inspector surfaces
- case/report/entity node inspection
- launch-into-chat handoff for inspected reports, entities, and headlines
- board handoff for inspected reports, entities, and headlines
- manual node/link creation
- source nodes derived from artifact sources for non-investigation graph work
- broader manual node semantics for concepts and sources alongside legacy people and organizations
- hidden/flagged filters
- entity resolution workflow
- `useNetworkGraphUiState.ts`, `useNetworkGraphInspectorState.ts`, and `networkGraphWorkspaceHandoffs.ts` now split controller concerns across UI state, inspector selection, and board/chat handoff helpers
- `NetworkGraphDialogs.tsx` and `NetworkGraphAddNodeOverlay.tsx` now isolate add-node, resolution, delete-confirm, and lead-investigation workflow UI from the main route shell

### Live Monitor

`src/components/features/LiveMonitor/*`

- batch scan runs
- source/threat filters
- optional auto-save to headlines
- launch into task setup from events

Live monitor requests now resolve through the active scope's derived pack and default purpose.

### Files

`src/components/features/Archives.tsx`

- workspace/file browsing now mixes saved artifacts with canonical workspace items instead of treating items as board-only records
- selected-workspace browsing supports `All`, `Artifacts`, and `Items` filtering over the same workspace-scoped list
- artifact rows still route into saved artifact detail and now share the same chat and board handoff verbs exposed by the omnibox
- workspace-item rows expose provenance-aware summaries plus direct workspace-chat, board-placement, and source-link actions

### Timeline

`src/components/features/TimelineView.tsx`

- routed chronology page with header search, filters popout, dossier, central event stream, and details drawer
- `src/components/features/Timeline/useTimelineViewController.ts` now owns route-query wiring, export/save commands, board/chat handoffs, and detail action composition while `TimelineView.tsx` stays focused on route shell layout
- timeline query parsing/serialization lives in `src/components/features/Timeline/timelineRouteState.ts`
- normalized `TimelineEvent` derivation in `src/components/features/Timeline/timelineEvents.ts`
- route-backed chronology derivation and related selection state are centralized in `src/components/features/Timeline/timelineViewModel.ts`
- default-on chronology for saved signals, runs, and artifacts
- default-on `ITEM` track for canonical workspace-item creation, promotion, and material-update events
- opt-in secondary `ENTITY` track for first-seen moments, repeated-mention thresholds, and artifact-backed reappearance milestones
- opt-in secondary `CHAT` track for chat session starts plus high-signal chat actions (`SEARCH_WORKSPACE`, saved artifact drafts, append-note actions, and follow-up launches)
- lineage rendering across signal, run, artifact, entity, and chat relationships without introducing a new persistence schema
- explicit lineage ids now drive timeline run/artifact derivation and nearby report-navigation helpers
- smaller-breakpoint header controls now keep workspace switching and chronology search visible without opening the dossier first
- click-through into saved artifacts and exact workspace chat sessions from timeline events
- board handoff for timeline-selected artifacts, entities, and signals
- timeline snapshot export in JSON/Markdown plus save-as-artifact support for `artifactType: TIMELINE`
- `TimelineToolbar.tsx`, `TimelineFiltersPanel.tsx`, `TimelineExportMenu.tsx`, `TimelineDossierPanel.tsx`, `TimelineEventList.tsx`, and `TimelineDetailRail.tsx` now own the major timeline sections so the route shell mainly coordinates route state and layout
- query updates and detail action shaping now live in `timelineQueryHelpers.ts` and `timelineDetailActions.ts`, keeping the view controller focused on orchestration

### Feed

`src/components/features/Feed.tsx`

- anomaly scanning
- scope-based categories
- custom search and run launches
- scanner settings (limit/priority/polling)

Finder still uses the existing UI, but scan requests now resolve through the selected scope's derived pack and default purpose.

Task setup and template flows now expose:

- domain pack selection
- purpose selection
- pack-specific starter prompts
- purpose-aware copy and output defaults
- generation-mode selection (`SINGLE_PASS` vs `STAGED`)
- model-aware capability messaging instead of provider-wide assumptions
- compact OpenRouter quick picks plus a dedicated browser modal for full catalog/manual slug entry
- template persistence for scope, pack, purpose, artifact type, and label profile metadata
- wizard state, pack/model derivation, and launch/template handlers centralized in `src/components/features/Runs/useTaskSetupState.ts`
- shared runtime-config behavior now routes through `useRuntimeConfigForm.ts`, `ProviderModelSelector.tsx`, `RuntimeConfigBehaviorControls.tsx`, `RuntimeConfigSummary.tsx`, and `OpenRouterSearchControls.tsx`, with launch-field shaping centralized in `runtimeConfigMapping.ts`
- the task-setup implementation now lives with the run-launch feature under `src/components/features/Runs/TaskSetupModal.tsx`, while the old UI path remains a compatibility re-export only

### Settings

`src/components/features/Settings/*`

- `/settings` now uses a thin tab shell in `index.tsx`
- `SettingsRuntimeTab.tsx`, `SettingsDataTab.tsx`, `SettingsScopesTab.tsx`, `SettingsTemplatesTab.tsx`, and `SettingsThemeTab.tsx` own the major tab render trees
- `useSettingsController.ts` is now a small facade over `useSettingsRuntimeState.ts`, `useSettingsDataState.ts`, and `useSettingsThemeState.ts`
- `SettingsDialogs.tsx` owns backup restore, purge confirmation, and import feedback boundaries instead of leaving those workflows inline in the page root
- the Runtime tab now reuses the same shared runtime-config modules used by task setup, guided chat, template authoring, and launch mapping

### Archives

`src/components/features/Archives.tsx`

- workspace/artifact navigation
- launch directly into workspace chat from workspace cards and saved artifacts
- deletion workflows
- exports (HTML/Markdown/JSON)
- canonical workspace/artifact shell naming with label-profile-aware artifact-specific copy retained inside export/rendering details where needed

## 8. Testing Coverage

Tests are currently concentrated in:

- route contract and route-wrapper canonicalization tests
- workspace-home landing canonicalization tests for artifact, board, and `/files` fallbacks
- timeline route-state and view-model seams
- workspace-board view-model seams
- extracted chat helper seams for launch-context summaries, guided-session metadata, and manual setup seeds
- provider parsing/contract tests
- provider router chat dispatch tests
- launch propagation tests across feature entry points
- config/store/key utility tests

See:

- `src/app/routes.test.ts`
- `src/app/routeViews.test.tsx`
- `src/components/features/Chat/chatPageUtils.test.ts`
- `src/components/features/Timeline/timelineRouteState.test.ts`
- `src/components/features/Timeline/timelineViewModel.test.ts`
- `src/components/features/TimelineView.test.tsx`
- `src/components/features/WorkspaceBoard/workspaceBoardViewModel.test.ts`
- `src/services/providers/*.test.ts`
- `src/components/features/*/launchPropagation.test.tsx`
- `src/store/caseStore.test.ts`
- `src/config/systemConfig.test.ts`

## 9. Bundle Review Checkpoint

Slice 7 closes with a documented bundle-review checkpoint instead of relying on build warnings as incidental output:

- run `npm run build` for shipped app changes, route changes, shared runtime changes, or shared UI changes
- treat any new Vite chunk warning as a regression until it is explained or reduced
- the currently known warning is the remaining `vendor-tldraw-app` chunk crossing Vite's `500 kB` warning threshold from `vite.config.ts`
- if that known warning changes materially or any additional chunk starts warning, call it out in the handoff/PR notes with the exact chunk name

## 10. Notable Constraints

- Timeline is now a live feature surface with exportable timeline snapshots, while secondary chronology remains intentionally curated and lower-signal graph/chat audit traces stay out of the main stream.
- Some fallback simulation behavior is intentionally used when scan/live provider calls fail for reasons other than missing API keys.
- Active UI labels, export surfaces, and archive selection now follow the resolved label profile; remaining legacy investigation names are confined to compatibility-oriented internal types, table names, and migration paths.
- `Ctrl+N` now navigates to `/files` and opens the new-workspace modal rather than relying on old shell state.
- Current lint/test status is tracked in `README.md` and `docs/operations/LINTING.md`.
- Static hosting on Vercel is supported because runtime state, provider access, and persistence are browser-local; each origin keeps its own IndexedDB SQLite database and local BYOK settings, so preview URLs and the production domain do not share persisted data.
