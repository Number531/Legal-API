import { describe, test, expect, jest } from '@jest/globals';
import { applyParameterCaps, createToolWithCaps } from '../../src/utils/createToolWithCaps.js';

describe('SDK Parameter Caps', () => {
  test('caps defaults for regular tools', () => {
    const capped = applyParameterCaps('search_cases', { limit: 10, include_text: true });
    expect(capped.limit).toBe(5);
    expect(capped.include_text).toBe(false);
    expect(capped.include_snippet).toBe(false);
    expect(capped.include_full_text).toBe(false);
  });

  test('caps full text requests to limit 2', () => {
    const capped = applyParameterCaps('search_cases', { include_full_text: true, limit: 10 });
    expect(capped.limit).toBe(2);
    expect(capped.include_full_text).toBe(true);
  });

  test('does not cap noCap tools', () => {
    const original = { limit: 50, include_text: true, include_snippet: true };
    const capped = applyParameterCaps('get_case_details', original);
    expect(capped).toEqual(original);
  });

  test('createToolWithCaps wraps handler and enforces caps', async () => {
    const handler = jest.fn(async (args) => args);
    const wrapped = createToolWithCaps('search_cases', handler);
    const result = await wrapped({ limit: 99, include_text: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.limit).toBe(5);
    expect(result.include_text).toBe(false);
  });
});

