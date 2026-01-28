# Log Aggregation (Section 17.2)

Centralized log aggregation for Claude SDK migration. Supports ELK, Splunk, and Datadog with structured JSON logs, redaction, and alerting patterns.

## Configuration
- Provider: `LOG_AGGREGATION_PROVIDER` (`datadog` | `elk` | `splunk`)
- Level: `LOG_LEVEL` (default: `info`)
- Format: JSON with required fields: `timestamp`, `level`, `service`, `env`, `request_id`, `path`, `model`, `latency_ms`
- Redactions: API keys, bearer tokens, SSN, credit cards (see `src/config/logAggregation.js`)

## Datadog Setup
1. Set `DD_API_KEY`, `DD_SITE`, `DD_SERVICE`, `ENVIRONMENT`
2. Enable intake: `https://http-intake.logs.${DD_SITE}/v1/input`
3. JSON log example query:
   - Latency spikes: `service:claude-sdk @latency_ms>5000`
   - Tool errors: `service:claude-sdk @event:tool_error`
4. Alerts:
   - Error rate >5% over 5m
   - P95 latency >10s over 10m

## ELK Setup
1. Set `ELK_HOST`, `ELK_USERNAME`, `ELK_PASSWORD`, `ELK_INDEX`
2. Filebeat/Vector shipper with JSON codec
3. Kibana queries:
   - `event:claude_request_complete AND latency_ms:>5000`
   - `event:structured_output_failure`
4. Alerts:
   - Circuit breaker trips increase (`claude_circuit_breaker_trips_total`)
   - Structured output failure rate >2%

## Splunk Setup
1. Set `SPLUNK_HEC_URL`, `SPLUNK_HEC_TOKEN`, `SPLUNK_INDEX`
2. HEC source type `json_no_timestamp`
3. SPL queries:
   - `search event="claude_request_complete" latency_ms>5000`
   - `search event="tool_error" | stats count by tool`
4. Alerts:
   - 429/529 errors sustained 5m
   - Tool error count > 5 in 10m

## Redaction
- Patterns applied in `redactLogMessage`: API keys, bearer tokens, SSN, credit cards
- Apply before emitting to any sink
- Avoid logging tool inputs containing PII

## Operational Checks
- Verify ingestion by provider (Datadog Live Tail, Kibana Discover, Splunk Search)
- Confirm redaction by sampling recent logs
- Ensure dashboards/alerts enabled for: latency, error rate, structured outputs, circuit breaker trips, cache usage

