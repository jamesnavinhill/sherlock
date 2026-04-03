# Sherlock AI Architecture

This document describes the current runtime architecture as implemented in `src/`.

Sherlock now runs on a compatibility-first domain-pack architecture. The established investigation shell remains in place, but runtime execution resolves a generic pack, purpose profile, and artifact contract under the hood.

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
- `NetworkGraph` (`AppView.NETWORK`)
- `LiveMonitor` (`AppView.LIVE_MONITOR`)
- `Archives` (`AppView.ARCHIVES`)
- `Settings` (`AppView.SETTINGS`)

## 2. Launch Pipeline

All launches still converge through `launchInvestigation` in `src/App.tsx`.

Flow:

1. Merge `configOverride` with persisted `SystemConfig`
2. Enforce provider API key presence before task creation
3. Resolve effective scope, domain pack, purpose profile, artifact type, and label profile
4. Create and persist a task (`TaskRepository`)
5. Execute provider investigation via `investigateTopic`
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
- provide pack-aware launch copy, purpose-aware setup labels, starter templates, and legacy title cleanup helpers

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
- adapters return typed artifact sections in addition to legacy `summary`, `agendas`, and `leads`
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

Migration:

- `src/services/db/migrate.ts` migrates prior `localStorage` Zustand payload (`sherlock-storage`) into SQLite one time
- `src/services/db/client.ts` applies additive schema upgrades for existing local databases

## 6. State Layer

Global store:

- `src/store/caseStore.ts`

State domains include:

- cases, archives, tasks, headlines
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

Supports deep dives, headline investigation, case/report editing, entity rename flows, and report/case exports.

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
- launch into investigation wizard from events

Live monitor requests now resolve through the active scope's derived pack and default purpose.

### Feed

`src/components/features/Feed.tsx`

- anomaly scanning
- scope-based categories
- custom search and investigation launches
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

- case/report navigation
- deletion workflows
- exports (HTML/Markdown/JSON)
- label-profile-aware workspace and artifact naming for mixed investigation and non-investigation archives

## 8. Testing Coverage

Tests are currently concentrated in:

- provider parsing/contract tests
- launch propagation tests across feature entry points
- config/store/key utility tests

See:

- `src/services/providers/*.test.ts`
- `src/components/features/*/launchPropagation.test.tsx`
- `src/store/caseStore.test.ts`
- `src/config/systemConfig.test.ts`

## 9. Notable Constraints

- Timeline view component exists but is not currently exposed in sidebar navigation.
- Some fallback simulation behavior is intentionally used when scan/live provider calls fail for reasons other than missing API keys.
- Stream 2 broadens labels across setup, templates, archives, sidebar navigation, and dossier/report surfaces, but a few legacy investigation names still remain in deeper compatibility paths.
- Current lint/test status is tracked in `README.md` and `docs/LINTING.md`.
