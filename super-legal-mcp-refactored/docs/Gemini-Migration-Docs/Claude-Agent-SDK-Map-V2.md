# Claude Agent SDK → Gemini-ADK Migration Guide V2

## Executive Summary

This document provides granular, production-ready code findings for migrating Super-Legal from Claude Agent SDK to Gemini-ADK. Based on Exa research conducted December 29, 2025, with explicit API patterns for Gemini-3-Pro and Gemini-3-Flash.

---

## Table of Contents

1. [Risk Areas Overview](#1-risk-areas-overview)
2. [Google ADK Callbacks - Hooks Replacement](#2-google-adk-callbacks---hooks-replacement)
3. [Gemini 3 Thinking & Reasoning](#3-gemini-3-thinking--reasoning)
4. [Structured Outputs & JSON Schema](#4-structured-outputs--json-schema)
5. [Session State & Conversation Management](#5-session-state--conversation-management)
6. [Code Execution Tool](#6-code-execution-tool)
7. [SSE Streaming Patterns](#7-sse-streaming-patterns)
8. [Multi-Agent Orchestration](#8-multi-agent-orchestration)
9. [Tool Registration & Function Calling](#9-tool-registration--function-calling)
10. [Migration Implementation Code](#10-migration-implementation-code)
11. [ADK Multi-Agent Design Patterns](#11-adk-multi-agent-design-patterns-december-2025)
12. [Safety Settings & Content Filtering](#12-safety-settings--content-filtering)
13. [Error Handling & Retry Best Practices](#13-error-handling--retry-best-practices)
14. [Production Deployment Patterns](#14-production-deployment-patterns)

---

## 1. Risk Areas Overview

### Risk Assessment Matrix

| Area | Claude Feature | Gemini Equivalent | Risk Level | Effort |
|------|---------------|-------------------|------------|--------|
| Hooks System | `sdkHooks.js` (598 lines) | ADK Callbacks | **HIGH** | 3-4 days |
| Thinking Mode | `interleaved-thinking-2025-05-14` beta | `thinkingConfig` | **HIGH** | 1-2 days |
| Code Execution | `execute_financial_model` | `ToolCodeExecution` | **MEDIUM** | 2-3 days |
| Session Resume | Agent SDK built-in | Manual implementation | **MEDIUM** | 2-3 days |
| Structured Outputs | Response schema | `responseJsonSchema` | **LOW** | 1 day |
| SSE Streaming | Native SSE events | `generateContentStream` | **LOW** | 1 day |
| Subagent Routing | 32 specialist agents | ADK multi-agent | **MEDIUM** | 3-4 days |

---

## 2. Google ADK Callbacks - Hooks Replacement

### 2.1 Claude Hooks (Current Implementation)

```javascript
// src/hooks/sdkHooks.js - Current Claude Implementation
const sdkHooksConfig = {
  beforeToolCall: async ({ toolName, args, context }) => {
    console.log(`[Hook] Before tool: ${toolName}`);
    // Parameter validation, rate limiting, logging
    return { proceed: true, modifiedArgs: args };
  },
  afterToolCall: async ({ toolName, result, context }) => {
    console.log(`[Hook] After tool: ${toolName}`);
    // Result caching, metrics collection
    return result;
  },
  beforeAgentResponse: async ({ response, context }) => {
    // Auto-continuation detection
    return response;
  }
};
```

### 2.2 Google ADK Callback Equivalents (December 2025)

**ADK Callback Architecture:**

```
Timeline: ──────────────────────────────────────────────────────────▶

User Message
    │
    ▼
┌─────────────────┐
│ before_agent    │ ← Records start time, agent info
│ _callback       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ on_llm_call     │ ← Before model invocation
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ on_llm_response │ ← After model response
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ before_tool     │ ← Tool argument modification
│ _callback       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Tool Execution  │
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ after_tool      │ ← Tool response modification
│ _callback       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ after_agent     │ ← Calculates duration, logs completion
│ _callback       │
└─────────────────┘
```

### 2.3 ADK Callback Implementation

```python
# src/callbacks/gemini_adk_hooks.py

from google.adk.agents import LlmAgent, CallbackContext
from google.adk.tools import BaseTool, ToolContext
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger("GeminiADK")

# ============================================
# AGENT LIFECYCLE CALLBACKS
# ============================================

def before_agent_callback(callback_context: CallbackContext) -> Optional[Any]:
    """
    Called before agent execution begins.
    Equivalent to Claude's beforeAgentResponse hook.
    """
    state = callback_context.state

    # Initialize request counter
    if "request_counter" not in state:
        state["request_counter"] = 1
    else:
        state["request_counter"] += 1

    # Store start time for duration calculation
    state["request_start_time"] = datetime.now()

    # Log the request
    logger.info("=== AGENT EXECUTION STARTED ===")
    logger.info(f"Request #{state['request_counter']}")

    return None  # Continue with normal agent processing


def after_agent_callback(callback_context: CallbackContext) -> Optional[Any]:
    """
    Called after agent execution completes.
    Equivalent to Claude's afterAgentResponse hook.
    """
    state = callback_context.state

    # Calculate request duration
    duration = None
    if "request_start_time" in state:
        duration = (datetime.now() - state["request_start_time"]).total_seconds()

    # Log the completion
    logger.info("=== AGENT EXECUTION COMPLETED ===")
    logger.info(f"Duration: {duration:.2f}s")

    return None  # Continue with normal agent processing


# ============================================
# TOOL CALLBACKS (Most Important for Migration)
# ============================================

def before_tool_callback(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext
) -> Optional[Dict]:
    """
    Called before each tool execution.
    CRITICAL: This replaces Claude's beforeToolCall hook.

    Args:
        tool: The tool being called
        args: Arguments passed to the tool
        tool_context: Context including state access

    Returns:
        Modified args dict, or None to proceed unchanged
    """
    logger.info(f"[Before Tool] {tool.name}")
    logger.info(f"[Before Tool] Args: {args}")

    # Parameter capping (from toolImplementations.js logic)
    modified_args = args.copy()

    # Apply default limits
    if 'limit' in modified_args and modified_args['limit'] > 5:
        logger.info(f"[Before Tool] Capping limit from {modified_args['limit']} to 5")
        modified_args['limit'] = 5

    if 'include_full_text' in modified_args:
        # Full text requests get stricter limits
        if modified_args.get('include_full_text') and modified_args.get('limit', 0) > 2:
            modified_args['limit'] = 2
            logger.info("[Before Tool] Full text request - capped limit to 2")

    # Rate limiting check
    state = tool_context.state
    tool_calls = state.get("tool_call_counts", {})
    current_count = tool_calls.get(tool.name, 0)

    if current_count >= 50:  # Per-tool rate limit
        logger.warning(f"[Before Tool] Rate limit exceeded for {tool.name}")
        return None  # This would need error handling

    tool_calls[tool.name] = current_count + 1
    state["tool_call_counts"] = tool_calls

    return modified_args


def after_tool_callback(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext,
    tool_response: Any
) -> Optional[Any]:
    """
    Called after each tool execution.
    CRITICAL: This replaces Claude's afterToolCall hook.

    Args:
        tool: The tool that was called
        args: Arguments that were passed
        tool_context: Context including state access
        tool_response: The tool's response

    Returns:
        Modified response, or None to proceed unchanged
    """
    logger.info(f"[After Tool] {tool.name} completed")

    # Result caching
    state = tool_context.state
    cache_key = f"cache:{tool.name}:{hash(str(args))}"
    state[cache_key] = {
        "response": tool_response,
        "timestamp": datetime.now().isoformat()
    }

    # Metrics collection
    metrics = state.get("tool_metrics", {})
    tool_metrics = metrics.get(tool.name, {"calls": 0, "total_time": 0})
    tool_metrics["calls"] += 1
    metrics[tool.name] = tool_metrics
    state["tool_metrics"] = metrics

    # Response modification example
    if tool.name == "search_sec_filings":
        # Add provenance metadata
        if isinstance(tool_response, dict):
            tool_response["_provenance"] = {
                "source": "SEC EDGAR",
                "retrieved_at": datetime.now().isoformat()
            }

    return tool_response


# ============================================
# AGENT CONFIGURATION WITH CALLBACKS
# ============================================

def create_agent_with_callbacks():
    """
    Creates a Gemini ADK agent with all callbacks configured.
    """
    from google.adk.agents import Agent

    agent = Agent(
        model="gemini-3-pro",  # Or gemini-3-flash for processing
        name="super_legal_agent",
        instruction="""You are a legal research specialist...""",
        before_agent_callback=before_agent_callback,
        after_agent_callback=after_agent_callback,
        before_tool_callback=before_tool_callback,
        after_tool_callback=after_tool_callback,
    )

    return agent
```

### 2.4 JavaScript/Node.js Callback Implementation

```javascript
// src/callbacks/geminiAdkHooks.js

import { LlmAgent } from '@google/adk';

/**
 * Google ADK Callback Configuration for Node.js
 * Replaces Claude SDK hooks system
 */

// State management
const agentState = {
  requestCounter: 0,
  requestStartTime: null,
  toolCallCounts: {},
  toolMetrics: {},
  cache: new Map()
};

/**
 * Before Agent Callback
 */
function beforeAgentCallback(callbackContext) {
  agentState.requestCounter++;
  agentState.requestStartTime = Date.now();

  console.log('=== AGENT EXECUTION STARTED ===');
  console.log(`Request #${agentState.requestCounter}`);

  return null; // Continue processing
}

/**
 * After Agent Callback
 */
function afterAgentCallback(callbackContext) {
  const duration = agentState.requestStartTime
    ? (Date.now() - agentState.requestStartTime) / 1000
    : 0;

  console.log('=== AGENT EXECUTION COMPLETED ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);

  return null;
}

/**
 * Before Tool Callback
 * CRITICAL: Main migration point from Claude's beforeToolCall
 */
function beforeToolCallback(tool, args, toolContext) {
  console.log(`[Before Tool] ${tool.name}`);

  const modifiedArgs = { ...args };

  // Parameter capping logic from toolImplementations.js
  if (modifiedArgs.limit && modifiedArgs.limit > 5) {
    console.log(`[Before Tool] Capping limit from ${modifiedArgs.limit} to 5`);
    modifiedArgs.limit = 5;
  }

  // Full text capping
  if (modifiedArgs.include_full_text && modifiedArgs.limit > 2) {
    modifiedArgs.limit = 2;
    console.log('[Before Tool] Full text - capped to 2');
  }

  // Rate limiting
  const toolCount = agentState.toolCallCounts[tool.name] || 0;
  if (toolCount >= 50) {
    console.warn(`[Before Tool] Rate limit for ${tool.name}`);
    return null;
  }
  agentState.toolCallCounts[tool.name] = toolCount + 1;

  return modifiedArgs;
}

/**
 * After Tool Callback
 * CRITICAL: Main migration point from Claude's afterToolCall
 */
function afterToolCallback(tool, args, toolContext, toolResponse) {
  console.log(`[After Tool] ${tool.name} completed`);

  // Caching
  const cacheKey = `${tool.name}:${JSON.stringify(args)}`;
  agentState.cache.set(cacheKey, {
    response: toolResponse,
    timestamp: new Date().toISOString()
  });

  // Metrics
  if (!agentState.toolMetrics[tool.name]) {
    agentState.toolMetrics[tool.name] = { calls: 0 };
  }
  agentState.toolMetrics[tool.name].calls++;

  // Add provenance for SEC tools
  if (tool.name === 'search_sec_filings' && typeof toolResponse === 'object') {
    toolResponse._provenance = {
      source: 'SEC EDGAR',
      retrieved_at: new Date().toISOString()
    };
  }

  return toolResponse;
}

/**
 * Create agent with callbacks
 */
export function createAgentWithCallbacks(tools) {
  return new LlmAgent({
    model: 'gemini-3-pro',
    name: 'super_legal_agent',
    instruction: `You are a legal research specialist...`,
    tools: tools,
    beforeAgentCallback,
    afterAgentCallback,
    beforeToolCallback,
    afterToolCallback
  });
}

export { beforeAgentCallback, afterAgentCallback, beforeToolCallback, afterToolCallback };
```

---

## 3. Gemini 3 Thinking & Reasoning

### 3.1 Claude Thinking (Current)

```javascript
// Current Claude SDK configuration
const options = {
  betas: ['interleaved-thinking-2025-05-14'],
  // Extended thinking enabled via beta flag
};
```

### 3.2 Gemini Thinking Configuration (December 2025)

```javascript
// Node.js - Gemini 3 Thinking Configuration
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Basic thinking configuration
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',  // or gemini-3-pro when available
  contents: 'Analyze the legal implications of this merger...',
  config: {
    thinkingConfig: {
      // Thinking budget in tokens (0 = disabled, -1 = dynamic)
      thinkingBudget: 8192,
      // Whether to include thinking in response
      includeThoughts: true,
    },
  },
});

console.log(response.text);

// Access thinking separately
for (const part of response.candidates[0].content.parts) {
  if (part.thought) {
    console.log('Thinking:', part.text);
  }
}
```

### 3.3 Thinking with Streaming

```javascript
// Stream with thinking enabled
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-pro',
  contents: 'Complex legal analysis...',
  config: {
    thinkingConfig: {
      thinkingBudget: 16384,
      includeThoughts: true,
    },
  },
});

for await (const chunk of stream) {
  // Check for thinking content
  for (const part of chunk.candidates?.[0]?.content?.parts || []) {
    if (part.thought) {
      // Thinking block
      process.stdout.write(`[THINKING] ${part.text}`);
    } else if (part.text) {
      // Regular response
      process.stdout.write(part.text);
    }
  }
}
```

### 3.4 Thinking Budget Levels

```javascript
// ThinkingConfig options
const thinkingConfigs = {
  // Disable thinking entirely
  disabled: {
    thinkingBudget: 0
  },

  // Low complexity (quick responses)
  low: {
    thinkingBudget: 1024,
    includeThoughts: false
  },

  // Medium complexity (balanced)
  medium: {
    thinkingBudget: 4096,
    includeThoughts: true
  },

  // High complexity (legal analysis)
  high: {
    thinkingBudget: 8192,
    includeThoughts: true
  },

  // Maximum (due diligence)
  maximum: {
    thinkingBudget: 24576,  // Max for most models
    includeThoughts: true
  },

  // Dynamic (model decides)
  dynamic: {
    thinkingBudget: -1,
    includeThoughts: true
  }
};

// Usage based on query complexity
function getThinkingConfig(queryComplexity) {
  switch (queryComplexity) {
    case 'SIMPLE':
      return thinkingConfigs.low;
    case 'MODERATE':
      return thinkingConfigs.medium;
    case 'COMPLEX':
      return thinkingConfigs.high;
    default:
      return thinkingConfigs.medium;
  }
}
```

### 3.5 Token Usage with Thinking

```javascript
// Access thinking token usage
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: {
    thinkingConfig: { thinkingBudget: 8192, includeThoughts: true }
  }
});

const usage = response.usageMetadata;
console.log('Thinking tokens:', usage.thoughtsTokenCount);
console.log('Output tokens:', usage.candidatesTokenCount);
console.log('Total tokens:', usage.totalTokenCount);
```

---

## 4. Structured Outputs & JSON Schema

### 4.1 Claude Structured Outputs (Current)

```javascript
// Current Claude SDK
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  messages: [...],
  response_format: { type: 'json_object' }
});
```

### 4.2 Gemini JSON Schema (December 2025)

```javascript
// Node.js - Gemini Structured Output with Zod
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define schema with Zod
const LegalAnalysisSchema = z.object({
  case_name: z.string().describe('Full case citation'),
  court: z.string().describe('Court that issued the decision'),
  year: z.number().describe('Year of decision'),
  holding: z.string().describe('Primary holding of the case'),
  relevance_score: z.number().min(0).max(100).describe('Relevance to query 0-100'),
  key_facts: z.array(z.string()).describe('Material facts'),
  legal_principles: z.array(z.object({
    principle: z.string(),
    citation: z.string().optional()
  })),
  procedural_posture: z.enum(['trial', 'appeal', 'certiorari', 'remand']).optional()
});

// Generate with schema enforcement
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Analyze SEC v. Howey Co. and extract key details',
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: zodToJsonSchema(LegalAnalysisSchema)
  }
});

// Parse validated response
const analysis = LegalAnalysisSchema.parse(JSON.parse(response.text));
console.log(analysis);
```

### 4.3 Structured Output with Streaming

```javascript
// Stream structured output
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: zodToJsonSchema(schema)
  }
});

let jsonBuffer = '';
for await (const chunk of stream) {
  const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
  jsonBuffer += text;
  // Emit partial JSON for real-time UI updates
  console.log('Partial:', jsonBuffer);
}

// Parse complete JSON
const result = JSON.parse(jsonBuffer);
```

### 4.4 Complex Nested Schema Example

```javascript
// Legal Research Report Schema
const ResearchReportSchema = z.object({
  query: z.string(),
  summary: z.object({
    executive_summary: z.string(),
    key_findings: z.array(z.string()),
    risk_assessment: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  cases: z.array(z.object({
    citation: z.string(),
    court: z.string(),
    year: z.number(),
    holding: z.string(),
    relevance: z.number()
  })),
  regulations: z.array(z.object({
    title: z.string(),
    cfr_citation: z.string(),
    agency: z.string(),
    effective_date: z.string().optional()
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['immediate', 'short_term', 'long_term']),
    rationale: z.string()
  }))
});

// Generate comprehensive report
const report = await ai.models.generateContent({
  model: 'gemini-3-pro',  // Use Pro for complex analysis
  contents: complexLegalQuery,
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: zodToJsonSchema(ResearchReportSchema)
  }
});
```

### 4.5 Enum Classification

```javascript
// Classification task with enum
const ClassificationSchema = z.object({
  category: z.enum([
    'securities_fraud',
    'antitrust',
    'environmental',
    'employment',
    'intellectual_property',
    'contract_dispute',
    'regulatory_compliance',
    'other'
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

const classification = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Classify this legal matter: ' + caseDescription,
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: zodToJsonSchema(ClassificationSchema)
  }
});
```

---

## 5. Session State & Conversation Management

### 5.1 Claude Session (Current)

```javascript
// Claude Agent SDK handles sessions internally
const response = await agentQuery({
  prompt: userQuery,
  options: { /* automatic session management */ }
});
```

### 5.2 Gemini Chat Sessions (December 2025)

```javascript
// Node.js - Gemini Chat Session Management
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Create a chat session
const chat = ai.chats.create({ model: 'gemini-2.5-flash' });

// Send messages with automatic history
const response1 = await chat.sendMessage({ message: 'I have a question about SEC filings.' });
console.log(response1.text);

const response2 = await chat.sendMessage({ message: 'What forms are required for a merger?' });
console.log(response2.text);

// Access conversation history
const history = await chat.getHistory();
for (const message of history) {
  console.log(`${message.role}: ${message.parts[0].text}`);
}
```

### 5.3 Streaming Chat

```javascript
// Stream chat responses
const chat = ai.chats.create({ model: 'gemini-2.5-flash' });

const stream = await chat.sendMessageStream({
  message: 'Explain the implications of this merger...'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### 5.4 Manual Session Management

```javascript
// Manual multi-turn conversation
class GeminiSession {
  constructor(model = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.model = model;
    this.contents = [];
    this.sessionId = `session_${Date.now()}`;
    this.state = {};
  }

  async sendMessage(message) {
    // Add user message to history
    this.contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Generate response
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: this.contents
    });

    // Add model response to history
    const modelContent = response.candidates[0].content;
    this.contents.push(modelContent);

    return response.text;
  }

  getHistory() {
    return this.contents;
  }

  clearHistory() {
    this.contents = [];
  }

  // Serialize for persistence
  serialize() {
    return JSON.stringify({
      sessionId: this.sessionId,
      contents: this.contents,
      state: this.state
    });
  }

  // Restore from serialized state
  static deserialize(json, model = 'gemini-2.5-flash') {
    const data = JSON.parse(json);
    const session = new GeminiSession(model);
    session.sessionId = data.sessionId;
    session.contents = data.contents;
    session.state = data.state;
    return session;
  }
}

// Usage
const session = new GeminiSession('gemini-3-pro');
await session.sendMessage('Analyze SEC filing requirements');
await session.sendMessage('What about Form 10-K specifically?');

// Save session
const serialized = session.serialize();
// Store to database or file...

// Later, restore session
const restored = GeminiSession.deserialize(serialized);
await restored.sendMessage('Continue from where we left off');
```

### 5.5 ADK Session State

```python
# Google ADK Session State Management
from google.adk.sessions import InMemorySessionService, Session
from google.adk.runners import Runner
from google.adk.agents import LlmAgent

# Create session service
session_service = InMemorySessionService()

# Create agent with output_key for state persistence
agent = LlmAgent(
    name="legal_researcher",
    model="gemini-3-pro",
    instruction="You are a legal research assistant...",
    output_key="last_research_result"  # Saves to session state
)

# Create runner
runner = Runner(
    agent=agent,
    app_name="super_legal",
    session_service=session_service
)

# Create session
session = await session_service.create_session(
    app_name="super_legal",
    user_id="user_123",
    session_id="session_456"
)

# Run agent - response automatically saved to state
for event in runner.run(
    user_id="user_123",
    session_id="session_456",
    new_message=user_content
):
    if event.is_final_response():
        print(event.content)

# Access state
updated_session = await session_service.get_session(
    app_name="super_legal",
    user_id="user_123",
    session_id="session_456"
)
print(updated_session.state)
# {'last_research_result': '...previous analysis...'}
```

---

## 6. Code Execution Tool

### 6.1 Claude Code Execution (Current)

```javascript
// Current Claude financial model execution
const result = await executeFinancialModel({
  modelType: 'dcf',
  financialData: {...},
  parameters: {...}
});
```

### 6.2 Gemini Code Execution (December 2025)

```javascript
// Node.js - Gemini Code Execution
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Enable code execution tool
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Calculate the DCF valuation with WACC of 10% and terminal growth of 2%',
  config: {
    tools: [{
      codeExecution: {}  // Enable code execution
    }]
  }
});

// Process response parts
for (const part of response.candidates[0].content.parts) {
  if (part.executableCode) {
    console.log('Generated Code:');
    console.log(part.executableCode.code);
    console.log('Language:', part.executableCode.language);
  }

  if (part.codeExecutionResult) {
    console.log('Execution Result:');
    console.log('Outcome:', part.codeExecutionResult.outcome);
    console.log('Output:', part.codeExecutionResult.output);
  }

  if (part.text) {
    console.log('Response:', part.text);
  }
}
```

### 6.3 Financial Model Code Execution

```javascript
// Financial model execution with Gemini
async function executeFinancialModel(modelType, financialData, parameters) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompts = {
    dcf: `
      Calculate a DCF (Discounted Cash Flow) valuation.

      Financial Data:
      ${JSON.stringify(financialData, null, 2)}

      Parameters:
      - WACC: ${parameters.wacc || 0.10}
      - Terminal Growth Rate: ${parameters.terminalGrowth || 0.02}
      - Projection Years: ${parameters.years || 5}

      Generate and execute Python code to:
      1. Project free cash flows
      2. Calculate terminal value
      3. Discount to present value
      4. Return the enterprise value and per-share value
    `,

    monte_carlo: `
      Run a Monte Carlo simulation for damages calculation.

      Financial Data:
      ${JSON.stringify(financialData, null, 2)}

      Parameters:
      - Iterations: ${parameters.iterations || 10000}
      - Confidence Level: ${parameters.confidence || 0.95}

      Generate and execute Python code to simulate outcomes.
    `
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompts[modelType],
    config: {
      tools: [{ codeExecution: {} }],
      temperature: 0  // Deterministic for financial calculations
    }
  });

  // Extract execution results
  const results = {
    code: null,
    output: null,
    outcome: null,
    explanation: null
  };

  for (const part of response.candidates[0].content.parts) {
    if (part.executableCode) {
      results.code = part.executableCode.code;
    }
    if (part.codeExecutionResult) {
      results.output = part.codeExecutionResult.output;
      results.outcome = part.codeExecutionResult.outcome;
    }
    if (part.text) {
      results.explanation = part.text;
    }
  }

  return results;
}

// Usage
const dcfResult = await executeFinancialModel('dcf', {
  revenue: [100, 110, 121, 133, 146],
  ebitda_margin: 0.25,
  capex_percent: 0.05,
  nwc_percent: 0.10
}, {
  wacc: 0.10,
  terminalGrowth: 0.025,
  years: 5
});

console.log('Valuation Code:', dcfResult.code);
console.log('Result:', dcfResult.output);
```

### 6.4 ADK Built-in Code Executor

```python
# Google ADK with Code Executor
from google.adk.agents import Agent
from google.adk.code_executors import BuiltInCodeExecutor

# Create agent with code execution capability
coding_agent = Agent(
    model='gemini-2.5-flash',
    name='FinancialModelAgent',
    instruction="""
    You are a financial modeling specialist.
    When asked to calculate valuations or run financial models,
    generate and execute Python code to compute accurate results.
    Always show your work and explain the methodology.
    """,
    code_executor=BuiltInCodeExecutor()
)

# The agent can now generate and execute code automatically
```

---

## 7. SSE Streaming Patterns

### 7.1 Claude SSE (Current)

```javascript
// Current Claude SSE implementation
function sendSSE(type, data) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

// Event types: system_info, delta, thinking, tool_call, final, error
```

### 7.2 Gemini Streaming (December 2025)

```javascript
// Express.js SSE endpoint with Gemini streaming
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/api/stream', async (req, res) => {
  const { query } = req.query;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Helper to send SSE events
  const sendSSE = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    sendSSE('system_init', {
      model: 'gemini-3-pro',
      timestamp: new Date().toISOString()
    });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro',
      contents: query,
      config: {
        thinkingConfig: {
          thinkingBudget: 8192,
          includeThoughts: true
        }
      }
    });

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.thought) {
          // Thinking content
          sendSSE('thinking', { content: part.text });
        } else if (part.text) {
          // Regular text delta
          sendSSE('delta', { content: part.text });
        } else if (part.functionCall) {
          // Tool call
          sendSSE('tool_call', {
            name: part.functionCall.name,
            args: part.functionCall.args
          });
        } else if (part.functionResponse) {
          // Tool result
          sendSSE('tool_result', {
            name: part.functionResponse.name,
            response: part.functionResponse.response
          });
        }
      }
    }

    sendSSE('final', { status: 'complete' });

  } catch (error) {
    sendSSE('error', { message: error.message });
  } finally {
    res.end();
  }
});
```

### 7.3 Full Server Implementation

```javascript
// src/server/gemini-adk-server.js - Complete streaming server

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rate limiting state
const rateLimiter = {
  requests: new Map(),
  maxRPM: 300,
  maxTPM: 200000,

  check(key) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const windowKey = `${key}:${minute}`;

    const current = this.requests.get(windowKey) || { count: 0, tokens: 0 };
    return current.count < this.maxRPM && current.tokens < this.maxTPM;
  },

  record(key, tokens) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const windowKey = `${key}:${minute}`;

    const current = this.requests.get(windowKey) || { count: 0, tokens: 0 };
    current.count++;
    current.tokens += tokens;
    this.requests.set(windowKey, current);
  }
};

// Tool definitions (converted from Claude format)
function convertToolsToGemini(claudeTools) {
  return claudeTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema  // Direct mapping
  }));
}

// Main streaming endpoint
app.post('/api/stream', async (req, res) => {
  const { query, tools, systemPrompt, options = {} } = req.body;

  // Rate limit check
  if (!rateLimiter.check('global')) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  // SSE setup
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendSSE = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, timestamp: Date.now(), ...data })}\n\n`);
  };

  try {
    sendSSE('system_info', {
      model: options.model || 'gemini-3-pro',
      maxTurns: options.maxTurns || 100
    });

    // Build config
    const config = {
      thinkingConfig: options.thinking !== false ? {
        thinkingBudget: options.thinkingBudget || 8192,
        includeThoughts: true
      } : undefined
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      config.tools = [{
        functionDeclarations: convertToolsToGemini(tools)
      }];
    }

    // Multi-turn conversation loop
    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
    }
    contents.push({ role: 'user', parts: [{ text: query }] });

    let turns = 0;
    const maxTurns = options.maxTurns || 100;

    while (turns < maxTurns) {
      turns++;

      const stream = await ai.models.generateContentStream({
        model: options.model || 'gemini-3-pro',
        contents,
        config
      });

      let hasToolCall = false;
      let accumulatedText = '';
      let functionCalls = [];

      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
          if (part.thought) {
            sendSSE('thinking', { content: part.text });
          } else if (part.text) {
            accumulatedText += part.text;
            sendSSE('delta', { content: part.text });
          } else if (part.functionCall) {
            hasToolCall = true;
            functionCalls.push(part.functionCall);
            sendSSE('tool_call', {
              name: part.functionCall.name,
              args: part.functionCall.args
            });
          }
        }
      }

      if (hasToolCall) {
        // Add model response with function calls
        contents.push({
          role: 'model',
          parts: functionCalls.map(fc => ({ functionCall: fc }))
        });

        // Execute tools and add responses
        const toolResponses = [];
        for (const fc of functionCalls) {
          const result = await executeToolHandler(fc.name, fc.args);
          sendSSE('tool_result', { name: fc.name, result });
          toolResponses.push({
            functionResponse: {
              name: fc.name,
              response: { result }
            }
          });
        }

        contents.push({ role: 'user', parts: toolResponses });

        sendSSE('continuation', { turn: turns, reason: 'tool_calls' });
      } else {
        // No more tool calls, we're done
        contents.push({
          role: 'model',
          parts: [{ text: accumulatedText }]
        });
        break;
      }
    }

    sendSSE('final', {
      status: 'complete',
      turns,
      model: options.model || 'gemini-3-pro'
    });

    // Record rate limit
    rateLimiter.record('global', 1000); // Estimate tokens

  } catch (error) {
    console.error('[Stream Error]', error);
    sendSSE('error', {
      message: error.message,
      code: error.code
    });
  } finally {
    res.end();
  }
});

// Tool execution handler (placeholder)
async function executeToolHandler(name, args) {
  // Import from existing toolImplementations.js
  const { toolImplementations } = await import('../tools/toolImplementations.js');
  const handler = toolImplementations[name];

  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  return await handler(args);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model: 'gemini-3-pro',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Gemini ADK Server running on port ${PORT}`);
});
```

---

## 8. Multi-Agent Orchestration

### 8.1 Claude Subagents (Current)

```javascript
// Current Claude SDK subagent configuration
const subagents = {
  'securities-researcher': {
    description: 'SEC filings and securities law',
    prompt: '...',
    tools: STANDARD_TOOLS.withWriteAndWeb,
    model: 'sonnet'
  },
  // ... 31 more specialists
};
```

### 8.2 Google ADK Multi-Agent Patterns (December 2025)

```python
# Google ADK Multi-Agent Architecture

from google.adk.agents import Agent, LlmAgent
from google.adk.agents.orchestration import SequentialAgent, ParallelAgent, LoopAgent
from google.adk.tools import agent_tool

# ============================================
# SPECIALIST AGENTS
# ============================================

securities_agent = LlmAgent(
    name="securities_researcher",
    model="gemini-3-flash",  # Fast model for specialists
    instruction="""You are a securities law specialist.
    Your expertise includes SEC regulations, EDGAR filings,
    Form 10-K, 10-Q, 8-K analysis, and securities fraud matters.
    Always cite specific regulations and provide EDGAR URLs.""",
    tools=[search_sec_filings, get_sec_filing_details],
    output_key="securities_analysis"
)

case_law_agent = LlmAgent(
    name="case_law_analyst",
    model="gemini-3-flash",
    instruction="""You are a case law research specialist.
    Your expertise includes federal and state court opinions,
    precedent analysis, and judicial reasoning patterns.
    Always provide full citations in Bluebook format.""",
    tools=[search_court_listener, get_opinion_details],
    output_key="case_law_analysis"
)

regulatory_agent = LlmAgent(
    name="regulatory_analyst",
    model="gemini-3-flash",
    instruction="""You are a regulatory compliance specialist.
    Your expertise includes CFR, Federal Register, agency rules,
    and rulemaking procedures. Always cite CFR sections.""",
    tools=[search_federal_register, search_cfr],
    output_key="regulatory_analysis"
)

# ============================================
# ORCHESTRATION PATTERNS
# ============================================

# Sequential Pipeline (for dependent analysis)
sequential_pipeline = SequentialAgent(
    name="research_pipeline",
    sub_agents=[
        securities_agent,      # First: Securities analysis
        case_law_agent,        # Then: Related case law
        regulatory_agent       # Finally: Regulatory context
    ]
)

# Parallel Research (for independent queries)
parallel_research = ParallelAgent(
    name="parallel_research",
    sub_agents=[
        securities_agent,
        case_law_agent,
        regulatory_agent
    ]
)

# Iterative Refinement (for complex analysis)
refinement_loop = LoopAgent(
    name="refinement_loop",
    agent=securities_agent,
    max_iterations=3,
    exit_condition=lambda state: state.get("confidence", 0) > 0.9
)

# ============================================
# ROOT ORCHESTRATOR
# ============================================

# Wrap specialists as tools for the orchestrator
securities_tool = agent_tool.AgentTool(agent=securities_agent)
case_law_tool = agent_tool.AgentTool(agent=case_law_agent)
regulatory_tool = agent_tool.AgentTool(agent=regulatory_agent)

orchestrator = Agent(
    name="legal_research_orchestrator",
    model="gemini-3-pro",  # Pro model for complex reasoning
    description="Root orchestrator for legal research",
    instruction="""You are the lead legal research coordinator.

    Analyze incoming queries and delegate to specialists:
    - securities_researcher: SEC, EDGAR, securities law
    - case_law_analyst: Court opinions, precedent
    - regulatory_analyst: CFR, Federal Register, agencies

    For simple queries, delegate to one specialist.
    For complex queries, coordinate multiple specialists.
    Always synthesize findings into a coherent analysis.""",
    tools=[securities_tool, case_law_tool, regulatory_tool]
)
```

### 8.3 Node.js Multi-Agent Implementation

```javascript
// src/config/geminiSubagents.js

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Subagent configurations (migrated from legalSubagents.js)
export const geminiSubagents = {
  'securities-researcher': {
    model: 'gemini-3-flash',
    name: 'securities_researcher',
    instruction: `You are a securities law specialist with expertise in:
    - SEC regulations and enforcement
    - EDGAR filing systems (10-K, 10-Q, 8-K, DEF 14A)
    - Securities fraud and insider trading
    - M&A disclosure requirements

    METHODOLOGY:
    1. Search SEC EDGAR for relevant filings
    2. Analyze filing content for material information
    3. Cross-reference with enforcement actions
    4. Provide citations with document URLs

    OUTPUT FORMAT:
    - Executive summary
    - Key findings with citations
    - Risk assessment
    - Recommended actions`,
    tools: ['search_sec_filings', 'get_sec_filing_details', 'search_sec_enforcement']
  },

  'case-law-analyst': {
    model: 'gemini-3-flash',
    name: 'case_law_analyst',
    instruction: `You are a case law research specialist with expertise in:
    - Federal and state court opinions
    - Precedent analysis and distinguish ability
    - Judicial reasoning patterns
    - Citation networks

    METHODOLOGY:
    1. Search CourtListener for relevant cases
    2. Analyze holdings and reasoning
    3. Identify controlling precedent
    4. Map citation relationships

    OUTPUT FORMAT:
    - Case summaries with Bluebook citations
    - Holding analysis
    - Precedential value assessment
    - Application to current matter`,
    tools: ['search_court_listener', 'get_opinion_details', 'get_citation_network']
  },

  // ... Additional 30 specialists following same pattern
};

// Create agent instances
export function createSubagent(name) {
  const config = geminiSubagents[name];
  if (!config) {
    throw new Error(`Unknown subagent: ${name}`);
  }

  return {
    name: config.name,
    model: config.model,
    instruction: config.instruction,
    tools: config.tools,

    // Execute method
    async execute(query, tools) {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: query,
        config: {
          systemInstruction: config.instruction,
          tools: tools ? [{ functionDeclarations: tools }] : undefined
        }
      });
      return response.text;
    }
  };
}

// Orchestrator that routes to specialists
export class LegalOrchestrator {
  constructor() {
    this.subagents = geminiSubagents;
    this.ai = ai;
  }

  async analyze(query, complexity = 'MODERATE') {
    // Route based on complexity
    switch (complexity) {
      case 'SIMPLE':
        return this.singleSpecialist(query);
      case 'MODERATE':
        return this.parallelResearch(query);
      case 'COMPLEX':
        return this.fullPipeline(query);
      default:
        return this.parallelResearch(query);
    }
  }

  async singleSpecialist(query) {
    // Determine best specialist
    const specialist = await this.routeToSpecialist(query);
    const agent = createSubagent(specialist);
    return agent.execute(query);
  }

  async parallelResearch(query) {
    // Run multiple specialists in parallel
    const specialists = await this.selectSpecialists(query, 3);
    const results = await Promise.all(
      specialists.map(name => {
        const agent = createSubagent(name);
        return agent.execute(query);
      })
    );
    return this.synthesize(results);
  }

  async fullPipeline(query) {
    // Sequential multi-phase research
    const phases = [
      { specialists: ['securities-researcher', 'case-law-analyst'], phase: 'discovery' },
      { specialists: ['regulatory-rulemaking-analyst'], phase: 'context' },
      { specialists: ['memo-generator'], phase: 'synthesis' }
    ];

    let accumulated = '';
    for (const phase of phases) {
      const results = await Promise.all(
        phase.specialists.map(name => {
          const agent = createSubagent(name);
          return agent.execute(query + '\n\nPrior research:\n' + accumulated);
        })
      );
      accumulated += results.join('\n\n');
    }

    return accumulated;
  }

  async routeToSpecialist(query) {
    // Use Gemini to classify query
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: `Classify this legal query and return the best specialist:

      Query: ${query}

      Available specialists:
      - securities-researcher: SEC, EDGAR, securities law
      - case-law-analyst: Court opinions, precedent
      - regulatory-rulemaking-analyst: CFR, Federal Register
      - pharma-regulatory-analyst: FDA, drug approvals
      - patent-analyst: USPTO, PTAB
      - environmental-compliance-analyst: EPA
      - antitrust-competition-analyst: FTC

      Return only the specialist name.`,
      config: { temperature: 0 }
    });

    return response.text.trim();
  }

  async selectSpecialists(query, count) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: `Select the ${count} most relevant specialists for this query:

      Query: ${query}

      Return a JSON array of specialist names.`,
      config: {
        temperature: 0,
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text);
  }

  async synthesize(results) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro',
      contents: `Synthesize these research findings into a coherent analysis:

      ${results.map((r, i) => `Finding ${i + 1}:\n${r}`).join('\n\n---\n\n')}

      Provide:
      1. Executive summary
      2. Key findings
      3. Conflicts or gaps
      4. Recommendations`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    return response.text;
  }
}
```

---

## 9. Tool Registration & Function Calling

### 9.1 Claude Tool Format (Current)

```javascript
// Current Claude format
{
  name: "search_sec_filings",
  description: "Search SEC EDGAR...",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "..." },
      limit: { type: "integer", description: "..." }
    },
    required: ["query"]
  }
}
```

### 9.2 Gemini FunctionDeclaration Format (December 2025)

```javascript
// src/utils/geminiToolAdapter.js

/**
 * Convert Claude tool definitions to Gemini FunctionDeclaration format
 */
export function convertToGeminiFunctionDeclaration(claudeTool) {
  return {
    name: claudeTool.name,
    description: claudeTool.description,
    parameters: claudeTool.inputSchema  // Direct mapping!
  };
}

/**
 * Convert all tools
 */
export function convertAllTools(claudeTools) {
  return claudeTools.map(convertToGeminiFunctionDeclaration);
}

/**
 * Build Gemini tools config
 */
export function buildGeminiToolsConfig(claudeTools) {
  return {
    tools: [{
      functionDeclarations: convertAllTools(claudeTools)
    }]
  };
}
```

### 9.3 Function Calling Flow

```javascript
// Complete function calling implementation
import { GoogleGenAI } from '@google/genai';
import { allTools } from '../tools/toolDefinitions.js';
import { createToolImplementations } from '../tools/toolImplementations.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const toolImplementations = createToolImplementations();

// Convert tools
const geminiTools = [{
  functionDeclarations: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }))
}];

async function executeWithTools(query, maxTurns = 100) {
  const contents = [{ role: 'user', parts: [{ text: query }] }];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro',
      contents,
      config: { tools: geminiTools }
    });

    const candidate = response.candidates[0];
    const parts = candidate.content.parts;

    // Check for function calls
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length > 0) {
      // Add model response
      contents.push({
        role: 'model',
        parts: functionCalls.map(p => ({ functionCall: p.functionCall }))
      });

      // Execute functions
      const functionResponses = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;

        const handler = toolImplementations[name];
        if (!handler) {
          functionResponses.push({
            functionResponse: {
              name,
              response: { error: `Unknown tool: ${name}` }
            }
          });
          continue;
        }

        try {
          const result = await handler(args);
          functionResponses.push({
            functionResponse: {
              name,
              response: { result }
            }
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name,
              response: { error: error.message }
            }
          });
        }
      }

      // Add function responses
      contents.push({
        role: 'user',  // Note: function responses use 'user' role in Gemini
        parts: functionResponses
      });

    } else {
      // No more function calls - return final response
      const textParts = parts.filter(p => p.text);
      return textParts.map(p => p.text).join('');
    }
  }

  return 'Max turns reached';
}
```

---

## 10. Migration Implementation Code

### 10.1 Complete Gemini ADK Server

```javascript
// src/server/gemini-adk-server.js - Production-ready implementation

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { allTools } from '../tools/toolDefinitions.js';
import { createToolImplementations } from '../tools/toolImplementations.js';
import { geminiSubagents, LegalOrchestrator } from '../config/geminiSubagents.js';
import {
  beforeAgentCallback,
  afterAgentCallback,
  beforeToolCallback,
  afterToolCallback
} from '../callbacks/geminiAdkHooks.js';

// ============================================
// INITIALIZATION
// ============================================

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const toolImplementations = createToolImplementations();
const orchestrator = new LegalOrchestrator();

// Convert Claude tools to Gemini format
const geminiTools = [{
  functionDeclarations: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }))
}];

// ============================================
// RATE LIMITING
// ============================================

class RateLimiter {
  constructor(maxRPM = 300, maxTPM = 200000) {
    this.maxRPM = maxRPM;
    this.maxTPM = maxTPM;
    this.windows = new Map();
  }

  check(key) {
    const minute = Math.floor(Date.now() / 60000);
    const windowKey = `${key}:${minute}`;
    const current = this.windows.get(windowKey) || { requests: 0, tokens: 0 };
    return current.requests < this.maxRPM && current.tokens < this.maxTPM;
  }

  record(key, tokens) {
    const minute = Math.floor(Date.now() / 60000);
    const windowKey = `${key}:${minute}`;
    const current = this.windows.get(windowKey) || { requests: 0, tokens: 0 };
    current.requests++;
    current.tokens += tokens;
    this.windows.set(windowKey, current);

    // Cleanup old windows
    for (const [k] of this.windows) {
      const [, windowMinute] = k.split(':');
      if (parseInt(windowMinute) < minute - 1) {
        this.windows.delete(k);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// CIRCUIT BREAKER
// ============================================

class CircuitBreaker {
  constructor(threshold = 3, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.lastFailure = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

const circuitBreaker = new CircuitBreaker();

// ============================================
// TOOL EXECUTION
// ============================================

async function executeToolWithHooks(name, args, context) {
  // Before hook
  const modifiedArgs = beforeToolCallback(
    { name },
    args,
    { state: context.state }
  );

  const finalArgs = modifiedArgs || args;

  // Execute
  const handler = toolImplementations[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const result = await handler(finalArgs);

  // After hook
  const modifiedResult = afterToolCallback(
    { name },
    finalArgs,
    { state: context.state },
    result
  );

  return modifiedResult || result;
}

// ============================================
// STREAMING ENDPOINT
// ============================================

app.post('/api/stream', async (req, res) => {
  const { query, options = {} } = req.body;

  // Rate limit check
  if (!rateLimiter.check('global')) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // SSE setup
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendSSE = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, timestamp: Date.now(), ...data })}\n\n`);
  };

  // Context for hooks
  const context = {
    state: {},
    sessionId: options.sessionId || `session_${Date.now()}`
  };

  try {
    // Before agent hook
    beforeAgentCallback({ state: context.state });

    sendSSE('system_init', {
      model: options.model || 'gemini-3-pro',
      sessionId: context.sessionId,
      maxTurns: options.maxTurns || 100
    });

    // Build system prompt
    const systemPrompt = options.systemPrompt || `You are a legal research specialist...`;

    // Initialize conversation
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. Ready to assist with legal research.' }] },
      { role: 'user', parts: [{ text: query }] }
    ];

    // Build config
    const config = {
      tools: geminiTools
    };

    // Add thinking if enabled
    if (options.thinking !== false) {
      config.thinkingConfig = {
        thinkingBudget: options.thinkingBudget || 8192,
        includeThoughts: true
      };
    }

    // Multi-turn execution loop
    let turns = 0;
    const maxTurns = options.maxTurns || 100;
    let totalTokens = 0;

    while (turns < maxTurns) {
      turns++;

      const response = await circuitBreaker.execute(async () => {
        return await ai.models.generateContentStream({
          model: options.model || 'gemini-3-pro',
          contents,
          config
        });
      });

      let hasToolCall = false;
      let accumulatedText = '';
      const functionCalls = [];

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];

        // Track tokens
        if (chunk.usageMetadata) {
          totalTokens = chunk.usageMetadata.totalTokenCount || 0;
        }

        for (const part of parts) {
          if (part.thought) {
            sendSSE('thinking', { content: part.text });
          } else if (part.text) {
            accumulatedText += part.text;
            sendSSE('delta', { content: part.text });
          } else if (part.functionCall) {
            hasToolCall = true;
            functionCalls.push(part.functionCall);
            sendSSE('tool_call', {
              name: part.functionCall.name,
              args: part.functionCall.args
            });
          }
        }
      }

      if (hasToolCall) {
        // Add model response
        contents.push({
          role: 'model',
          parts: functionCalls.map(fc => ({ functionCall: fc }))
        });

        // Execute tools
        const toolResponses = [];
        for (const fc of functionCalls) {
          try {
            const result = await executeToolWithHooks(fc.name, fc.args, context);
            sendSSE('tool_result', { name: fc.name, success: true });
            toolResponses.push({
              functionResponse: {
                name: fc.name,
                response: { result }
              }
            });
          } catch (error) {
            sendSSE('tool_error', { name: fc.name, error: error.message });
            toolResponses.push({
              functionResponse: {
                name: fc.name,
                response: { error: error.message }
              }
            });
          }
        }

        contents.push({ role: 'user', parts: toolResponses });
        sendSSE('continuation', { turn: turns, reason: 'tool_calls' });

      } else {
        // No more tool calls
        contents.push({
          role: 'model',
          parts: [{ text: accumulatedText }]
        });

        // Check for truncation (auto-continuation)
        if (totalTokens >= 60000 && !accumulatedText.includes('RESEARCH COMPLETE')) {
          contents.push({
            role: 'user',
            parts: [{ text: 'Continue from where you left off. Complete the analysis.' }]
          });
          sendSSE('continuation', { turn: turns, reason: 'auto_continue' });
        } else {
          break;
        }
      }
    }

    // After agent hook
    afterAgentCallback({ state: context.state });

    // Record rate limit
    rateLimiter.record('global', totalTokens);

    sendSSE('final', {
      status: 'complete',
      turns,
      totalTokens,
      sessionId: context.sessionId
    });

  } catch (error) {
    console.error('[Stream Error]', error);
    sendSSE('error', {
      message: error.message,
      code: error.code || 'UNKNOWN'
    });
  } finally {
    res.end();
  }
});

// ============================================
// SINGLE-TURN ENDPOINT (for simple queries)
// ============================================

app.post('/api/research', async (req, res) => {
  const { query, options = {} } = req.body;

  if (!rateLimiter.check('global')) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const response = await circuitBreaker.execute(async () => {
      return await ai.models.generateContent({
        model: options.model || 'gemini-3-flash',
        contents: query,
        config: {
          tools: geminiTools,
          thinkingConfig: options.thinking ? {
            thinkingBudget: options.thinkingBudget || 4096
          } : undefined
        }
      });
    });

    rateLimiter.record('global', response.usageMetadata?.totalTokenCount || 500);

    res.json({
      text: response.text,
      usage: response.usageMetadata
    });

  } catch (error) {
    console.error('[Research Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH & STATUS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model: 'gemini-3-pro',
    tools: allTools.length,
    subagents: Object.keys(geminiSubagents).length,
    circuitBreaker: circuitBreaker.state,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/subagents', (req, res) => {
  res.json({
    subagents: Object.entries(geminiSubagents).map(([name, config]) => ({
      name,
      model: config.model,
      description: config.instruction.substring(0, 200) + '...'
    }))
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     Gemini ADK Legal Research Server         ║
╠══════════════════════════════════════════════╣
║  Port:      ${PORT}                              ║
║  Model:     gemini-3-pro                     ║
║  Tools:     ${String(allTools.length).padEnd(3)} registered                   ║
║  Subagents: ${String(Object.keys(geminiSubagents).length).padEnd(3)} configured                  ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
```

---

## 11. ADK Multi-Agent Design Patterns (December 2025)

Based on Google Developer Blog research (December 16, 2025), these 8 patterns form the architectural foundation for Gemini ADK multi-agent systems.

### 11.1 Pattern Overview

| Pattern | Use Case | Super-Legal Application |
|---------|----------|------------------------|
| Sequential Pipeline | Dependent processing stages | Research → Analysis → Synthesis |
| Coordinator/Dispatcher | Central routing | Query classification → Specialist delegation |
| Parallel Fan-Out/Gather | Independent concurrent work | Multiple database searches |
| Hierarchical Decomposition | Complex task breakdown | Due diligence workflows |
| Generator/Critic | Quality assurance | Draft → Review cycles |
| Iterative Refinement | Progressive improvement | Research depth expansion |
| Human-in-the-Loop | Approval gates | Sensitive research review |
| Composite | Combined patterns | Full research pipelines |

### 11.2 Sequential Pipeline Pattern

```python
# Sequential Pipeline - Stages that depend on previous output
from google.adk.agents.orchestration import SequentialAgent

# Research Pipeline: Each stage feeds the next
research_pipeline = SequentialAgent(
    name="LegalResearchPipeline",
    sub_agents=[
        # Stage 1: Data gathering
        LlmAgent(
            name="data_gatherer",
            model="gemini-3-flash",
            instruction="Search databases and gather raw data...",
            tools=[search_sec_filings, search_court_listener],
            output_key="raw_data"
        ),
        # Stage 2: Analysis (uses raw_data)
        LlmAgent(
            name="analyst",
            model="gemini-3-pro",
            instruction="Analyze the gathered data in {raw_data}...",
            output_key="analysis"
        ),
        # Stage 3: Synthesis (uses analysis)
        LlmAgent(
            name="synthesizer",
            model="gemini-3-pro",
            instruction="Create comprehensive report from {analysis}...",
            output_key="final_report"
        )
    ]
)

# Node.js equivalent
const sequentialPipeline = {
  name: 'LegalResearchPipeline',
  stages: [
    { name: 'gather', model: 'gemini-3-flash', outputKey: 'raw_data' },
    { name: 'analyze', model: 'gemini-3-pro', inputKey: 'raw_data', outputKey: 'analysis' },
    { name: 'synthesize', model: 'gemini-3-pro', inputKey: 'analysis', outputKey: 'report' }
  ],

  async execute(query) {
    let context = { query };
    for (const stage of this.stages) {
      const prompt = stage.inputKey
        ? `${stage.instruction}\n\nContext: ${JSON.stringify(context[stage.inputKey])}`
        : query;
      const result = await ai.models.generateContent({ model: stage.model, contents: prompt });
      context[stage.outputKey] = result.text;
    }
    return context;
  }
};
```

### 11.3 Coordinator/Dispatcher Pattern

```python
# Coordinator routes work to appropriate specialists
# This is the PRIMARY pattern for Super-Legal orchestration

coordinator = LlmAgent(
    name="LegalResearchCoordinator",
    model="gemini-3-pro",  # Pro for complex routing decisions
    instruction="""You are the lead legal research coordinator.

    Analyze each query and delegate to the appropriate specialist:

    SPECIALISTS AVAILABLE:
    - securities_researcher: SEC, EDGAR, securities fraud, M&A filings
    - case_law_analyst: Court opinions, precedent, judicial patterns
    - regulatory_analyst: CFR, Federal Register, agency rules
    - pharma_analyst: FDA, FAERS, drug approvals
    - patent_analyst: USPTO, PTAB proceedings
    - environmental_analyst: EPA, compliance, enforcement

    ROUTING RULES:
    1. Single entity + single domain → ONE specialist
    2. Multiple entities OR domains → 2-4 specialists in PARALLEL
    3. Due diligence or comprehensive → ALL relevant specialists

    Return your delegation plan before executing.""",
    tools=[
        AgentTool(agent=securities_agent),
        AgentTool(agent=case_law_agent),
        AgentTool(agent=regulatory_agent),
        AgentTool(agent=pharma_agent),
        AgentTool(agent=patent_agent),
        AgentTool(agent=environmental_agent)
    ]
)
```

```javascript
// Node.js Coordinator Implementation
class LegalCoordinator {
  constructor() {
    this.specialists = {
      'securities': { triggers: ['SEC', 'EDGAR', '10-K', '10-Q', 'securities', 'IPO', 'M&A'], model: 'gemini-3-flash' },
      'case_law': { triggers: ['court', 'case', 'ruling', 'precedent', 'opinion', 'lawsuit'], model: 'gemini-3-flash' },
      'regulatory': { triggers: ['CFR', 'regulation', 'rule', 'Federal Register', 'agency'], model: 'gemini-3-flash' },
      'pharma': { triggers: ['FDA', 'drug', 'pharmaceutical', 'FAERS', 'clinical'], model: 'gemini-3-flash' },
      'patent': { triggers: ['patent', 'USPTO', 'PTAB', 'IPR', 'invention'], model: 'gemini-3-flash' },
      'environmental': { triggers: ['EPA', 'environmental', 'pollution', 'CERCLA'], model: 'gemini-3-flash' }
    };
  }

  async route(query) {
    // Score each specialist based on keyword matches
    const scores = {};
    const queryLower = query.toLowerCase();

    for (const [name, config] of Object.entries(this.specialists)) {
      scores[name] = config.triggers.reduce((score, trigger) => {
        return score + (queryLower.includes(trigger.toLowerCase()) ? 1 : 0);
      }, 0);
    }

    // Get top specialists
    const sorted = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    // Routing decision
    if (sorted.length === 0) {
      return ['case_law']; // Default fallback
    } else if (sorted.length === 1 || sorted[0][1] > sorted[1][1] * 2) {
      return [sorted[0][0]]; // Clear winner
    } else {
      return sorted.slice(0, 3).map(([name]) => name); // Multiple specialists
    }
  }

  async dispatch(query) {
    const specialists = await this.route(query);

    if (specialists.length === 1) {
      // Single specialist - direct execution
      return this.executeSpecialist(specialists[0], query);
    } else {
      // Multiple specialists - parallel execution
      const results = await Promise.all(
        specialists.map(name => this.executeSpecialist(name, query))
      );
      return this.synthesize(results);
    }
  }
}
```

### 11.4 Parallel Fan-Out/Gather Pattern

```python
# Parallel execution for independent tasks
from google.adk.agents.orchestration import ParallelAgent

# Fan-out to multiple database searches simultaneously
parallel_search = ParallelAgent(
    name="ParallelDatabaseSearch",
    sub_agents=[
        LlmAgent(
            name="sec_searcher",
            model="gemini-3-flash",
            instruction="Search SEC EDGAR for relevant filings",
            tools=[search_sec_filings],
            output_key="sec_results"
        ),
        LlmAgent(
            name="court_searcher",
            model="gemini-3-flash",
            instruction="Search CourtListener for relevant cases",
            tools=[search_court_listener],
            output_key="court_results"
        ),
        LlmAgent(
            name="regulatory_searcher",
            model="gemini-3-flash",
            instruction="Search Federal Register for relevant rules",
            tools=[search_federal_register],
            output_key="regulatory_results"
        )
    ]
)

# Gather results into synthesis agent
gatherer = LlmAgent(
    name="ResultsSynthesizer",
    model="gemini-3-pro",
    instruction="""Synthesize results from parallel searches:
    - SEC Results: {sec_results}
    - Court Results: {court_results}
    - Regulatory Results: {regulatory_results}

    Provide unified analysis with cross-references.""",
    output_key="synthesized_report"
)
```

```javascript
// Node.js Parallel Fan-Out/Gather
async function parallelFanOutGather(query, specialists) {
  console.log(`[Fan-Out] Starting parallel search across ${specialists.length} sources`);

  // Fan-out: Execute all searches in parallel
  const searchPromises = specialists.map(async (specialist) => {
    const startTime = Date.now();
    try {
      const result = await executeSpecialist(specialist, query);
      console.log(`[Fan-Out] ${specialist} completed in ${Date.now() - startTime}ms`);
      return { specialist, result, success: true };
    } catch (error) {
      console.error(`[Fan-Out] ${specialist} failed:`, error.message);
      return { specialist, error: error.message, success: false };
    }
  });

  // Wait for all results
  const results = await Promise.all(searchPromises);

  // Gather: Filter successful results
  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  if (failedResults.length > 0) {
    console.warn(`[Gather] ${failedResults.length} specialists failed`);
  }

  // Synthesize successful results
  const synthesisPrompt = `
    Synthesize these research findings into a coherent analysis:

    ${successfulResults.map(r => `## ${r.specialist}\n${r.result}`).join('\n\n---\n\n')}

    Provide:
    1. Unified executive summary
    2. Key findings across all sources
    3. Conflicts or inconsistencies
    4. Gaps requiring additional research
  `;

  const synthesis = await ai.models.generateContent({
    model: 'gemini-3-pro',
    contents: synthesisPrompt,
    config: {
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });

  return {
    individual: successfulResults,
    failed: failedResults,
    synthesis: synthesis.text
  };
}
```

### 11.5 Generator/Critic (Validation Loop) Pattern

```python
# Generator creates, Critic validates, Loop until quality threshold
from google.adk.agents.orchestration import LoopAgent

generator = LlmAgent(
    name="MemoGenerator",
    model="gemini-3-pro",
    instruction="""Generate a comprehensive legal memorandum based on research findings.
    Include:
    - Executive summary
    - Factual background
    - Legal analysis
    - Conclusions and recommendations
    """,
    output_key="draft_memo"
)

critic = LlmAgent(
    name="MemoCritic",
    model="gemini-3-pro",
    instruction="""Review the draft memorandum for:
    - Citation accuracy
    - Legal reasoning soundness
    - Completeness of analysis
    - Compliance with formatting standards

    Provide:
    - quality_score: 0-100
    - feedback: List of specific issues
    - status: "PASS" if score >= 85, else "REVISE"
    """,
    output_key="review"
)

# Loop until quality threshold met
validation_loop = LoopAgent(
    name="MemoValidationLoop",
    sub_agents=[generator, critic],
    max_iterations=3,
    exit_condition=lambda state: state.get("review", {}).get("status") == "PASS"
)
```

```javascript
// Node.js Generator/Critic Pattern
async function generatorCriticLoop(query, maxIterations = 3, qualityThreshold = 85) {
  let draft = null;
  let feedback = null;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`[Gen/Critic] Iteration ${iteration}/${maxIterations}`);

    // Generate (or revise based on feedback)
    const generatePrompt = draft
      ? `Revise this draft based on feedback:\n\nDraft:\n${draft}\n\nFeedback:\n${feedback}`
      : `Generate legal memorandum for: ${query}`;

    const generateResponse = await ai.models.generateContent({
      model: 'gemini-3-pro',
      contents: generatePrompt,
      config: { thinkingConfig: { thinkingBudget: 8192 } }
    });
    draft = generateResponse.text;

    // Critique
    const critiqueResponse = await ai.models.generateContent({
      model: 'gemini-3-pro',
      contents: `Review this legal memorandum for quality:\n\n${draft}`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            quality_score: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } },
            strengths: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    });

    const critique = JSON.parse(critiqueResponse.text);
    console.log(`[Gen/Critic] Quality score: ${critique.quality_score}`);

    if (critique.quality_score >= qualityThreshold) {
      console.log(`[Gen/Critic] Quality threshold met at iteration ${iteration}`);
      return { draft, critique, iterations: iteration };
    }

    feedback = critique.issues.join('\n');
  }

  console.warn(`[Gen/Critic] Max iterations reached without meeting threshold`);
  return { draft, critique, iterations: maxIterations, warning: 'Threshold not met' };
}
```

### 11.6 Hierarchical Decomposition Pattern

```python
# Complex tasks broken into subtasks across hierarchy levels
from google.adk.agents import Agent
from google.adk.agents.orchestration import SequentialAgent, ParallelAgent

# Level 1: Master Planner
master_planner = LlmAgent(
    name="DueDiligencePlanner",
    model="gemini-3-pro",
    instruction="""Create a due diligence research plan.

    Break down into:
    1. Corporate/Securities research
    2. Litigation/Legal risks
    3. Regulatory compliance
    4. Intellectual property
    5. Financial analysis

    For each area, specify:
    - Key questions to answer
    - Data sources to query
    - Risk factors to assess""",
    output_key="research_plan"
)

# Level 2: Area Coordinators (each manages sub-specialists)
securities_coordinator = Agent(
    name="SecuritiesCoordinator",
    model="gemini-3-pro",
    sub_agents=[
        LlmAgent(name="edgar_specialist", model="gemini-3-flash", ...),
        LlmAgent(name="ownership_specialist", model="gemini-3-flash", ...),
        LlmAgent(name="insider_trading_specialist", model="gemini-3-flash", ...)
    ]
)

litigation_coordinator = Agent(
    name="LitigationCoordinator",
    model="gemini-3-pro",
    sub_agents=[
        LlmAgent(name="federal_cases_specialist", model="gemini-3-flash", ...),
        LlmAgent(name="state_cases_specialist", model="gemini-3-flash", ...),
        LlmAgent(name="regulatory_actions_specialist", model="gemini-3-flash", ...)
    ]
)

# Level 3: Full Hierarchical Pipeline
due_diligence_pipeline = SequentialAgent(
    name="FullDueDiligence",
    sub_agents=[
        master_planner,  # Plan first
        ParallelAgent(   # Execute in parallel
            name="AreaResearch",
            sub_agents=[
                securities_coordinator,
                litigation_coordinator,
                regulatory_coordinator,
                ip_coordinator,
                financial_coordinator
            ]
        ),
        synthesizer      # Combine results
    ]
)
```

### 11.7 Human-in-the-Loop Pattern

```python
# Pause for human approval at critical decision points
from google.adk.agents import LlmAgent

class HumanApprovalAgent:
    """Agent that pauses for human review at critical points."""

    def __init__(self, approval_threshold='high_risk'):
        self.threshold = approval_threshold
        self.pending_approvals = []

    async def check_approval_needed(self, action, context):
        """Determine if human approval is required."""
        risk_indicators = [
            'material non-public information',
            'securities violation',
            'litigation hold',
            'regulatory investigation',
            'insider trading'
        ]

        risk_level = sum(1 for indicator in risk_indicators
                        if indicator.lower() in str(action).lower())

        return risk_level >= 2  # Require approval for 2+ risk indicators

    async def request_approval(self, action, context, callback):
        """Queue action for human approval."""
        approval_request = {
            'id': f"approval_{datetime.now().timestamp()}",
            'action': action,
            'context': context,
            'status': 'pending',
            'callback': callback
        }
        self.pending_approvals.append(approval_request)

        # In production, this would notify human reviewers
        return approval_request['id']

# Integration with agent workflow
async def execute_with_approval(agent, query, approval_agent):
    """Execute agent with human-in-the-loop for sensitive actions."""

    # Initial analysis
    analysis = await agent.analyze(query)

    # Check if approval needed
    if await approval_agent.check_approval_needed(analysis, query):
        approval_id = await approval_agent.request_approval(
            action=analysis,
            context=query,
            callback=lambda approved: continue_execution(approved, analysis)
        )
        return {'status': 'pending_approval', 'approval_id': approval_id}

    # No approval needed - continue
    return {'status': 'complete', 'result': analysis}
```

```javascript
// Node.js Human-in-the-Loop
class ApprovalGate {
  constructor() {
    this.pendingApprovals = new Map();
    this.highRiskPatterns = [
      /material non-public/i,
      /insider trading/i,
      /securities violation/i,
      /regulatory investigation/i,
      /litigation hold/i
    ];
  }

  needsApproval(content) {
    const riskScore = this.highRiskPatterns.reduce((score, pattern) => {
      return score + (pattern.test(content) ? 1 : 0);
    }, 0);
    return riskScore >= 2;
  }

  async requestApproval(action, context) {
    const approvalId = `approval_${Date.now()}`;
    const approval = {
      id: approvalId,
      action,
      context,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.pendingApprovals.set(approvalId, approval);

    // Emit event for UI/notification system
    console.log(`[Approval Required] ${approvalId}`);
    console.log(`Action: ${action.substring(0, 200)}...`);

    return approvalId;
  }

  approve(approvalId, approver) {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      approval.status = 'approved';
      approval.approver = approver;
      approval.approvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  reject(approvalId, approver, reason) {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      approval.status = 'rejected';
      approval.approver = approver;
      approval.rejectedAt = new Date().toISOString();
      approval.reason = reason;
      return true;
    }
    return false;
  }
}
```

### 11.8 Composite Pattern (Production Pipeline)

```javascript
// Complete production pipeline combining multiple patterns
class SuperLegalPipeline {
  constructor() {
    this.coordinator = new LegalCoordinator();
    this.approvalGate = new ApprovalGate();
    this.qualityThreshold = 85;
  }

  async execute(query, options = {}) {
    const pipeline = {
      startTime: Date.now(),
      query,
      stages: []
    };

    try {
      // Stage 1: Query Classification (Coordinator pattern)
      const classification = await this.classifyQuery(query);
      pipeline.stages.push({ name: 'classification', result: classification });

      // Stage 2: Parallel Research (Fan-Out pattern)
      const specialists = await this.coordinator.route(query);
      const research = await parallelFanOutGather(query, specialists);
      pipeline.stages.push({ name: 'research', result: research });

      // Stage 3: Draft Generation with Quality Loop (Generator/Critic)
      const draft = await generatorCriticLoop(
        `Research findings:\n${research.synthesis}\n\nQuery: ${query}`,
        3,
        this.qualityThreshold
      );
      pipeline.stages.push({ name: 'draft', result: draft });

      // Stage 4: Human Approval Check (Human-in-the-Loop)
      if (this.approvalGate.needsApproval(draft.draft)) {
        const approvalId = await this.approvalGate.requestApproval(
          draft.draft,
          { query, classification, specialists }
        );
        pipeline.stages.push({ name: 'approval', status: 'pending', approvalId });
        return { status: 'pending_approval', pipeline, approvalId };
      }

      // Stage 5: Final Synthesis
      pipeline.stages.push({ name: 'complete', result: draft.draft });
      pipeline.duration = Date.now() - pipeline.startTime;

      return { status: 'complete', pipeline, result: draft.draft };

    } catch (error) {
      pipeline.error = error.message;
      pipeline.duration = Date.now() - pipeline.startTime;
      return { status: 'error', pipeline, error: error.message };
    }
  }

  async classifyQuery(query) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: `Classify this legal research query:

      Query: ${query}

      Return JSON with:
      - complexity: "simple" | "moderate" | "complex"
      - domains: string[] (legal domains involved)
      - entities: string[] (companies/persons mentioned)
      - urgency: "low" | "medium" | "high"`,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  }
}
```

---

## 12. Safety Settings & Content Filtering

### 12.1 Gemini Safety Categories

```javascript
// Available harm categories (December 2025)
const HarmCategory = {
  HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARM_CATEGORY_CIVIC_INTEGRITY: 'HARM_CATEGORY_CIVIC_INTEGRITY'
};

// Threshold levels
const HarmBlockThreshold = {
  BLOCK_NONE: 'BLOCK_NONE',           // No blocking
  BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH', // Block high probability only
  BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE',
  OFF: 'OFF'  // Default for gemini-2.5-flash+ (no system safety filter)
};
```

### 12.2 Safety Configuration for Legal Research

```javascript
// Legal research-appropriate safety settings
const legalSafetySettings = [
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH'  // Allow legal discussion of crimes, fraud
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_LOW_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

// Apply to generation config
const response = await ai.models.generateContent({
  model: 'gemini-3-pro',
  contents: query,
  config: {
    safetySettings: legalSafetySettings
  }
});
```

### 12.3 Handling Safety Blocks

```javascript
// Check for safety blocks in response
async function generateWithSafetyHandling(prompt, config = {}) {
  try {
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-pro',
      contents: prompt,
      config: {
        safetySettings: legalSafetySettings,
        ...config
      }
    });

    // Check for blocked response
    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      const safetyRatings = response.candidates[0].safetyRatings;
      const blockedCategories = safetyRatings
        .filter(r => r.blocked)
        .map(r => r.category);

      console.warn('[Safety] Response blocked:', blockedCategories);

      return {
        blocked: true,
        categories: blockedCategories,
        message: 'Response blocked due to safety filters'
      };
    }

    return {
      blocked: false,
      text: response.text,
      safetyRatings: response.candidates?.[0]?.safetyRatings
    };

  } catch (error) {
    if (error.message?.includes('SAFETY')) {
      return {
        blocked: true,
        error: error.message
      };
    }
    throw error;
  }
}
```

### 12.4 Python Safety Configuration

```python
# Python safety settings for ADK
from google.genai import types

safety_settings = [
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH,
    ),
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    types.SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
]

# Apply to agent
agent = LlmAgent(
    name="legal_researcher",
    model="gemini-3-pro",
    instruction="...",
    generate_content_config=types.GenerateContentConfig(
        safety_settings=safety_settings
    )
)
```

---

## 13. Error Handling & Retry Best Practices

### 13.1 Exponential Backoff Pattern

```javascript
// Production-grade retry with exponential backoff
class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.initialDelayMs = options.initialDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 60000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterFactor = options.jitterFactor || 0.1;
  }

  async execute(fn, context = {}) {
    let lastError;
    let delay = this.initialDelayMs;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          console.error(`[Retry] Non-retryable error:`, error.message);
          throw error;
        }

        if (attempt === this.maxRetries) {
          console.error(`[Retry] Max retries (${this.maxRetries}) exceeded`);
          throw error;
        }

        // Add jitter to prevent thundering herd
        const jitter = delay * this.jitterFactor * Math.random();
        const actualDelay = Math.min(delay + jitter, this.maxDelayMs);

        console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${actualDelay}ms`);
        console.warn(`[Retry] Error: ${error.message}`);

        await this.sleep(actualDelay);
        delay *= this.backoffMultiplier;
      }
    }

    throw lastError;
  }

  isRetryable(error) {
    const retryableCodes = [
      'RATE_LIMIT_EXCEEDED',
      'RESOURCE_EXHAUSTED',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'INTERNAL',
      429,  // Too Many Requests
      500,  // Internal Server Error
      502,  // Bad Gateway
      503,  // Service Unavailable
      504   // Gateway Timeout
    ];

    const errorCode = error.code || error.status || error.statusCode;
    const errorMessage = error.message?.toLowerCase() || '';

    return retryableCodes.includes(errorCode) ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('quota') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('temporarily unavailable');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retryHandler = new RetryHandler({
  maxRetries: 5,
  initialDelayMs: 1000,
  backoffMultiplier: 2
});

const response = await retryHandler.execute(async () => {
  return await ai.models.generateContent({
    model: 'gemini-3-pro',
    contents: query
  });
});
```

### 13.2 Circuit Breaker with Recovery

```javascript
// Enhanced circuit breaker for production
class EnhancedCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 3;
    this.timeout = options.timeout || 60000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;

    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  async execute(fn) {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitBreakerError('Circuit breaker is OPEN', this.state);
      }
    }

    // Check HALF_OPEN call limit
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new CircuitBreakerError('HALF_OPEN call limit reached', this.state);
    }

    try {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenCalls++;
      }

      const result = await fn();
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.transitionTo('CLOSED');
      }
    } else {
      this.failures = 0;
    }
  }

  onFailure() {
    this.lastFailureTime = Date.now();
    this.failures++;

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.failures >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    console.log(`[CircuitBreaker] ${this.state} -> ${newState}`);
    this.state = newState;

    if (newState === 'CLOSED') {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenCalls = 0;
      this.successes = 0;
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      timeUntilRetry: this.state === 'OPEN'
        ? Math.max(0, this.timeout - (Date.now() - this.lastFailureTime))
        : 0
    };
  }
}

class CircuitBreakerError extends Error {
  constructor(message, state) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.state = state;
  }
}
```

### 13.3 Comprehensive Error Handler

```javascript
// Unified error handling for Gemini API
class GeminiErrorHandler {
  constructor(retryHandler, circuitBreaker) {
    this.retry = retryHandler;
    this.circuit = circuitBreaker;
  }

  async executeWithProtection(fn, options = {}) {
    try {
      // Circuit breaker wraps retry logic
      return await this.circuit.execute(async () => {
        return await this.retry.execute(fn);
      });

    } catch (error) {
      return this.handleError(error, options);
    }
  }

  handleError(error, options) {
    const errorInfo = this.categorizeError(error);

    console.error(`[ErrorHandler] ${errorInfo.category}:`, errorInfo.message);

    // Return graceful degradation response
    if (options.fallbackResponse) {
      return {
        error: true,
        category: errorInfo.category,
        message: errorInfo.message,
        fallback: options.fallbackResponse
      };
    }

    // Re-throw with enhanced info
    const enhancedError = new Error(errorInfo.message);
    enhancedError.category = errorInfo.category;
    enhancedError.recoverable = errorInfo.recoverable;
    enhancedError.suggestedAction = errorInfo.suggestedAction;
    throw enhancedError;
  }

  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('rate limit') || message.includes('quota')) {
      return {
        category: 'RATE_LIMIT',
        message: 'API rate limit exceeded',
        recoverable: true,
        suggestedAction: 'Wait and retry'
      };
    }

    if (message.includes('safety') || message.includes('blocked')) {
      return {
        category: 'SAFETY_BLOCK',
        message: 'Content blocked by safety filters',
        recoverable: false,
        suggestedAction: 'Modify query to avoid sensitive content'
      };
    }

    if (message.includes('invalid') || message.includes('malformed')) {
      return {
        category: 'INVALID_REQUEST',
        message: 'Invalid request format',
        recoverable: false,
        suggestedAction: 'Check request parameters'
      };
    }

    if (message.includes('authentication') || message.includes('api key')) {
      return {
        category: 'AUTH_ERROR',
        message: 'Authentication failed',
        recoverable: false,
        suggestedAction: 'Verify API key'
      };
    }

    if (error instanceof CircuitBreakerError) {
      return {
        category: 'CIRCUIT_OPEN',
        message: 'Service temporarily unavailable',
        recoverable: true,
        suggestedAction: 'Wait for circuit reset'
      };
    }

    return {
      category: 'UNKNOWN',
      message: error.message || 'Unknown error',
      recoverable: true,
      suggestedAction: 'Retry or contact support'
    };
  }
}

// Production usage
const errorHandler = new GeminiErrorHandler(
  new RetryHandler({ maxRetries: 5 }),
  new EnhancedCircuitBreaker({ failureThreshold: 3 })
);

const result = await errorHandler.executeWithProtection(
  async () => ai.models.generateContent({ model: 'gemini-3-pro', contents: query }),
  { fallbackResponse: 'Unable to process request. Please try again.' }
);
```

### 13.4 Python Error Handling

```python
# Python retry decorator for ADK
import asyncio
import random
from functools import wraps
from typing import Callable, Any

def retry_with_exponential_backoff(
    max_retries: int = 5,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: float = 0.1
):
    """Decorator for exponential backoff retry logic."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay

            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)

                except Exception as e:
                    if not is_retryable(e):
                        raise

                    if attempt == max_retries:
                        raise

                    # Add jitter
                    actual_delay = min(
                        delay + (delay * jitter * random.random()),
                        max_delay
                    )

                    print(f"[Retry] Attempt {attempt} failed, "
                          f"retrying in {actual_delay:.2f}s: {e}")

                    await asyncio.sleep(actual_delay)
                    delay *= backoff_factor

        return wrapper
    return decorator


def is_retryable(error: Exception) -> bool:
    """Check if an error is retryable."""
    retryable_messages = [
        'rate limit',
        'quota',
        'timeout',
        'temporarily unavailable',
        'resource exhausted',
        '429',
        '500',
        '502',
        '503',
        '504'
    ]

    error_str = str(error).lower()
    return any(msg in error_str for msg in retryable_messages)


# Usage
@retry_with_exponential_backoff(max_retries=5, initial_delay=1.0)
async def generate_with_retry(prompt: str, model: str = "gemini-3-pro"):
    return await ai.models.generate_content_async(
        model=model,
        contents=prompt
    )
```

---

## 14. Production Deployment Patterns

### 14.1 Environment Configuration

```javascript
// Production environment configuration
const productionConfig = {
  // Model selection
  models: {
    orchestrator: process.env.GEMINI_ORCHESTRATOR_MODEL || 'gemini-3-pro',
    processor: process.env.GEMINI_PROCESSOR_MODEL || 'gemini-3-flash',
    validator: process.env.GEMINI_VALIDATOR_MODEL || 'gemini-3-flash'
  },

  // Rate limiting
  rateLimits: {
    rpm: parseInt(process.env.GEMINI_RPM) || 300,
    tpm: parseInt(process.env.GEMINI_TPM) || 200000,
    dailyQuota: parseInt(process.env.GEMINI_DAILY_QUOTA) || 1000000
  },

  // Circuit breaker
  circuitBreaker: {
    failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD) || 5,
    successThreshold: parseInt(process.env.CB_SUCCESS_THRESHOLD) || 3,
    timeout: parseInt(process.env.CB_TIMEOUT) || 60000
  },

  // Retry
  retry: {
    maxRetries: parseInt(process.env.RETRY_MAX) || 5,
    initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY) || 1000,
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY) || 60000
  },

  // Thinking configuration
  thinking: {
    enabled: process.env.THINKING_ENABLED !== 'false',
    defaultBudget: parseInt(process.env.THINKING_BUDGET) || 8192,
    maxBudget: parseInt(process.env.THINKING_MAX_BUDGET) || 24576
  },

  // Safety
  safety: {
    dangerousContent: process.env.SAFETY_DANGEROUS || 'BLOCK_ONLY_HIGH',
    harassment: process.env.SAFETY_HARASSMENT || 'BLOCK_MEDIUM_AND_ABOVE',
    hateSpech: process.env.SAFETY_HATE || 'BLOCK_MEDIUM_AND_ABOVE'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    includeThinking: process.env.LOG_THINKING === 'true',
    includeToolCalls: process.env.LOG_TOOLS !== 'false'
  }
};
```

### 14.2 Monitoring & Observability

```javascript
// Metrics collection for production monitoring
class GeminiMetrics {
  constructor() {
    this.requests = { total: 0, success: 0, failed: 0 };
    this.latencies = [];
    this.tokenUsage = { input: 0, output: 0, thinking: 0 };
    this.toolCalls = {};
    this.errors = {};
    this.startTime = Date.now();
  }

  recordRequest(success, latencyMs, tokens = {}) {
    this.requests.total++;
    if (success) {
      this.requests.success++;
    } else {
      this.requests.failed++;
    }

    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) {
      this.latencies.shift();  // Keep last 1000
    }

    this.tokenUsage.input += tokens.input || 0;
    this.tokenUsage.output += tokens.output || 0;
    this.tokenUsage.thinking += tokens.thinking || 0;
  }

  recordToolCall(toolName, success, latencyMs) {
    if (!this.toolCalls[toolName]) {
      this.toolCalls[toolName] = { total: 0, success: 0, failed: 0, latencies: [] };
    }

    this.toolCalls[toolName].total++;
    if (success) {
      this.toolCalls[toolName].success++;
    } else {
      this.toolCalls[toolName].failed++;
    }
    this.toolCalls[toolName].latencies.push(latencyMs);
  }

  recordError(category) {
    this.errors[category] = (this.errors[category] || 0) + 1;
  }

  getStats() {
    const uptimeMs = Date.now() - this.startTime;
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;
    const p95Latency = this.latencies.length > 0
      ? this.latencies.sort((a, b) => a - b)[Math.floor(this.latencies.length * 0.95)]
      : 0;

    return {
      uptime: Math.floor(uptimeMs / 1000),
      requests: {
        ...this.requests,
        successRate: this.requests.total > 0
          ? (this.requests.success / this.requests.total * 100).toFixed(2) + '%'
          : 'N/A'
      },
      latency: {
        avg: Math.round(avgLatency),
        p95: Math.round(p95Latency)
      },
      tokens: this.tokenUsage,
      topTools: Object.entries(this.toolCalls)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .map(([name, stats]) => ({ name, ...stats })),
      errors: this.errors
    };
  }
}

// Integration with server
const metrics = new GeminiMetrics();

// Add metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getStats());
});

// Prometheus-compatible metrics
app.get('/metrics/prometheus', (req, res) => {
  const stats = metrics.getStats();
  const lines = [
    `# HELP gemini_requests_total Total requests`,
    `# TYPE gemini_requests_total counter`,
    `gemini_requests_total{status="success"} ${stats.requests.success}`,
    `gemini_requests_total{status="failed"} ${stats.requests.failed}`,
    `# HELP gemini_latency_ms Request latency`,
    `# TYPE gemini_latency_ms gauge`,
    `gemini_latency_avg_ms ${stats.latency.avg}`,
    `gemini_latency_p95_ms ${stats.latency.p95}`,
    `# HELP gemini_tokens_total Token usage`,
    `# TYPE gemini_tokens_total counter`,
    `gemini_tokens_total{type="input"} ${stats.tokens.input}`,
    `gemini_tokens_total{type="output"} ${stats.tokens.output}`,
    `gemini_tokens_total{type="thinking"} ${stats.tokens.thinking}`
  ];
  res.type('text/plain').send(lines.join('\n'));
});
```

### 14.3 Health Check Endpoints

```javascript
// Comprehensive health checks
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    components: {}
  };

  // Check Gemini API connectivity
  try {
    const testResponse = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: 'Health check',
      config: { maxOutputTokens: 10 }
    });
    health.components.geminiApi = { status: 'healthy' };
  } catch (error) {
    health.components.geminiApi = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Check circuit breaker state
  health.components.circuitBreaker = {
    status: circuitBreaker.state === 'CLOSED' ? 'healthy' : 'degraded',
    state: circuitBreaker.state
  };

  // Check rate limiter
  health.components.rateLimiter = {
    status: rateLimiter.check('global') ? 'healthy' : 'throttled'
  };

  // Overall status
  const hasUnhealthy = Object.values(health.components)
    .some(c => c.status === 'unhealthy');
  if (hasUnhealthy) {
    health.status = 'unhealthy';
    res.status(503);
  }

  res.json(health);
});

// Readiness check (for Kubernetes)
app.get('/ready', async (req, res) => {
  if (circuitBreaker.state === 'OPEN') {
    res.status(503).json({ ready: false, reason: 'Circuit breaker open' });
    return;
  }

  if (!rateLimiter.check('global')) {
    res.status(503).json({ ready: false, reason: 'Rate limited' });
    return;
  }

  res.json({ ready: true });
});

// Liveness check (for Kubernetes)
app.get('/live', (req, res) => {
  res.json({ alive: true, uptime: process.uptime() });
});
```

### 14.4 Graceful Shutdown

```javascript
// Graceful shutdown handling
class GracefulShutdown {
  constructor(server) {
    this.server = server;
    this.isShuttingDown = false;
    this.activeRequests = new Set();

    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  trackRequest(req, res) {
    const requestId = Date.now() + Math.random().toString(36);
    this.activeRequests.add(requestId);

    res.on('finish', () => {
      this.activeRequests.delete(requestId);
    });

    return requestId;
  }

  async shutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    this.server.close();

    // Wait for active requests (max 30s)
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeRequests.size > 0 && Date.now() - startTime < maxWait) {
      console.log(`[Shutdown] Waiting for ${this.activeRequests.size} active requests...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeRequests.size > 0) {
      console.warn(`[Shutdown] Force closing ${this.activeRequests.size} remaining requests`);
    }

    console.log('[Shutdown] Cleanup complete, exiting');
    process.exit(0);
  }
}

// Usage
const server = app.listen(PORT);
const shutdown = new GracefulShutdown(server);

// Track requests in middleware
app.use((req, res, next) => {
  if (shutdown.isShuttingDown) {
    res.status(503).json({ error: 'Server shutting down' });
    return;
  }
  shutdown.trackRequest(req, res);
  next();
});
```

---

## Appendix A: Migration Checklist

### Phase 1: Foundation
- [ ] Install `@google/genai` package
- [ ] Add `GEMINI_API_KEY` to environment
- [ ] Create `src/utils/geminiToolAdapter.js`
- [ ] Create `src/callbacks/geminiAdkHooks.js`

### Phase 2: Tool Migration
- [ ] Convert all 117 tools to FunctionDeclaration format
- [ ] Verify tool handlers work with Gemini response format
- [ ] Test each tool category independently

### Phase 3: Callbacks/Hooks
- [ ] Implement `beforeToolCallback`
- [ ] Implement `afterToolCallback`
- [ ] Implement `beforeAgentCallback`
- [ ] Implement `afterAgentCallback`
- [ ] Port rate limiting logic
- [ ] Port parameter capping logic

### Phase 4: Subagent Migration
- [ ] Create `src/config/geminiSubagents.js`
- [ ] Convert 32 subagent prompts
- [ ] Implement orchestrator routing
- [ ] Test specialist delegation

### Phase 5: Server Implementation
- [ ] Create `src/server/gemini-adk-server.js`
- [ ] Implement SSE streaming
- [ ] Implement multi-turn loop
- [ ] Implement auto-continuation
- [ ] Add rate limiting
- [ ] Add circuit breaker

### Phase 6: Testing & Validation
- [ ] Tool-by-tool verification
- [ ] Subagent routing accuracy
- [ ] End-to-end research flows
- [ ] Report generation quality
- [ ] Performance benchmarks

---

## Appendix B: Key API Differences

| Feature | Claude SDK | Gemini SDK |
|---------|------------|------------|
| Tool schema | `inputSchema` | `parameters` |
| Function response role | `tool` | `user` |
| Thinking | Beta flag | `thinkingConfig` |
| Streaming | `agentQuery` | `generateContentStream` |
| Hooks | Built-in | Manual callbacks |
| Session | Automatic | Manual management |
| Code execution | Custom | `ToolCodeExecution` |

---

---

## 15. Critical Gap Fixes: Production-Ready Patterns

Based on exhaustive Exa research conducted December 29, 2025, this section addresses all remaining gaps for seamless Claude → Gemini migration.

### 15.1 Gemini 3 Model Configuration (December 2025)

**CRITICAL UPDATE**: Gemini 3 models use `thinking_level` instead of `thinkingBudget`.

```javascript
// Gemini 3 Flash/Pro Configuration (December 2025)
const GEMINI_3_CONFIG = {
  // Model IDs (December 2025)
  models: {
    orchestrator: 'gemini-3-pro-preview',       // Deep reasoning, complex routing
    processor: 'gemini-3-flash-preview',        // Fast execution, agentic workflows
  },

  // Token Limits (Gemini 3 Flash)
  limits: {
    maxInputTokens: 1_048_576,    // 1M context window
    maxOutputTokens: 65_536,      // 64K output
  },

  // Thinking Level (REPLACES thinkingBudget in Gemini 3)
  // Options: 'MINIMAL', 'LOW', 'MEDIUM', 'HIGH'
  thinkingConfig: {
    // MINIMAL: Similar to thinkingBudget=0 (fastest, cheapest)
    // LOW: Light reasoning
    // MEDIUM: Balanced (default recommendation)
    // HIGH: Maximum reasoning (similar to thinkingBudget=24576)
    thinking_level: 'MEDIUM',
    include_thoughts: true,  // Include thinking in response
  },

  // Media Resolution (NEW in Gemini 3)
  // Controls vision processing for multimodal inputs
  mediaResolution: 'medium',  // 'low' | 'medium' | 'high' | 'ultra_high'

  // Pricing (December 2025)
  pricing: {
    input: 0.50,   // $0.50 per 1M tokens
    output: 3.00,  // $3.00 per 1M tokens
    audio: 1.00,   // $1.00 per 1M input tokens
  }
};

// Node.js Implementation
async function generateWithGemini3(prompt, options = {}) {
  const config = {
    // Gemini 3 specific: thinking_level replaces thinkingBudget
    thinkingConfig: {
      thinkingLevel: options.thinkingLevel || 'MEDIUM',
      includeThoughts: options.includeThoughts !== false,
    },
    // Media resolution for multimodal
    mediaResolution: options.mediaResolution || 'MEDIUM',
    maxOutputTokens: options.maxTokens || 65536,
    temperature: options.temperature || 1.0,
    topP: options.topP || 0.95,
  };

  return await ai.models.generateContent({
    model: options.model || 'gemini-3-flash-preview',
    contents: prompt,
    config
  });
}
```

### 15.2 Truncation Detection (Ported from Claude)

**CRITICAL**: These exact patterns must be implemented to detect incomplete outputs.

```javascript
// ============================================
// TRUNCATION DETECTION PATTERNS
// Port from claude-sdk-server.js lines 729-731
// ============================================

const TRUNCATION_PATTERNS = [
  // Structural indicators
  /\.\.\s*$/,                    // Trailing dots
  /,\s*$/,                       // Trailing comma
  /;\s*$/,                       // Trailing semicolon
  /\[\s*$/,                      // Unclosed bracket
  /\{\s*$/,                      // Unclosed brace
  /:\s*$/,                       // Trailing colon

  // Content indicators
  /continued in/i,
  /see continuation/i,
  /next section will/i,
  /detailed in the following/i,
  /will be covered/i,
  /as follows:/i,
  /the following sections/i
];

/**
 * Detect if Gemini response was truncated
 * @param {string} text - Response text
 * @param {Object} response - Full Gemini response object
 * @returns {Object} - Truncation status and reason
 */
function detectTruncation(text, response) {
  if (!text || text.length < 100) {
    return { truncated: false, reason: null };
  }

  // Primary: Check finishReason
  const finishReason = response?.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    return {
      truncated: true,
      reason: 'finish_reason_max_tokens',
      finishReason
    };
  }

  // Secondary: Check text patterns in last 500 chars
  const tail = text.slice(-500);
  for (const pattern of TRUNCATION_PATTERNS) {
    if (pattern.test(tail)) {
      return {
        truncated: true,
        reason: 'pattern_match',
        pattern: pattern.toString()
      };
    }
  }

  // Tertiary: Check token usage near limit (95% threshold)
  const usage = response?.usageMetadata;
  if (usage) {
    const outputTokens = usage.candidatesTokenCount || 0;
    const maxTokens = 65536; // Gemini 3 Flash max
    if (outputTokens >= maxTokens * 0.95) {
      return {
        truncated: true,
        reason: 'token_limit_95_percent',
        outputTokens,
        maxTokens
      };
    }
  }

  return { truncated: false, reason: null };
}
```

### 15.3 Completion Detection (Prevents Infinite Loops)

**CRITICAL**: These patterns OVERRIDE truncation detection to prevent infinite continuation loops.

```javascript
// ============================================
// COMPLETION DETECTION PATTERNS
// These signals indicate work is DONE - do NOT continue
// ============================================

const COMPLETION_PATTERNS = [
  // Legal research specific
  /RESEARCH\s*COMPLETE/i,
  /MEMORANDUM\s*COMPLETE/i,
  /ANALYSIS\s*COMPLETE/i,

  // Document completion signals
  /## CONCLUSION[\s\S]*?written\s+by/i,
  /\*\*END\s+OF\s+DOCUMENT\*\*/i,
  /---\s*\n\s*\*Document\s+generated/i,
  /\*\*\*\s*END\s*\*\*\*/i,

  // Task completion signals
  /All\s+tasks?\s+completed?/i,
  /Research\s+findings?\s+finalized/i,
  /Report\s+generation\s+complete/i
];

/**
 * Detect if agent explicitly signaled completion
 * @param {string} text - Response text
 * @returns {Object} - Completion status
 */
function detectCompletion(text) {
  if (!text || text.length < 100) {
    return { completed: false };
  }

  // Check last 2000 chars for completion signals
  const tail = text.slice(-2000);

  for (const pattern of COMPLETION_PATTERNS) {
    if (pattern.test(tail)) {
      return {
        completed: true,
        pattern: pattern.toString()
      };
    }
  }

  return { completed: false };
}

/**
 * Determine if auto-continuation should proceed
 * Completion signals OVERRIDE truncation detection
 */
function shouldContinue(text, response, continuationAttempt, maxAttempts = 14) {
  const completion = detectCompletion(text);
  const truncation = detectTruncation(text, response);

  // Completion signals ALWAYS win - prevent infinite loops
  if (completion.completed) {
    console.log('✅ Completion signal detected - stopping continuation');
    return {
      shouldContinue: false,
      reason: 'completion_detected',
      completion
    };
  }

  // Check max attempts
  if (continuationAttempt >= maxAttempts) {
    console.warn(`⚠️ Max continuation attempts (${maxAttempts}) reached`);
    return {
      shouldContinue: false,
      reason: 'max_attempts_reached',
      attempts: continuationAttempt
    };
  }

  // If truncated and not complete, continue
  if (truncation.truncated) {
    return {
      shouldContinue: true,
      reason: truncation.reason,
      attempt: continuationAttempt + 1
    };
  }

  // Not truncated, not complete - we're done
  return {
    shouldContinue: false,
    reason: 'natural_completion'
  };
}
```

### 15.4 Auto-Continuation Loop (Gemini Implementation)

```javascript
// ============================================
// GEMINI AUTO-CONTINUATION IMPLEMENTATION
// Mirrors Claude SDK server auto-continuation logic
// ============================================

const AUTO_CONTINUATION_CONFIG = {
  enabled: process.env.AUTO_CONTINUATION !== 'false',
  maxAttempts: parseInt(process.env.AUTO_CONTINUATION_MAX_ATTEMPTS) || 14,
  continuationPrompt: `CONTINUE FROM EXACT POINT WHERE OUTPUT STOPPED.

IMPORTANT:
- Do NOT recap or summarize what was already written
- Do NOT add preamble like "Continuing from where I left off..."
- Simply continue the content seamlessly
- If research/memorandum is complete, explicitly state "RESEARCH COMPLETE"
`
};

async function generateWithAutoContinuation(initialPrompt, options = {}) {
  let accumulatedText = '';
  let continuationAttempt = 0;
  let contents = [{ role: 'user', parts: [{ text: initialPrompt }] }];

  while (true) {
    const response = await ai.models.generateContent({
      model: options.model || 'gemini-3-flash-preview',
      contents,
      config: {
        thinkingConfig: { thinkingLevel: 'MEDIUM' },
        maxOutputTokens: 65536
      }
    });

    const responseText = response.text || '';
    accumulatedText += responseText;

    // Check if we should continue
    const decision = shouldContinue(
      accumulatedText,
      response,
      continuationAttempt,
      AUTO_CONTINUATION_CONFIG.maxAttempts
    );

    if (!decision.shouldContinue) {
      console.log(`[AutoContinuation] Stopping: ${decision.reason}`);
      return {
        text: accumulatedText,
        continuations: continuationAttempt,
        stopReason: decision.reason
      };
    }

    // Prepare for continuation
    continuationAttempt++;
    console.log(`🔄 [AutoContinuation] Attempt ${continuationAttempt}/${AUTO_CONTINUATION_CONFIG.maxAttempts}`);

    // Add response to history and continuation prompt
    contents.push({ role: 'model', parts: [{ text: responseText }] });
    contents.push({ role: 'user', parts: [{ text: AUTO_CONTINUATION_CONFIG.continuationPrompt }] });
  }
}
```

### 15.5 ADK Session Resumption & State Persistence

```javascript
// ============================================
// ADK SESSION MANAGEMENT
// Based on google.github.io/adk-docs December 2025
// ============================================

import { types } from '@google/genai';

// ADK Session Resumption Configuration
const sessionConfig = {
  // Enable automatic reconnection across ~10 minute timeouts
  sessionResumption: new types.SessionResumptionConfig(),

  // Enable unlimited session duration via context compression
  contextWindowCompression: new types.ContextWindowCompressionConfig({
    mechanism: 'SUMMARIZATION',  // Compress via summarization
    triggerThreshold: 0.8,       // Compress when 80% full
  }),
};

// Manual Session State Management (for custom persistence)
class GeminiSessionManager {
  constructor(storageDir = 'sessions') {
    this.storageDir = storageDir;
    this.activeSessions = new Map();
  }

  /**
   * Save session state for later resumption
   */
  async saveSession(sessionId, data) {
    const session = {
      sessionId,
      contents: data.contents,       // Full conversation history
      state: data.state,             // Custom state (tool metrics, etc.)
      resumptionHandle: data.handle, // ADK resumption handle if available
      savedAt: new Date().toISOString(),
      version: '2.0'
    };

    const path = `${this.storageDir}/${sessionId}.json`;
    await fs.writeFile(path, JSON.stringify(session, null, 2));
    this.activeSessions.set(sessionId, session);

    console.log(`[Session] Saved ${sessionId}`);
    return session;
  }

  /**
   * Resume session from saved state
   */
  async resumeSession(sessionId) {
    // Check memory first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId);
    }

    // Load from disk
    const path = `${this.storageDir}/${sessionId}.json`;
    try {
      const json = await fs.readFile(path, 'utf-8');
      const session = JSON.parse(json);
      this.activeSessions.set(sessionId, session);
      console.log(`[Session] Resumed ${sessionId}`);
      return session;
    } catch (error) {
      console.warn(`[Session] Could not resume ${sessionId}:`, error.message);
      return null;
    }
  }

  /**
   * Create new session with initial context
   */
  async createSession(userId, initialContext = {}) {
    const sessionId = `${userId}_${Date.now()}`;
    return this.saveSession(sessionId, {
      contents: [],
      state: {
        userId,
        created: new Date().toISOString(),
        ...initialContext
      }
    });
  }
}

// Usage in agent loop
const sessionManager = new GeminiSessionManager();

async function agentLoopWithSession(sessionId, userPrompt) {
  // Resume or create session
  let session = await sessionManager.resumeSession(sessionId);
  if (!session) {
    session = await sessionManager.createSession('user', {});
  }

  // Add new user message
  session.contents.push({ role: 'user', parts: [{ text: userPrompt }] });

  // Generate response
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: session.contents,
    config: { thinkingConfig: { thinkingLevel: 'MEDIUM' } }
  });

  // Add response to history
  session.contents.push({ role: 'model', parts: [{ text: response.text }] });

  // Save updated session
  await sessionManager.saveSession(sessionId, session);

  return response.text;
}
```

### 15.6 Multi-Model Fallback Architecture

```javascript
// ============================================
// PRODUCTION FALLBACK ARCHITECTURE
// Based on LiteLLM Router patterns
// ============================================

class MultiModelRouter {
  constructor(config = {}) {
    this.models = {
      primary: config.primary || 'gemini-3-flash-preview',
      fallback: config.fallback || 'gemini-3-pro-preview',
      emergency: config.emergency || null  // Optional Claude fallback
    };

    this.metrics = {
      primary: { success: 0, failures: 0, latency: [] },
      fallback: { success: 0, failures: 0, latency: [] }
    };

    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      initialDelay: config.initialDelay || 1000,
      backoffMultiplier: config.backoffMultiplier || 2
    };
  }

  /**
   * Execute with automatic fallback
   */
  async execute(prompt, options = {}) {
    const startTime = Date.now();

    // Try primary model
    try {
      const result = await this.executeWithRetry(
        this.models.primary,
        prompt,
        options
      );
      this.recordSuccess('primary', Date.now() - startTime);
      return { result, model: this.models.primary, fallback: false };

    } catch (primaryError) {
      console.warn(`[Router] Primary failed: ${primaryError.message}`);
      this.recordFailure('primary');

      // Try fallback model
      try {
        const result = await this.executeWithRetry(
          this.models.fallback,
          prompt,
          options
        );
        this.recordSuccess('fallback', Date.now() - startTime);
        return { result, model: this.models.fallback, fallback: true };

      } catch (fallbackError) {
        console.error(`[Router] Fallback failed: ${fallbackError.message}`);
        this.recordFailure('fallback');

        // Emergency fallback (if configured)
        if (this.models.emergency) {
          console.warn('[Router] Using emergency fallback');
          return this.executeEmergency(prompt, options);
        }

        throw new Error(`All models failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }

  async executeWithRetry(model, prompt, options) {
    let lastError;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: prompt,
          config: options.config || {}
        });
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries) {
          console.log(`[Router] Retry ${attempt}/${this.retryConfig.maxRetries} for ${model}`);
          await this.sleep(delay);
          delay *= this.retryConfig.backoffMultiplier;
        }
      }
    }

    throw lastError;
  }

  isRetryable(error) {
    const retryablePatterns = [
      /rate limit/i,
      /quota/i,
      /timeout/i,
      /unavailable/i,
      /429/,
      /500/,
      /503/
    ];
    return retryablePatterns.some(p => p.test(error.message));
  }

  recordSuccess(tier, latencyMs) {
    this.metrics[tier].success++;
    this.metrics[tier].latency.push(latencyMs);
  }

  recordFailure(tier) {
    this.metrics[tier].failures++;
  }

  getStats() {
    return Object.entries(this.metrics).map(([tier, stats]) => ({
      tier,
      successRate: stats.success / (stats.success + stats.failures) || 0,
      avgLatency: stats.latency.length > 0
        ? stats.latency.reduce((a, b) => a + b, 0) / stats.latency.length
        : 0,
      ...stats
    }));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Feature flag for instant rollback
const USE_GEMINI = process.env.USE_GEMINI !== 'false';

async function executeWithRollback(prompt, options = {}) {
  if (!USE_GEMINI) {
    console.log('[Rollback] Gemini disabled, using Claude');
    return executeWithClaude(prompt, options);
  }

  const router = new MultiModelRouter({
    primary: 'gemini-3-flash-preview',
    fallback: 'gemini-3-pro-preview',
    emergency: process.env.CLAUDE_FALLBACK === 'true' ? 'claude-sonnet-4' : null
  });

  return router.execute(prompt, options);
}
```

### 15.7 Testing Infrastructure Requirements

```javascript
// ============================================
// GEMINI MIGRATION TEST SUITE STRUCTURE
// Required test files for production validation
// ============================================

/*
test/gemini/
├── unit/
│   ├── tool-adapter.test.js       # Tool schema conversion
│   ├── truncation-detection.test.js
│   ├── completion-detection.test.js
│   ├── session-manager.test.js
│   └── thinking-config.test.js
├── integration/
│   ├── auto-continuation.test.js
│   ├── multi-turn-conversation.test.js
│   ├── parallel-function-calling.test.js
│   ├── streaming-events.test.js
│   └── subagent-routing.test.js
├── e2e/
│   ├── research-pipeline.test.js
│   ├── memo-generation.test.js
│   └── full-due-diligence.test.js
└── parity/
    ├── claude-gemini-comparison.test.js
    └── golden-prompts.test.js
*/

// Example: Truncation Detection Tests
describe('Truncation Detection', () => {
  test('detects MAX_TOKENS finish reason', () => {
    const response = {
      candidates: [{ finishReason: 'MAX_TOKENS' }]
    };
    const result = detectTruncation('Some text...', response);
    expect(result.truncated).toBe(true);
    expect(result.reason).toBe('finish_reason_max_tokens');
  });

  test('detects trailing ellipsis pattern', () => {
    const result = detectTruncation(
      'The analysis continues and the results show that...',
      { candidates: [{ finishReason: 'STOP' }] }
    );
    expect(result.truncated).toBe(true);
    expect(result.reason).toBe('pattern_match');
  });

  test('detects unclosed brace', () => {
    const result = detectTruncation(
      'function example() {',
      { candidates: [{ finishReason: 'STOP' }] }
    );
    expect(result.truncated).toBe(true);
  });
});

// Example: Completion Detection Tests
describe('Completion Detection', () => {
  test('detects RESEARCH COMPLETE signal', () => {
    const text = `
      ## Conclusion
      Based on the analysis, the target company shows...

      RESEARCH COMPLETE
    `;
    const result = detectCompletion(text);
    expect(result.completed).toBe(true);
  });

  test('completion overrides truncation', () => {
    const text = 'Final summary... MEMORANDUM COMPLETE';
    const response = { candidates: [{ finishReason: 'MAX_TOKENS' }] };

    const decision = shouldContinue(text, response, 0, 14);
    expect(decision.shouldContinue).toBe(false);
    expect(decision.reason).toBe('completion_detected');
  });
});

// Example: Parity Test
describe('Claude vs Gemini Parity', () => {
  const goldenPrompts = [
    'Search SEC filings for Apple Inc 10-K reports from 2023',
    'Find federal court cases involving securities fraud in the Ninth Circuit',
    'Analyze FDA warning letters for pharmaceutical companies in Q4 2024'
  ];

  for (const prompt of goldenPrompts) {
    test(`parity: ${prompt.substring(0, 50)}...`, async () => {
      const claudeResult = await executeWithClaude(prompt);
      const geminiResult = await executeWithGemini(prompt);

      // Structural similarity check
      expect(geminiResult.toolsCalled).toEqual(
        expect.arrayContaining(claudeResult.toolsCalled)
      );

      // Quality score comparison (allow 10% variance)
      const claudeScore = await evaluateQuality(claudeResult.text);
      const geminiScore = await evaluateQuality(geminiResult.text);
      expect(geminiScore).toBeGreaterThan(claudeScore * 0.9);
    });
  }
});
```

---

## Appendix C: Migration Confidence Matrix (Updated)

| Component | Confidence | Notes |
|-----------|------------|-------|
| Tool Schema Conversion | 95% | `inputSchema` → `parameters` direct mapping |
| Parallel Function Calling | 95% | Native support in Gemini |
| Thinking/Reasoning | 90% | `thinking_level` replaces `thinkingBudget` |
| Auto-Continuation | 90% | Patterns documented, needs testing |
| Session Resumption | 85% | ADK handles automatically |
| Subagent Routing | 85% | Coordinator pattern well-supported |
| Completion Detection | 85% | Patterns ported, needs validation |
| SSE Streaming | 80% | Different event structure |
| Report Saving Hooks | 80% | Manual callback implementation |
| Code Execution | 75% | `ToolCodeExecution` differs from custom |

---

*Document generated: December 29, 2025*
*Last updated: December 29, 2025 (V2.2 - Added critical gap fixes, truncation/completion detection, session management, fallback architecture)*
*Research sources: Exa MCP, Exa CODE, Google Developer Blog, Gemini API Documentation, ADK Documentation, LiteLLM Patterns*
*Target models: Gemini-3-Pro (orchestrator), Gemini-3-Flash (processing)*
*Document version: 2.2*
