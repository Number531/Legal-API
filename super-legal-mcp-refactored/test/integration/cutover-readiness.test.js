import { describe, it, expect, beforeAll } from '@jest/globals';
import { stickyBucket, shouldRouteToSdk, shouldRollback, ROLLBACK_THRESHOLDS } from '../../src/config/canaryConfig.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const HEALTH_URL = `${SERVER_URL}/health`;
const METRICS_URL = `${SERVER_URL}/metrics`;
const RESEARCH_URL = `${SERVER_URL}/api/research`;

let serverAvailable = false;

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text), text };
  } catch {
    return { status: res.status, json: null, text };
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text), text };
  } catch {
    return { status: res.status, json: null, text };
  }
}

describe('Cutover Readiness', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(HEALTH_URL);
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
  });

  describe('Health Endpoint', () => {
    it('exposes flags and dependencies', async () => {
      if (!serverAvailable) return;
      const { status, json } = await fetchJson(HEALTH_URL);
      expect(status).toBeLessThan(500);
      expect(json).toBeTruthy();
      expect(json.feature_flags).toBeTruthy();
      expect(json.dependencies).toBeTruthy();
      expect(json.feature_flags).toHaveProperty('CANARY_PCT');
      expect(json.feature_flags).toHaveProperty('SDK_TOOL_RUNNER');
      expect(json.dependencies).toHaveProperty('circuit_breaker');
    });

    it('includes build metadata', async () => {
      if (!serverAvailable) return;
      const { json } = await fetchJson(HEALTH_URL);
      expect(json.build).toBeTruthy();
      expect(json.build).toHaveProperty('version');
      expect(json.build).toHaveProperty('commit');
    });

    it('canary flag is present', async () => {
      if (!serverAvailable) return;
      const { json } = await fetchJson(HEALTH_URL);
      expect(json?.feature_flags?.CANARY_PCT).not.toBeUndefined();
    });

    it('rollback flag is present', async () => {
      if (!serverAvailable) return;
      const { json } = await fetchJson(HEALTH_URL);
      expect(json?.feature_flags?.SDK_TOOL_RUNNER).not.toBeUndefined();
    });
  });

  describe('Metrics Endpoint', () => {
    it('returns Prometheus text', async () => {
      if (!serverAvailable) return;
      const res = await fetch(METRICS_URL);
      const text = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(text).toMatch(/claude_request_duration_ms/);
    });
  });

  describe('Canary Routing (unit)', () => {
    it('stickyBucket returns consistent values', () => {
      const bucket1 = stickyBucket('user-123');
      const bucket2 = stickyBucket('user-123');
      expect(bucket1).toBe(bucket2);
      expect(bucket1).toBeGreaterThanOrEqual(0);
      expect(bucket1).toBeLessThan(100);
    });

    it('shouldRouteToSdk respects canary percentage', () => {
      // At 0%, no one routes to SDK
      expect(shouldRouteToSdk({ identifier: 'user-1', canaryPct: 0 })).toBe(false);
      // At 100%, everyone routes to SDK
      expect(shouldRouteToSdk({ identifier: 'user-1', canaryPct: 100 })).toBe(true);
    });

    it('routes consistently at 50%', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(shouldRouteToSdk({ identifier: `user-${i}`, canaryPct: 50 }));
      }
      const sdkCount = results.filter(Boolean).length;
      // Should be roughly 50% (within 30% tolerance for small sample)
      expect(sdkCount).toBeGreaterThan(20);
      expect(sdkCount).toBeLessThan(80);
    });
  });

  describe('Rollback Thresholds (unit)', () => {
    it('shouldRollback returns false for healthy metrics', () => {
      expect(shouldRollback({ parity: 0.99, latencyRegressionPct: 5, errorRateMultiple: 1, breakerTripDelta: 0 })).toBe(false);
    });

    it('shouldRollback returns true for low parity', () => {
      expect(shouldRollback({ parity: 0.90 })).toBe(true);
    });

    it('shouldRollback returns true for high latency regression', () => {
      expect(shouldRollback({ latencyRegressionPct: 25 })).toBe(true);
    });

    it('shouldRollback returns true for doubled error rate', () => {
      expect(shouldRollback({ errorRateMultiple: 3 })).toBe(true);
    });

    it('shouldRollback returns true for breaker trip increase', () => {
      expect(shouldRollback({ breakerTripDelta: 1 })).toBe(true);
    });

    it('exports correct thresholds', () => {
      expect(ROLLBACK_THRESHOLDS.parityMin).toBe(0.95);
      expect(ROLLBACK_THRESHOLDS.latencyRegressionMaxPct).toBe(20);
      expect(ROLLBACK_THRESHOLDS.errorRateMaxMultiple).toBe(2);
      expect(ROLLBACK_THRESHOLDS.breakerTripIncreaseAllowed).toBe(0);
    });
  });

  describe('Domain Endpoints (integration)', () => {
    it('SEC domain responds', async () => {
      if (!serverAvailable) return;
      const { status } = await postJson(RESEARCH_URL, { query: 'Find 10-K filings for Tesla in 2023' });
      expect(status).toBeLessThan(500);
    });

    it('EPA domain responds', async () => {
      if (!serverAvailable) return;
      const { status } = await postJson(RESEARCH_URL, { query: 'Show EPA violations for ExxonMobil facilities in Texas' });
      expect(status).toBeLessThan(500);
    });

    it('FDA domain responds', async () => {
      if (!serverAvailable) return;
      const { status } = await postJson(RESEARCH_URL, { query: 'Search FDA device recalls for pacemakers in 2024' });
      expect(status).toBeLessThan(500);
    });

    it('GovInfo domain responds', async () => {
      if (!serverAvailable) return;
      const { status } = await postJson(RESEARCH_URL, { query: 'Find recent Congressional bills about climate change' });
      expect(status).toBeLessThan(500);
    });
  });
});

