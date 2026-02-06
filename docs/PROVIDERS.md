# Multi-Provider Architecture Roadmap

## Objective

Build a clean, robust provider system where Google Gemini is the default and the app can switch reliably to OpenRouter, OpenAI, or Anthropic, with uniform behavior across all investigation flows.

## Product Rules (Must Hold)

- Default provider is `GEMINI`.
- Provider selection is explicit and persistent, not inferred from string heuristics.
- Any flow that starts an investigation must carry the selected provider/model unless the user overrides it in that flow.
- Deep-dive, entity investigate, headline investigate, and full-spectrum runs must all respect the same config propagation rules.
- Provider-specific differences are isolated in adapters; UI and feature logic consume one normalized contract.

## Current Gaps (From Project Review)

- Provider and transport logic are mixed in `src/services/gemini.ts`.
- Provider support in `src/config/aiModels.ts` currently covers `GEMINI` and `OPENROUTER` only.
- OpenAI and Anthropic keys are collected in Settings but not wired to runtime clients.
- `hasApiKey()` and key management in `src/services/gemini.ts` are not provider-aware for OpenAI/Anthropic.
- Investigation wizard config is dropped in some paths:
  - `src/components/features/OperationView/index.tsx` lead modal ignores returned config.
  - `src/App.tsx` investigation start/run signatures do not carry scope/date override/preseeded input from wizard.
- Provider behavior is selected mostly via `modelId` branching, which does not scale cleanly.

## Target Architecture

### 1) Contracts

Create normalized provider contracts under `src/services/providers/types.ts`:

- `AIProvider = 'GEMINI' | 'OPENROUTER' | 'OPENAI' | 'ANTHROPIC'`
- `ProviderOperation = 'INVESTIGATE' | 'SCAN_ANOMALIES' | 'LIVE_INTEL' | 'TTS'`
- `ProviderRequestContext` and operation-specific input types
- Shared normalized outputs for `InvestigationReport`, `FeedItem[]`, `MonitorEvent[]`, and typed error classes

### 2) Adapter Isolation

Create one adapter per provider:

- `src/services/providers/geminiProvider.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`

Each adapter owns:

- key resolution/validation
- provider request payloads
- provider response normalization
- provider-specific fallback/retry behavior

### 3) Router/Facade

Create provider router in `src/services/providers/index.ts`:

- resolve adapter by selected provider + model
- enforce capability checks (for example: TTS support)
- expose single app-facing API for all provider operations

Keep `src/services/gemini.ts` as temporary compatibility facade during migration, then replace its internals with router calls.

### 4) Shared Utilities

Move cross-provider utilities to `src/services/providers/shared/`:

- `jsonParsing.ts`
- `normalizers.ts`
- `errors.ts`
- `logging.ts`

## Phased Delivery Plan

## Phase 0 - Baseline and Safety Harness

- [ ] Snapshot current behavior with fixtures for investigate/scan/live flows.
- [ ] Add baseline tests around known fragile parsing paths.
- [ ] Add migration flag (`providerRouterV1`) to allow safe rollback while refactoring.

Exit criteria:

- Existing Gemini and OpenRouter behavior is reproducible by tests before refactor begins.

## Phase 1 - Provider Config Model

- [ ] Extend provider enum/types to include OpenAI and Anthropic.
- [ ] Update `src/config/aiModels.ts` with explicit provider metadata and per-model capabilities.
- [ ] Add `getDefaultModelForProvider(provider)` and remove inference-only routing as primary strategy.
- [ ] Define persisted config shape in `SystemConfig`:
  - `provider`
  - `modelId`
  - `thinkingBudget`
  - existing search/persona settings
- [ ] Add migration logic for existing configs that only store `modelId`.

Exit criteria:

- Selected provider and selected model are explicit in config and backward-compatible with existing user data.

## Phase 2 - Key Management and Validation

- [ ] Move key handling out of `src/services/gemini.ts` into `src/services/providers/keys.ts`.
- [ ] Implement `hasApiKey(provider?)` and `getApiKeyOrThrow(provider)` for all 4 providers.
- [ ] Keep local storage compatibility, but centralize all key reads/writes.
- [ ] Update API key modal and settings to validate keys per selected provider.

Exit criteria:

- Auth checks are provider-aware and no longer tied to Gemini/OpenRouter-only logic.

## Phase 3 - Adapter Extraction

- [ ] Extract Gemini logic into `geminiProvider.ts`.
- [ ] Extract OpenRouter logic into `openRouterProvider.ts`.
- [ ] Implement OpenAI adapter for investigate/scan/live operations.
- [ ] Implement Anthropic adapter for investigate/scan/live operations.
- [ ] Normalize response shapes in adapter layer only.
- [ ] Map provider errors into typed app errors (`MISSING_API_KEY`, `RATE_LIMITED`, `PARSE_ERROR`, `UPSTREAM_ERROR`).

Exit criteria:

- Each provider can execute the same operation contract and returns normalized data.

## Phase 4 - Router and Compatibility Facade

- [ ] Implement provider registry/router (`src/services/providers/index.ts`).
- [ ] Replace direct provider branching in `src/services/gemini.ts` with router dispatch.
- [ ] Keep exported function signatures stable during this phase to reduce UI churn.
- [ ] Add structured debug logs with `provider`, `modelId`, `operation`, `retryCount`, `errorClass`.

Exit criteria:

- App-facing services are provider-agnostic; provider conditionals are not spread across feature code.

## Phase 5 - Flow Uniformity Across Investigation Entry Points

- [ ] Introduce one shared `InvestigationLaunchRequest` type and use it end-to-end.
- [ ] Update `src/App.tsx` start/run pipeline to carry:
  - `configOverride`
  - scope
  - date range override
  - optional preseeded entities
- [ ] Fix `src/components/features/OperationView/index.tsx` lead modal path to apply returned config override.
- [ ] Ensure full-spectrum deep dives inherit parent config unless explicitly overridden.
- [ ] Ensure `Feed`, `LiveMonitor`, entity inspector, and headline investigation all use the same launch path.
- [ ] Persist effective run config into report/task snapshots for auditability.

Exit criteria:

- Provider/model choice is consistently respected in every investigation flow.

## Phase 6 - UI/UX Alignment

- [ ] In Settings and wizard, show provider then model hierarchy clearly.
- [ ] Add provider-specific capability hints (for example, thinking budget availability).
- [ ] On run start, validate required key for effective provider and show clear prompt if missing.
- [ ] Keep per-flow override option where it already exists, but make inheritance behavior explicit.

Exit criteria:

- Users can predict exactly which provider/model each run will use.

## Phase 7 - Testing Matrix

- [ ] Unit tests for parsing and normalization utilities with malformed/markdown-wrapped JSON.
- [ ] Adapter contract tests with canned payload fixtures for each provider.
- [ ] Integration tests for investigation launch propagation across:
  - dashboard/Feed
  - live monitor
  - operation deep dive
  - entity investigate
  - headline investigate
- [ ] Regression tests for report rendering safety (summary/leads/agendas always strings).

Exit criteria:

- CI verifies provider parity and flow uniformity, not just per-provider happy paths.

## Phase 8 - Documentation and Cleanup

- [ ] Update `docs/architecture.md` provider section and component interaction diagrams.
- [ ] Update `README.md` for multi-provider setup and key instructions.
- [ ] Remove legacy mixed-provider internals from `src/services/gemini.ts` once router is stable.
- [ ] Add an operations runbook section for debugging provider failures.

Exit criteria:

- No critical provider behavior depends on legacy mixed implementation.

## Acceptance Checklist (Definition of Done)

- [ ] Gemini remains default for new and migrated users.
- [ ] Switching provider in Settings changes behavior for all subsequent investigations.
- [ ] Flow-level override works and is preserved for spawned/deep-dive tasks.
- [ ] OpenRouter, OpenAI, and Anthropic paths produce normalized outputs and do not break report rendering.
- [ ] Missing-key errors are provider-specific and actionable.
- [ ] Investigation report metadata records provider + model used.
- [ ] Tests cover provider adapters and cross-flow propagation logic.

## Suggested Execution Order

1. Phase 0-2 (contracts, config, key management)
2. Phase 3-4 (adapters + router)
3. Phase 5-6 (flow wiring and UX)
4. Phase 7-8 (tests, docs, cleanup)
