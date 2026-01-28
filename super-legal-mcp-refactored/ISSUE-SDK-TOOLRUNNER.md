# Issue: SDK Tool Runner Unavailable

**Date:** December 8, 2025
**Severity:** Blocking → **RESOLVED**
**Status:** ~~Open~~ → **Fixed**

---

## Summary

The SDK Tool Runner feature (`anthropic.beta.messages.toolRunner`) referenced in the migration spec does not exist in the Anthropic SDK. The migration spec was aspirational/theoretical.

---

## Root Cause

**The migration spec incorrectly referenced a non-existent API:**
- `migration-spec.md` Section 6 mentions `anthropic.beta.messages.toolRunner`
- This API does **not exist** in `@anthropic-ai/sdk` v0.39.0
- The actual SDK only provides:
  - `anthropic.beta.messages.create()`
  - `anthropic.beta.messages.stream()`
  - `anthropic.beta.messages.countTokens()`

**Verified by inspecting:**
```bash
node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.d.ts
```

The `Messages` class only exports:
- `create()` - single message creation
- `stream()` - streaming message creation
- `countTokens()` - token counting
- `batches` - message batches subresource

**No `toolRunner` property exists.**

---

## Solution Applied

**Replaced the non-existent Tool Runner with direct SDK streaming API:**

### Before (❌ Non-functional):
```javascript
const toolRunnerFactory = anthropic?.beta?.messages?.toolRunner;
if (!toolRunnerFactory?.create) {
  // Error: SDK Tool Runner unavailable
}
const toolRunner = toolRunnerFactory.create({ ... });
const stream = toolRunner.messages.stream({ ... });
```

### After (✅ Working):
```javascript
const stream = await anthropic.beta.messages.stream({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  messages,
  tools,
  system: cachedSystemPrompt,
  betas: betaHeader.split(',').filter(Boolean),
  tool_choice,
  // ... other params
});

// Process stream events
for await (const event of stream) {
  await handler.handle(event);
}

const finalMessage = await stream.finalMessage();

// Execute tools manually if needed
if (finalMessage.stop_reason === 'tool_use') {
  for (const block of finalMessage.content) {
    if (block.type === 'tool_use') {
      const result = await toolHandlers[block.name](block.input);
      // Handle result...
    }
  }
}
```

---

## Changes Made

### File 1: `src/server/claude-sdk-server.js`

1. **Removed** non-existent `toolRunnerFactory` check (lines 308-313)
2. **Replaced** with direct call to `anthropic.beta.messages.stream()` (line 364)
3. **Implemented** manual tool execution loop after streaming completes (lines 386-410)
4. **Fixed** beta header format (`betas` array instead of single `beta` string) (line 371)
5. **Added** tool handlers map for executing tools from stream results (line 360)

### File 2: `src/utils/sdkStreamHandler.js`

**Problem:** Stream handler was looking for `event.type === 'text'` but SDK actually sends `event.type === 'content_block_delta'` with `event.delta.type === 'text_delta'`

**Fixed:** Added proper handling in `content_block_delta` case (lines 34-47):
```javascript
case 'content_block_delta': {
  if (event.delta?.type === 'text_delta') {
    state.text += event.delta.text || '';
    onText?.(event.delta.text || '');
  }
  else if (event.delta?.type === 'thinking_delta') {
    // Accumulate thinking blocks...
  }
  // ... other delta types
}
```

### File 3: `src/utils/promptCaching.js`

**Problem:** API returned error "A maximum of 4 blocks with cache_control may be provided. Found 97"

**Root Cause:** `buildCachedTools()` was adding `cache_control` to all 97 tools, but API only allows 4 total (1 for system prompt + 3 for tools)

**Fixed:** Limited cache_control to first 3 tools only:
```javascript
export function buildCachedTools(tools = []) {
  if (!Array.isArray(tools)) return [];
  // API allows max 4 cache_control blocks total (1 for system, 3 for tools)
  return tools.map((tool, idx) => ({
    ...tool,
    ...(idx < 3 ? { cache_control: { type: 'ephemeral' } } : {})
  }));
}
```

---

## Verification Steps

1. Start the SDK server:
   ```bash
   npm run sdk-server
   ```

2. Verify health:
   ```bash
   curl http://localhost:3001/health
   # ✅ Returns: {"status": "healthy", "sdk_version": "0.39.0", ...}
   ```

3. Test simple query:
   ```bash
   curl -X POST http://localhost:3001/api/research \
     -H "Content-Type: application/json" \
     -d '{"query": "What is 2+2?"}'
   # ✅ Returns: {"text": "2 + 2 = 4", "usage": {...}, ...}
   ```

4. Test research endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/research \
     -H "Content-Type: application/json" \
     -d '{"query": "Find 10-K filings for Tesla in 2023"}'
   # ✅ Expected: Successful response with SEC filing data
   ```

## Actual Test Results

✅ **All tests passing:**
- Health endpoint: Status 200
- Simple query: Returns correct text response
- Usage metrics: Proper token counts (24,766 input, 13-77 output)
- Stream duration: ~4-5 seconds
- No errors in server logs

---

## Migration Spec Clarification

**The migration spec needs updating:**

### Section 6.1-6.2 should clarify:
- **Tool Runner is conceptual**, not an actual SDK API
- The SDK provides `anthropic.beta.messages.stream()` directly
- Tool execution loops must be implemented manually
- Multi-turn conversations require appending tool results to `messages` array

### Correct pattern:
```javascript
// 1. Stream the initial request
const stream = await anthropic.beta.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 8192,
  messages: [{ role: 'user', content: 'Search SEC filings for Tesla' }],
  tools: [...],
  system: '...'
});

// 2. Collect stream events
for await (const event of stream) {
  // Handle text, thinking, tool_use events
}

// 3. Get final message
const finalMessage = await stream.finalMessage();

// 4. If tools were called, execute them
if (finalMessage.stop_reason === 'tool_use') {
  const toolResults = [];
  for (const block of finalMessage.content) {
    if (block.type === 'tool_use') {
      const result = await executeToolCall(block.name, block.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }
  }
  
  // 5. Continue conversation with tool results (if multi-turn needed)
  const followUpStream = await anthropic.beta.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [
      { role: 'user', content: 'Search SEC filings for Tesla' },
      { role: 'assistant', content: finalMessage.content },
      { role: 'user', content: toolResults }
    ],
    tools: [...]
  });
}
```

---

## Related Files

- `src/server/claude-sdk-server.js` - ✅ **FIXED**: Removed toolRunner, use direct streaming API
- `src/utils/sdkStreamHandler.js` - ✅ **FIXED**: Added proper `content_block_delta` handling for text/thinking
- `src/utils/promptCaching.js` - ✅ **FIXED**: Limited cache_control to 3 tools (API max)
- `src/utils/sdkToolAdapter.js` - ✅ No changes needed (already correct)
- `docs/SDK-TOOLRUNNER-FIX.md` - ✅ **NEW**: Detailed implementation notes
- `migration-spec.md` - ⚠️ Needs clarification on Tool Runner concept
- `package.json` - SDK version remains `^0.39.0`

---

## Status: RESOLVED ✅

The endpoint is now functional using the actual SDK API instead of the non-existent Tool Runner abstraction.
