import { describe, test, expect } from '@jest/globals';
import { getCostAlertLevel } from '../../src/config/costAlerts.js';
import { createRecursionTracker } from '../../src/utils/recursionTracker.js';
import { featureFlags } from '../../src/config/featureFlags.js';

describe('Cost alerts', () => {
  test('returns correct levels for ratios', () => {
    expect(getCostAlertLevel(1, 1)).toBe('normal');
    expect(getCostAlertLevel(1.6, 1)).toBe('warn');
    expect(getCostAlertLevel(2.1, 1)).toBe('critical');
    expect(getCostAlertLevel(3.5, 1)).toBe('emergency');
  });
});

describe('Recursion tracker', () => {
  test('tracks enter/exit and enforces max depth', () => {
    const tracker = createRecursionTracker(2);
    expect(tracker.enter('a')).toBe(1);
    expect(tracker.enter('b')).toBe(2);
    expect(() => tracker.enter('c')).toThrow(/Recursion depth exceeded/);
    expect(tracker.exit()).toBe(2);
    expect(tracker.exit()).toBe(1);
    expect(tracker.status()).toEqual({ depth: 1, maxDepth: 2, path: ['a'] });
  });
});

describe('Feature flags defaults', () => {
  test('exposes numeric and boolean defaults without throwing', () => {
    expect(typeof featureFlags.SDK_TOOL_RUNNER).toBe('boolean');
    expect(typeof featureFlags.SDK_STREAMING).toBe('boolean');
    expect(typeof featureFlags.STRUCTURED_OUTPUTS).toBe('boolean');
    expect(Number.isFinite(featureFlags.CANARY_PCT)).toBe(true);
    expect(Number.isFinite(featureFlags.PRESERVE_GRACE_PERIOD)).toBe(true);
  });
});

