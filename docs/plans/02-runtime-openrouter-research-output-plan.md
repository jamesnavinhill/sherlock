# Runtime, OpenRouter, And Research Output Expansion Plan

Date: 2026-04-05
Status: Active

## Objective

Complete the next platform expansion phase by:

- modernizing the shared provider/runtime layer for richer model capabilities
- bringing OpenRouter to a first-class state with dynamic model discovery, capability-aware behavior, and web search
- upgrading artifact generation from lead-first outputs to research-grade, evidence-oriented outputs
- leaving Sherlock in a coherent pre-workspace state with the report/dossier UI aligned to the stronger artifact model

This plan intentionally stops before the dedicated workspace/board implementation. The follow-on board plan is tracked separately in [03-research-workspace-plan.md](/mnt/c/Users/james/projects/sherlock/docs/plans/03-research-workspace-plan.md).

## Dependency Boundary

This plan is the baseline that the workspace plan depends on.

It owns the shared foundations that should not be redesigned inside the board plan:

- shared provider/message/runtime expansion
- capability-aware model registry and request building
- OpenRouter modernization
- web-search integration and provenance capture
- hybrid generation strategy
- evidence-oriented artifact contract
- minimal report/dossier refresh for the new artifact shape

The board plan should consume these outputs, not redefine them.

## Decisions Locked In

### 1. This is a full shared-runtime expansion, not an OpenRouter-only one-off

Preferred direction:

- OpenRouter is the forcing function, not the only beneficiary
- shared transport/runtime seams should be improved once for the platform
- chat and artifact generation should both move onto the stronger foundation
- scan/live flows can follow the same shape after chat and artifacts are stabilized

### 2. OpenRouter should be fully modernized now

Preferred direction:

- replace the stale hardcoded OpenRouter catalog with a dynamic catalog flow
- use a broader provider-model registry abstraction, with OpenRouter as the first dynamic backend
- support a small curated quick-pick list plus full model browsing plus manual slug entry
- model capabilities should come from normalized metadata, not static provider-wide assumptions

### 3. OpenRouter web search should be on by default everywhere, with a settings toggle

Preferred direction:

- default to enabled for OpenRouter-supported workflows
- provide a clear global settings control to disable it
- use OpenRouter's current recommended `openrouter:web_search` server tool path
- do not adopt deprecated plugin-first behavior as the main path

### 4. Capability handling should use smart defaults, warnings, and guarded disabling

Preferred direction:

- do not silently pretend unsupported combinations work
- keep user choice where possible
- disable impossible combinations
- warn clearly when a chosen model cannot fully support the active configuration
- offer one-click recommended fallback models rather than auto-switching behind the user's back

### 5. Model selection should use progressive disclosure

Preferred direction:

- keep a small default selector for common choices
- add a dedicated OpenRouter browser modal or drawer
- support manual slug entry
- keep curated quick picks focused on Sherlock-relevant roles only
- do not dump the full OpenRouter catalog into the shared flat select control

### 6. The OpenRouter catalog should use a bundled snapshot plus live refresh plus local cache

Preferred direction:

- ship with a usable bundled baseline
- refresh from OpenRouter's live models API
- cache locally with TTL behavior
- degrade gracefully if live fetch fails

### 7. Native/shared message architecture should be upgraded now

Preferred direction:

- move away from flattened synthetic conversation prompts as the long-term architecture
- stabilize a shared message/request/response foundation for both chat and artifact generation
- do not treat OpenRouter as a special-case transport forever

### 8. Artifact evolution should upgrade the current model, not collapse all workspace objects into artifacts

Preferred direction:

- keep `Artifact` as the canonical generated research output
- keep other workspace object types distinct where appropriate
- make the artifact contract richer and more evidence-native
- preserve compatibility fields/readers during transition

### 9. Richer evidence should use a dedicated subrecord/table

Preferred direction:

- keep current artifact sections intact as the compatibility bridge
- add a dedicated evidence-oriented persistence path alongside them
- avoid overloading `ArtifactSection.items` into an opaque mixed bag forever

### 10. Generation strategy should be hybrid, with a global default and per-run override

Preferred direction:

- support both lighter single-pass generation and staged generation
- add a global default in Settings
- allow per-run or per-workspace override
- use staged generation for deeper research-grade outputs where it adds real value

### 11. Plan 1 should establish the research-grade artifact baseline before the board plan starts

Preferred direction:

- include section-first artifact contract work
- include evidence-oriented output changes
- include deeper or staged generation support
- include the minimal report/dossier UI refresh needed to present the new shape honestly
- stop before board implementation begins

### 12. Provenance should be richer than plain extracted links

Preferred direction:

- persist richer provider/tool/search metadata where available
- capture enough provenance to support future workspace and board flows
- avoid overcommitting to a final search-trace object model too early

## Execution Streams

### Stream 1: Provider Model Registry And OpenRouter Catalog

Primary targets:

- `src/config/aiModels.ts`
- `src/config/systemConfig.ts`
- new provider-model registry modules under `src/services/providers/*` or `src/config/*`
- `src/components/features/Settings/index.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`

Required work:

1. Introduce a provider-model registry abstraction that can represent static and dynamic backends.
2. Implement OpenRouter as the first dynamic backend using bundled snapshot + live refresh + local cache.
3. Normalize model metadata into Sherlock-facing capabilities and display metadata.
4. Replace stale hardcoded OpenRouter-only assumptions in selection flows.
5. Add curated quick picks, full browser flow, recent/favorite or recent-like behavior, and manual slug entry.
6. Keep lightweight runtime fallback handling for invalid or unavailable model IDs.

### Stream 2: Capability-Aware Runtime Foundation

Primary targets:

- `src/services/providers/types.ts`
- `src/services/providers/index.ts`
- `src/services/providers/shared/chat.ts`
- shared provider helpers under `src/services/providers/shared/*`
- chat runtime seams in `src/services/chat/runtime.ts`

Required work:

1. Introduce a stronger shared request/response model for both chat and artifact generation.
2. Reduce dependence on flattened synthetic prompt transport as the long-term shape.
3. Move capability decisions from provider-wide booleans toward selected-model-aware behavior.
4. Add warning/fallback hooks for unsupported feature combinations.
5. Preserve enough compatibility that the rest of the app can transition incrementally.

### Stream 3: OpenRouter Functional Modernization

Primary targets:

- `src/services/providers/openRouterProvider.ts`
- provider tests under `src/services/providers/*.test.ts`
- shared response normalization helpers

Required work:

1. Add OpenRouter's `openrouter:web_search` server tool path as the primary web-search implementation.
2. Add core OpenRouter settings:
   - global on/off
   - engine
   - max results
   - max total results
   - allowed domains
   - excluded domains
3. Ensure web search defaults on, with user-facing override.
4. Request native structured output where supported instead of relying only on prompt-shape JSON.
5. Normalize and persist richer provenance:
   - citations/annotations
   - search/tool usage
   - model/provider metadata
   - search grounding hints where available
6. Keep user-visible warning/fallback behavior when a chosen model cannot fully support the active configuration.

### Stream 4: Research-Grade Artifact Contract

Primary targets:

- `src/services/providers/shared/prompts.ts`
- all provider adapters:
  - `src/services/providers/geminiProvider.ts`
  - `src/services/providers/openRouterProvider.ts`
  - `src/services/providers/openAIProvider.ts`
  - `src/services/providers/anthropicProvider.ts`
- `src/types/index.ts`
- `src/domain/*`
- persistence/repository paths under `src/services/db/*`

Required work:

1. Flip the generation contract from lead-first to section-first.
2. Make richer evidence and methodology content first-class.
3. Keep compatibility arrays such as `agendas`, `leads`, and `followUps` during transition where current readers still depend on them.
4. Add a dedicated evidence subrecord/table instead of overloading legacy section item arrays forever.
5. Introduce the hybrid generation mode model:
   - global default
   - per-run/workspace override
   - single-pass path
   - staged path
6. Raise output quality without assuming all providers need identical single-shot token budgets.

### Stream 5: Minimal Report And Dossier Refresh

Primary targets:

- `src/components/features/OperationView/ReportViewer.tsx`
- `src/components/features/OperationView/DossierPanel.tsx`
- adjacent OperationView components as needed

Required work:

1. Update the report surface to present evidence-rich sections honestly.
2. Reduce overemphasis on lead launching as the dominant artifact behavior.
3. Surface richer provenance and evidence context where available.
4. Keep the refresh minimal and aligned to the stronger artifact baseline rather than drifting into board/library implementation.

## Suggested Delivery Order

1. Establish the provider-model registry and OpenRouter catalog flow.
2. Land the shared capability-aware runtime seams for chat and artifact generation.
3. Modernize OpenRouter on top of that foundation.
4. Upgrade the artifact contract, evidence persistence, and hybrid generation path.
5. Refresh the report/dossier surfaces enough to match the stronger outputs.
6. Hand the stabilized artifact/runtime baseline to the board plan.

This is a dependency-aware staggered sequence, not a single-file serial rollout.

## Non-Goals

- Do not implement the dedicated workspace/board in this plan.
- Do not collapse all workspace object types into `Artifact`.
- Do not redesign Timeline or NetworkGraph into the board.
- Do not build a giant all-providers dynamic catalog in one pass just because OpenRouter needs one now.
- Do not spend plan time on heavy migration logic for legacy saved model selections; the project is still effectively greenfield.

## Handoff To The Workspace Plan

Plan 2 should assume this plan has already established:

- a stable research-grade artifact contract
- richer evidence persistence
- stronger provenance metadata
- a capability-aware provider/runtime baseline
- a coherent minimal reader/dossier experience

The follow-on board plan is tracked in [03-research-workspace-plan.md](/mnt/c/Users/james/projects/sherlock/docs/plans/03-research-workspace-plan.md).

## Validation Expectations

Before closing implementation work under this plan:

- `npm run lint`
- targeted tests covering:
  - provider registry/runtime behavior
  - OpenRouter adapter behavior
  - artifact generation and persistence changes
  - report/dossier rendering changes
- `npm run build`

Run the full test suite if this plan expands into broad shared-provider infrastructure where targeted coverage would be misleading.
