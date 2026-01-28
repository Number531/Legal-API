# Model Selection Guide

## Models (Dec 2025)
- claude-opus-4-5-20251101 — deep reasoning, 200K (1M beta), ~$15 / $75 per MTok (input/output)
- claude-sonnet-4-5-20250929 — default, balanced cost/perf, 200K (1M beta), ~$3 / $15 per MTok
- claude-haiku-4-5-20251001 — low-latency, low-cost, 200K, ~$0.40 / $2.00 per MTok

## Decision Tree (from migration-spec 15.4)
1) Deep reasoning or multi-step (>3 tool calls) → Opus
2) Large context (>100K tokens) → Sonnet with `context-1m` beta
3) Simple/fast path, ≤1 tool → Haiku
4) Default → Sonnet

## Beta Headers
- Thinking + fine-grained streaming: always
- Structured outputs: when schema provided
- Context-1m: only when needed; higher cost
- Skills: when skills container present

## Cost/Performance Notes
- Prompt caching: cache system prompts & tool defs (writes 1.25x, reads 0.1x)
- Track tokens via metrics `claude_tokens_*`
- Prefer Haiku for cheap, single-tool lookups; Opus only when justified

## Examples
```javascript
const choose = (ctx) => {
  if (ctx.deepReasoning) return 'claude-opus-4-5-20251101';
  if (ctx.largeContext) return 'claude-sonnet-4-5-20250929';
  if (ctx.simple) return 'claude-haiku-4-5-20251001';
  return 'claude-sonnet-4-5-20250929';
};
```


