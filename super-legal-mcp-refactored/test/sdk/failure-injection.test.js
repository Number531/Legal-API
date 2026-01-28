import { describe, expect, test } from '@jest/globals';
import { CircuitBreaker } from '../../src/utils/circuitBreaker.js';
import { RateLimiter } from '../../src/utils/rateLimiter.js';
import {
  ERROR_CODES,
  mapExceptionToCode,
  toErrorResponse
} from '../../src/utils/sdkErrorTaxonomy.js';

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('TimeoutError')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

describe('Failure injection (Phase 7)', () => {
  test('tool execution times out within budget', async () => {
    const slowTool = new Promise((resolve) => setTimeout(() => resolve('ok'), 50));
    await expect(withTimeout(slowTool, 10)).rejects.toThrow('TimeoutError');
  });

  test('malformed tool input is mapped to VALIDATION_ERROR', () => {
    const code = mapExceptionToCode({ name: 'ValidationError' });
    expect(code).toBe(ERROR_CODES.VALIDATION_ERROR);
    const resp = toErrorResponse(code, 'bad payload', { field: 'input' });
    expect(resp.status).toBe(400);
    expect(resp.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  test('network failure is mapped to NETWORK_ERROR and surfaced as 502', () => {
    const code = mapExceptionToCode({ code: 'ECONNREFUSED' });
    expect(code).toBe(ERROR_CODES.NETWORK_ERROR);
    const resp = toErrorResponse(code, 'network down');
    expect(resp.status).toBe(502);
  });

  test('rate limiter blocks after rpm exceeded', () => {
    const limiter = new RateLimiter({ rpm: 1, tpm: 10 });
    limiter.acquire(1);
    expect(() => limiter.acquire(1)).toThrow(/RateLimitError/);
  });

  test('circuit breaker transitions CLOSED -> OPEN -> HALF_OPEN -> CLOSED', async () => {
    const breaker = new CircuitBreaker({ threshold: 1, timeoutMs: 30 });
    await expect(
      breaker.execute(async () => {
        throw new Error('fail');
      })
    ).rejects.toThrow('fail');
    await expect(
      breaker.execute(async () => 'should not run')
    ).rejects.toThrow('CircuitBreakerOpen');

    // Wait for half-open window
    await new Promise((resolve) => setTimeout(resolve, 35));
    const result = await breaker.execute(async () => 'recovered');
    expect(result).toBe('recovered');
    expect(breaker.state).toBe('CLOSED');
  });
});

