/**
 * Prometheus-style alerting rule definitions (documentation only).
 * Exported for reference or downstream rendering.
 */
export const alertingRules = {
  groups: [
    {
      name: 'claude_sdk',
      interval: '30s',
      rules: [
        {
          alert: 'ClaudeToolErrorRateHigh',
          expr:
            'rate(claude_tool_invocations_total{status="error"}[5m]) / rate(claude_tool_invocations_total[5m]) > 0.05',
          for: '5m',
          labels: { severity: 'warning' },
          annotations: {
            summary: 'Tool error rate above 5%'
          }
        },
        {
          alert: 'ClaudeLatencyRegression',
          expr: 'histogram_quantile(0.95, claude_request_duration_ms_bucket) > 10000',
          for: '10m',
          labels: { severity: 'warning' },
          annotations: {
            summary: 'P95 request latency above 10s'
          }
        },
        {
          alert: 'StructuredOutputValidationFailure',
          expr:
            'rate(claude_structured_output_failures_total[5m]) / rate(claude_structured_output_attempts_total[5m]) > 0.02',
          for: '5m',
          labels: { severity: 'critical' },
          annotations: {
            summary: 'Structured output validation failure rate above 2%'
          }
        },
        {
          alert: 'CircuitBreakerTripping',
          expr: 'increase(claude_circuit_breaker_trips_total[15m]) > 3',
          for: '1m',
          labels: { severity: 'critical' },
          annotations: {
            summary: 'Circuit breaker tripped 3+ times in 15 minutes'
          }
        }
      ]
    }
  ]
};

