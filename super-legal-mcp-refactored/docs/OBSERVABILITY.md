# Observability Guide (Phase 6.5)

This document explains how to deploy and operate the observability stack for the Claude SDK migration.

## Endpoints

- Metrics: `http://<host>:<port>/metrics` (Prometheus format)
- Skills metrics: `http://<host>:<port>/api/skills/dashboard` (JSON)

## Metrics (from `src/utils/sdkMetrics.js`)

| Metric | Type | Labels |
| --- | --- | --- |
| `claude_request_duration_ms` | Histogram | `path`, `model`, `status` |
| `claude_stream_duration_ms` | Histogram | `path`, `model`, `status` |
| `claude_tool_duration_ms` | Histogram | `tool`, `status` |
| `claude_tool_invocations_total` | Counter | `tool`, `status` |
| `claude_structured_output_attempts_total` | Counter | `tool` |
| `claude_structured_output_success_total` | Counter | `tool` |
| `claude_structured_output_failures_total` | Counter | `tool` |
| `claude_tokens_input_total` | Counter | `model` |
| `claude_tokens_output_total` | Counter | `model` |
| `claude_tokens_cached_total` | Counter | `model` |
| `claude_circuit_breaker_trips_total` | Counter | `domain` |
| `claude_errors_total` | Counter | `code`, `path` |
| `claude_thinking_blocks_total` | Counter | `path` |

## Alerting

Prometheus rules are defined in [`prometheus/alerts.yml`](../prometheus/alerts.yml):

- Tool error rate > 5% (5m)
- P95 request latency > 10s (10m)
- Structured output failure rate > 2% (5m)
- Circuit breaker trips > 3 in 15m
- Rate limit errors > 10/min (5m)

### Deploying alerts

1. Copy `prometheus/alerts.yml` to your Prometheus rules directory.
2. Add to `prometheus.yml`:
   ```yaml
   rule_files:
     - alerts.yml
   ```
3. Reload Prometheus or restart the service.

## Dashboard

An importable Grafana dashboard is provided at [`grafana/claude-sdk-dashboard.json`](../grafana/claude-sdk-dashboard.json) with panels for:

- Request latency (P50/P95/P99)
- Tool error rate by tool
- Structured output success rate
- Token usage (input/output/cached)
- Circuit breaker trips
- Thinking blocks rate

### Importing the dashboard

1. In Grafana, go to **Dashboards → Import**.
2. Upload `grafana/claude-sdk-dashboard.json`.
3. Select your Prometheus data source when prompted.

## Logging

- Structured JSON logs with `request_id` from `correlationIdMiddleware`.
- Secrets masking for API keys, bearer tokens, SSNs, credit cards in `sdkLogger.js`.
- Request completion logs include latency, model, tools called, thinking blocks, and token usage.

## Tracing

- `sdkTracing.js` uses `@opentelemetry/api` to create spans for requests and tools.
- If an exporter is configured externally, spans will be emitted; otherwise tracing is a no-op.

## Troubleshooting

- **High tool error rate**: Check underlying API clients; verify rate limits and credentials.
- **Structured output failures**: Validate schemas, ensure `structured-outputs-2025-11-13` beta header is sent.
- **Circuit breaker trips**: Inspect dependent services; increase timeout or reduce concurrency as needed.
- **Rate limit errors**: Lower traffic, increase backoff, or request higher quota; monitor `claude_errors_total{code="RATE_LIMIT_ERROR"}`.

## Validation Checklist

- `/metrics` returns Prometheus text format without errors.
- Grafana dashboard panels populate with live data after import.
- Prometheus alerts load without syntax errors and fire when thresholds are exceeded (can be tested with `--rule.alert.for` overrides in a staging environment).

