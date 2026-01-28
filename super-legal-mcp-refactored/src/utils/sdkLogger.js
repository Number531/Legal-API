import { randomUUID } from 'crypto';
import { logAggregationConfig, redactLogMessage } from '../config/logAggregation.js';

// Basic secrets masking patterns (fallback if config unavailable)
const secretPatterns = [
  { regex: /sk-[a-zA-Z0-9]{20,}/g, replacement: '[REDACTED_API_KEY]' },
  { regex: /Bearer [a-zA-Z0-9_\-\.]{20,}/g, replacement: 'Bearer [REDACTED]' },
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' }
];

function maskSecrets(value) {
  if (typeof value !== 'string') return value;
  // Use centralized redaction from logAggregation config
  let sanitized = redactLogMessage(value);
  // Fallback patterns for legacy masking labels
  for (const pattern of secretPatterns) {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }
  return sanitized;
}

function sanitizeLog(logObj) {
  const cloned = {};
  for (const [key, value] of Object.entries(logObj || {})) {
    if (typeof value === 'string') {
      cloned[key] = maskSecrets(value);
    } else if (Array.isArray(value)) {
      cloned[key] = value.map(maskSecrets);
    } else if (value && typeof value === 'object') {
      cloned[key] = sanitizeLog(value);
    } else {
      cloned[key] = value;
    }
  }
  return cloned;
}

/**
 * Build a log entry with required fields per logAggregationConfig.requiredFields.
 * Missing fields are set to null to ensure downstream parsers don't break.
 */
function buildLogEntry(level, event, data = {}) {
  const base = {
    timestamp: new Date().toISOString(),
    level,
    service: logAggregationConfig?.datadog?.service || 'claude-sdk',
    env: logAggregationConfig?.datadog?.env || process.env.ENVIRONMENT || 'unknown',
    event
  };

  // Ensure all required fields are present
  const requiredFields = logAggregationConfig?.requiredFields || [];
  for (const field of requiredFields) {
    if (!(field in base) && !(field in data)) {
      base[field] = null;
    }
  }

  return sanitizeLog({ ...base, ...data });
}

export function correlationIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export function logInfo(event, data = {}) {
  const payload = buildLogEntry('info', event, data);
  console.log(JSON.stringify(payload));
}

export function logError(event, data = {}) {
  const payload = buildLogEntry('error', event, data);
  console.error(JSON.stringify(payload));
}

export function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();
  const requestId = req.requestId || res.locals.requestId;

  res.on('finish', () => {
    const latency = Date.now() - start;
    logInfo('request_complete', {
      request_id: requestId,
      path: req.path,
      method: req.method,
      status: res.statusCode,
      latency_ms: latency,
      model: res.locals?.model,
      tools_called: res.locals?.tools_called,
      thinking_blocks: res.locals?.thinking_blocks,
      tokens: res.locals?.tokens
    });
  });

  next();
}

