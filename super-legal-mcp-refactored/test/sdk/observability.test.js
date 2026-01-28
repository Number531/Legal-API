import { describe, test, expect } from '@jest/globals';
import {
  initSdkMetrics,
  metricsEndpoint,
  recordTokens,
  recordStreamDuration
} from '../../src/utils/sdkMetrics.js';

describe('Observability - Metrics', () => {
  test('initSdkMetrics should not throw', () => {
    expect(() => initSdkMetrics()).not.toThrow();
  });

  test('metricsEndpoint should respond with metrics', async () => {
    const res = {
      headers: {},
      set(key, value) {
        this.headers[key] = value;
      },
      endCalled: false,
      end(body) {
        this.endCalled = true;
        this.body = body;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonPayload = payload;
      }
    };

    await metricsEndpoint({}, res);
    expect(res.headers['Content-Type']).toBeDefined();
    expect(res.endCalled || res.jsonPayload).toBeTruthy();
  });

  test('recordTokens and recordStreamDuration should not throw', () => {
    expect(() => recordTokens({ model: 'test', input: 10, output: 5, cached: 1 })).not.toThrow();
    expect(() =>
      recordStreamDuration({ path: '/api/research', model: 'test', status: 'ok' }, 100)
    ).not.toThrow();
  });
});

