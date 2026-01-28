# Incident Response Playbook

## Error Taxonomy (src/utils/sdkErrorTaxonomy.js)
- NETWORK_ERROR → 502
- VALIDATION_ERROR → 400
- TIMEOUT_ERROR → 504
- RATE_LIMIT_ERROR → 429
- CIRCUIT_BREAKER_OPEN → 503
- TOOL_EXECUTION_ERROR → 500
- UNKNOWN_ERROR → 500

## Scenarios & Actions

### Rate Limit (429/529)
- Exponential backoff with jitter (per spec 15.2)
- Reduce concurrency; check quotas
- Monitor `claude_errors_total{code="RATE_LIMIT_ERROR"}`

### Timeouts
- Client: increase/request timeout; return partial if available
- Server: validate downstream SLAs; check circuit breaker state

### Structured Output Failures
- Verify `structured-outputs-2025-11-13` header
- Validate schemas in `src/config/structuredOutputSchemas.js`
- If >5% failure: disable `STRUCTURED_OUTPUTS` flag temporarily

### Circuit Breaker Trips
- Inspect dependent service health
- Lower concurrency; increase timeout cautiously
- Monitor `claude_circuit_breaker_trips_total`

### Skills Failures/Quota
- Check `skillsQuotas.js`, `skillsMetrics.js`
- Review sandbox limits (no network/filesystem unless approved)

## Escalation
- On-call: SDK migration owner
- If production impact persists >15m: initiate rollback (see `ROLLBACK-PROCEDURES.md`)

## Validation Commands
```bash
curl -s http://localhost:3001/metrics | grep claude_errors_total | head
curl -s http://localhost:3001/api/skills/dashboard | jq
```


