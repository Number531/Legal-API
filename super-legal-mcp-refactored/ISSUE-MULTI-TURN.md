# Issue: Multi-Turn Tool Execution Missing

**Date:** December 8, 2025
**Severity:** High
**Status:** Open

---

## Summary

The `/api/stream` endpoint is **single-turn only** - it executes tools but never loops back to Claude for analysis. This causes the stream to end abruptly after tool execution without Claude providing a final response.

---

## Current Behavior

1. User sends query
2. Claude streams response with thinking + tool calls
3. Tools execute (results sent to client)
4. **STOP** - Stream ends with `stop_reason: "tool_use"`

## Expected Behavior

1. User sends query
2. Claude streams response with thinking + tool calls
3. Tools execute (results sent to client)
4. **Tool results sent back to Claude**
5. Claude streams analysis of tool results
6. Repeat until `stop_reason: "end_turn"`

---

## Root Cause

**File:** `src/server/claude-sdk-server.js` (Lines 551-635)

The current implementation executes tools but doesn't continue the conversation:

```javascript
// Lines 583-601: Single-turn tool execution
if (finalMessage.stop_reason === 'tool_use') {
  for (const block of finalMessage.content) {
    if (block.type === 'tool_use') {
      const handler = toolHandlers[block.name];
      if (handler) {
        send({ type: 'tool_call', phase: 'tool_executing', ... });
        const result = await handler(block.input);
        send({ type: 'tool_call', phase: 'tool_result', ... });
      }
    }
  }
}
// Then immediately sends final and ends - NO LOOP BACK TO CLAUDE
send({ type: 'final', ... });
```

---

## Research Findings

| Component | Multi-Turn? | Status |
|-----------|-------------|--------|
| Legacy Server (claude-server-v2.js) | Yes (archived) | Decommissioned - throws error |
| SDK Server `/api/research` | No | Single-turn only |
| SDK Server `/api/stream` | No | Single-turn only |
| ClaudeOrchestrator | Yes | Used for Gemini filtering only |

### Legacy Multi-Turn Pattern (Lines 1250-1264 in claude-server-v2.js)

The decommissioned legacy server had the correct pattern:

```javascript
// Build assistant message with tool calls
conversationHistory.push({
  role: 'assistant',
  content: assistantContent  // thinking + text + tool_use blocks
});

// Append tool results
conversationHistory.push(...toolResults);

// RECURSIVE CALL FOR MULTI-TURN
const result = await this.streamClaudeCall(conversationHistory, tools, {
  ...options,
  phase: 'follow-up'
});

return result;
```

---

## Solution

### Implementation Plan

Replace single-turn with multi-turn loop in `/api/stream` handler:

```javascript
// Lines 551-635: Replace with multi-turn pattern
let messages = [{ role: 'user', content: query }];
const MAX_TURNS = 10;
let turn = 0;

while (turn < MAX_TURNS) {
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages,
    tools: buildCachedTools(toolsForRequest),
    ...(cachedSystemPrompt ? { system: cachedSystemPrompt } : {}),
    ...(output_format ? { output_format } : {}),
    ...(skills ? { container: { skills } } : {}),
    ...(tool_choice ? { tool_choice } : {})
  });

  // Stream events to client
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      if (event.delta?.type === 'text_delta') {
        send({ type: 'delta', text: event.delta.text });
      } else if (event.delta?.type === 'thinking_delta') {
        send({ type: 'thinking', text: event.delta.thinking });
      }
    } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
      send({ type: 'tool_call', phase: 'tool_start', name: event.content_block.name, id: event.content_block.id });
    }
  }

  const finalMessage = await stream.finalMessage();

  // If no tool calls, we're done
  if (finalMessage.stop_reason !== 'tool_use') {
    send({
      type: 'final',
      completed: new Date().toISOString(),
      model: finalMessage.model,
      usage: finalMessage.usage,
      stop_reason: finalMessage.stop_reason,
      turns: turn + 1
    });
    break;
  }

  // Execute tools and collect results
  const toolResults = [];
  for (const block of finalMessage.content) {
    if (block.type === 'tool_use') {
      const handler = toolHandlers[block.name];
      if (handler) {
        send({ type: 'tool_call', phase: 'tool_executing', name: block.name, input: block.input });
        try {
          const result = await withToolSpan(block.name, () => handler(block.input));
          incrementToolInvocation(block.name, 'ok');
          send({ type: 'tool_call', phase: 'tool_result', name: block.name, result });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: typeof result === 'string' ? result : JSON.stringify(result)
          });
        } catch (err) {
          incrementToolInvocation(block.name, 'error');
          send({ type: 'tool_call', phase: 'tool_error', name: block.name, error: err?.message });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: err?.message }),
            is_error: true
          });
        }
      }
    }
  }

  // Append assistant message + tool results for next turn
  messages.push({ role: 'assistant', content: finalMessage.content });
  messages.push({ role: 'user', content: toolResults });

  turn++;
  send({ type: 'turn_complete', turn, tool_count: toolResults.length });
}

// Safety: if we hit MAX_TURNS without completion
if (turn >= MAX_TURNS) {
  send({ type: 'warning', message: 'Max turns reached', turns: turn });
}
```

---

## Key Changes

1. **Wrap streaming in a loop** that continues until `stop_reason !== 'tool_use'`
2. **Build messages array** with assistant content + tool results after each turn
3. **Add MAX_TURNS limit** (default 10) to prevent infinite loops
4. **Track turn count** for metrics and debugging
5. **Send intermediate events** (`turn_complete`) so client sees progress
6. **Handle tool errors** gracefully with `is_error: true`

---

## Testing

After implementation:

```bash
# Restart server
lsof -ti:3001 | xargs kill -9
npm run sdk-server

# Test in playground
open test/claude-playground.html
```

**Test Query:** "Find 10-K filings for Tesla in 2023"

**Expected Flow:**
1. Claude streams thinking + SEC tool calls
2. Tools execute, results sent to client
3. Claude receives results and streams analysis
4. Final response with complete answer

---

## Related Files

- `src/server/claude-sdk-server.js` - SDK server (needs fix)
- `src/server/claude-server-v2.js` - Legacy server (has pattern, decommissioned)
- `test/claude-playground.html` - Frontend (no changes needed)
- `src/utils/sdkStreamHandler.js` - Stream handler (no changes needed)

---

## Metrics to Track

After implementation, monitor:
- `sdk_stream_turns` - Histogram of turns per request
- `sdk_stream_duration` - Total duration including all turns
- `sdk_tool_invocations` - Tool calls per turn
- `sdk_max_turns_reached` - Counter for requests hitting MAX_TURNS

---

## Status: OPEN

Awaiting implementation approval.
