# Rollout Plan (Phase 9 → Phase 4 Full Cutover)

Derived from migration-spec.md Section 12 (Phase 4) and Section 17.5.

## Tiers and Timing
- 5% for 1 hour (initial validation)
- 25% for 4 hours (domain metrics)
- 50% for 24 hours (stability)
- 75% for 24 hours (near-full load)
- 100% for 1 week (full cutover)

## Checkpoints (at each tier)
- Parity score ≥ 0.98 on golden prompts
- P95 latency regression ≤ 20% vs baseline
- Structured output validity ≥ 98%
- Circuit breaker trips: no increase vs baseline
- Error rate: not more than 2x baseline

## Go / No-Go Criteria
- Proceed only if all checkpoints met for the tier duration
- No critical alerts open (Prometheus / cutover-monitor)
- No Sev1/Sev2 incidents in prior 24h

## Rollback Triggers (any true)
- Parity < 0.95
- P95 regression > 20%
- Error rate > 2x baseline
- Circuit breaker trips increase
- Structured outputs validity < 98%

## Commands and Scripts
- Canary %: `CANARY_PCT=<value>` env, then redeploy
- Rollback: `CANARY_PCT=0 SDK_TOOL_RUNNER=false STRUCTURED_OUTPUTS=false` + redeploy
- Monitor: `node scripts/cutover-monitor.js`
- Verify: `scripts/cutover-verify.sh`

## Metrics to Watch
- `claude_request_duration_ms` (P50/P95)
- `claude_errors_total` (by code)
- `claude_structured_output_*`
- `claude_circuit_breaker_trips_total`
- Domain parity via shadow proxy (if enabled)

## Communication Plan
- Announce tier changes in eng channel + oncall page
- Record go/no-go decision with timestamps
- Post-mortem required for any rollback


