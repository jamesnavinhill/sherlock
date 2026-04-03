# Sherlock AI Architecture

This document describes the current runtime architecture as implemented in `src/`.

## 1. Application Shell

`src/App.tsx` is the root orchestrator.

Responsibilities:

- Initializes persistence/state (`useCaseStore().initializeStore()`)
- Owns active view routing (`AppView`)
- Owns the unified investigation launch pipeline
- Wires lazy-loaded feature modules
- Applies theme/accent runtime CSS variables

Primary views loaded from App:

- `Feed` (`AppView.DASHBOARD`)
- `OperationView` (`AppView.INVESTIGATION`)
- `NetworkGraph` (`AppView.NETWORK`)
- `LiveMonitor` (`AppView.LIVE_MONITOR`)
- `Archives` (`AppView.ARCHIVES`)
- `Settings` (`AppView.SETTINGS`)

## 2. Launch Pipeline

All investigation launches converge through `launchInvestigation` in `src/App.tsx`.

Flow:

1. Merge `configOverride` with persisted `SystemConfig`
2. Enforce provider API key presence before task creation
3. Resolve effective scope/date/context
4. Create and persist a task (`TaskRepository`)
5. Execute provider investigation via `investigateTopic`
6. Archive resulting report into case structures
7. Persist run config snapshots for traceability

Launch sources currently used:

- `FEED_SEARCH`
- `FEED_WIZARD`
- `LIVE_MONITOR_EVENT`
- `OPERATION_HEADLINE`
- `FULL_SPECTRUM`
- `SETTINGS_TEMPLATE`

## 3. AI Provider Layer

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

- Router enforces provider/model alignment and capability checks
- TTS is only implemented on Gemini adapter
- Provider debug logs use `[provider-router]` metadata

## 4. Persistence Model

Sherlock now persists core application data to SQLite in-browser.

Runtime storage stack:

- wa-sqlite WASM (`public/wa-sqlite-async.wasm`)
- IndexedDB VFS (`IDBBatchAtomicVFS`)
- Drizzle ORM proxy driver

Entry points:

- `src/services/db/client.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/*`

Migration:

- `src/services/db/migrate.ts` migrates prior `localStorage` Zustand payload (`sherlock-storage`) into SQLite one time.

## 5. State Layer

Global store:

- `src/store/caseStore.ts`

State domains include:

- cases, archives, tasks, headlines
- manual graph nodes/links
- entity aliases and hide/flag sets
- theme/accent mode
- scopes and templates
- feed config and UI state

Persistence writes are handled through repository calls and settings KV writes rather than direct feature-level `localStorage` use.

## 6. Feature Composition

### Operation View

`src/components/features/OperationView/*`

- Toolbar
- DossierPanel
- ReportViewer
- InspectorPanel

Supports deep dives, headline investigation, case/report editing, entity rename flows, and report/case exports.

### Network Graph

`src/components/features/NetworkGraph/*`

- D3 canvas rendering
- case/report/entity node inspection
- manual node/link creation
- hidden/flagged filters
- entity resolution workflow

### Live Monitor

`src/components/features/LiveMonitor/*`

- batch scan runs
- source/threat filters
- optional auto-save to headlines
- launch into investigation wizard from events

### Feed

`src/components/features/Feed.tsx`

- anomaly scanning
- scope-based categories
- custom search and investigation launches
- scanner settings (limit/priority/polling)

### Archives

`src/components/features/Archives.tsx`

- case/report navigation
- deletion workflows
- exports (HTML/Markdown/JSON)

## 7. Testing Coverage

Tests are currently concentrated in:

- provider parsing/contract tests
- launch propagation tests across feature entry points
- config/store/key utility tests

See:

- `src/services/providers/*.test.ts`
- `src/components/features/*/launchPropagation.test.tsx`
- `src/store/caseStore.test.ts`
- `src/config/systemConfig.test.ts`

## 8. Notable Constraints

- Timeline view component exists but is not currently exposed in sidebar navigation.
- Some fallback simulation behavior is intentionally used when scan/live provider calls fail for reasons other than missing API keys.
- Current lint/test status is tracked in `README.md` and `docs/LINTING.md`.
