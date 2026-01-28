# Rollback Procedures

## Triggers
- Parity <95% on golden prompts
- P95 latency regression >20% vs baseline
- Error rate doubled vs prior day
- Critical incident (structured outputs failing, breaker thrash)

## Steps
1) Set flag to disable SDK path:
```bash
export SDK_TOOL_RUNNER=false
export CANARY_PCT=0
```
2) Redeploy/reload service.
3) Verify routing (expect legacy):
```bash
curl -s http://localhost:3001/health | jq '.environment'
```
4) Monitor metrics:
```bash
curl -s http://localhost:3001/metrics | grep claude_errors_total
```
5) Confirm parity/latency return to baseline.

## Verification Checklist
- Legacy responses served
- Error rate stabilizes
- Breaker trips not increasing
- Structured outputs disabled if failing

## Post-Rollback
- Capture logs for incident report
- Open follow-up to root-cause before re-enabling SDK


