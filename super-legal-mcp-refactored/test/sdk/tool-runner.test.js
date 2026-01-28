import { describe, test, expect } from '@jest/globals';
import { buildSdkTools } from '../../src/utils/sdkToolAdapter.js';
import { createSdkStreamHandler } from '../../src/utils/sdkStreamHandler.js';
import { shouldRouteToSdk } from '../../src/utils/sdkRouting.js';
import { createToolWithCaps } from '../../src/utils/createToolWithCaps.js';

describe('SDK Tool Adapter', () => {
  test('builds tool list and wraps handlers with caps', async () => {
    const impls = {
      search_cases: createToolWithCaps('search_cases', async (args) => args)
    };
    const tools = buildSdkTools(impls);
    const search = tools.find((t) => t.name === 'search_cases');
    expect(search).toBeTruthy();
    const result = await search.handler({ limit: 50, include_text: true });
    // executeToolSafe wraps result in { content: ... }
    expect(result.content).toBeTruthy();
    const parsed = JSON.parse(result.content);
    expect(parsed.limit).toBe(5);
    expect(parsed.include_text).toBe(false);
  });

  test('returns stub handler when implementation missing', async () => {
    const tools = buildSdkTools({});
    const anyTool = tools[0];
    const result = await anyTool.handler({});
    expect(result).toHaveProperty('notice', 'handler_not_configured');
  });
});

describe('SDK Stream Handler', () => {
  test('accumulates text, thinking, and tool calls/results', async () => {
    const handler = createSdkStreamHandler();
    await handler.handle({ type: 'text', text: 'Hello ' });
    await handler.handle({ type: 'text', text: 'world' });
    await handler.handle({ type: 'thinking', thinking: 'deep thought' });
    await handler.handle({ type: 'tool_call', tool_use_id: 't1', tool_name: 'demo', tool_input: { q: 'x' } });
    await handler.handle({ type: 'tool_result', tool_use_id: 't1', tool_name: 'demo', output: { ok: true } });
    const final = handler.final();
    expect(final.text).toBe('Hello world');
    expect(final.thinkingBlocks[0]).toBe('deep thought');
    expect(final.toolCalls[0].name).toBe('demo');
    expect(final.toolCalls[0].result).toEqual({ ok: true });
  });
});

describe('Canary routing', () => {
  test('routes only when flag on and random under pct', () => {
    const flags = { SDK_TOOL_RUNNER: true, CANARY_PCT: 10 };
    const alwaysZero = () => 0.0;
    const alwaysHigh = () => 0.9;
    expect(shouldRouteToSdk(flags, alwaysZero)).toBe(true);
    expect(shouldRouteToSdk(flags, alwaysHigh)).toBe(false);
  });

  test('does not route when flag disabled', () => {
    const flags = { SDK_TOOL_RUNNER: false, CANARY_PCT: 100 };
    expect(shouldRouteToSdk(flags, () => 0.0)).toBe(false);
  });
});

