let api;
try {
  // Lazy import to avoid crashing if dependency is unavailable
  api = await import('@opentelemetry/api');
} catch (err) {
  api = null;
}

const tracer = api?.trace?.getTracer('super-legal-sdk') ?? {
  startSpan: () => ({
    setAttributes: () => {},
    setStatus: () => {},
    recordException: () => {},
    end: () => {}
  })
};

export function startRequestSpan(name, attributes = {}) {
  const span = tracer.startSpan(name);
  if (span?.setAttributes) {
    span.setAttributes(attributes);
  }
  return span;
}

export function endSpan(span, { error } = {}) {
  if (!span) return;
  if (error && span.recordException) {
    span.recordException(error);
    span.setStatus?.({ code: api?.SpanStatusCode?.ERROR ?? 2, message: error.message });
  } else {
    span.setStatus?.({ code: api?.SpanStatusCode?.OK ?? 1 });
  }
  span.end?.();
}

export function withToolSpan(toolName, fn) {
  const span = startRequestSpan('claude.tool', { 'tool.name': toolName });
  return (async () => {
    try {
      const result = await fn();
      endSpan(span);
      return result;
    } catch (error) {
      endSpan(span, { error });
      throw error;
    }
  })();
}

