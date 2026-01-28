import { describe, test, expect } from '@jest/globals';
import { goldenPrompts } from './golden-prompts.js';

describe('Golden prompts', () => {
  test('contains required domains', () => {
    expect(goldenPrompts.sec).toBeTruthy();
    expect(goldenPrompts.epa).toBeTruthy();
    expect(goldenPrompts.fda).toBeTruthy();
    expect(goldenPrompts.govinfo).toBeTruthy();
  });

  test('prompts are non-empty strings', () => {
    Object.values(goldenPrompts).forEach((p) => {
      expect(typeof p).toBe('string');
      expect(p.length).toBeGreaterThan(10);
    });
  });
});

