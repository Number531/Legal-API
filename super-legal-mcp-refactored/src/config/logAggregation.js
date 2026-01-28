/**
 * Log aggregation configuration (Section 17.2)
 * Supports ELK, Splunk, and Datadog setups with JSON log formatting and
 * redaction rules to keep sensitive data out of downstream sinks.
 */

export const logAggregationConfig = {
  provider: process.env.LOG_AGGREGATION_PROVIDER || 'datadog', // datadog | elk | splunk
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  requiredFields: [
    'timestamp',
    'level',
    'service',
    'env',
    'request_id',
    'path',
    'model',
    'latency_ms'
  ],
  redactions: [
    { pattern: /sk-[a-zA-Z0-9]{32,}/g, replacement: '[REDACTED_API_KEY]' }, // API keys
    { pattern: /Bearer [a-zA-Z0-9_\-\.]{20,}/g, replacement: 'Bearer [REDACTED]' }, // bearer tokens
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' }, // SSN
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' } // credit cards
  ],
  elk: {
    host: process.env.ELK_HOST,
    username: process.env.ELK_USERNAME,
    password: process.env.ELK_PASSWORD,
    index: process.env.ELK_INDEX || 'claude-sdk'
  },
  splunk: {
    hecUrl: process.env.SPLUNK_HEC_URL,
    hecToken: process.env.SPLUNK_HEC_TOKEN,
    index: process.env.SPLUNK_INDEX || 'claude-sdk'
  },
  datadog: {
    apiKey: process.env.DD_API_KEY,
    site: process.env.DD_SITE || 'datadoghq.com',
    service: process.env.DD_SERVICE || 'claude-sdk',
    env: process.env.ENVIRONMENT || 'sdk-migration'
  }
};

export function redactLogMessage(message = '') {
  let output = message;
  for (const { pattern, replacement } of logAggregationConfig.redactions) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

