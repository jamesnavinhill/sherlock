# Sherlock Architecture

This document describes the current runtime architecture as implemented in `src/`.

Repository note:

- `src/` remains the active Sherlock application.
- active plans live under `docs/plans/`, active reports live under `docs/reports/`, and historical planning/report artifacts live under `docs/_legacy/`

Sherlock now runs on a canonical workspace architecture. The domain-pack shell remains in place, but runtime execution resolves a generic pack, purpose profile, and artifact contract under the settled `Workspace -> Artifact -> WorkspaceRun` model.

## 1. Application Shell

`src/App.tsx` is now a thin entry export over the route-backed shell in `src/app/AppShell.tsx`.

Responsibilities:

- initializes persistence/state (`useWorkspaceStore().initializeStore()`, exported from `src/store/workspaceStore.ts`)
- mounts the browser router and route-backed page composition
- mounts the shared header omnibox/search surface used for route, workspace, and canonical-record lookup
- owns the unified launch pipeline
- resolves domain-pack and purpose metadata into run config
- wires lazy-loaded route pages and route wrappers
- applies one unified Sherlock theme workspace to runtime CSS variables

`/` and unknown routes now redirect to `/welcome`, giving first-time visitors a public landing page before they enter the main app shell. The welcome CTA reuses the existing API key modal and only routes into `/files` after the user authenticates or explicitly chooses to browse without a key.

Primary route-backed surfaces:

- `LandingPage` at `/welcome`
- `Feed` at `/discover`
- `Files` at `/files`
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
- `src/app/routeViewHelpers.ts`
- `src/app/AppShell.tsx`
- `src/app/workbench/AppWorkbenchContext.ts`
- `src/app/workbench/AppWorkbenchHostProvider.tsx`
- `src/app/workbench/AppWorkbenchHost.tsx`
- `src/app/workbench/useAppWorkbenchHost.ts`
- `src/app/useAppShellController.ts`
- `src/app/useAppShellEffects.ts`
- `src/app/useAppShellLaunch.ts`
- `src/app/useAppShellNavigation.ts`
- `src/app/AppShellRoutes.tsx`
- `src/components/ui/GlobalSearch.tsx`
- `src/components/ui/omniboxFocus.ts`
- `src/components/ui/omniboxModel.ts`
- `src/components/ui/chrome.ts`
- `src/components/features/WorkspaceHome/index.tsx`
- `src/services/workspace/home.ts`

`src/app/useAppShellController.ts` now delegates initialization, location tracking, and theme-application effects to `src/app/useAppShellEffects.ts`, keeping the controller focused on launch orchestration and surface commands.

The app-shell controller now also relies on dedicated helper seams:

- `src/app/appShellLaunchHelpers.ts` for launch/run config shaping and preseeded-entity merge behavior
- `src/app/appShellOpenChatHelpers.ts` for launch-context chat title/primer decisions
- `src/app/appShellNavigationHelpers.ts` for record-id to route-target resolution
- `src/app/useAppShellLaunch.ts` for run-launch orchestration and lineage-aware task execution
- `src/app/useAppShellNavigation.ts` for route-target and record-target navigation handlers
- `src/app/routeViewHelpers.ts` for pure route-side artifact, board, and breadcrumb derivation

Canonical path inventory:

- `/welcome`
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
- files focus state (`workspaceId`, `focusItemId`) is URL-owned so canonical workspace items resolve to a stable Files destination
- artifact reading focus state (`focusSectionId`, `focusEvidenceId`, `inspector`) is URL-owned so search/omnibox opens can land on a precise reading target
- network entity focus (`focusEntity`) is URL-owned so entity mentions and omnibox results can reopen the graph in a focused state
- artifact/entity/headline temporary inspector selection beyond the current report focus remains store/component-owned
- board agent drafts, chat composer drafts, and other transient workflow state remain store/component-owned

Route wrappers now enforce the same contract at runtime:

- `WorkspaceHomeRouteView` now keeps `/workspaces/:workspaceId` in place and renders a lightweight overview backed by the workspace-home readiness model instead of redirecting immediately into artifacts or boards
- `TimelineView` round-trips chronology query state through `useSearchParams` with parsing/serialization centralized in `src/components/features/Timeline/timelineRouteState.ts`
- the bare workspace chat route (`/workspaces/:workspaceId/chat`) clears stale deep-linked session selection when no `sessionId` is present
- the bare workspace board route (`/workspaces/:workspaceId/board`) redirects to the first valid board document when one exists, and invalid board ids fall back to that same canonical board route

The route contract is now active runtime behavior rather than future groundwork. `AppView` still exists only as a coarse navigation label for the sidebar and route-targeting helpers, while URL-backed routing is the primary navigation mechanism.

### Shared chrome contract

Shared routed-surface chrome now lives in `src/components/ui/chrome.ts`.

That module currently centralizes:

- sticky header treatment for routed surfaces
- shared panel shell/header treatments
- common toolbar/menu/toggle/segmented-button classes

The Sherlock-owned route shell and dock layout primitives now live in:

- `src/components/system/layout/PageShell.tsx`
- `src/components/system/layout/DockPanel.tsx`
- `src/components/system/controls/FieldRow.tsx`
- `src/components/system/controls/PopupSurface.tsx`
- `src/components/system/controls/RangeField.tsx`
- `src/components/system/controls/DateRangePicker.tsx`
- `src/styles/system/shell.css`
- `src/styles/system/controls.css`
- `src/styles/system/surfaces.css`
- `src/styles/system/workbench.css`
- `src/system/theme/schema.ts`
- `src/system/theme/storage.ts`
- `src/system/theme/cssVars.ts`

Files, Feed, Live Monitor, Network Graph, Settings, Workspace Home, Chat, the Chat composer toolbar, and the shared omnibox header now consume those shared tokens rather than keeping separate one-off header and toolbar contracts.

Stage 4's routed-shell closeout is now active in runtime code:

- every in-app route mounted by `src/app/AppShellRoutes.tsx` except the public `LandingPage` now composes through `PageShell`
- `Files.tsx`, `Feed.tsx`, `LiveMonitor/index.tsx`, `WorkspaceHome/index.tsx`, `Chat/ChatPage.tsx`, `WorkspaceBoard/index.tsx`, `TimelineView.tsx`, `NetworkGraph/index.tsx`, `OperationView/index.tsx`, and `Settings/index.tsx` are now on the shared routed-shell contract
- shared mobile panel backdrops now use one shell backdrop treatment rather than per-route `bg-black/80` overlays
- `DockPanel` now carries a theme-backed `--osint-dock-width` contract, and shared rail/inspector shells default to the Sherlock theme's rail, utility, and sidebar width variables
- docked sidebar seams now consume the shared shell divider tokens, and sidebar/workbench header minimum heights follow the same toolbar-height token that drives the main page header
- route-local reader and dialog seams, including the artifact reader, board-agent rail, network graph overlays, and modal shell, now render through shared token-driven shell surfaces instead of route-specific dark wrappers
- timeline relationship chips now consume the Sherlock graph palette tokens so graph-color tuning reaches visible routed surfaces outside the settings workbench
- public landing, route fallback, and error-boundary surfaces remain intentionally outside the routed `PageShell` contract because they are app-shell entry/error states rather than workspace pages

Stage 5's app-shell workbench host is also now active in runtime code:

- `AppShell.tsx` now provides one shared workbench registry while `PageShell.tsx` mounts the shared host inside each routed page body, so the dock sits under page toolbars instead of stretching the entire app column
- `Sidebar.tsx` now exposes the global workbench trigger while the shared host owns app-level open/close and left/right dock placement
- routed consumers register utility content through `useRegisterAppWorkbenchPanel()` rather than rendering route-local right docks
- the global theme workbench now registers once at the app-shell level, so canon-style theme controls are available across routed workspace pages such as Viewer, Board, Graph, Timeline, Chat, and Settings
- `TimelineView.tsx` remains a route-level consumer and coexists with the global theme workbench through the shared multi-panel host registry instead of replacing it
- the host/provider split (`AppWorkbenchHostProvider.tsx`, `AppWorkbenchHost.tsx`, `useAppWorkbenchHost.ts`) now owns panel registration, active-panel switching, open/close state, and left/right dock placement without introducing a second docking system

The shared input/control layer now also has Sherlock-owned primitives instead of route-local slider/date markup:

- `RangeField` is the shared range-slider contract for theme tuning and runtime-behavior controls
- `DateRangePicker` is the shared absolute date-range contract for inline field layouts and toolbar-trigger popups
- `FieldRow` and `PopupSurface` provide the small supporting structure those controls reuse
- Settings, Run Setup, Guided Run Builder, Feed, Live Monitor, and the shared thinking-budget control now render through that layer instead of keeping separate raw `input[type="range"]` or paired `input[type="date"]` seams

The active visual-theme runtime now uses one Sherlock-owned theme workspace:

- `theme_workspace` stores saved and draft theme templates, while the app-level `theme_mode` setting is the single source of truth for the live dark/light display mode
- each workspace entry contains `savedThemes`, `draftThemes`, and an `activeThemeId`; theme templates no longer own the current display mode
- each theme template now stores mode-scoped `accent`, `graphs`, `background`, `surfaces`, and shell divider values, while shared shell geometry/rendering, typography, radii, and control chrome stay single-valued per template
- `src/app/useAppShellEffects.ts` now applies one `buildSherlockThemeCssVars(activeTheme, themeMode)` result to the document so preset selection and display-mode switching are cleanly decoupled
- legacy split theme fragments other than the active `theme_mode` display-mode setting (`accent_settings`, `theme_surface_settings`, `theme_font_settings`, `theme_background_settings`) are migration inputs only; bootstrap reads them only when `theme_workspace` is missing, and the active compatibility helpers now live under `src/system/theme/legacy/splitTheme.ts`

### Shared panel foundations

The panel-heavy routed surfaces now also share panel primitives instead of each maintaining separate accordion shells and inspector chrome.

Primary shared panel files:

- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/LibraryRail/LibraryRailHeader.tsx`
- `src/components/features/LibraryRail/LibraryRailSections.tsx`
- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- `src/components/features/Inspector/GlobalInspectorHeader.tsx`
- `src/components/features/Inspector/GlobalInspectorSections.tsx`
- `src/components/features/shared/useExclusivePanelSections.ts`

Current panel-system rules:

- route-owned surfaces should keep their own data shaping, actions, and copy while rendering through the shared library-rail or global-inspector shells
- exclusive open/close behavior for accordion-style panel sections should use `useExclusivePanelSections.ts` rather than per-surface toggle helpers
- Operation View, Timeline, Network Graph, Chat, and WorkspaceBoard now all render their routed rail/inspector chrome through these shared panel contracts instead of keeping separate shell implementations
- WorkspaceBoard also uses the shared tab shell for its `Inspector` and `Agent` right-panel views
- ArtifactViewer's detail sidebar is an intentionally specialized shared consumer that composes `LibraryRailHeader.tsx` and `LibraryRailSections.tsx` directly rather than adopting `LibraryRailShell.tsx`, because it is a right-side reader support surface inside the artifact view
- route-local panel components remain the intended adapter layer so focus, selection, handoff behavior, and surface-specific copy stay owned by their feature even though the chrome is shared

### Shared icon contract

Sherlock now uses one curated local application-icon registry for user-selectable record icons instead of letting each surface persist raw third-party component names or invent local icon mappings.

Primary icon-system files:

- `src/lib/appIcons.tsx`
- `src/components/ui/IconPickerOverlay.tsx`

Current icon-system rules:

- `src/lib/appIcons.tsx` is the single registry for approved icon ids, pack metadata, fallback helpers, and board-safe SVG data-url generation
- the registry can mix multiple local icon packs behind one typed `AppIconId` contract; current packs include Sherlock's original Lucide defaults plus Tabler and Pixelarticons selections
- persistence stores typed icon ids, not raw component imports or display labels
- `Workspace.iconId` is the source of truth for customizable workspace icons in Files and other workspace-facing surfaces
- `ManualNode.iconId` is the source of truth for manual network-node overrides
- `WorkspaceLibraryEntry.iconId` is derived data and should be rendered as-is by board/library surfaces rather than recomputed locally
- Files workspace-icon customization, board icon insertion, and network manual-node overrides should all reuse `IconPickerOverlay` so icon selection stays visually and behaviorally consistent across surfaces
- board placement keeps using generated SVG data URLs for icon assets so tldraw export paths remain self-contained

Fallback behavior stays simple:

- workspace-facing surfaces fall back to the default folder icon
- manual network nodes fall back to the built-in report/entity subtype mapping
- artifact-derived entities may optionally carry `Entity.iconId`, but subtype-driven defaults remain the normal path when no explicit icon is present

### Workspace-home readiness contract

This round still stops short of a full dashboard-style global home, but it now leaves behind the runtime contract the next round will build on:

- `selectWorkspaceHomeReadinessState` in `src/store/selectors/workspaceHomeSelectors.ts` exposes the canonical workspace-home input slice
- `src/services/workspace/home.ts` derives summary counts, board state, recent activity, and saved-view summaries
- `src/components/features/WorkspaceHome/index.tsx` uses that readiness model to render the canonical workspace landing route without introducing a second persistence path
- the resulting page is a real lightweight workspace overview at `/workspaces/:workspaceId`, not the app-wide homepage/dashboard

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
- `TimelineInspectorPanel`
- `WorkspaceBoardDialogs`

This contract is meant to keep future slice work consistent: controller for orchestration, view-model for pure derivation, sections for presentation, and shared modules only where overlap is already real.

## 2. Launch Pipeline

All launches still converge through `launchInvestigation` in `src/app/useAppShellController.ts`.

Flow:

1. Resolve runtime-config fields through `src/components/features/Runs/runtimeConfigMapping.ts`
2. Enforce provider API key presence before task creation
3. Resolve effective scope, domain pack, purpose profile, artifact type, and label profile
4. Create and persist a workspace run (`WorkspaceRunRepository`)
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
- `src/services/runtime/*`

Provider router and adapters:

- `src/services/providers/index.ts`
- `src/services/providers/routerContext.ts`
- `src/services/providers/geminiProvider.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`

Shared provider utilities:

- `src/services/providers/shared/*`
  - error normalization
  - retry policy
  - direct-provider JSON request and SSE transport helpers
  - shared simulated fallback builders for feed/live surfaces
  - shared scan/live normalization and fallback control-flow helpers
  - JSON parsing fallbacks
  - output normalization
  - prompt builders
  - shared chat message shaping
  - artifact contract normalization

Model registry and provider defaults:

- `src/config/aiModels.ts`
- `src/config/aiModels/*`
- `src/config/systemConfig.ts`

Key behavior:

- model selection is now capability-aware at the selected-model level rather than only the provider level
- `src/config/aiModels/staticCatalog.ts` now owns bundled direct-provider and OpenRouter snapshot model data
- `src/config/aiModels/openRouterCatalog.ts` now owns OpenRouter catalog refresh, cache hydration, bundled snapshot fallback, and curated quick-pick shaping
- `src/config/aiModels/modelSelection.ts` now owns provider/model lookup, capability derivation, recent selection persistence, and manual OpenRouter slug support
- `aiModels.ts` remains the stable public barrel for feature/runtime imports while the model-catalog/runtime-config seam is internally split into smaller canonical modules
- `src/services/runtime/providerOperations.ts` now owns the app-facing investigate/feed/live/TTS router wrappers, while `src/services/runtime/providerKeys.ts` owns active-provider key orchestration and Gemini client reset behavior
- `src/services/runtime.ts` remains the stable public barrel for app-facing runtime imports while the runtime/config seam is internally split into smaller canonical modules
- router enforces provider/model alignment and capability checks
- `routerContext.ts` now owns provider execution setup, capability gating, runtime logging, and shared scope/pack/purpose resolution for router entrypoints
- router resolves a pack and purpose profile for each run without repeating workspace/scope fallback logic in every operation handler
- `src/services/providers/shared/directTransport.ts` now owns the shared POST/error/SSE plumbing for OpenAI, Anthropic, and OpenRouter adapters so those files stay focused on provider-specific headers, request bodies, and response parsing
- router now exposes a sibling `CHAT` runtime path for workspace-grounded conversational turns
- router now exposes a sibling `BOARD_AGENT` runtime path for workspace-board planning turns with structured action outputs
- router now exposes both non-streaming and streaming chat paths with a provider-agnostic event envelope and abort support
- router now exposes both non-streaming and streaming board-agent paths with structured action events parsed from a Sherlock-owned tagged protocol
- adapters now share a stronger request/response shape for both chat and artifact generation, including model-aware capability handling and warning surfaces
- adapters now share a board-agent planning contract that keeps BYOK/model selection aligned with the rest of the app instead of introducing a separate board-only provider stack
- the board-agent runtime now layers a Sherlock-owned session runner plus action registry on top of the provider router so streamed planning actions can be sanitized, executed, audited, and continued without introducing a second provider subsystem
- adapters return typed artifact sections plus canonical `followUps`; legacy flattened `agendas` and `leads` fields remain only for older payload hydration and bounded compatibility import paths
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

The active schema now uses canonical table and column names that mirror the runtime vocabulary:

- `workspaces` hold workspace-oriented metadata such as `displayTitle`, `launchTopic`, `launchAngle`, `prioritySourcesSummary`, `mode`, `packId`, `purposeId`, `labelProfileId`, and optional `iconId`
- `artifacts` store `artifactType`, pack/purpose references, label profiles, config snapshots, and metadata JSON including provider provenance
- `key_findings` persist first-class findings with stable ids, origin artifact/section linkage, support refs, ordering, and finding-local metadata
- `follow_ups` now persist first-class actionable follow-up records linked to artifacts and lineage refs such as `sourceSignalId` and `resolvedByArtifactId`
- `artifact_sections` persists typed section rows separately from the legacy flattened artifact fields, with section ids scoped per artifact rather than globally across the table
- `artifact_evidence` persists first-class evidence rows for artifact claims, citations, quotes, and source hints
- `workspace_runs` persist pack/purpose/artifact metadata alongside the config snapshot
- `chat_sessions`, `chat_messages`, `chat_message_attachments`, and `chat_actions` persist workspace-bound chat history and auditable retrieval traces
- `workspace_items` persist canonical workspace-native notes, links, files/media, and promoted excerpts with provenance
- `workspace_boards` persist named board/page shells per workspace
- `workspace_board_documents` persist tldraw board snapshots separately from canonical research records
- `manual_nodes` persist manual graph-node labels, subtype, and optional `iconId`
- `board_agent_sessions` and `board_agent_actions` persist board-agent task state plus action audit trails for workspace boards

Artifact persistence now lands in the canonical `artifacts` table, while `key_findings`, `follow_ups`, `artifact_sections`, and `artifact_evidence` carry richer structured output alongside the flattened compatibility fields still written for import/export continuity. `Artifact.keyFindings` is the source of truth for findings, and `KEY_FINDINGS` sections are derived presentation. `configJson` carries explicit lineage refs and generation-mode snapshots that Timeline and other runtime surfaces use directly.

Repository write paths that span multiple tables now use the shared `runWriteTransaction(...)` helper from `src/services/db/client.ts` so artifact saves, chat attachment saves, workspace deletes, demo-seed imports, and workspace-data restore flows commit atomically instead of relying on sequential best effort. Repository helpers may join an existing transaction, but must not silently open a nested one.

Maintenance flows now treat SQLite data as a workspace-data domain:

- Settings export/import use a canonical backup payload with `workspaces`, `artifacts`, `runs`, `chat`, `boardAgent`, `signals`, `graph`, `workspaceSurface`, `templates`, and `metadata`
- workspace-data restore clears the current workspace-data domain and replays the backup inside one transaction
- app-level settings such as theme, provider defaults, and API keys remain outside workspace backup/restore

Migration:

- `src/services/db/client.ts` is the single persistence bootstrap entry point
- `src/services/db/migrations.ts` applies the ordered SQLite migration pipeline: canonical table/column cutover, schema bootstrap from `src/services/db/migrations_sql.ts`, and additive schema repairs for older local databases
- the migration runner records applied steps in SQLite table `__sherlock_schema_migrations`
- older local databases still get the `artifact_sections` rebuild when they use the legacy global section-id primary key
- the findings cutover backfills canonical `key_findings` rows from structured payload `keyFindings`, then existing `KEY_FINDINGS` sections, then legacy mixed-duty `agendas` as a bounded fallback
- legacy `sherlock-storage` Zustand payloads are no longer imported during bootstrap; canonical workspace-data backup/import is the supported transfer path

Canonical signal naming now leads the active runtime seams even where restore/import compatibility remains:

- repositories expose `getSignals(...)` / `createSignal(...)` as the primary saved-signal API
- chat retrieval attachments, workspace-search snippets, and board/library refs now prefer `SIGNAL` as the ref/attachment kind
- backup payloads now write canonical signal snapshots under `signals.signals`, while legacy `signals.headlines` snapshots are still accepted during restore/import normalization

Canonical finding naming now also leads the active runtime seams:

- providers normalize explicit `keyFindings` payloads into `Artifact.keyFindings`
- workspace search indexes `key_findings` rows directly as finding-native context snippets instead of reconstructing findings from generic section text
- chat mentions, chat launch context, chat attachments, and board refs can target a finding id directly
- the default left library still stays artifact/item/source-oriented; findings are directly searchable and placeable without becoming a passive browse category

## 6. State Layer

Global store:

- `src/store/workspaceStore.ts`
- `src/store/actions/bootstrapActions.ts`
- `src/store/actions/simpleActions.ts`
- `src/store/actions/conversationActions.ts`
- `src/store/actions/conversationActionState.ts`
- `src/store/actions/artifactRunActions.ts`
- `src/store/actions/artifactRunActionState.ts`
- `src/store/actions/workspaceActions.ts`
- `src/store/actions/workspaceActionState.ts`
- `src/store/selectors/appShellSelectors.ts`
- `src/store/selectors/chatSelectors.ts`
- `src/store/selectors/workspaceBoardSelectors.ts`
- `src/store/selectors/timelineSelectors.ts`
- `src/store/selectors/networkGraphSelectors.ts`
- `src/store/selectors/operationSelectors.ts`
- `src/store/selectors/settingsSelectors.ts`
- `src/store/selectors/runSetupSelectors.ts`
- `src/store/selectors/workspaceHomeSelectors.ts`

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
- theme workspace state, app-level theme mode, and derived compatibility theme slices
- scopes and templates
- feed config and UI state

`src/store/workspaceStore.ts` is now primarily the public state contract plus initial state composition; grouped action modules own bootstrap, UI/settings, conversation, artifact/run, and workspace maintenance responsibilities behind that stable store entry.

Feature-level subscriptions now route through surface-specific selector modules under `src/store/selectors/*Selectors.ts`. That keeps `useAppShellController`, chat, board, timeline, network graph, operation, settings, workspace-home, and runtime-config flows subscribed to their own state slices without relying on one kitchen-sink selector file or introducing a second state system.

App-shell subscriptions are explicitly split by responsibility instead of one broad selector:

- `useAppShellLaunchTaskState`
- `useAppShellRouteState`
- `useAppShellThemeUiState`
- `useAppShellLookupState`
- `useAppShellBootstrapState`

Settings selectors are also split so persistence-maintenance reads and scope tab reads do not share one broad subscription:

- `useSettingsDataMaintenanceState`
- `useSettingsScopeState`

Workspace maintenance action state shaping is also split out of the action creator now:

- `src/store/actions/workspaceActionState.ts` owns pure state transitions for workspace delete/purge/import/clear flows
- `src/store/actions/workspaceActions.ts` now focuses on repository coordination plus choosing the correct state transition helper

Conversation and artifact/run action shaping now follow the same pattern:

- `src/store/actions/conversationActionState.ts` owns pure chat-session, chat-message, and board-agent session/action record shaping plus local state transitions
- `src/store/actions/conversationActions.ts` now coordinates repository writes and then applies those pure conversation-state builders
- `src/store/actions/artifactRunActionState.ts` owns pure workspace-run transitions plus artifact-save planning/state updates
- `src/store/actions/artifactRunActions.ts` now handles repository coordination, alias persistence, and artifact-save orchestration around those pure builders

Route-to-chat opening also has a smaller contract:

- `src/app/openChatRequest.ts` now acts as a thin route-side orchestrator
- `src/app/appShellOpenChatHelpers.ts` now owns workspace resolution plus chat-session/primer input shaping for route-driven chat opens

Persistence writes are handled through repository calls and settings KV writes rather than direct feature-level `localStorage` use. The remaining browser-persisted non-SQLite values now flow through typed helpers in `src/utils/localStorage.ts`, including dedicated helpers for system config, cached OpenRouter catalog data, recent model selections, omnibox recent destinations, active workspace id, and monitor autosave. Provider keys remain the only intentional direct `localStorage` exception.

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
- WorkspaceLibraryRail
- ArtifactViewer
- OperationInspectorPanel
- `useOperationViewController.ts` now owns route-level selection state, template-save flow, and high-level board/chat orchestration while `useOperationViewInspectorState.ts` owns right-rail selection plus report/entity/headline handoff commands and `index.tsx` stays focused on layout and modal composition
- `OperationViewDialogs.tsx` now holds the lead follow-through modal, new-workspace modal, and protocol-template save dialog so workflow copy and launch boundaries live outside the page shell
- saved artifact routes can now carry `focusSectionId`, `focusEvidenceId`, and `inspector=REPORT`, which lets omnibox/search hits reopen the reader on a precise section/evidence target while defaulting the right rail to a current-artifact inspector
- `operationWorkspacePanelData.ts` now keeps the dossier-side workspace aggregation model on canonical workspace naming instead of the older case-labelled helper shape
- the route wrapper now composes through `PageShell`, and its workspace rail inherits the theme rail-width token through the shared dock contract

Supports deep dives, follow-up execution, signal follow-through, launch-into-chat handoff for the active artifact plus inspected entities/signals, workspace/artifact editing, entity rename flows, and workspace/artifact exports.

Operation View now also includes board handoff for the active artifact plus inspected entities and headlines, reusing canonical identifiers rather than creating board-only report copies.

### Research Workspace

`src/components/features/WorkspaceBoard/*`

- dedicated canvas-first workspace surface built on `tldraw`
- route-backed workspace/board/library/session derivation centralized in `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts`
- multiple named boards/pages per workspace with persisted board snapshots
- canonical library drawer for artifacts, entities, sources, signals, notes, links, files/media, and promoted excerpts
- board/library records now carry derived `iconId` metadata so rails and placed cards render from one shared icon source of truth
- drag/drop or click-to-place flows from canonical library into the active board
- omnibox board handoff now reuses the same queue/place path, but prefers focusing an existing linked card on the active board before placing a duplicate
- presentation mode plus manual-first AI actions for selection summaries and drafted board notes
- Sherlock-owned board-agent groundwork under `src/services/workspace/agent/*`, including pure snapshot parsing and prompt-part context assembly for selected, visible, and linked board state
- a board-agent runtime wrapper that turns persisted board state plus bounded prompt parts into provider-router `BOARD_AGENT` requests
- a board-agent session runner plus `sessionLifecycle.ts` helper seam that persist planned actions into `board_agent_actions`, pause for approval-first review, then execute safe board actions plus Sherlock-aware canonical writes against the live `tldraw` editor while persisting `AWAITING_APPROVAL`, `SKIPPED`, `COMPLETED`, and `FAILED` audit state transitions
- board inspector request entry, starter-intent menu, low-risk auto-approve toggle, review-sheet previews, todo tracking, cancellation, and action receipt/history for the latest board-agent session
- cross-surface placement handoff respects presentation mode rather than mutating readonly boards
- inspector actions back into artifacts, workspace chat, timeline, network graph, source links, and promoted-item provenance
- Sherlock-themed board chrome that reuses the existing panel/header/button vocabulary instead of introducing a parallel UI system
- `BoardTopBar.tsx`, `BoardCanvasPane.tsx`, `WorkspaceBoardLibraryRail.tsx`, `WorkspaceBoardInspectorPanel.tsx`, `BoardAgentRail.tsx`, and `BoardDialogs.tsx` now isolate the major board sections from the route shell
- controller responsibilities are split further across `useBoardCanvasPersistence.ts`, `useWorkspaceBoardPlacement.ts`, `useWorkspaceBoardAgentState.ts`, `useWorkspaceBoardLibraryState.ts`, `useWorkspaceBoardInspectorState.ts`, `workspaceBoardItemActions.ts`, and `workspaceBoardAgent.ts` so the public controller stays focused on route orchestration instead of carrying placement, board-agent review/session state, upload/dialog state, and inspector/library logic inline
- board-agent action execution now dispatches from the thin `actions/registry.ts` orchestrator into focused family modules in `actions/metaActions.ts`, `actions/boardMutationActions.ts`, and `actions/workspaceWriteActions.ts`, with shared normalization and shape/canonical-write helpers bounded in `actions/shared.ts`
- the route wrapper now composes through `PageShell`, and the board library rail now inherits the theme rail-width token through the shared dock contract

`ArtifactViewer` and `WorkspaceLibraryRail` now also surface:

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
- `@` mention autocomplete for canonical workspace artifacts, key findings, items, entities, and saved signals from the active workspace
- resolved mention refs persist on the user turn metadata, feed an explicit mentioned-record context block into retrieval, and render back out of the transcript as reopenable inline tokens
- save-as-artifact, append-to-artifact, and follow-up-run actions with persisted `chat_actions`
- retrieval attachments can now be promoted into canonical workspace excerpts and optionally placed directly onto the research board
- transcript copy plus Markdown/JSON export
- guided conversational run builder that maps into the same launch request shape used by `src/components/features/Runs/RunSetupModal.tsx`
- context drawer with recent artifacts, recent signals, pinned launch context, last-turn retrieval snippets, and action log
- contextual handoff from Operation View, Files, and Network Graph into the same session backend, with artifact/entity/signal grounding persisted on the target chat session
- finding-aware chat launch context can pin a specific finding and carry its origin artifact/section provenance into the session primer and attachment metadata
- workspace-item handoff now persists `workspaceItemId` in chat launch context so Files and omnibox item opens can pin the item itself, not just its provenance fallback
- `ChatHeader.tsx`, `ChatLibraryRail.tsx`, `ChatTranscript.tsx`, `ChatComposer.tsx`, `ChatInspectorPanel.tsx`, and `ChatDialogs.tsx` now keep the routed page shell focused on header/layout wiring rather than the full transcript and modal tree
- controller responsibilities are split across `useChatViewState.ts`, `useChatWorkspaceState.ts`, `chatSessionLifecycle.ts`, `chatStreaming.ts`, `chatGuidedActions.ts`, and `chatTranscriptActions.ts` so the routed chat controller no longer carries every local state declaration, workspace/session derivation, streaming flow, and transcript workflow inline
- `src/services/chat/runtimeContext.ts` now owns shared chat/guided runtime profile resolution plus provider-router request shaping so `runtime.ts` and `guidedMode.ts` reuse the same scope/pack/purpose/label fallback rules

`ArtifactViewer` now renders:

- a document-first reader with the executive summary as the main body entry point instead of a top dashboard strip
- canonical `Artifact.keyFindings` records as a dedicated `Key Findings` block near the top of the document body and again in the details rail
- inline section-level evidence jump cues plus detail-rail evidence jumps for findings, sections, and provenance rows
- section-level editing for the executive summary plus substantive content sections such as methodology
- purpose-ordered supplemental sections such as methodology, implications, anomalies, or timeline with pack-aware section titles
- a rebuilt details rail where findings, follow-ups, entities, and provenance use one related item-row family rather than separate local treatments

### Network Graph

`src/components/features/NetworkGraph/*`

- D3 canvas rendering
- `src/components/features/NetworkGraph/useNetworkGraphController.ts` now owns inspector selection, graph mutations, board/chat handoffs, and modal state while `index.tsx` stays focused on composing the control bar, canvas, dossier, and inspector surfaces
- report/entity node inspection
- launch-into-chat handoff for inspected artifacts, entities, and headlines
- board handoff for inspected artifacts, entities, and headlines
- omnibox entity results can now focus the active network surface in place by reopening the entity inspector and recentering the graph instead of forcing a redundant route change
- omnibox, chat mentions, and timeline actions now share the same routed focus contract for item-in-Files, report-section/report-evidence, and network-entity reopening
- manual node/link creation
- manual node creation and inspector editing now support optional icon overrides, while default report/entity subtype icons remain the fallback path
- source nodes derived from artifact sources for non-investigation graph work
- broader manual node semantics for concepts and sources alongside legacy people and organizations
- hidden/flagged filters
- entity resolution workflow
- `useNetworkGraphUiState.ts`, `useNetworkGraphInspectorState.ts`, `useNetworkGraphNodeActions.ts`, and `networkGraphWorkspaceHandoffs.ts` now split controller concerns across UI state, inspector selection, mutation flows, and board/chat handoff helpers
- the feature layer now uses canonical workspace-filter naming, while `networkGraphNodeIds.ts` keeps legacy persisted graph identifiers stable behind the helper boundary for existing graph references
- `NetworkGraphDialogs.tsx` and `NetworkGraphAddNodeOverlay.tsx` now isolate add-node, resolution, delete-confirm, and lead-investigation workflow UI from the main route shell
- the route wrapper now composes through `PageShell`, with shared shell backdrops and theme-bound dock widths for the dossier/inspector rails

### Live Monitor

`src/components/features/LiveMonitor/*`

- batch scan runs
- source/threat filters
- optional auto-save to headlines
- launch into run setup from events

Live monitor requests now resolve through the active scope's derived pack and default purpose.

### Files

`src/components/features/Files.tsx`

- `src/components/features/Files/useFilesController.ts` now owns selection state, route-focus recovery, export/purge menu state, and board/chat handoff commands while `Files.tsx` stays focused on shell chrome, dialogs, and top-level menu wiring
- `src/components/features/Files/FilesOverview.tsx` and `src/components/features/Files/FilesRecords.tsx` now own the workspace-overview and selected-workspace record sections instead of keeping both grid/list render trees inline
- plain `/files` now lands on the all-workspaces overview in grid mode instead of restoring the last workspace as the default home surface
- workspace/file browsing now mixes saved artifacts with canonical workspace items instead of treating items as board-only records
- shell-level Files copy now uses the canonical `Workspace` / `Artifact` nouns instead of label-profile drift
- workspace cards and related workspace-facing surfaces now resolve `Workspace.iconId` through the shared icon registry instead of hardcoded folder glyphs
- selected-workspace browsing supports `All`, `Artifacts`, and `Items` filtering over the same workspace-scoped list
- artifact rows still route into saved artifact detail and now share the same chat and board handoff verbs exposed by the omnibox
- item opens now resolve through `/files?workspaceId=...&focusItemId=...`, which gives canonical workspace items a stable focusable destination for omnibox, chat-mention, and timeline handoffs
- workspace-item rows expose provenance-aware summaries plus direct workspace-chat, board-placement, and source-link actions
- Files, chat primers, library entries, workspace search snippets, and omnibox recents now share one workspace-item text shaping contract through `src/services/workspace/workspaceItemText.ts`

### Timeline

`src/components/features/TimelineView.tsx`

- routed chronology page with header search, filters popout, dossier, central event stream, and details drawer
- `src/components/features/Timeline/useTimelineViewController.ts` now owns route-query wiring, export/save commands, board/chat handoffs, and detail action composition while `TimelineView.tsx` stays focused on route shell layout
- `src/components/features/Timeline/useTimelinePanelState.ts` now owns panel/open-menu shell state and outside-click handling so the main controller no longer carries those UI effects inline
- `src/components/features/Timeline/useTimelineWorkspaceActions.ts` now owns Files/chat/board detail actions and selected-record handoff shaping
- timeline query parsing/serialization lives in `src/components/features/Timeline/timelineRouteState.ts`
- durable saved timeline views persist through SQLite-backed settings records and reopen through the shared omnibox result/action model
- normalized `TimelineEvent` derivation in `src/components/features/Timeline/timelineEvents.ts`
- `timelineEvents.ts` now composes dedicated `timelineEventBuilders.ts` and `timelineEventUtils.ts` seams instead of keeping all event heuristics inline in one owner file
- route-backed chronology derivation and related selection state are centralized in `src/components/features/Timeline/timelineViewModel.ts`
- `TimelineLibraryRail.tsx` now renders through the shared `LibraryRail` foundation while keeping Timeline-specific focus chips and reference actions in the feature layer
- `TimelineInspectorPanel.tsx` now renders through the shared `GlobalInspectorPanel` foundation while keeping Timeline-specific context composition and handoff actions route-owned
- Timeline section exclusivity now reuses `src/components/features/shared/useExclusivePanelSections.ts` instead of a Timeline-only toggle helper
- default-on chronology for saved signals, runs, and artifacts
- default-on `ITEM` track for canonical workspace-item creation, promotion, material-update, and chat-reuse events
- opt-in secondary `ENTITY` track for first-seen moments, repeated-mention thresholds, and artifact-backed reappearance milestones
- opt-in secondary `CHAT` track for chat session starts plus high-signal chat actions (`SEARCH_WORKSPACE`, saved artifact drafts, append-note actions, and follow-up launches)
- lineage rendering across signal, run, artifact, entity, and chat relationships without introducing a new persistence schema
- explicit lineage ids now drive timeline run/artifact derivation and nearby report-navigation helpers
- smaller-breakpoint header controls now keep workspace switching and chronology search visible without opening the dossier first
- click-through into saved artifacts and exact workspace chat sessions from timeline events
- board handoff for timeline-selected artifacts, entities, signals, and focused workspace items
- timeline snapshot export in JSON/Markdown plus save-as-artifact support for `artifactType: TIMELINE`
- `TimelineToolbar.tsx`, `TimelineFiltersPanel.tsx`, `TimelineExportMenu.tsx`, `TimelineLibraryRail.tsx`, `TimelineEventList.tsx`, and `TimelineInspectorPanel.tsx` now own the major timeline sections so the route shell mainly coordinates route state and layout
- query updates and detail action shaping now live in `timelineQueryHelpers.ts` and `timelineDetailActions.ts`, keeping the view controller focused on orchestration
- the route wrapper now composes through `PageShell`, and the main event column plus filter/export surfaces now use shell-token-backed stage/menu treatments instead of route-local dark wrappers

### Omnibox

`src/components/ui/GlobalSearch.tsx`

- the omnibox runtime contract remains centered on `src/components/ui/omniboxModel.ts`, but that module now delegates to smaller result-builder, recents, mention, and scoring helpers instead of keeping all ranking and shaping logic in one 900-line file
- route results, workspace results, saved timeline views, run/chat results, finding-native workspace-search snippets, and other workspace-search snippets still converge into one result list so search/navigation behavior remains one shared spine
- `GlobalSearch.tsx` stays responsible for UI state and async repository lookups while the pure omnibox shaping logic now lives in dedicated helper modules

### Feed

`src/components/features/Feed.tsx`

- anomaly scanning
- scope-based categories
- custom search and run launches
- scanner settings (limit/priority/polling)

Finder still uses the existing UI, but scan requests now resolve through the selected scope's derived pack and default purpose.

Run-setup and template flows now expose:

- domain pack selection
- purpose selection
- pack-specific starter prompts
- purpose-aware copy and output defaults
- generation-mode selection (`SINGLE_PASS` vs `STAGED`)
- model-aware capability messaging instead of provider-wide assumptions
- compact OpenRouter quick picks plus a dedicated browser modal for full catalog/manual slug entry
- template persistence for scope, pack, purpose, artifact type, and label profile metadata
- wizard state, pack/model derivation, and launch/template handlers centralized in `src/components/features/Runs/useRunSetupState.ts`
- shared runtime-config behavior now routes through `runtimeConfigState.ts`, `useRuntimeConfigForm.ts`, `ProviderModelSelector.tsx`, `RuntimeConfigBehaviorControls.tsx`, `RuntimeConfigSummary.tsx`, and `OpenRouterSearchControls.tsx`, with launch-field shaping centralized in `runtimeConfigMapping.ts`
- the run-setup implementation now lives with the run-launch feature under `src/components/features/Runs/RunSetupModal.tsx`
- shared field controls for thinking budget and absolute date windows now come from `src/components/system/controls/*` rather than per-surface inline slider/date markup

### Settings

`src/components/features/Settings/*`

- `/settings` now uses a thin tab shell in `index.tsx`
- `SettingsRuntimeTab.tsx`, `SettingsDataTab.tsx`, `SettingsScopesTab.tsx`, `SettingsTemplatesTab.tsx`, and `SettingsThemeTab.tsx` own the major tab render trees
- `useSettingsController.ts` is now a small facade over `useSettingsRuntimeState.ts`, `useSettingsDataState.ts`, and `useSettingsThemeState.ts`
- `SettingsDialogs.tsx` owns backup restore, purge confirmation, and import feedback boundaries instead of leaving those workflows inline in the page root
- the Runtime tab now reuses the same shared runtime-config modules used by run setup, guided chat, template authoring, and launch mapping
- the Theme tab now edits one docked Sherlock theme workspace rather than separate accent/background/surface/font cards
- the Theme tab implementation is now split under `src/components/features/Settings/themeWorkbench/*`, separating tab sections, helper ownership, and workbench-host panel content from the routed settings shell
- the theme workspace's draft/export utility rail now registers into the shared app-level workbench host instead of rendering as a settings-only right dock
- the Theme tab's background, graph, typography, shell, and radius sliders now render through the shared `RangeField` contract instead of one-off range markup
- theme templates are full editable themes with saved/draft separation, app-mode-contextual dark/light editing for mode-scoped families, factory reset, fork-to-custom-slot, and JSON/CSS export

### Files

`src/components/features/Files.tsx`

- workspace/artifact navigation
- grid-first all-workspaces landing for the default app home
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
- `src/store/workspaceStore.test.ts`
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
- Active UI labels and export surfaces now follow the resolved label profile; remaining legacy investigation names are confined to bounded compatibility-oriented internal types, migration paths, and persisted graph-id shims.
- `Ctrl+N` now navigates to `/files` and opens the new-workspace modal rather than relying on old shell state.
- Current lint/test status is tracked in `README.md` and `docs/operations/LINTING.md`.
- Static hosting on Vercel is supported because runtime state, provider access, and persistence are browser-local; each origin keeps its own IndexedDB SQLite database and local BYOK settings, so preview URLs and the production domain do not share persisted data.
