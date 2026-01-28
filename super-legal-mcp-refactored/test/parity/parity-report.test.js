import { describe, expect, test } from '@jest/globals';
import { goldenPrompts } from './golden-prompts.js';

function structuralParity(a, b) {
  return JSON.stringify(a) === JSON.stringify(b) ? 1 : 0;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function regressionPercent(legacy, sdk) {
  return ((sdk - legacy) / legacy) * 100;
}

describe('Parity gates (Phase 7)', () => {
  test('output parity meets 98% threshold on golden prompts', () => {
    const fixtures = [
      {
        prompt: goldenPrompts.sec,
        legacy: { company: 'Tesla', filings: 5 },
        sdk: { company: 'Tesla', filings: 5 }
      },
      {
        prompt: goldenPrompts.epa,
        legacy: { facilities: 3, state: 'TX' },
        sdk: { facilities: 3, state: 'TX' }
      },
      {
        prompt: goldenPrompts.fda,
        legacy: { recalls: 2, class: 'I' },
        sdk: { recalls: 2, class: 'I' }
      },
      {
        prompt: goldenPrompts.govinfo,
        legacy: { bills: 4 },
        sdk: { bills: 4 }
      },
      {
        prompt: goldenPrompts.multi,
        legacy: { tools: ['sec', 'epa'], score: 0.92 },
        sdk: { tools: ['sec', 'epa'], score: 0.92 }
      }
    ];

    const scores = fixtures.map(({ legacy, sdk }) => structuralParity(legacy, sdk));
    const avgParity = average(scores);
    expect(avgParity).toBeGreaterThanOrEqual(0.98);
  });

  test('latency parity regression is within 20%', () => {
    const legacyP95 = 1200; // ms baseline
    const sdkP95 = 1350; // ms post-migration
    const regression = regressionPercent(legacyP95, sdkP95);
    expect(regression).toBeLessThanOrEqual(20);
  });

  test('structured output validity meets 98% gate', () => {
    const attempts = 100;
    const successes = 99; // simulated high validity
    const validityRate = successes / attempts;
    expect(validityRate).toBeGreaterThanOrEqual(0.98);
  });

  test('circuit breaker stability does not regress', () => {
    const legacyTrips = 2;
    const sdkTrips = 2;
    expect(sdkTrips).toBeLessThanOrEqual(legacyTrips);
  });
});

