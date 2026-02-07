# Provider Operations Runbook

This runbook covers runtime incidents in the provider router pipeline:

- `INVESTIGATE`
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

## 2. Error Class Reference

| Error | Meaning | Primary Action |
| --- | --- | --- |
| `MISSING_API_KEY` | No usable key for provider | Add key or switch provider |
| `RATE_LIMITED` | Upstream quota/throttle | Retry later, change model/provider |
| `PARSE_ERROR` | Model payload failed normalization | Retry with simpler topic, collect payload |
| `UPSTREAM_ERROR` | Endpoint/network/provider failure | Validate account/status, retry/switch |
| `UNSUPPORTED_OPERATION` | Capability mismatch (commonly TTS) | Use supported provider/model |

## 3. Capability Constraints

- TTS: Gemini adapter only.
- Thinking budget: model-gated, mainly relevant to Gemini models.
- Web search: capability varies by provider/model metadata.

## 4. Launch Propagation Checks

If users report wrong provider/model context:

1. Launch from each entry point:
   - Finder search
   - Finder wizard
   - Live Monitor event
   - Operation headline
   - Full Spectrum (batch lead)
2. Validate persisted config snapshots on task/report (`provider`, `modelId`, `scopeId`, `dateRangeOverride`, `launchSource`).
3. Confirm inherited context from parent report/case where expected.

## 5. Fallback Behavior Notes

Current adapter behavior:

- `INVESTIGATE`: fails hard on provider errors (no simulated report fallback).
- `SCAN_ANOMALIES` and `LIVE_INTEL`: return simulated fallback items for non-key failures.
- `MISSING_API_KEY`: does not fallback; error is surfaced.

This distinction is important when diagnosing “why data still appeared” in feed/live flows.

## 6. Recovery Playbook

1. Switch to a known-good provider/model with valid key.
2. Retry with narrower scope/topic/date range.
3. Disable or simplify optional overrides.
4. Capture logs and failing input for escalation.

## 7. Escalation Artifact Checklist

- Timestamp + timezone
- Browser and app context
- Provider/model and operation
- Launch source
- Error class + message
- Minimal reproducible prompt/topic
- Whether fallback data appeared
