# Code Execution Integration Analysis

**Document Version**: 2.0
**Date**: December 15, 2025
**Author**: Claude Code Analysis
**Status**: Verified Against December 2025 Anthropic Documentation

---

## ✅ Documentation Verification (December 15, 2025)

**This document has been verified against official Anthropic sources:**

| Source | URL | Verified |
|--------|-----|----------|
| Code Execution Tool Docs | https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool | ✅ |
| Code Execution with MCP | https://www.anthropic.com/engineering/code-execution-with-mcp | ✅ |
| Building Agents with SDK | https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk | ✅ |
| Agent SDK Python Docs | https://docs.claude.com/en/docs/agent-sdk/python | ✅ |

**Key Verified Specifications:**
- Beta header: `code-execution-2025-08-25` (current)
- Tool type: `code_execution_20250825` (current - supports Bash + file operations)
- Container: 5GiB RAM, 5GiB disk, 1 CPU, 30-day expiration
- Network: **Completely disabled** (security sandbox)
- Python: 3.11.12 with pre-installed data science libraries

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Code Execution Tool Specification](#code-execution-tool-specification)
4. [Integration Compatibility Matrix](#integration-compatibility-matrix)
5. [Existing Code Execution Infrastructure](#existing-code-execution-infrastructure)
6. [Proposed Integration Strategy](#proposed-integration-strategy)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Safety and Breaking Change Assessment](#safety-and-breaking-change-assessment)
9. [Sandbox Limitations and Constraints](#sandbox-limitations-and-constraints)
10. [Integration Workflow Examples](#integration-workflow-examples)
11. [Alternative Approaches](#alternative-approaches)
12. [Rollback Plan](#rollback-plan)
13. [Decision Matrix](#decision-matrix)
14. [Appendix: Reference Documentation](#appendix-reference-documentation)

---

## Executive Summary

This document analyzes the integration of Anthropic's Code Execution Tool (`code_execution_20250825`) with the Super-Legal MCP server architecture. The analysis examines compatibility with existing systems, identifies potential breaking changes, and provides explicit implementation guidance.

### Key Findings

| Finding | Assessment |
|---------|------------|
| **Breaking Changes** | ZERO - Integration is purely additive |
| **Agent SDK Compatibility** | Indirect only (via HTTP endpoint) |
| **Direct API Compatibility** | Full compatibility |
| **Existing Infrastructure** | Code execution stub already present in codebase |
| **Recommended Approach** | Dedicated `/api/financial-model` endpoint |

### Recommendation

Proceed with implementation via a dedicated endpoint. The integration:
- Does not modify any existing code paths
- Uses established patterns already in the codebase
- Can be rolled back by removing 3-5 lines of code
- Provides high-value financial modeling capabilities for legal memoranda

---

## Current Architecture Analysis

### Server File Location

```
/Users/ej/Super-Legal/super-legal-mcp-refactored/src/server/claude-sdk-server.js
```

**Total Lines**: 1,121
**Primary Function**: Legal research API with streaming, tool execution, and subagent delegation

### Two Distinct API Pathways

The server implements two fundamentally different approaches to Claude integration:

#### Pathway 1: Agent SDK (Multi-Turn)

**Location**: Lines 717-912
**Endpoint**: `/api/stream` (when `featureFlags.USE_AGENT_SDK === true`)
**Method**: `agentQuery()` from `@anthropic-ai/claude-agent-sdk`

```javascript
// Lines 717-737
for await (const message of agentQuery({
  prompt: currentPrompt,
  options: {
    model: MODEL,
    maxTurns: Number(process.env.SDK_MAX_TURNS || 100),
    maxThinkingTokens: 4096,
    systemPrompt: SYSTEM_PROMPT,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    includePartialMessages: true,
    betas: [
      'context-1m-2025-08-07',
      'interleaved-thinking-2025-05-14'
    ],
    ...(currentSessionId ? { resume: currentSessionId } : {}),
    mcpServers: {
      'super-legal-tools': mcpServer
    },
    ...(featureFlags.SUBAGENTS_ENABLED ? { agents: getLegalSubagents() } : {}),
    hooks: sdkHooksConfig
  }
}))
```

**Characteristics**:
- Uses MCP servers for tool access (not `tools` array)
- Supports subagent delegation via `agents` config
- Multi-turn conversations with session resumption
- Auto-continuation for truncated outputs
- Hooks for lifecycle monitoring (PreToolUse, PostToolUse, SubagentStop, etc.)

**Code Execution Compatibility**: **NO** - The Agent SDK uses MCP servers, which is a different paradigm than the Direct API's `tools` array required by Code Execution.

#### Pathway 2: Direct API

**Location**: Lines 492-598 (`/api/research`), Lines 914-1107 (legacy `/api/stream`)
**Endpoint**: `/api/research`, `/api/stream` (when `featureFlags.USE_AGENT_SDK === false`)
**Method**: `anthropic.beta.messages.stream()` or `anthropic.messages.stream()`

```javascript
// Lines 494-508
const stream = await anthropic.beta.messages.stream({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  messages,
  tools,
  thinking: {
    type: 'enabled',
    budget_tokens: 4096
  },
  ...(output_format ? { output_format } : {}),
  ...(cachedSystemPrompt ? { system: cachedSystemPrompt } : {}),
  ...((betaHeader && betaHeader.length > 0) ? { betas: betaHeader.split(',').filter(Boolean) } : {}),
  ...(skills ? { container: { skills } } : {}),
  ...(tool_choice ? { tool_choice } : {})
});
```

**Characteristics**:
- Uses `tools` array for tool definitions
- Supports Skills container with code execution
- Single-turn with manual tool execution loop
- Structured output support via `output_format`

**Code Execution Compatibility**: **YES** - Direct API supports the `tools` array format required by Code Execution.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE-SDK-SERVER.JS                                │
│                         (1,121 lines)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED INFRASTRUCTURE                             │   │
│  │  - Anthropic client initialization (lines 121-131)                  │   │
│  │  - Rate limiter (lines 177-180)                                     │   │
│  │  - Circuit breaker (lines 181-184)                                  │   │
│  │  - API clients (SEC, FDA, EPA, etc.) (lines 196-225)               │   │
│  │  - SDK tools registry (lines 228-241)                               │   │
│  │  - MCP server creation (lines 243-258)                              │   │
│  │  - System prompt loading (lines 148-176)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PATHWAY 1: AGENT SDK                              │   │
│  │                    /api/stream (USE_AGENT_SDK=true)                  │   │
│  │                    Lines 671-912                                     │   │
│  │                                                                      │   │
│  │  Features:                                                           │   │
│  │  - agentQuery() streaming iterator                                  │   │
│  │  - MCP servers (mcpServers config)                                  │   │
│  │  - Subagent delegation (getLegalSubagents())                        │   │
│  │  - SDK hooks (sdkHooksConfig)                                       │   │
│  │  - Session resumption                                               │   │
│  │  - Auto-continuation                                                │   │
│  │                                                                      │   │
│  │  Code Execution: NOT COMPATIBLE                                     │   │
│  │  Reason: Uses MCP servers, not tools array                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PATHWAY 2: DIRECT API                             │   │
│  │                    /api/research (lines 416-598)                     │   │
│  │                    /api/stream legacy (lines 914-1107)               │   │
│  │                                                                      │   │
│  │  Features:                                                           │   │
│  │  - anthropic.beta.messages.stream()                                 │   │
│  │  - tools array with handler binding                                 │   │
│  │  - Skills container support                                         │   │
│  │  - Structured outputs                                               │   │
│  │  - Prompt caching                                                   │   │
│  │                                                                      │   │
│  │  Code Execution: FULLY COMPATIBLE                                   │   │
│  │  Already has stub at lines 935-941                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Execution Tool Specification

### Official Anthropic Documentation

**Source**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
**Engineering Blog**: https://www.anthropic.com/engineering/advanced-tool-use

### Tool Configuration (Verified December 2025)

| Property | Value | Source |
|----------|-------|--------|
| **Beta Header** | `code-execution-2025-08-25` | Official docs |
| **Tool Type** | `code_execution_20250825` | Official docs |
| **Supported Languages** | Python 3.11.12, Bash | Container specs |
| **Container RAM** | **5 GiB** | Official docs |
| **Container Disk** | **5 GiB** workspace storage | Official docs |
| **Container CPU** | 1 core | Official docs |
| **Network Access** | **Completely DISABLED** | Security section |
| **Container Lifetime** | **30 days** after creation | Official docs |
| **Cost** | $0.05/hour (50 free hours/day/org) | Pricing section |

### Pre-Installed Python Libraries (Verified December 2025)

**Data Science:**
| Library | Use Case |
|---------|----------|
| `pandas` | Financial data manipulation |
| `numpy` | Numerical computations, NPV calculations |
| `scipy` | Statistical analysis, optimization |
| `scikit-learn` | Predictive modeling, regression |
| `statsmodels` | Time series, econometrics, OLS |

**Visualization:**
| Library | Use Case |
|---------|----------|
| `matplotlib` | Charts and visualizations |
| `seaborn` | Statistical graphics |

**File Processing:**
| Library | Use Case |
|---------|----------|
| `pyarrow` | Columnar data processing |
| `openpyxl`, `xlsxwriter`, `xlrd` | Excel file handling |
| `pillow` | Image processing |
| `python-pptx`, `python-docx` | Office document creation |
| `pypdf`, `pdfplumber`, `pypdfium2` | PDF extraction |
| `pdf2image`, `pdfkit`, `tabula-py` | PDF processing |
| `reportlab[pycairo]`, `Img2pdf` | PDF generation |

**Math & Computing:**
| Library | Use Case |
|---------|----------|
| `sympy` | Symbolic mathematics |
| `mpmath` | Arbitrary precision math |

**Utilities:**
| Library | Use Case |
|---------|----------|
| `tqdm` | Progress bars |
| `python-dateutil`, `pytz` | Date/time handling |
| `joblib` | Parallel processing |
| `sqlite` | Local database |
| `ripgrep (rg)`, `fd` | Fast file search |

### API Request Format (Corrected December 2025)

**IMPORTANT**: Use `client.beta.messages.create` with `betas` array (NOT headers object):

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// CORRECT PATTERN (from official December 2025 docs):
const response = await client.beta.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  betas: ['code-execution-2025-08-25'],  // Beta as array element
  max_tokens: 16000,
  tools: [{
    type: 'code_execution_20250825',
    name: 'code_execution'
  }],
  messages: [{
    role: 'user',
    content: 'Build a DCF model with revenue: [100, 110, 121], WACC: 0.10'
  }]
});

// Container reuse (optional - for multi-step analyses):
const containerId = response.container?.id;
// Use in subsequent requests: container: containerId
```

### Response Structure (December 2025 Format)

**Bash Command Response:**
```javascript
{
  "type": "server_tool_use",
  "id": "srvtoolu_01B3C4D5E6F7G8H9I0J1K2L3",
  "name": "bash_code_execution",
  "input": {
    "command": "python script.py"
  }
},
{
  "type": "bash_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01B3C4D5E6F7G8H9I0J1K2L3",
  "content": {
    "type": "bash_code_execution_result",
    "stdout": "{\"enterprise_value\": 1234567.89, ...}",
    "stderr": "",
    "return_code": 0
  }
}
```

**File Operation Response:**
```javascript
{
  "type": "server_tool_use",
  "id": "srvtoolu_01C4D5E6F7G8H9I0J1K2L3M4",
  "name": "text_editor_code_execution",
  "input": {
    "command": "view",
    "path": "output.json"
  }
},
{
  "type": "text_editor_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01C4D5E6F7G8H9I0J1K2L3M4",
  "content": {
    "type": "text_editor_code_execution_result",
    "file_type": "text",
    "content": "{\"enterprise_value\": 1234567.89}",
    "numLines": 1,
    "startLine": 1,
    "totalLines": 1
  }
}
```

**Error Response:**
```javascript
{
  "type": "bash_code_execution_tool_result",
  "tool_use_id": "srvtoolu_xyz",
  "content": {
    "type": "bash_code_execution_tool_result_error",
    "error_code": "execution_time_exceeded"  // or: unavailable, container_expired, invalid_tool_input, too_many_requests
  }
}
```

---

## Integration Compatibility Matrix

### Component-by-Component Analysis

| Component | Location | Code Execution Compatible | Integration Method |
|-----------|----------|--------------------------|-------------------|
| `/api/stream` (Agent SDK) | Lines 671-912 | **NO** | Indirect via HTTP |
| `/api/research` (Direct API) | Lines 416-598 | **YES** | Direct tool addition |
| `/api/sdk-test` | Lines 362-386 | **YES** | Direct tool addition |
| MCP tools | `agentSdkToolAdapter.js` | Unaffected | Separate system |
| Subagents | `legalSubagents.js` | Indirect | Can call endpoints |
| Skills container | Lines 456-478 | **YES** | Already integrated |
| SDK hooks | `sdkHooks.js` | Unaffected | Lifecycle only |
| Structured outputs | Lines 451-454 | **YES** | Can combine |

### Why Agent SDK Cannot Use Code Execution Directly

The Agent SDK uses a fundamentally different tool paradigm:

**Agent SDK (MCP Servers)**:
```javascript
// Line 732-734
mcpServers: {
  'super-legal-tools': mcpServer
}
```

**Direct API (Tools Array)**:
```javascript
// Required for Code Execution
tools: [{
  type: 'code_execution_20250825',
  name: 'code_execution'
}]
```

These are incompatible because:
1. MCP servers use the Model Context Protocol, a separate tool discovery/execution mechanism
2. Code Execution requires the `tools` array format with specific type declarations
3. The Agent SDK abstracts away the raw API, not exposing the `tools` array

### Indirect Integration Path

Subagents running under the Agent SDK CAN access Code Execution indirectly:

```
Subagent (securities-researcher)
    │
    ├──→ Extract financial data via MCP tools (SEC EDGAR, etc.)
    │
    ├──→ Make HTTP POST to /api/financial-model endpoint
    │         │
    │         └──→ Endpoint uses Direct API with code_execution
    │
    └──→ Incorporate results into legal memorandum
```

---

## Existing Code Execution Infrastructure

### Current Implementation (Lines 935-941)

The server ALREADY has Code Execution infrastructure for Skills:

```javascript
// Lines 935-941 in /api/stream legacy path
if (featureFlags.SKILLS_ENABLED) {
  toolsForRequest.push({
    type: 'code_execution_20250825',
    name: 'code_execution',
    description: 'Anthropic managed code execution for Skills'
  });
}
```

### Beta Header Construction (Lines 479-483)

```javascript
const betaHeader = buildBetaHeader({
  includeStructuredOutputs: Boolean(schema),
  includeSkills: Boolean(skills),
  includeExtendedContext
});
```

The `buildBetaHeader` function in `src/utils/skillsRequestBuilder.js` already handles adding `code-execution-2025-08-25` when Skills are enabled.

### Skills Container Integration (Lines 456-478)

```javascript
// Build skills container with quota enforcement
const customSkills = featureFlags.SKILLS_ENABLED ? getCustomSkills() : [];
const userId = req.headers['x-user-id'] || req.body?.user_id || null;
if (featureFlags.SKILLS_ENABLED && customSkills.length) {
  for (const skill of customSkills) {
    const quota = enforceSkillQuota({ userId, skillName: skill.name });
    if (!quota.allowed) {
      recordSkillFailure(skill.name);
      return res.status(429).json({
        error: 'skill_quota_exceeded',
        skill: skill.name,
        limits: quota.limits,
        counts: { hourly: quota.hourlyCount, daily: quota.dailyCount }
      });
    }
  }
}
const skills = featureFlags.SKILLS_ENABLED ? buildSkillsContainer(customSkills) : null;
```

### Implication

The infrastructure for Code Execution already exists. A dedicated financial modeling endpoint would:
1. Reuse the existing Anthropic client (line 123)
2. Follow established patterns for beta headers
3. Use the same error handling and metrics

---

## Proposed Integration Strategy

### Strategy: Dedicated Financial Modeling Endpoint

**Rationale**:
- Cleanest separation of concerns
- Does not modify existing code paths
- Provides structured interface for financial modeling
- Easier to test, monitor, and maintain
- Clear rollback path

### New Endpoint Specification

**Route**: `POST /api/financial-model`

**Request Body**:
```typescript
interface FinancialModelRequest {
  modelType: 'dcf' | 'event_study' | 'monte_carlo' | 'regression' | 'time_series' | 'damages';
  financialData: {
    // DCF
    revenue?: number[];
    expenses?: number[];
    capex?: number[];
    workingCapital?: number[];
    // Event Study
    prices?: Array<{ date: string; price: number }>;
    marketPrices?: Array<{ date: string; price: number }>;
    // Monte Carlo
    baseCase?: number;
    variables?: Array<{ name: string; min: number; max: number; distribution: string }>;
    // Regression
    dependent?: number[];
    independent?: Record<string, number[]>;
    periods?: string[];
    // Time Series
    series?: number[];
    dates?: string[];
    // Damages
    actual?: number[];
    butFor?: number[];
  };
  parameters: {
    // DCF
    wacc?: number;
    terminalGrowth?: number;
    taxRate?: number;
    years?: number;
    // Event Study
    eventDate?: string;
    estimationWindow?: [number, number];
    eventWindow?: [number, number];
    // Monte Carlo
    iterations?: number;
    distributions?: Record<string, { type: string; params: number[] }>;
    correlations?: number[][];
    // Regression
    variableNames?: string[];
    // Time Series
    frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    // Damages
    discountRate?: number;
    interestRate?: number;
    calculationDate?: string;
  };
}
```

**Response Body**:
```typescript
interface FinancialModelResponse {
  success: boolean;
  modelType: string;
  data: {
    // Model-specific results (varies by modelType)
    [key: string]: any;
  };
  charts: Array<{
    type: 'image';
    media_type: 'image/png';
    data: string; // base64
  }>;
  text: string; // Model explanation
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}
```

### Files to Create/Modify

| File | Action | Lines Changed | Purpose |
|------|--------|---------------|---------|
| `src/server/financialModelEndpoint.js` | **CREATE** | ~350 new | Dedicated endpoint module |
| `src/server/claude-sdk-server.js` | **MODIFY** | +5 lines | Import and route registration |
| `src/config/legalSubagents.js` | **MODIFY** (optional) | +30 lines | Add financial modeling instructions |

### Integration Code for claude-sdk-server.js

**Add Import (after line 66)**:
```javascript
import { financialModelHandler } from './financialModelEndpoint.js';
```

**Add Route (after line 413)**:
```javascript
// Financial modeling endpoint with sandboxed code execution
app.post('/api/financial-model', financialModelHandler);
```

**Total Changes**: 2 lines added to existing file

---

## Technical Implementation Details

### New File: `src/server/financialModelEndpoint.js`

```javascript
/**
 * Financial Model Endpoint
 *
 * Provides sandboxed Python code execution for financial modeling
 * within legal memoranda. Uses Anthropic Direct API with Code Execution Tool.
 *
 * @module financialModelEndpoint
 * @see https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Constants aligned with December 2025 docs
const CODE_EXECUTION_MODEL = 'claude-sonnet-4-5-20250929';  // Confirmed compatible
const CODE_EXECUTION_BETA = 'code-execution-2025-08-25';     // Current beta header
const CODE_EXECUTION_TOOL = 'code_execution_20250825';       // Current tool type

/**
 * Execute a financial model in a sandboxed Python environment.
 *
 * @param {Object} request - The financial model request
 * @param {string} request.modelType - Type of model
 * @param {Object} request.financialData - Financial data
 * @param {Object} request.parameters - Model parameters
 * @returns {Promise<Object>} Model results
 */
export async function executeFinancialModel(request) {
  const { modelType, financialData, parameters } = request;

  const prompt = buildFinancialPrompt(modelType, financialData, parameters);

  try {
    // CORRECT API PATTERN (from official December 2025 docs):
    // Use client.beta.messages.create with betas array
    const response = await client.beta.messages.create({
      model: CODE_EXECUTION_MODEL,
      betas: [CODE_EXECUTION_BETA],  // Beta header as array element
      max_tokens: 16000,
      tools: [{
        type: CODE_EXECUTION_TOOL,   // Tool type from docs
        name: 'code_execution'       // Name from docs
      }],
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Container reuse pattern (optional - for multi-step analyses)
    // const containerId = response.container?.id;

    return extractResults(response);
  } catch (error) {
    console.error('[FinancialModel] Execution failed:', error.message);
    return {
      success: false,
      error: error.message,
      modelType
    };
  }
}

/**
 * Extract results from code execution response
 * Handles bash_code_execution_result and text_editor_code_execution_result
 */
function extractResults(response) {
  const results = {
    success: response.stop_reason !== 'error',
    outputs: [],
    charts: [],
    errors: []
  };

  for (const content of response.content) {
    if (content.type === 'bash_code_execution_tool_result') {
      const result = content.content;
      if (result.type === 'bash_code_execution_result') {
        results.outputs.push({
          stdout: result.stdout,
          stderr: result.stderr,
          return_code: result.return_code
        });
        // Extract any file_ids for charts
        if (result.content) {
          for (const file of result.content) {
            if (file.file_id) {
              results.charts.push(file.file_id);
            }
          }
        }
      } else if (result.type === 'bash_code_execution_tool_result_error') {
        results.errors.push(result.error_code);
      }
    }
  }

  return results;
}

// ... (prompt builders for DCF, event_study, monte_carlo, regression, time_series, damages)
```

### Prompt Builder Pattern

Each financial model type has a dedicated prompt builder:

```javascript
function buildDCFPrompt(data, params) {
  return `You are a financial analyst building a Discounted Cash Flow (DCF) model
for legal proceedings.

## Input Data
- Revenue projections (annual): ${JSON.stringify(data.revenue || [])}
- Operating expenses: ${JSON.stringify(data.expenses || [])}
- Capital expenditures: ${JSON.stringify(data.capex || [])}
- Working capital changes: ${JSON.stringify(data.workingCapital || [])}
- Tax rate: ${params.taxRate || 0.21}
- WACC (Weighted Average Cost of Capital): ${params.wacc || 0.10}
- Terminal growth rate: ${params.terminalGrowth || 0.02}
- Projection years: ${params.years || 5}

## Requirements
1. Calculate Free Cash Flow (FCF) for each projection year
2. Discount FCF to present value using WACC
3. Calculate terminal value using Gordon Growth Model
4. Sum to get enterprise value
5. Create a sensitivity table varying WACC (+/- 2%) and terminal growth (+/- 1%)
6. Generate a waterfall chart showing value components

## Output Format
Return a JSON object with:
- enterprise_value: number
- fcf_by_year: array of {year, fcf, pv}
- terminal_value: number
- terminal_value_pv: number
- sensitivity_table: 2D array
- methodology_notes: string explaining assumptions

Use pandas for data manipulation and numpy.npv() for NPV calculations.
Generate charts using matplotlib and return as base64 PNG.`;
}
```

---

## Safety and Breaking Change Assessment

### Risk Matrix

| Risk Category | Probability | Impact | Mitigation |
|--------------|-------------|--------|------------|
| Breaking `/api/stream` | **0%** | N/A | New route, no existing code touched |
| Breaking `/api/research` | **0%** | N/A | New route, no existing code touched |
| Breaking MCP tools | **0%** | N/A | Different tool system |
| Breaking subagents | **0%** | N/A | Additive instructions only |
| Breaking Skills | **0%** | N/A | Separate beta header/endpoint |
| Rate limit interference | **5%** | Low | Shares client but isolated calls |
| Memory/performance impact | **10%** | Low | Sandboxed in Anthropic container |

### Detailed Safety Analysis

#### 1. Agent SDK Path (Lines 671-912)

**Will NOT be modified**. The financial modeling endpoint:
- Uses a completely separate route (`/api/financial-model`)
- Uses Direct API (`anthropic.messages.create`), not Agent SDK (`agentQuery`)
- Has no shared state with Agent SDK path
- Does not modify `featureFlags.USE_AGENT_SDK` logic

#### 2. Direct API Path (Lines 416-598)

**Will NOT be modified**. The financial modeling endpoint:
- Is a new route, not a modification of `/api/research`
- Uses its own Anthropic API call, not shared streaming
- Does not modify tool handlers or Skills logic

#### 3. MCP Tools

**Completely unaffected**. MCP tools are:
- Defined in `agentSdkToolAdapter.js`
- Served via `getAgentSdkMcpServer()`
- Used only by Agent SDK path
- Not involved in Code Execution at all

#### 4. Subagents

**Enhancement only**. The optional subagent update:
- Adds `FINANCIAL_MODELING_INSTRUCTIONS` to prompt
- Does not modify existing delegation logic
- Does not change tool permissions
- Subagents can ignore the instructions if not needed

#### 5. SDK Hooks

**Completely unaffected**. Hooks:
- Monitor Agent SDK lifecycle events
- Are not triggered by Direct API calls
- Have no interaction with `/api/financial-model`

### What Changes at Runtime

| Before | After |
|--------|-------|
| Server has N routes | Server has N+1 routes |
| No `/api/financial-model` | `/api/financial-model` responds |
| Subagents cannot do financial modeling | Subagents can call endpoint |

### What Does NOT Change

- All existing routes function identically
- Agent SDK path execution unchanged
- MCP tool behavior unchanged
- Subagent delegation logic unchanged
- Skills execution unchanged
- Rate limiting unchanged
- Circuit breaker unchanged
- Metrics collection unchanged (except new endpoint metrics)

---

## Sandbox Limitations and Constraints

### What the Sandbox CAN Do (Verified December 2025)

| Capability | Details |
|------------|---------|
| Python execution | Python 3.11.12 with standard library |
| Bash commands | Full shell access for system operations |
| Data manipulation | pandas, numpy, pyarrow operations |
| Statistical analysis | scipy.stats, statsmodels, scikit-learn |
| Visualization | matplotlib, seaborn charts (PNG output) |
| File I/O | Read/write within 5GiB workspace |
| PDF processing | pypdf, pdfplumber, reportlab, tabula-py |
| Excel processing | openpyxl, xlsxwriter, xlrd |
| Office documents | python-docx, python-pptx |
| JSON/data processing | Full json module + sqlite3 |

### What the Sandbox CANNOT Do (Verified December 2025)

| Limitation | Implication | Source |
|------------|-------------|--------|
| **No internet access** | Cannot call APIs, fetch data, web scrape | Official docs: "Completely disabled for security" |
| **No external databases** | Cannot query external SQL, MongoDB, etc. (sqlite3 available locally) | Container specs |
| **No pip install** | Must use pre-installed libraries only | Container specs |
| **30-day container lifetime** | Container expires after 30 days; state lost | Official docs |
| **5GiB memory limit** | Large datasets may require chunking | Container specs |
| **5GiB disk limit** | Workspace storage capped | Container specs |
| **1 CPU core** | Limited parallelization | Container specs |
| **No GPU access** | CPU-only computation | Container specs |

### Critical Implication for Integration

**Financial data must be PRE-EXTRACTED before calling the endpoint.**

The workflow must be:
1. Subagent extracts financial data from SEC EDGAR (via MCP tools)
2. Subagent structures data into JSON format
3. Subagent calls `/api/financial-model` with extracted data
4. Sandbox performs computation on provided data
5. Results returned to subagent for incorporation

The sandbox CANNOT:
- Fetch SEC filings directly
- Query financial databases
- Access market data APIs
- Download price histories

---

## Integration Workflow Examples

### Example 1: DCF Valuation for M&A Fairness Opinion

```
User Query: "Analyze Apple's acquisition price fairness based on DCF valuation"

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Main Agent receives query                                           │
│         Route: /api/stream (Agent SDK)                                      │
│         Action: Delegates to securities-researcher subagent                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: securities-researcher extracts financial data                       │
│         Tools: mcp__super-legal-tools__sec_edgar_search                     │
│         Action: Fetches Apple 10-K, extracts:                              │
│           - Revenue: [394.33B, 383.29B, 365.82B, ...]                      │
│           - Operating expenses: [274.89B, 268.78B, ...]                    │
│           - Capital expenditures: [10.71B, 10.96B, ...]                    │
│           - WACC components from proxy statement                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: securities-researcher calls financial model endpoint                │
│         Route: POST /api/financial-model                                    │
│         Body: {                                                             │
│           modelType: "dcf",                                                 │
│           financialData: {                                                  │
│             revenue: [394.33, 383.29, 365.82, 378.32, 397.74],            │
│             expenses: [274.89, 268.78, 256.87, 264.58, 278.19],           │
│             capex: [10.71, 10.96, 11.09, 10.82, 10.49]                    │
│           },                                                                │
│           parameters: {                                                     │
│             wacc: 0.089,                                                    │
│             terminalGrowth: 0.025,                                          │
│             taxRate: 0.21,                                                  │
│             years: 5                                                        │
│           }                                                                 │
│         }                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Code Execution Sandbox processes request                            │
│         Environment: Python 3.11 sandbox (no network)                       │
│         Libraries: pandas, numpy, matplotlib                                │
│         Execution:                                                          │
│           - Calculates Free Cash Flow projections                          │
│           - Discounts to present value using WACC                          │
│           - Computes terminal value (Gordon Growth)                        │
│           - Builds sensitivity matrix                                       │
│           - Generates waterfall chart (base64 PNG)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Endpoint returns structured results                                 │
│         Response: {                                                         │
│           success: true,                                                    │
│           modelType: "dcf",                                                 │
│           data: {                                                           │
│             enterprise_value: 2847392000000,                               │
│             fcf_by_year: [...],                                            │
│             terminal_value: 3891204000000,                                 │
│             terminal_value_pv: 2432891000000,                              │
│             sensitivity_table: [[...], [...], ...]                         │
│           },                                                                │
│           charts: [{                                                        │
│             type: "image",                                                  │
│             media_type: "image/png",                                        │
│             data: "iVBORw0KGgo..."                                         │
│           }]                                                                │
│         }                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: securities-researcher incorporates into memorandum                  │
│         Section: STEP 7: ECONOMIC LIABILITY ASSESSMENT                      │
│         Content:                                                            │
│           - Enterprise value: $2.85 trillion                               │
│           - Sensitivity analysis table                                      │
│           - Waterfall chart as exhibit                                      │
│           - Methodology notes with assumptions                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Report saved                                                        │
│         Path: reports/2025-12-15-apple-dcf-analysis.md                     │
│         SubagentStop hook: Verifies report was saved                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Example 2: Event Study for Securities Fraud Damages

```
User Query: "Calculate damages for Tesla securities fraud during the
            'funding secured' tweet incident"

Workflow:
1. case-law-analyst finds relevant case: In re Tesla Securities Litigation
2. securities-researcher extracts Tesla stock prices around Aug 7, 2018
3. securities-researcher calls /api/financial-model with:
   {
     modelType: "event_study",
     financialData: {
       prices: [{ date: "2018-07-01", price: 310.50 }, ...],
       marketPrices: [{ date: "2018-07-01", price: 2760.12 }, ...]  // S&P 500
     },
     parameters: {
       eventDate: "2018-08-07",
       estimationWindow: [-120, -10],
       eventWindow: [-5, 20]
     }
   }
4. Sandbox runs OLS regression, calculates CAR, performs t-test
5. Returns: CAR = 12.4%, t-statistic = 3.87, p-value < 0.001
6. securities-researcher incorporates statistical evidence into damages section
```

---

## Alternative Approaches

### Alternative 1: Use Existing `/api/research` with Skills

**Description**: Enable `SKILLS_ENABLED` flag and send financial modeling prompts directly to `/api/research`.

**Implementation**:
```bash
# In .env
SKILLS_ENABLED=true
```

**Pros**:
- No new code required
- Uses existing infrastructure
- General-purpose (Claude decides when to use code execution)

**Cons**:
- Less structured responses
- No pre-built financial prompts
- Harder to test specific models
- More token usage (Claude must figure out approach)

**Recommendation**: Suitable for ad-hoc analysis, not recommended for production financial modeling.

### Alternative 2: MCP Tool Wrapper

**Description**: Create an MCP tool that wraps the Code Execution API call.

**Implementation**:
```javascript
// In agentSdkToolAdapter.js or new file
export const financialModelMcpTool = {
  name: 'execute_financial_model',
  description: 'Execute financial models (DCF, event study, Monte Carlo) in Python sandbox',
  inputSchema: {
    type: 'object',
    properties: {
      modelType: { type: 'string', enum: ['dcf', 'event_study', 'monte_carlo'] },
      financialData: { type: 'object' },
      parameters: { type: 'object' }
    },
    required: ['modelType', 'financialData']
  },
  handler: async (input) => {
    // Makes HTTP call to /api/financial-model or Direct API
    return await executeFinancialModel(input);
  }
};
```

**Pros**:
- Subagents can call directly via MCP
- Integrates with existing tool system
- No HTTP overhead within same process

**Cons**:
- Adds complexity to MCP server
- MCP tool still needs to call Direct API internally
- Harder to test in isolation

**Recommendation**: Consider as Phase 2 enhancement after dedicated endpoint proves stable.

### Alternative 3: External Service (E2B, Modal, Koyeb)

**Description**: Use third-party code execution service instead of Anthropic's sandbox.

**Pros**:
- More control over environment
- Can install additional packages
- Network access possible (with security)
- Longer execution times

**Cons**:
- Additional vendor dependency
- Network latency
- Separate billing/monitoring
- Security configuration required

**Recommendation**: Consider only if Anthropic sandbox limitations become blocking.

---

## Rollback Plan

### Rollback Procedure

If any issues occur after deployment, follow this procedure:

#### Step 1: Remove Route (Immediate - 30 seconds)

Edit `src/server/claude-sdk-server.js`:

```diff
- import { financialModelHandler } from './financialModelEndpoint.js';

  // ... other code ...

- // Financial modeling endpoint with sandboxed code execution
- app.post('/api/financial-model', financialModelHandler);
```

**Lines to remove**: 2

#### Step 2: Remove Endpoint File (Optional)

```bash
rm src/server/financialModelEndpoint.js
```

#### Step 3: Remove Subagent Instructions (Optional)

If `FINANCIAL_MODELING_INSTRUCTIONS` was added to `legalSubagents.js`, remove it.

#### Step 4: Restart Server

```bash
npm run start
# or
pm2 restart claude-sdk-server
```

### Rollback Verification

After rollback:
- `/api/financial-model` returns 404
- All other endpoints function normally
- Subagents continue with existing functionality
- No error logs related to financial modeling

### Rollback Impact

| Affected | Impact |
|----------|--------|
| Financial model requests | Fail with 404 |
| Other API endpoints | ZERO impact |
| Agent SDK path | ZERO impact |
| MCP tools | ZERO impact |
| Subagents | Continue without financial modeling |

---

## Decision Matrix

### Should You Implement This Integration?

| Question | Yes | No |
|----------|-----|-----|
| Do you need quantitative financial analysis in legal memoranda? | Proceed | Skip |
| Are DCF, event studies, or Monte Carlo simulations relevant? | Proceed | Skip |
| Do you have resources to test the endpoint? | Proceed | Defer |
| Is the 5-line change acceptable risk? | Proceed | Defer |
| Do you need this capability in the next sprint? | Proceed | Defer |

### Implementation Priority

| Priority Level | Criteria | Recommendation |
|----------------|----------|----------------|
| **HIGH** | Securities litigation, M&A fairness opinions, damages calculations | Implement now |
| **MEDIUM** | Occasional financial analysis needs | Implement when convenient |
| **LOW** | Primarily regulatory/compliance work without financial modeling | Defer indefinitely |

---

## Appendix: Reference Documentation

### Anthropic Documentation

| Resource | URL |
|----------|-----|
| Code Execution Tool | https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool |
| Advanced Tool Use Blog | https://www.anthropic.com/engineering/advanced-tool-use |
| Tool Use Examples | https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use |
| Agent SDK TypeScript | https://platform.claude.com/docs/en/agent-sdk/typescript |

### Related Files in Super-Legal

| File | Purpose |
|------|---------|
| `src/server/claude-sdk-server.js` | Main server with API pathways |
| `src/hooks/sdkHooks.js` | SDK lifecycle hooks |
| `src/config/legalSubagents.js` | Subagent definitions |
| `src/utils/skillsRequestBuilder.js` | Beta header construction |
| `src/skills/skillsRegistry.js` | Skills registration |

### Plan File

| Location | `/Users/ej/.claude/plans/harmonic-singing-rossum.md` |
|----------|-----------------------------------------------------|
| Phase | 5 - Code Execution Integration for Financial Modeling |
| Status | Pre-Implementation Analysis Complete |

---

## Appendix: Best Practices from Anthropic Engineering (December 2025)

### From "Code Execution with MCP" Article

1. **Data Pre-extraction Pattern**: "Models are great at navigating filesystems. Presenting tools as code APIs allows models to read tool definitions on-demand."

2. **Progressive Disclosure**: Filter and transform data locally in the execution environment before returning results to the model.

3. **Control Flow in Code**: Use familiar programming patterns (loops, conditionals) rather than chaining individual tool calls - improves efficiency and reduces latency.

4. **Sensitive Data Handling**: Intermediate results stay in the execution environment by default, preventing sensitive information from entering the model's context unnecessarily.

### Container Reuse Pattern

For multi-step financial analyses, reuse containers to maintain state:

```javascript
// First request - get container ID
const response1 = await client.beta.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  betas: ['code-execution-2025-08-25'],
  // ... request
});
const containerId = response1.container?.id;

// Subsequent requests - reuse container
const response2 = await client.beta.messages.create({
  container: containerId,  // Reuse container
  model: 'claude-sonnet-4-5-20250929',
  betas: ['code-execution-2025-08-25'],
  // ... request
});
```

---

**Document End**

*This analysis was generated and verified by Claude Code on December 15, 2025.*
*All specifications verified against official Anthropic documentation.*
*For questions or updates, refer to the plan file at `/Users/ej/.claude/plans/harmonic-singing-rossum.md`*
