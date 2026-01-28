# SDK Cutover Runbook (Phase 4)

This runbook aligns with `migration-spec.md` Section 15 and Phase 4 cutover requirements.

## Rollback (Emergency)
1. Set `SDK_TOOL_RUNNER=false` (and optionally `CANARY_PCT=0`) in environment.
2. Restart services (`pm2 reload` or `npm restart`).
3. Verify `/health` shows `SDK_TOOL_RUNNER` false and traffic routing to legacy.
4. Monitor error rate and latency until stable; investigate root cause before re-enabling SDK.

## Staged Cutover (50% → 75% → 100%)
- Update `CANARY_PCT` and deploy.
- After each stage (24–48h): confirm parity ≥98%, P95 latency within 20%, no breaker trip increase.
- Full cutover: `CANARY_PCT=100`, `SDK_TOOL_RUNNER=true`, `STRUCTURED_OUTPUTS=true`.

## Monitoring
- Shadow proxy metrics: `/metrics`, `/metrics/domains`
- Cutover monitor script: `node scripts/cutover-monitor.js` (set `METRICS_URL`, `DOMAINS_URL`, `INTERVAL_SEC`, `OUT_PATH`).
- Alerts: parity < 0.95 or error rate >2x baseline.
- Track P50/P95 latency, total requests, failures, and parity distribution per domain.

## Rate Limit & Overload
- 429: exponential backoff with jitter (1s, 2s, 4s); respect `retry-after`.
- 529: back off 10s; max 3 attempts.
- Escalate to rollback if sustained for >15 minutes.

## Timeouts
- Client abort: return partial data if available; log request_id.
- Server/SDK timeouts: prefer SDK defaults; ensure client timeout > SDK timeout.

## Structured Outputs
- Enabled by default for mapped tools; beta header `structured-outputs-2025-11-13`.
- If failure rate >5%: disable `STRUCTURED_OUTPUTS` or per-tool schema; log violations.

## Managed Skills (Document Processing)
- Enable with `SKILLS_ENABLED=true`; disable to bypass quickly.
- Beta headers required: `code-execution-2025-08-25, skills-2025-10-02`.
- Managed skills: `pdf`, `xlsx`, `docx` (enabled by default), `pptx` (disabled by default).
- If skill errors occur, disable `SKILLS_ENABLED` and restart the SDK server.

## Model Selection (default)
- Hard tasks: `claude-opus-4-5-20251101`
- Default: `claude-sonnet-4-5-20250929`
- Fast/simple: `claude-haiku-4-5-20251001`
- Use 1M context only when needed; enable `context-1m-2025-08-07`.

## Health & Endpoints
- `/health` (legacy server), `/api/research` (SDK), `/api/claude/research` (gateway), `/api/claude/stream` (gateway streaming).
- Shadow proxy: `/metrics`, `/metrics/domains`.

## Incident Response (structured outputs)
1. Check schema validity and beta header.
2. Disable structured outputs for affected tool; fall back to free-form.
3. Monitor error rate; re-enable after validation passes.

## Post-Cutover Cleanup
- Legacy orchestration (`processStreamWithToolHandling`) decommissioned; keep rollback flag available.
- ClaudeOrchestrator archived as `.legacy` for reference only.
- Keep feature flags in place for emergency rollback.*** End Patch

