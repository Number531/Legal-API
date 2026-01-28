import { describe, test, expect } from '@jest/globals';
import {
  buildCachedSystemPrompt,
  buildCachedTools,
  estimatePromptCacheSavings,
  promptCacheConstants
} from '../../src/utils/promptCaching.js';

describe('promptCaching', () => {
  test('wraps system prompt with cache control', () => {
    const blocks = buildCachedSystemPrompt('You are a legal assistant.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: 'text',
      cache_control: { type: 'ephemeral' }
    });
  });

  test('applies cache control to tools', () => {
    const tools = [
      { name: 'search_sec', description: 'x', input_schema: { type: 'object', properties: {} } }
    ];
    const cached = buildCachedTools(tools);
    expect(cached[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(tools[0].cache_control).toBeUndefined(); // original not mutated
  });

  test('estimates cache savings using spec multipliers', () => {
    const result = estimatePromptCacheSavings({ inputTokens: 1000, hitRate: 0.6 });
    const expectedCached =
      (1 - 0.6) * promptCacheConstants.CACHE_WRITE_MULTIPLIER * 1000 +
      0.6 * promptCacheConstants.CACHE_READ_MULTIPLIER * 1000;
    expect(result.cachedCost).toBeCloseTo(expectedCached, 6);
    expect(result.baselineCost).toBe(1000);
    expect(result.savingsPct).toBeGreaterThan(0);
  });
});

