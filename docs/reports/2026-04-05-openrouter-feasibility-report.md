# OpenRouter Feasibility Report

Prepared on April 5, 2026.

This report audits Sherlock's current OpenRouter integration against the codebase as checked out today and OpenRouter's official documentation and public models API as available on April 5, 2026. It focuses on two questions:

1. How do we broaden OpenRouter model choice without overwhelming the UI?
2. What is required to bring OpenRouter to a more functional state, especially around web search?

## Executive Summary

OpenRouter support in Sherlock is feasible to improve in a staged way without a risky rewrite, but the current implementation is materially behind what OpenRouter supports today.

The two biggest findings are:

- Sherlock currently hardcodes a small, partially stale OpenRouter catalog in `src/config/aiModels.ts`.
- Sherlock does not currently use OpenRouter web search at all. The app sends plain chat-completions requests without the OpenRouter web-search server tool, without the deprecated web plugin, and without native `web_search_options`.

The highest-value recommendation is a two-part rollout:

1. Replace the hardcoded OpenRouter catalog with a dynamic, cached model catalog plus a lightweight "quick picks + search/add by slug" UI.
2. Add OpenRouter's current `openrouter:web_search` server tool path first, then optionally add richer model-aware capability handling and native message/tool support later.

## Codebase Audit

### 1. OpenRouter models are hardcoded and reused across multiple UI surfaces

Current OpenRouter model choices live in `src/config/aiModels.ts` inside the static `AI_MODELS` array.

Those helpers are then reused in multiple places:

- `src/components/features/Settings/index.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`

This means the current hardcoded catalog is not isolated to one dropdown. Any model-catalog redesign needs to cover all four surfaces.

### 2. The current OpenRouter catalog is already partially stale

Sherlock currently hardcodes these OpenRouter models:

- `stepfun/step-3.5-flash:free`
- `arcee-ai/trinity-large-preview:free`
- `tngtech/deepseek-r1t2-chimera:free`
- `tngtech/deepseek-r1t-chimera:free`
- `deepseek/deepseek-r1-0528:free`
- `z-ai/glm-4.5-air:free`
- `openrouter/pony-alpha`

Against OpenRouter's live public models API on April 5, 2026, 4 of those 7 slugs were not present:

- `tngtech/deepseek-r1t2-chimera:free`
- `tngtech/deepseek-r1t-chimera:free`
- `deepseek/deepseek-r1-0528:free`
- `openrouter/pony-alpha`

The static catalog is therefore already drifting from the real platform.

### 3. Capability metadata for OpenRouter is currently inaccurate

Sherlock currently marks OpenRouter as:

- no thinking budget
- no web search
- no structured output on all listed models

That metadata lives in `src/config/aiModels.ts`.

OpenRouter's live models API shows that many current OpenRouter models support some or all of:

- `tools`
- `tool_choice`
- `response_format`
- `structured_outputs`
- `reasoning`
- `web_search_options` on some native-search models

Examples from the live API on April 5, 2026:

- `stepfun/step-3.5-flash:free` advertises `tools` and `reasoning`
- `arcee-ai/trinity-large-preview:free` advertises `response_format`, `structured_outputs`, and `tools`
- `z-ai/glm-4.5-air:free` advertises `reasoning`, `tool_choice`, and `tools`

So the current Sherlock capability labels understate what OpenRouter can do today.

### 4. OpenRouter requests are still sent as simple chat-completions without tools

The active adapter is `src/services/providers/openRouterProvider.ts`.

Current behavior:

- all requests go to `https://openrouter.ai/api/v1/chat/completions`
- the request body only sends `model`, `messages`, `max_tokens`, and optionally `response_format`
- `messages` is effectively a single user message containing a flattened prompt string
- no `tools`
- no `tool_choice`
- no `plugins`
- no `web_search_options`
- no provider routing configuration

This means Sherlock is using only the narrowest OpenRouter compatibility path.

### 5. Sherlock chat currently flattens conversations into a synthetic prompt

`src/services/providers/shared/chat.ts` serializes the conversation as text:

- `USER: ...`
- `ASSISTANT: ...`

That flattened transcript is then inserted into one large prompt string.

This is important because:

- it is workable for plain text generation
- it is not the strongest foundation for native tool and server-tool behavior
- it prevents Sherlock from taking full advantage of provider-native structured conversation patterns

Important nuance: OpenRouter's `openrouter:web_search` server tool can still be added without implementing a client-side tool loop, because it runs server-side inside one request. But Sherlock's flattened prompt design still limits how far the integration can mature later.

### 6. OpenRouter investigate/scan/live paths do not request structured output even when models can support it

In `src/services/providers/openRouterProvider.ts`, the OpenRouter investigation/scan/live flows ask for JSON in prompt text, but they do not currently pass `expectJson: true`, so they do not request `response_format: { type: 'json_object' }`.

This is a notable gap because OpenRouter exposes `response_format` and `structured_outputs` on many models today.

### 7. The shared selector UI would be overwhelmed by the full OpenRouter catalog

`src/components/ui/OsintSelect.tsx` is a flat dropdown with:

- no search input
- no grouping
- no remote loading
- no pinned/recent/favorite section

Dropping the full OpenRouter catalog into the existing control would be a UI regression.

## Official OpenRouter Findings As Of April 5, 2026

### 1. The old web plugin is deprecated

OpenRouter's current docs explicitly mark the web plugin as deprecated and direct developers to the server-tool path instead:

- Web Search plugin docs: <https://openrouter.ai/docs/guides/features/plugins/web-search>

Key change from the docs:

- deprecated: `plugins: [{ id: "web" }]`
- deprecated: `:online`
- preferred: `tools: [{ type: "openrouter:web_search" }]`

### 2. The recommended web-search path is now the `openrouter:web_search` server tool

Official docs:

- Web Search server tool: <https://openrouter.ai/docs/guides/features/server-tools/web-search>

The documented behavior today is:

- works with any OpenRouter model
- model decides when to search
- model may search multiple times in one request
- defaults to `auto` engine
- `auto` uses native provider search when available, otherwise falls back to Exa

Supported parameters documented today include:

- `engine`
- `max_results`
- `max_total_results`
- `search_context_size`
- `user_location`
- `allowed_domains`
- `excluded_domains`

### 3. The server tool also works with the Responses API

The same server-tool docs explicitly state that the web-search tool works with:

- Chat Completions API
- Responses API

Sherlock does not need to migrate to the Responses API just to gain web search. Chat Completions is enough for a first implementation.

### 4. OpenRouter exposes a large live model catalog via the public models API

Official API endpoint used for this audit:

- <https://openrouter.ai/api/v1/models>

Observed on April 5, 2026:

- total models: 349
- free models: 25
- models advertising `tools`: 248
- models advertising `response_format`: 269
- models advertising `structured_outputs`: 219
- models advertising `reasoning`: 167
- models advertising `web_search_options`: 15

These numbers come from the live official API, not from static docs.

### 5. Auto Router is a real option for simplifying choice

Official docs:

- Auto Router: <https://openrouter.ai/docs/guides/routing/routers/auto-router>

Relevant facts from the docs:

- `openrouter/auto` can choose among supported models
- it can be constrained with `allowed_models`
- wildcard patterns are supported
- there is no additional fee beyond the selected model's normal rate

This is relevant because it offers a way to expose "more OpenRouter" without forcing every user to manually browse hundreds of model slugs.

### 6. Tool-calling support is standardized across supported models

Official docs:

- Tool Calling: <https://openrouter.ai/docs/guides/features/tool-calling>

Relevant facts from the docs:

- OpenRouter standardizes the tools interface
- supported models can be filtered by `supported_parameters=tools`
- client-defined tools still require the classic tool-call / tool-result loop
- the `tools` parameter must be included on every relevant request

For Sherlock, this matters less for the first web-search phase because `openrouter:web_search` is a server tool, but it matters for future functionality.

## Answer To The Core Product Questions

### Can Sherlock offer "any OpenRouter model" without overwhelming the UI?

Yes, with a layered model-selection design.

A flat dropdown of 349 models would be too much. A layered approach is feasible and preferable:

- keep a small curated "quick picks" list in the current dropdown
- add a searchable "Browse OpenRouter models" modal or drawer
- allow manual "Add by slug" entry for advanced users
- remember recents and favorites locally
- derive capability badges from the live catalog instead of hardcoding them

This gives novices a simple path and power users full access.

### Are OpenRouter models currently using web search in Sherlock?

No.

Sherlock's OpenRouter adapter currently does not send:

- `tools: [{ type: "openrouter:web_search" }]`
- `plugins: [{ id: "web" }]`
- `web_search_options`
- `:online` model variants

So OpenRouter web search is not active in the app today.

### What is the best supported path to add web search now?

Use the `openrouter:web_search` server tool, not the deprecated web plugin.

That is the current OpenRouter-recommended path as of April 5, 2026.

## Feasibility Assessment

### Track A: Broaden model selection

Feasibility: High

Risk: Low to medium

Why it is feasible:

- `SystemConfig.modelId` already stores an arbitrary string
- `getModelProvider()` already treats `provider/name` slugs as OpenRouter
- no persistence migration is required just to store additional OpenRouter model IDs

Inference:

Because model IDs are already stored as plain strings, Sherlock can support dynamic OpenRouter model IDs without changing the persistence schema, unless we also decide to store OpenRouter-specific tuning settings.

Main work required:

- add an OpenRouter models service that fetches and caches `/api/v1/models`
- normalize API data into Sherlock-facing model metadata
- replace static OpenRouter-only lookup assumptions in `src/config/aiModels.ts`
- add search/filter UI instead of a flat-only dropdown
- preserve a small curated default set for speed and clarity

### Track B: Add OpenRouter web search

Feasibility: High for a first useful version

Risk: Medium

Why it is feasible:

- OpenRouter supports the server tool through Chat Completions
- Sherlock already uses Chat Completions for OpenRouter
- server tools do not require Sherlock to execute client-side tool loops

Main work required:

- add `tools: [{ type: "openrouter:web_search", parameters: ... }]` to selected OpenRouter requests
- decide which workflows should opt into search by default:
  - investigate
  - scan anomalies
  - live intel
  - chat
- parse and preserve returned citations/annotations where available
- expose at least one simple UI control for search mode

Important caveat:

Adding the server tool alone improves grounding, but it does not solve broader OpenRouter maturity gaps like model-aware capability labels, structured output negotiation, or richer native message handling.

### Track C: Bring OpenRouter to a more complete feature baseline

Feasibility: Medium

Risk: Medium to high

This is the "do it right" path beyond simple web search.

Main work required:

- derive capabilities from live model metadata instead of static booleans
- request `response_format` where supported
- distinguish model-level capabilities from provider-level capabilities
- parse OpenRouter annotations and usage metadata
- optionally move OpenRouter chat from flattened transcript prompts toward native message arrays
- optionally add provider routing controls such as `openrouter/auto`, `allowed_models`, or provider sorting

This is still feasible, but it is a wider provider/runtime improvement rather than a small adapter patch.

## Recommended Product And UI Approach

### Recommended UX shape

Use progressive disclosure instead of one giant selector.

Recommended model-selection UX:

1. Keep the existing dropdown for:
   - current provider default
   - curated quick picks
   - recent models
2. Add a secondary action:
   - `Browse OpenRouter models`
3. In the browser modal, support:
   - text search
   - free-only filter
   - tools filter
   - structured-output filter
   - reasoning filter
   - large-context filter
4. Add:
   - `Use model slug...`
5. Show compact capability chips:
   - `Free`
   - `Tools`
   - `Structured`
   - `Reasoning`
   - `Search-ready`

This avoids overwhelming the default flow while still exposing the full OpenRouter platform.

### Why not just dump the entire catalog into the current dropdown?

Because Sherlock's shared selector component is not designed for that scale.

The current `OsintSelect` is appropriate for:

- provider choice
- small curated model lists
- scan-depth toggles

It is not appropriate for a 300+ item provider catalog.

## Recommended Technical Rollout

### Phase 1: Low-risk catalog modernization

Goal:

- stop relying on stale hardcoded OpenRouter slugs

Recommended scope:

- keep static catalogs for Gemini/OpenAI/Anthropic
- add a dynamic OpenRouter catalog service
- cache the fetched catalog in memory plus local storage with TTL
- expose curated quick picks plus search/add-by-slug
- keep `DEFAULT_MODELS_BY_PROVIDER.OPENROUTER` as a safe fallback

Expected value:

- solves stale model list
- unlocks full model access
- no major provider-runtime rewrite

### Phase 2: Web search integration via server tools

Goal:

- make OpenRouter materially more useful for current-information tasks

Recommended scope:

- add an OpenRouter search settings object in app config
- wire `openrouter:web_search` into investigate, scan, live intel, and optionally chat
- support a minimal first configuration:
  - enabled on/off
  - engine: `auto` by default
  - max results
  - domain allow/block list
- capture usage metadata if present
- extract citations from annotations when available

Expected value:

- meaningful functional improvement
- aligned with OpenRouter's current recommended implementation

### Phase 3: Capability-aware OpenRouter runtime

Goal:

- stop treating OpenRouter as one flat "supports nothing" provider

Recommended scope:

- move capability checks from provider-level static booleans to model-aware metadata
- request structured output when the selected model advertises it
- support reasoning-capable OpenRouter models more accurately
- optionally support `openrouter/auto` and constrained allowed-model routing

Expected value:

- cleaner UI truthfulness
- fewer artificial feature limitations
- better long-term fit for OpenRouter's platform model

## Concrete Implementation Notes

### Files most likely to change for catalog broadening

- `src/config/aiModels.ts`
- `src/config/systemConfig.ts`
- `src/components/ui/OsintSelect.tsx`
- `src/components/features/Settings/index.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`

### Files most likely to change for web search

- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/types.ts`
- `src/services/providers/shared/normalizers.ts`
- `src/config/systemConfig.ts`
- `src/types/index.ts`
- relevant tests under `src/services/providers/*.test.ts`

### Strong recommendation on capability modeling

Do not continue to model OpenRouter capability as a single provider-wide boolean set.

OpenRouter is an aggregator. The meaningful truth is model-level, not provider-level.

Recommended direction:

- keep provider-level metadata for broad UI framing
- derive actual behavior from selected model metadata

## Recommended Decision

Proceed.

The work is worth doing and can be staged safely.

If prioritization is needed, the best order is:

1. dynamic OpenRouter catalog with quick picks plus search/add-by-slug
2. `openrouter:web_search` server tool integration
3. model-aware capability cleanup and structured-output support

That order delivers user-visible value quickly while avoiding a large upfront runtime refactor.

## Sources

Official OpenRouter sources used for this report:

- Models API: <https://openrouter.ai/api/v1/models>
- Web Search plugin docs: <https://openrouter.ai/docs/guides/features/plugins/web-search>
- Web Search server tool docs: <https://openrouter.ai/docs/guides/features/server-tools/web-search>
- Tool Calling docs: <https://openrouter.ai/docs/guides/features/tool-calling>
- Auto Router docs: <https://openrouter.ai/docs/guides/routing/routers/auto-router>
