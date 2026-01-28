# Cost Optimization

## Prompt Caching
- Cache system prompts and tool definitions
- Costs: writes 1.25x input, reads 0.1x input
- Benefit: large savings on repeated tool metadata/system context
- Code example:
  - `buildCachedSystemPrompt(text)` and `buildCachedTools(tools)` from `src/utils/promptCaching.js`
  - Apply in SDK calls: `system: buildCachedSystemPrompt(SDK_SYSTEM_PROMPT)`, `tools: buildCachedTools(tools)`
- Metrics to watch:
  - `claude_cache_read_tokens_total`
  - `claude_cache_creation_tokens_total`
  - Compare against `claude_tokens_input_total` for savings
- Savings estimate:
  - Baseline = `input_tokens`
  - Cached = `(1-hit_rate)*1.25*input + hit_rate*0.1*input`
  - See `estimatePromptCacheSavings` helper

## Model Selection
- Use Haiku for simple, single-tool queries
- Use Sonnet as default; Opus only for deep reasoning or complex chains
- See `docs/MODEL-SELECTION.md`

## Token Discipline
- Enforce parameter caps (see `src/utils/createToolWithCaps.js`)
- Use structured outputs to reduce retries/parse errors
- Track tokens via `claude_tokens_*` metrics

## Headers and Context
- Avoid `context-1m` unless necessary; higher cost
- Enable structured outputs only when schemas are ready

## Monitoring
- Watch `claude_request_duration_ms`, `claude_tokens_*`
- Set alerts on token spikes or latency regressions


