# Sherlock AI Architecture

This document describes the current runtime architecture as implemented in `src/`.

Sherlock now runs on a compatibility-first domain-pack architecture. The established shell remains in place, but runtime execution resolves a generic pack, purpose profile, and artifact contract under the hood.

## 1. Application Shell

`src/App.tsx` is the root orchestrator.

Responsibilities:

- initializes persistence/state (`useCaseStore().initializeStore()`)
- owns active view routing (`AppView`)
- owns the unified launch pipeline
- resolves domain-pack and purpose metadata into run config
- wires lazy-loaded feature modules
- applies theme/accent runtime CSS variables

Primary views loaded from App:

- `Feed` (`AppView.DASHBOARD`)
- `OperationView` (`AppView.INVESTIGATION`)
- `Chat` (`AppView.CHAT`)
- `NetworkGraph` (`AppView.NETWORK`)
- `LiveMonitor` (`AppView.LIVE_MONITOR`)
- `Archives` (`AppView.ARCHIVES`)
- `Settings` (`AppView.SETTINGS`)
- `TimelineView` (`AppView.TIMELINE`, exposed in sidebar navigation as the workspace chronology surface)

## 2. Launch Pipeline

All launches still converge through `launchInvestigation` in `src/App.tsx`.

Flow:

1. Merge `configOverride` with persisted `SystemConfig`
2. Enforce provider API key presence before task creation
3. Resolve effective scope, domain pack, purpose profile, artifact type, and label profile
4. Create and persist a task (`TaskRepository`)
5. Execute the provider run via `investigateTopic`
6. Normalize typed artifact sections and run metadata
7. Archive the resulting artifact into compatibility case structures
8. Persist run config snapshots for traceability

Run config snapshots now include:

- `scopeId` and `scopeName`
- `packId` and `packName`
- `purposeId` and `purposeName`
- `artifactType`
- `labelProfileId`
- date-range, launch source, and provider/model snapshots
- lineage refs such as `sourceSignalId`, `parentArtifactId`, `parentRunId`, `sourceRunId`, and `producedArtifactId` when available

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

Key responsibilities:

- derive first-party domain packs from scopes
- resolve purpose profiles for each run
- resolve label profiles for compatibility rendering
- build typed artifact sections alongside legacy flattened fields
- provide pack-aware launch copy, purpose-aware setup labels, starter templates, export naming, and legacy title cleanup helpers

## 4. AI Provider Layer

App-facing compatibility facade:

- `src/services/gemini.ts`

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

Key behavior:

- router enforces provider/model alignment and capability checks
- router resolves a pack and purpose profile for each run
- router now exposes a sibling `CHAT` runtime path for workspace-grounded conversational turns
- router now exposes both non-streaming and streaming chat paths with a provider-agnostic event envelope and abort support
- adapters return typed artifact sections in addition to legacy `summary`, `agendas`, and `leads`
- chat adapters accept message arrays plus deterministic workspace retrieval bundles, support streaming output on all active providers, and return structured citations
- TTS is only implemented on Gemini adapter
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

The schema still uses compatibility tables such as `cases`, `reports`, and `tasks`, but Stream 1 extends them with generalized metadata:

- `cases` can now hold workspace-oriented metadata such as `mode`, `packId`, `purposeId`, and `labelProfileId`
- `reports` now store `artifactType`, pack/purpose references, label profiles, and metadata JSON
- `artifact_sections` persists typed section rows separately from the legacy flattened report fields
- `tasks` now persist pack/purpose/artifact metadata alongside the config snapshot
- `chat_sessions`, `chat_messages`, `chat_message_attachments`, and `chat_actions` persist workspace-bound chat history and auditable retrieval traces

Artifact persistence still uses the existing `reports` table, but report `configJson` is now also used to preserve run/source lineage snapshots that can be backfilled from the originating task during archive flows.

Maintenance flows now treat SQLite data as a workspace-data domain:

- Settings export/import use a canonical backup payload with `workspaces`, `artifacts`, `runs`, `chat`, `signals`, `graph`, `templates`, and `metadata`
- workspace-data restore clears the current workspace-data domain before replaying the backup
- app-level settings such as theme, provider defaults, and API keys remain outside workspace backup/restore

Migration:

- `src/services/db/migrate.ts` migrates prior `localStorage` Zustand payload (`sherlock-storage`) into SQLite one time
- `src/services/db/client.ts` applies additive schema upgrades for existing local databases

## 6. State Layer

Global store:

- `src/store/caseStore.ts`

State domains include:

- cases, archives, tasks, headlines
- chat sessions, messages, generation state, and launch context
- pack-aware report config snapshots
- typed artifact sections
- manual graph nodes/links
- entity aliases and hide/flag sets
- theme/accent mode
- scopes and templates
- feed config and UI state

Persistence writes are handled through repository calls and settings KV writes rather than direct feature-level `localStorage` use.

## 7. Feature Composition

### Operation View

`src/components/features/OperationView/*`

- Toolbar
- DossierPanel
- ReportViewer
- InspectorPanel

Supports deep dives, headline follow-through, launch-into-chat handoff for the active artifact plus inspected entities/signals, workspace/artifact editing, entity rename flows, and workspace/artifact exports.

### Chat

`src/components/features/Chat/ChatPage.tsx`

- dedicated workspace-bound chat page
- persisted session switching, rename, delete, and guided-run session flows
- streaming grounded answers backed by deterministic workspace retrieval
- stop/cancel handling for in-flight assistant turns
- bounded retrieval actions for artifact summaries, full artifact text, and recent signals
- save-as-artifact, append-to-artifact, and follow-up-run actions with persisted `chat_actions`
- transcript copy plus Markdown/JSON export
- guided conversational run builder that maps into the same launch request shape used by `TaskSetupModal`
- context drawer with recent artifacts, recent signals, pinned launch context, last-turn retrieval snippets, and action log
- contextual handoff from Operation View, Archives, and Network Graph into the same session backend, with report/entity/headline grounding persisted on the target chat session

`ReportViewer` now renders:

- typed summary sections
- supplemental sections such as findings, methodology, implications, or timeline
- compatibility-mapped lead and anomaly sections for legacy artifacts
- purpose-ordered section layouts with dedicated timeline and findings treatments
- pack-aware section titles that map legacy labels into broader workspace terminology

### Network Graph

`src/components/features/NetworkGraph/*`

- D3 canvas rendering
- case/report/entity node inspection
- launch-into-chat handoff for inspected reports, entities, and headlines
- manual node/link creation
- source nodes derived from artifact sources for non-investigation graph work
- broader manual node semantics for concepts and sources alongside legacy people and organizations
- hidden/flagged filters
- entity resolution workflow

### Live Monitor

`src/components/features/LiveMonitor/*`

- batch scan runs
- source/threat filters
- optional auto-save to headlines
- launch into task setup from events

Live monitor requests now resolve through the active scope's derived pack and default purpose.

### Timeline

`src/components/features/TimelineView.tsx`

- routed chronology page with header search, filters popout, dossier, central event stream, and details drawer
- normalized `TimelineEvent` derivation in `src/components/features/Timeline/timelineEvents.ts`
- default-on chronology for saved signals, runs, and artifacts
- opt-in secondary `CHAT` track for chat session starts plus high-signal chat actions (`SEARCH_WORKSPACE`, saved artifact drafts, append-note actions, and follow-up launches)
- lineage rendering across signal, run, artifact, and chat relationships without introducing a new persistence schema
- click-through into saved artifacts and exact workspace chat sessions from timeline events

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
- template persistence for scope, pack, purpose, artifact type, and label profile metadata

### Archives

`src/components/features/Archives.tsx`

- workspace/artifact navigation
- launch directly into workspace chat from workspace cards and saved artifacts
- deletion workflows
- exports (HTML/Markdown/JSON)
- label-profile-aware workspace and artifact naming for mixed investigation and non-investigation archives

## 8. Testing Coverage

Tests are currently concentrated in:

- provider parsing/contract tests
- provider router chat dispatch tests
- launch propagation tests across feature entry points
- config/store/key utility tests

See:

- `src/services/providers/*.test.ts`
- `src/components/features/*/launchPropagation.test.tsx`
- `src/store/caseStore.test.ts`
- `src/config/systemConfig.test.ts`

## 9. Notable Constraints

- Timeline is now a live feature surface, but secondary chronology remains intentionally curated; entity milestones and lower-signal audit tracks are still deferred to later slices.
- Some fallback simulation behavior is intentionally used when scan/live provider calls fail for reasons other than missing API keys.
- Active UI labels, export surfaces, and archive selection now follow the resolved label profile; remaining legacy investigation names are confined to compatibility-oriented internal types, table names, and migration paths.
- `Ctrl+N` now routes through Archives and opens the active new-workspace modal rather than relying on dead shell state.
- Current lint/test status is tracked in `README.md` and `docs/operations/LINTING.md`.
