/**
 * Prompt caching helpers per migration-spec Section 16.3.
 * Adds ephemeral cache_control blocks to system prompts and tool definitions
 * and provides simple cost estimation helpers for cache reads/writes.
 */

const CACHE_WRITE_MULTIPLIER = 1.25; // cache creation cost vs input
const CACHE_READ_MULTIPLIER = 0.1; // cache read cost vs input

export function buildCachedSystemPrompt(text) {
  if (!text) return undefined;
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' }
    }
  ];
}

export function buildCachedTools(tools = []) {
  if (!Array.isArray(tools)) return [];
  // API allows max 4 cache_control blocks total (1 for system, 3 for tools)
  return tools.map((tool, idx) => ({
    ...tool,
    ...(idx < 3 ? { cache_control: { type: 'ephemeral' } } : {})
  }));
}

/**
 * Estimate cost impact of prompt caching for a given input token count.
 * Returns baseline cost units (normalized to input tokens), cached cost,
 * and estimated savings percentage.
 */
export function estimatePromptCacheSavings({ inputTokens = 0, hitRate = 0 }) {
  const normalizedTokens = Math.max(inputTokens, 0);
  const clampedHitRate = Math.min(Math.max(hitRate, 0), 1);

  const baselineCost = normalizedTokens;
  const cachedCost =
    (1 - clampedHitRate) * CACHE_WRITE_MULTIPLIER * normalizedTokens +
    clampedHitRate * CACHE_READ_MULTIPLIER * normalizedTokens;

  const savings = baselineCost === 0 ? 0 : ((baselineCost - cachedCost) / baselineCost) * 100;

  return {
    baselineCost,
    cachedCost,
    savingsPct: Number(savings.toFixed(2))
  };
}

export const promptCacheConstants = {
  CACHE_WRITE_MULTIPLIER,
  CACHE_READ_MULTIPLIER
};

