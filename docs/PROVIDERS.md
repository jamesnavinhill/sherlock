# AI Providers Architecture (Gemini + OpenRouter)

## Summary
Current behavior mixes Gemini and OpenRouter logic in `src/services/gemini.ts`. That is acceptable as a short-term bridge, but it is not a clean long-term architecture.

The failures observed (`JSON.parse` errors, empty OpenRouter content, Markdown crashes) came from:
- provider response-shape differences not normalized centrally
- brittle JSON extraction/parsing
- model output fields (`summary`, `leads`, `agendas`) not sanitized to strings before rendering
- deep-dive/full-spectrum runs not always inheriting the parent report config

## Recommended Target Design
Use a provider abstraction and keep provider-specific code isolated.

### 1) Core Contract
Create a shared provider interface:

```ts
interface AIProviderClient {
  investigate(input: InvestigateInput): Promise<InvestigateResult>;
  scanAnomalies(input: ScanInput): Promise<ScanResult>;
  liveIntel(input: LiveIntelInput): Promise<LiveIntelResult>;
}
```

All methods return normalized domain types only (strings, typed enums, arrays of typed objects).

### 2) Provider Adapters
- `src/services/providers/geminiProvider.ts`
- `src/services/providers/openRouterProvider.ts`

Each adapter owns:
- auth/key handling for that provider
- HTTP/SDK calls
- provider-specific prompt envelopes
- response normalization into shared output types

### 3) Router Layer
`src/services/providers/index.ts`:
- reads active `modelId`
- resolves provider from model catalog
- dispatches to correct adapter

No UI component should branch on provider internals.

### 4) Shared Utilities
Move cross-provider utilities to dedicated files:
- `jsonParsing.ts` (`parseJsonWithFallback`, fenced-block extraction, balanced JSON extraction)
- `normalizers.ts` (string/entity/source normalization)
- `errors.ts` (typed retryable vs non-retryable errors)

### 5) Observability
Add structured debug logs in dev:
- provider
- model id
- operation (`investigate`, `scan`, `liveIntel`)
- retry count and final error class

This makes “why did it use Gemini?” questions answerable immediately.

## Migration Plan
1. Keep current behavior stable in `gemini.ts` (bridge mode).
2. Extract OpenRouter code to `openRouterProvider.ts`.
3. Extract Gemini code to `geminiProvider.ts`.
4. Replace `gemini.ts` with a thin orchestration facade.
5. Add provider-specific tests with canned payload fixtures.

## Testing Requirements
- Parse robustness tests for:
  - fenced JSON
  - JSON + trailing commentary
  - arrays/objects with escaped quotes
- OpenRouter payload variants:
  - `message.content` string
  - `message.content` array of parts
  - fallback fields (`text`, `reasoning`)
- UI safety:
  - markdown inputs are always strings
  - arrays are normalized to string arrays before render

## Practical Note
Single-file mixed provider code can work for rapid iteration, but once multiple providers are production paths, separate adapters are the maintainable standard. The right target is “one orchestrator + one adapter per provider + shared normalization/parsing utilities.”
