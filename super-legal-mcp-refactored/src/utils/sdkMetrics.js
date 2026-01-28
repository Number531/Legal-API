import client from 'prom-client';

// Register default metrics once per process
let defaultMetricsRegistered = false;

// Histograms
const requestDuration = new client.Histogram({
  name: 'claude_request_duration_ms',
  help: 'SDK request duration in milliseconds',
  labelNames: ['path', 'model', 'status'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000]
});

const streamDuration = new client.Histogram({
  name: 'claude_stream_duration_ms',
  help: 'SDK stream duration in milliseconds',
  labelNames: ['path', 'model', 'status'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000]
});

const toolDuration = new client.Histogram({
  name: 'claude_tool_duration_ms',
  help: 'Tool execution duration in milliseconds',
  labelNames: ['tool', 'status'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000]
});

// Counters
const toolInvocations = new client.Counter({
  name: 'claude_tool_invocations_total',
  help: 'Tool invocation counter',
  labelNames: ['tool', 'status']
});

const structuredOutputAttempts = new client.Counter({
  name: 'claude_structured_output_attempts_total',
  help: 'Structured output attempts',
  labelNames: ['tool']
});

const structuredOutputSuccess = new client.Counter({
  name: 'claude_structured_output_success_total',
  help: 'Structured output successes',
  labelNames: ['tool']
});

const structuredOutputFailures = new client.Counter({
  name: 'claude_structured_output_failures_total',
  help: 'Structured output failures',
  labelNames: ['tool']
});

const circuitBreakerTrips = new client.Counter({
  name: 'claude_circuit_breaker_trips_total',
  help: 'Circuit breaker trips',
  labelNames: ['domain']
});

const errorCounter = new client.Counter({
  name: 'claude_errors_total',
  help: 'SDK error counter',
  labelNames: ['code', 'path']
});

const thinkingBlocks = new client.Counter({
  name: 'claude_thinking_blocks_total',
  help: 'Number of thinking blocks observed',
  labelNames: ['path']
});

// Token usage
const inputTokens = new client.Counter({
  name: 'claude_tokens_input_total',
  help: 'Input tokens across requests',
  labelNames: ['model']
});

const outputTokens = new client.Counter({
  name: 'claude_tokens_output_total',
  help: 'Output tokens across requests',
  labelNames: ['model']
});

const cacheTokens = new client.Counter({
  name: 'claude_tokens_cached_total',
  help: 'Cache read tokens across requests',
  labelNames: ['model']
});

const cacheReadTokens = new client.Counter({
  name: 'claude_cache_read_tokens_total',
  help: 'Cache read input tokens across requests',
  labelNames: ['model']
});

const cacheCreationTokens = new client.Counter({
  name: 'claude_cache_creation_tokens_total',
  help: 'Cache creation input tokens across requests',
  labelNames: ['model']
});

export function initSdkMetrics() {
  if (!defaultMetricsRegistered) {
    client.collectDefaultMetrics();
    defaultMetricsRegistered = true;
  }
}

export function metricsMiddleware(req, res, next) {
  const end = requestDuration.startTimer({ path: req.path });
  res.on('finish', () => {
    end({ model: res.locals?.model || 'unknown', status: res.statusCode });
  });
  next();
}

export function recordStreamDuration({ path, model, status }, durationMs) {
  streamDuration.observe({ path, model, status }, durationMs);
}

export function recordToolDuration(tool, status, durationMs) {
  toolDuration.observe({ tool, status }, durationMs);
}

export function incrementToolInvocation(tool, status = 'ok') {
  toolInvocations.inc({ tool, status });
}

export function recordStructuredOutputAttempt(tool) {
  structuredOutputAttempts.inc({ tool });
}

export function recordStructuredOutputSuccess(tool) {
  structuredOutputSuccess.inc({ tool });
}

export function recordStructuredOutputFailure(tool) {
  structuredOutputFailures.inc({ tool });
}

export function recordCircuitBreakerTrip(domain = 'unknown') {
  circuitBreakerTrips.inc({ domain });
}

export function recordError(code, path = 'unknown') {
  errorCounter.inc({ code, path });
}

export function recordThinkingBlock(path = 'unknown') {
  thinkingBlocks.inc({ path });
}

export function recordTokens({
  model = 'unknown',
  input = 0,
  output = 0,
  cached = 0,
  cacheRead = 0,
  cacheCreation = 0
}) {
  const cacheReadValue = cacheRead || cached || 0;
  if (input) inputTokens.inc({ model }, input);
  if (output) outputTokens.inc({ model }, output);
  if (cached) cacheTokens.inc({ model }, cached);
  if (cacheReadValue) cacheReadTokens.inc({ model }, cacheReadValue);
  if (cacheCreation) cacheCreationTokens.inc({ model }, cacheCreation);
}

export async function metricsEndpoint(req, res) {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Metrics unavailable' });
  }
}

