# Provider Operations Runbook

This runbook covers runtime incidents in the provider router pipeline as surfaced through `src/services/runtime.ts`:

- `INVESTIGATE`
- `CHAT`
- `SCAN_ANOMALIES`
- `LIVE_INTEL`
- `TTS`

Adapters in scope:

- `GEMINI`
- `OPENROUTER`
- `OPENAI`
- `ANTHROPIC`

## 1. Fast Triage

1. Open `System Config -> AI` and capture selected `provider` and `model`.
2. Verify a key exists for the selected provider.
3. Reproduce once.
4. Inspect browser console for `[provider-router]` entries.
5. Capture:
   - `provider`
   - `modelId`
   - `operation`
   - `retryCount`
   - `errorClass`
6. If the run used OpenRouter, also capture:
   - `generationMode`
   - whether OpenRouter web search was enabled
   - search engine and domain filters from `System Config -> AI`
   - any provenance warnings shown in the artifact or chat response

## 2. Error Class Reference

| Error                   | Meaning                            | Primary Action                            |
| ----------------------- | ---------------------------------- | ----------------------------------------- |
| `MISSING_API_KEY`       | No usable key for provider         | Add key or switch provider                |
| `RATE_LIMITED`          | Upstream quota/throttle            | Retry later, change model/provider        |
| `PARSE_ERROR`           | Model payload failed normalization | Retry with simpler topic, collect payload |
| `UPSTREAM_ERROR`        | Endpoint/network/provider failure  | Validate account/status, retry/switch     |
| `UNSUPPORTED_OPERATION` | Capability mismatch (commonly TTS) | Use supported provider/model              |

## 3. Capability Constraints

- TTS: Gemini adapter only.
- Chat: all active providers support the persisted workspace chat contract for both non-streaming and streaming turns.
- Chat stop/cancel: aborts the active provider request and persists the turn as cancelled if a final answer was not completed.
- Chat actions: retrieval/save/follow-up operations are persisted in `chat_actions`; use them when confirming what the system actually did for a user.
- Research Workspace AI actions: selection summaries and drafted board notes reuse the same provider router with explicit manual triggers only. Failures surface inline/toast-side and do not auto-reorganize the board or create silent persistence side effects. Presentation mode blocks board-mutating placement flows until the operator returns the board to edit mode.
- Timeline audit: persisted chat sessions and high-signal `chat_actions` now surface in `Timeline`, so operator verification can cross-check Chat's action log against the workspace chronology.
- Thinking budget: model-gated. Do not assume it is available just because the provider supports some reasoning-capable models.
- Structured output: model-gated. Sherlock will request native structured output where available and fall back to prompt-shaped JSON when it is not.
- Web search: capability varies by selected model metadata.
- OpenRouter web search defaults on, but can be disabled globally in `System Config -> AI`.

OpenRouter-specific search notes:

- Sherlock uses `openrouter:web_search` as the primary search path.
- Operator-tunable settings are `enabled`, `engine`, `maxResults`, `maxTotalResults`, `searchContextSize`, `allowedDomains`, and `excludedDomains`.
- Some engines do not honor every filter combination. Sherlock records warnings in artifact/chat provenance when a requested filter set is likely to be ignored.

## 4. Launch Propagation Checks

If users report wrong provider/model context:

1. Launch from each entry point:
   - Finder search
   - Finder wizard
   - Live Monitor event
   - Operation headline
   - Full Spectrum (batch lead)
   - Settings template or built-in starter
2. Validate persisted config snapshots on task/artifact (`provider`, `modelId`, `scopeId`, `dateRangeOverride`, `launchSource`).
3. Confirm pack/purpose snapshots (`packId`, `purposeId`, `artifactType`, `labelProfileId`) match the selected launch setup.
4. Confirm inherited context from parent artifact/workspace where expected.
5. Confirm `generationMode` propagated correctly when the launch came from Settings defaults, a saved template, guided mode, or a parent artifact follow-up.
6. If the launch used a starter or template, verify the resolved purpose and artifact type still match the prefilled copy shown in `TaskSetupModal`.

## 5. Fallback Behavior Notes

Current adapter behavior:

- `INVESTIGATE`: fails hard on provider errors (no simulated artifact fallback).
- `CHAT`: fails hard on provider or retrieval errors (no simulated transcript fallback). Streaming turns follow the same rule and only keep the partial text if the user explicitly stopped the run.
- `SCAN_ANOMALIES` and `LIVE_INTEL`: return simulated fallback items for non-key failures.
- `MISSING_API_KEY`: does not fallback; error is surfaced.
- invalid or unavailable saved model ids now fall back to the nearest runtime-valid selection, except OpenRouter manual slugs which are preserved intentionally.

This distinction is important when diagnosing "why data still appeared" in feed/live flows.

## 6. Recovery Playbook

1. Switch to a known-good provider/model with valid key.
2. Retry with narrower scope/topic/date range.
3. Disable or simplify optional overrides.
4. For OpenRouter incidents, retry with web search disabled once to separate provider/model issues from search-tool issues.
5. If the artifact shows provenance warnings, capture them before retrying because they often explain unsupported engine/filter combinations.
6. Capture logs and failing input for escalation.

## 7. Escalation Artifact Checklist

- Timestamp + timezone
- Browser and app context
- Provider/model and operation
- Generation mode and OpenRouter search settings if relevant
- Launch source
- Error class + message
- Minimal reproducible prompt/topic
- Whether fallback data appeared
- Any artifact/chat provenance warnings or missing-citation symptoms
