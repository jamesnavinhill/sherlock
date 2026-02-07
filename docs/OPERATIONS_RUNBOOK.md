# Sherlock Provider Operations Runbook

## Scope

This runbook covers runtime failures in the multi-provider AI pipeline (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`) for:

- investigations
- anomaly scans
- live intel
- Gemini TTS

## 1) Fast Triage

1. Confirm active provider/model in **Settings → AI**.
2. Confirm provider key exists for that provider in **Settings → AI** (or API key modal).
3. Re-run the same action and check browser console for `[provider-router]` logs.
4. Capture:
   - `provider`
   - `modelId`
   - `operation`
   - `retryCount`
   - `errorClass`

## 2) Error Class Mapping

| Error Class | Meaning | Primary Action |
| --- | --- | --- |
| `MISSING_API_KEY` | No key was found for selected provider | Add key or switch provider |
| `RATE_LIMITED` | Upstream throttling or quota limits | Retry later or switch model/provider |
| `PARSE_ERROR` | Provider returned non-parseable payload | Re-run; if persistent, lower complexity and collect sample payload |
| `UPSTREAM_ERROR` | Provider endpoint/network/server issue | Validate key/account status, then retry/switch provider |
| `UNSUPPORTED_OPERATION` | Feature not available for provider/model (ex: TTS) | Use supported provider/model |

## 3) Known Capability Constraints

- TTS is currently implemented for Gemini only.
- Thinking budget is model-gated and primarily relevant to Gemini models.
- Web search/tooling support varies by provider capability metadata.

## 4) Launch Propagation Verification

If users report "wrong provider/model used":

1. Start a run from each flow:
   - Feed
   - Live Monitor event
   - Operation deep dive
   - NetworkGraph entity investigate
   - Operation headline investigate
2. Check archived report/task snapshot config (`provider`, `modelId`, `scopeId`, `dateRangeOverride`, `launchSource`).
3. Confirm overrides are intentional and inherited fields match parent report where expected.

## 5) Recovery Playbook

1. Switch to `GEMINI` with a known-good model and key to restore baseline.
2. Reduce custom overrides (scope/date/preseed) and re-run.
3. If parse instability continues, collect raw provider payload sample and attach it to a bug report.
4. Include console `[provider-router]` entries and the failing launch source.

## 6) Escalation Artifact Checklist

- Timestamp and timezone
- Selected provider/model
- Operation type (`INVESTIGATE` / `SCAN_ANOMALIES` / `LIVE_INTEL` / `TTS`)
- Error class and message
- One minimal reproducible topic/request
- Whether fallback behavior triggered
