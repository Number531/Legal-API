# Migration Plan: Claude Agent SDK Integration

**Date:** December 8, 2025 (Updated)
**Project:** super-legal-mcp-refactored
**Goal:** Replace manual streaming with Claude Agent SDK's automatic agentic loop
**SDK Version:** v0.1.0+

---

## Executive Summary

This migration replaces the current single-turn streaming implementation with the Claude Agent SDK, which provides:
- **Automatic multi-turn tool execution** - No manual loop needed
- **Built-in context management** - Handles compaction and token limits
- **Permission system** - Fine-grained tool control
- **Usage tracking** - Automatic cost/token reporting per turn

---

## IMPORTANT: Breaking Changes in Agent SDK v0.1.0

The Claude Code SDK was renamed to Claude Agent SDK. Key breaking changes:

| Change | Old Behavior | New Behavior |
|--------|--------------|--------------|
| **Package Name** | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| **System Prompt** | Used Claude Code's prompt by default | No default - must explicitly set |
| **Settings** | Loaded from filesystem by default | No settings loaded - must set `settingSources` |
| **Permissions** | N/A | `bypassPermissions` requires `allowDangerouslySkipPermissions: true` |

---

## Current Architecture

### Package Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.39.0",
  "@modelcontextprotocol/sdk": "^1.0.0"
}
```

### Key Components

| Component | File | Lines | Description |
|-----------|------|-------|-------------|
| Tool Definitions | `src/tools/toolDefinitions.js` | 2,350 | 100+ legal domain tools |
| Tool Implementations | `src/tools/toolImplementations.js` | 900+ | Handler functions |
| SDK Server | `src/server/claude-sdk-server.js` | 650 | Streaming endpoints |
| Stream Handler | `src/utils/sdkStreamHandler.js` | 122 | Event accumulator |
| Tool Adapter | `src/utils/sdkToolAdapter.js` | 40 | Schema conversion |
| MCP Server | `src/server/EnhancedLegalMcpServer.js` | 451 | MCP protocol handler |

### Current Flow (Single-Turn)

```
1. User query -> /api/stream
2. anthropic.messages.stream() -> Claude response
3. If stop_reason='tool_use' -> Execute tools
4. Send tool results to client
5. END (no continuation!)
```

### Problem

Claude calls tools but never analyzes the results. The conversation stops at step 4.

---

## Target Architecture

### New Package Dependencies
```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.1.0",
  "@anthropic-ai/sdk": "^0.39.0",
  "@modelcontextprotocol/sdk": "^1.0.0",
  "zod": "^3.23.0"
}
```

### New Flow (Multi-Turn)

```
1. User query -> /api/stream
2. Agent SDK query() -> AsyncGenerator
3. For each message:
   - system (init) -> Session info
   - stream_event -> Partial streaming
   - assistant -> Full message with tool calls
   - (automatic tool execution by SDK)
   - result -> Final response
4. Loop continues until result.subtype='success'
5. Send SDKResultMessage with usage/cost
```

---

## Implementation Plan

### Phase 1: Install Agent SDK

```bash
npm install @anthropic-ai/claude-agent-sdk zod
```

**Verify installation:**
```bash
node -e "import('@anthropic-ai/claude-agent-sdk').then(m => console.log('OK', Object.keys(m)))"
```

---

### Phase 2: Create Agent SDK Tool Adapter

**New File:** `src/utils/agentSdkToolAdapter.js`

```javascript
/**
 * Converts existing MCP tools to Claude Agent SDK format
 *
 * IMPORTANT: Agent SDK tool() function expects a ZodRawShape (object of Zod types),
 * NOT a z.object(). The SDK wraps it internally.
 *
 * Correct:   tool("name", "desc", { param: z.string() }, handler)
 * Incorrect: tool("name", "desc", z.object({ param: z.string() }), handler)
 */
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { allTools } from '../tools/toolDefinitions.js';

/**
 * Converts JSON Schema property to Zod type
 * @param {object} prop - JSON Schema property
 * @param {string} description - Property description
 * @returns {z.ZodType} - Zod type
 */
function jsonSchemaPropertyToZod(prop, description) {
  let zodType;

  switch (prop.type) {
    case 'string':
      if (prop.enum && prop.enum.length > 0) {
        zodType = z.enum(prop.enum);
      } else {
        zodType = z.string();
      }
      break;
    case 'number':
    case 'integer':
      zodType = z.number();
      if (prop.minimum !== undefined) zodType = zodType.min(prop.minimum);
      if (prop.maximum !== undefined) zodType = zodType.max(prop.maximum);
      break;
    case 'boolean':
      zodType = z.boolean();
      break;
    case 'array':
      const itemType = prop.items ? jsonSchemaPropertyToZod(prop.items, '') : z.any();
      zodType = z.array(itemType);
      break;
    case 'object':
      if (prop.properties) {
        zodType = z.object(jsonSchemaToZodShape(prop));
      } else {
        zodType = z.record(z.any());
      }
      break;
    default:
      zodType = z.any();
  }

  // Add description
  if (description || prop.description) {
    zodType = zodType.describe(description || prop.description);
  }

  return zodType;
}

/**
 * Converts JSON Schema to Zod shape (NOT z.object)
 * @param {object} jsonSchema - JSON Schema object
 * @returns {object} - Zod shape object { key: z.type() }
 */
function jsonSchemaToZodShape(jsonSchema) {
  if (!jsonSchema || jsonSchema.type !== 'object') {
    return {};
  }

  const shape = {};
  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  for (const [key, prop] of Object.entries(properties)) {
    let zodType = jsonSchemaPropertyToZod(prop, prop.description);

    // Make optional if not required
    if (!required.includes(key)) {
      zodType = zodType.optional();
      if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
      }
    }

    shape[key] = zodType;
  }

  return shape;
}

/**
 * Builds Agent SDK tools from existing implementations
 *
 * Tool naming: When exposed to Claude, tools are named mcp__{server}__{tool}
 * Example: mcp__super-legal-tools__search_sec_filings
 *
 * @param {object} toolImplementations - Map of tool name to handler function
 * @returns {Array} - Array of Agent SDK tool definitions
 */
export function buildAgentSdkTools(toolImplementations = {}) {
  const tools = [];

  for (const def of allTools) {
    const handler = toolImplementations[def.name];
    if (!handler) continue;

    try {
      // Convert JSON Schema to Zod shape (NOT z.object!)
      const zodShape = jsonSchemaToZodShape(def.inputSchema);

      const sdkTool = tool(
        def.name,
        def.description || `Tool: ${def.name}`,
        zodShape,  // Pass shape directly, SDK wraps with z.object internally
        async (args, extra) => {
          try {
            const result = await handler(args);
            const content = typeof result === 'string'
              ? result
              : JSON.stringify(result, null, 2);

            return {
              content: [{ type: 'text', text: content }]
            };
          } catch (err) {
            console.error(`Tool ${def.name} error:`, err.message);
            return {
              content: [{
                type: 'text',
                text: `Error executing ${def.name}: ${err.message}`
              }],
              isError: true
            };
          }
        }
      );

      tools.push(sdkTool);
    } catch (err) {
      console.warn(`Failed to convert tool ${def.name}:`, err.message);
    }
  }

  return tools;
}

/**
 * Creates an in-process MCP server instance for Agent SDK
 * @param {Array} tools - Array of tool definitions from buildAgentSdkTools
 * @returns {object} - MCP server config for Agent SDK
 */
export function createLegalMcpServer(tools) {
  return createSdkMcpServer({
    name: 'super-legal-tools',
    version: '2.0.0',
    tools
  });
}

/**
 * Gets the full MCP tool name as Claude will see it
 * @param {string} serverName - MCP server name
 * @param {string} toolName - Tool name
 * @returns {string} - Full tool name (e.g., mcp__super-legal-tools__search_sec)
 */
export function getMcpToolName(serverName, toolName) {
  return `mcp__${serverName}__${toolName}`;
}
```

---

### Phase 3: Update SDK Server

**File:** `src/server/claude-sdk-server.js`

#### 3.1 Add Agent SDK Import

```javascript
// Add at top of file (after existing imports)
import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildAgentSdkTools, createLegalMcpServer } from '../utils/agentSdkToolAdapter.js';
```

#### 3.2 Initialize Agent SDK Tools

```javascript
// Add after EnhancedLegalMcpServer initialization

// Build Agent SDK tools from existing implementations
const agentTools = buildAgentSdkTools(toolImplementations);
const legalMcpServer = createLegalMcpServer(agentTools);

console.log(`Agent SDK: ${agentTools.length} tools registered`);
console.log(`Tool names will be: mcp__super-legal-tools__{name}`);
```

#### 3.3 Replace `/api/stream` Endpoint

**Current (Lines 467-636)** -> Replace with:

```javascript
/**
 * GET /api/stream - Server-Sent Events streaming with Agent SDK
 * Multi-turn tool execution with automatic continuation
 *
 * Message Types from Agent SDK:
 * - system (subtype: 'init') - Session initialization
 * - stream_event - Partial streaming (requires includePartialMessages)
 * - assistant - Full assistant message with content blocks
 * - result (subtype: 'success'|'error_*') - Final result
 */
app.get('/api/stream', async (req, res) => {
  const span = startSpan('sdk_stream', { query: req.query.query?.substring(0, 100) });
  const requestId = req.requestId || `req-${Date.now()}`;

  // Validate input
  const { query: userQuery, sessionId, schema: requestedSchema, tool: requestedTool } = req.query;
  if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
    res.status(400).json({ error: 'Missing or invalid query parameter' });
    return;
  }

  // Rate limiting
  try {
    globalRateLimiter.acquire(Math.ceil(userQuery.length / 4));
  } catch (err) {
    recordError('RATE_LIMIT', '/api/stream');
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Request-ID': requestId
  });

  const send = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      console.error('SSE write error:', e.message);
    }
  };

  const end = () => {
    try {
      res.end();
    } catch (e) {
      console.error('SSE end error:', e.message);
    }
  };

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(':\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 15000);

  // System info
  send({
    type: 'system_info',
    message: 'Claude Agent SDK Legal Research System',
    model: MODEL,
    timestamp: new Date().toISOString()
  });

  // Structured output schema
  const schema = featureFlags.STRUCTURED_OUTPUTS && requestedSchema
    ? STRUCTURED_OUTPUT_ENABLED[requestedSchema]
    : null;

  const streamStart = Date.now();
  let totalTurns = 0;
  let totalToolCalls = 0;

  try {
    await anthropicBreaker.execute(async () => {
      // Agent SDK query with automatic multi-turn
      // IMPORTANT: bypassPermissions requires allowDangerouslySkipPermissions
      for await (const message of query({
        prompt: userQuery,
        options: {
          model: MODEL,
          maxTurns: 10,
          maxThinkingTokens: featureFlags.EXTENDED_CONTEXT ? 32768 : undefined,

          // System prompt - REQUIRED in v0.1.0 (no default)
          systemPrompt: SYSTEM_PROMPT || 'You are a legal research assistant with access to SEC, FDA, EPA, USPTO, and other regulatory databases.',

          // Permissions - bypassPermissions needs this flag
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,

          // Streaming
          includePartialMessages: true,

          // MCP server with our tools
          mcpServers: {
            'super-legal-tools': legalMcpServer
          },

          // Structured output (optional)
          ...(schema ? {
            outputFormat: {
              type: 'json_schema',
              schema
            }
          } : {})
        }
      })) {

        // Handle different message types
        switch (message.type) {
          case 'system':
            if (message.subtype === 'init') {
              send({
                type: 'system_init',
                session_id: message.session_id,
                tools: message.tools?.length || 0,
                model: message.model,
                mcp_servers: message.mcp_servers
              });
            } else if (message.subtype === 'compact_boundary') {
              send({
                type: 'compact_boundary',
                trigger: message.compact_metadata?.trigger,
                pre_tokens: message.compact_metadata?.pre_tokens
              });
            }
            break;

          case 'stream_event':
            // Partial streaming events (only with includePartialMessages: true)
            if (message.event?.type === 'content_block_delta') {
              const delta = message.event.delta;
              if (delta?.type === 'text_delta') {
                send({ type: 'delta', text: delta.text });
              } else if (delta?.type === 'thinking_delta') {
                send({ type: 'thinking', text: delta.thinking });
              } else if (delta?.type === 'input_json_delta') {
                send({
                  type: 'tool_call',
                  phase: 'tool_input_streaming',
                  partial_json: delta.partial_json
                });
              }
            } else if (message.event?.type === 'content_block_start') {
              const block = message.event.content_block;
              if (block?.type === 'tool_use') {
                send({
                  type: 'tool_call',
                  phase: 'tool_start',
                  name: block.name,
                  id: block.id
                });
                totalToolCalls++;
              } else if (block?.type === 'thinking') {
                send({ type: 'thinking_start' });
              }
            } else if (message.event?.type === 'content_block_stop') {
              // Block completed - can send tool_end event if needed
            }
            break;

          case 'assistant':
            // Full assistant message (text, tool_use, thinking blocks)
            totalTurns++;
            for (const block of message.message.content || []) {
              if (block.type === 'text') {
                send({ type: 'assistant_text', text: block.text });
              } else if (block.type === 'tool_use') {
                send({
                  type: 'tool_call',
                  phase: 'tool_use',
                  name: block.name,
                  id: block.id,
                  input: block.input
                });
              } else if (block.type === 'thinking') {
                send({ type: 'thinking_block', thinking: block.thinking });
              }
            }
            break;

          case 'user':
            // User message replay (for session resume)
            break;

          case 'result':
            // Final result message
            clearInterval(heartbeat);

            const finalPayload = {
              type: 'final',
              completed: new Date().toISOString(),
              model: MODEL,
              session_id: message.session_id,
              subtype: message.subtype,  // 'success' or 'error_*'
              is_error: message.is_error,
              num_turns: message.num_turns,
              total_cost_usd: message.total_cost_usd,
              duration_ms: message.duration_ms,
              duration_api_ms: message.duration_api_ms,
              usage: message.usage,
              model_usage: message.modelUsage
            };

            // Include result text (only on success)
            if (message.subtype === 'success' && message.result) {
              finalPayload.result = message.result;
            }

            // Include structured output if available
            if (message.structured_output) {
              finalPayload.structured = {
                valid: true,
                data: message.structured_output
              };
            }

            // Include errors if any
            if (message.errors?.length) {
              finalPayload.errors = message.errors;
            }

            // Include permission denials if any
            if (message.permission_denials?.length) {
              finalPayload.permission_denials = message.permission_denials;
            }

            // Record metrics
            recordStreamDuration(
              { path: '/api/stream', model: MODEL, status: message.is_error ? 'error' : 'ok' },
              Date.now() - streamStart
            );

            if (message.usage) {
              recordTokens({
                model: MODEL,
                input: message.usage.input_tokens,
                output: message.usage.output_tokens,
                cached: message.usage.cache_read_input_tokens,
                cacheRead: message.usage.cache_read_input_tokens,
                cacheCreation: message.usage.cache_creation_input_tokens
              });
            }

            send(finalPayload);
            break;

          default:
            // Log unknown message types for debugging
            console.log('Unknown Agent SDK message type:', message.type, message);
        }
      }
    });

    endSpan(span);
  } catch (error) {
    clearInterval(heartbeat);

    const code = mapExceptionToCode(error);
    const resp = toErrorResponse(code, error?.message || 'Unknown error', {}, requestId);
    recordError(resp.body.error.code, '/api/stream');
    console.error('Agent SDK stream error:', error);

    send({ type: 'error', error: resp.body.error });
    endSpan(span, { error });
  } finally {
    clearInterval(heartbeat);
    end();
  }
});
```

---

### Phase 4: Update `/api/research` Endpoint

The POST `/api/research` endpoint can also use the Agent SDK for non-streaming multi-turn:

```javascript
/**
 * POST /api/research - Non-streaming research with Agent SDK
 */
app.post('/api/research', async (req, res) => {
  const { query: userQuery, sessionId, schema: requestedSchema } = req.body;

  // ... validation and rate limiting ...

  try {
    let finalResult = null;

    for await (const message of query({
      prompt: userQuery,
      options: {
        model: MODEL,
        maxTurns: 10,
        systemPrompt: SYSTEM_PROMPT || 'You are a legal research assistant.',
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        mcpServers: {
          'super-legal-tools': legalMcpServer
        }
      }
    })) {
      if (message.type === 'result') {
        finalResult = message;
      }
    }

    if (!finalResult) {
      throw new Error('No result received from Agent SDK');
    }

    res.json({
      text: finalResult.result,
      usage: finalResult.usage,
      num_turns: finalResult.num_turns,
      total_cost_usd: finalResult.total_cost_usd,
      duration_ms: finalResult.duration_ms,
      is_error: finalResult.is_error,
      subtype: finalResult.subtype,
      structured: finalResult.structured_output
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

---

### Phase 5: Keep Legacy Compatibility

For backward compatibility during testing, add a feature flag:

```javascript
// In src/config/featureFlags.js
export const USE_AGENT_SDK = process.env.USE_AGENT_SDK === 'true';

// In claude-sdk-server.js
if (featureFlags.USE_AGENT_SDK) {
  // New Agent SDK implementation
  app.get('/api/stream', agentSdkStreamHandler);
  app.post('/api/research', agentSdkResearchHandler);
} else {
  // Legacy single-turn implementation
  app.get('/api/stream', legacyStreamHandler);
  app.post('/api/research', legacyResearchHandler);
}
```

---

## SDK Message Types Reference

| Type | Subtype | Description | Key Fields |
|------|---------|-------------|------------|
| `system` | `init` | Session initialization | `session_id`, `tools`, `mcp_servers`, `model` |
| `system` | `compact_boundary` | Context compaction occurred | `compact_metadata` |
| `stream_event` | - | Partial streaming | `event` (Anthropic SDK event) |
| `assistant` | - | Full assistant message | `message.content[]` (text, tool_use, thinking) |
| `user` | - | User message (replay) | `message` |
| `result` | `success` | Successful completion | `result`, `usage`, `total_cost_usd` |
| `result` | `error_max_turns` | Hit turn limit | `errors`, `num_turns` |
| `result` | `error_during_execution` | Execution error | `errors` |
| `result` | `error_max_budget_usd` | Budget exceeded | `total_cost_usd` |
| `result` | `error_max_structured_output_retries` | Schema validation failed | `errors` |

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `src/utils/agentSdkToolAdapter.js` | Tool conversion for Agent SDK |
| **MODIFY** | `src/server/claude-sdk-server.js` | Replace streaming endpoints |
| **MODIFY** | `src/config/featureFlags.js` | Add USE_AGENT_SDK flag |
| **MODIFY** | `package.json` | Add @anthropic-ai/claude-agent-sdk, zod |

---

## Testing Plan

### Step 1: Unit Tests

```bash
# Test tool adapter
npm test -- src/utils/agentSdkToolAdapter.test.js

# Test Agent SDK integration
npm test -- test/sdk/agent-sdk-integration.test.js
```

### Step 2: Manual Testing

```bash
# Enable Agent SDK
export USE_AGENT_SDK=true

# Start server
npm run sdk-server

# Test simple query (no tools)
curl "http://localhost:3001/api/stream?query=What+is+2%2B2"

# Test tool query
curl "http://localhost:3001/api/stream?query=Find+Tesla+10-K+filings+from+2023"
```

### Step 3: Playground Testing

```bash
open test/claude-playground.html
```

**Test queries:**
1. "What is 2+2?" - Simple, no tools
2. "Find SEC 10-K filings for Tesla in 2023" - SEC tools
3. "Search FDA device recalls for pacemakers" - FDA tools
4. "Show EPA violations for facilities in Texas" - EPA tools

**Expected behavior:**
- Stream shows `system_init` with tool count
- Tools execute and results stream back (`tool_call` events)
- Claude analyzes results and provides summary (`assistant_text`)
- Final `result` message includes usage and cost
- Multiple turns visible in timeline

---

## Rollback Plan

If issues arise, revert to legacy implementation:

```bash
# Disable Agent SDK
export USE_AGENT_SDK=false

# Restart server
npm run sdk-server
```

The legacy single-turn code remains available via feature flag.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Multi-turn completion | Stream continues until `result.subtype='success'` |
| Tool execution | All 100+ tools work via MCP |
| Error rate | < 2% of requests |
| Latency (p95) | < 30 seconds |
| Cost tracking | `total_cost_usd` reported in result |
| Usage tracking | Token counts in `usage` object |

---

## References

- [Claude Agent SDK TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Custom Tools Guide](https://platform.claude.com/docs/en/agent-sdk/custom-tools)
- [MCP in the SDK](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Migration Guide](https://platform.claude.com/docs/en/agent-sdk/migration-guide)
