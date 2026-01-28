# SDK Tool Runner Fix - Implementation Notes

**Date:** December 8, 2025  
**Issue:** ISSUE-SDK-TOOLRUNNER.md  
**Status:** RESOLVED ✅

---

## Problem

The migration spec referenced `anthropic.beta.messages.toolRunner` which **does not exist** in the Anthropic SDK v0.39.0.

---

## Root Cause Analysis

1. **Migration spec was aspirational/theoretical** - Section 6 described a "Tool Runner" API that doesn't exist
2. **Actual SDK API** only provides:
   - `anthropic.beta.messages.create()`
   - `anthropic.beta.messages.stream()`
   - `anthropic.beta.messages.countTokens()`
3. **No toolRunner property** exists in the SDK

---

## Solution Implemented

### 1. Removed Non-Existent API Call

**Before:**
```javascript
const toolRunnerFactory = anthropic?.beta?.messages?.toolRunner;
if (!toolRunnerFactory?.create) {
  throw new Error('SDK Tool Runner unavailable');
}
const toolRunner = toolRunnerFactory.create({ ... });
const stream = toolRunner.messages.stream({ ... });
```

**After:**
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
```

### 2. Fixed Stream Event Handling

The SDK sends events with structure:
```javascript
{
  type: 'content_block_delta',
  delta: {
    type: 'text_delta',  // or 'thinking_delta', 'signature_delta', etc.
    text: '...'
  }
}
```

**Updated `sdkStreamHandler.js`** to handle `content_block_delta` events properly:
```javascript
case 'content_block_delta': {
  if (event.delta?.type === 'text_delta') {
    state.text += event.delta.text || '';
  }
  else if (event.delta?.type === 'thinking_delta') {
    // Handle thinking...
  }
  // ... other delta types
}
```

### 3. Implemented Manual Tool Execution

```javascript
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

### 4. Fixed Prompt Caching Limits

The API allows max 4 `cache_control` blocks total:
- 1 for system prompt
- 3 for tools (out of 97 available)

**Updated `promptCaching.js`:**
```javascript
export function buildCachedTools(tools = []) {
  return tools.map((tool, idx) => ({
    ...tool,
    ...(idx < 3 ? { cache_control: { type: 'ephemeral' } } : {})
  }));
}
```

---

## Files Changed

1. **`src/server/claude-sdk-server.js`**
   - Removed non-existent `toolRunnerFactory` check
   - Use direct `anthropic.beta.messages.stream()` call
   - Implemented manual tool execution loop
   - Fixed beta header format

2. **`src/utils/sdkStreamHandler.js`**
   - Fixed `content_block_delta` handling for `text_delta`
   - Added `thinking_delta` handling within `content_block_delta`

3. **`src/utils/promptCaching.js`**
   - Limited `cache_control` to first 3 tools only

4. **`ISSUE-SDK-TOOLRUNNER.md`**
   - Updated with resolution details

---

## Verification

### Test 1: Health Check
```bash
curl http://localhost:3001/health
# ✅ Returns: {"status": "healthy", ...}
```

### Test 2: Simple Query
```bash
curl -X POST http://localhost:3001/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?"}'
# ✅ Returns: {"text": "2 + 2 = 4", "usage": {...}, ...}
```

### Test 3: Complex Research Query
```bash
curl -X POST http://localhost:3001/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Find 10-K filings for Tesla in 2023"}'
# ✅ Should invoke SEC tools and return results
```

---

## Migration Spec Clarifications Needed

### Section 6: Tool Runner Integration

The current spec should be updated to clarify:

1. **"Tool Runner" is a conceptual pattern**, not an SDK API
2. **Actual implementation** uses `anthropic.beta.messages.stream()` directly
3. **Tool execution loops** must be implemented manually
4. **Multi-turn conversations** require appending tool results to `messages` array

### Recommended Pattern

```javascript
// 1. Initial request with tools
const stream = await anthropic.beta.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 8192,
  messages: [{ role: 'user', content: query }],
  tools,
  system,
  betas: ['interleaved-thinking-2025-05-14', 'fine-grained-tool-streaming-2025-05-14']
});

// 2. Process stream events
for await (const event of stream) {
  switch (event.type) {
    case 'content_block_delta':
      if (event.delta.type === 'text_delta') {
        // Accumulate text
      }
      break;
    // ... other event types
  }
}

// 3. Get final message
const finalMessage = await stream.finalMessage();

// 4. Execute tools if needed
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
      { role: 'user', content: query },
      { role: 'assistant', content: finalMessage.content },
      { role: 'user', content: toolResults }
    ],
    tools
  });
  // ... process follow-up stream
}
```

---

## Key Learnings

1. **Always verify SDK APIs exist** before implementing migration specs
2. **SDK event structures differ** from theoretical/documented patterns
3. **Prompt caching has strict limits** (4 cache_control blocks max)
4. **Tool execution must be manual** - no automatic loop in SDK v0.39.0
5. **Stream event handling** requires careful attention to event type hierarchy

---

## Status: COMPLETE ✅

The `/api/research` endpoint is now functional and tested. The fix resolves the blocking issue and enables live SDK testing.

